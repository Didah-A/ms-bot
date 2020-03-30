const { MessageFactory, InputHints, CardFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const StatsCard = require('../bots/resources/statsCard.json');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, weatherDialog, helpDialog, covid19Dialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!weatherDialog) throw new Error('[MainDialog]: Missing parameter \'weatherDialog\' is required');

        if (!helpDialog) throw new Error('[MainDialog]: Missing parameter \'helpDialog\' is required');

        if (!covid19Dialog) throw new Error('[MainDialog]: Missing parameter \'covid19Dialog\' is required');

        /**
         * Define the main dialog and its related components.
         * This is a sample "check for weather" dialog.
         *
         * */

        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(weatherDialog)
            .addDialog(helpDialog)
            .addDialog(covid19Dialog)
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * This accepts a weather request command and displays the weather for that city
     *
     */
    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'Hi there! My name is Crystal. What can I help you with today? 🙂';
        const promptMessage = MessageFactory.suggestedActions(['Get Corona virus statistics', 'check the weather', 'Help'], messageText, InputHints.ExpectingInput);
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the weatherDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const cityDetails = {};
        const countryDetails = {};

        if (!this.luisRecognizer.isConfigured) {
            /* LUIS is not configured, we just run the weatherDialog path. */
            return await stepContext.beginDialog('weatherDialog', cityDetails);
        }

        /* Call LUIS and gather any potential city details. (Note the TurnContext has the response to the prompt) */
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'CheckWeather': {
            const CityEntities = this.luisRecognizer.getCityEntity(luisResult);

            /* Initialize the city Details with any entities we may have found in the response. */
            if (CityEntities) cityDetails.location = CityEntities.city;

            /* Run the weatherDialog passing in whatever details we have from the LUIS call, it will fill out the remainder. **/
            return await stepContext.beginDialog('weatherDialog', cityDetails);
        }

        case 'checkCovid19Stat': {
            const CountryEntities = this.luisRecognizer.getCountryCode(luisResult);

            /* Initialize the city Details with any entities we may have found in the response. */
            if (CountryEntities) countryDetails.name = CountryEntities.country;

            /* Run the weatherDialog passing in whatever details we have from the LUIS call, it will fill out the remainder. **/
            return await stepContext.beginDialog('covid19Dialog', countryDetails);
        }

        case 'Help' : {
            return await stepContext.beginDialog('helpDialog', {});
        }

        default: {
            /* Catch all for unhandled intents */
            const didntUnderstandMessageText = 'Sorry, I didn\'t get that. Please try asking in a different way eg, "check weather, check the weather for Nairobi"';
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        }

        return await stepContext.next();
    }

    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "book a flight" interaction with a simple confirmation.
     */
    async finalStep(stepContext) {
        const convertToTitleCase = (text) => (text[0].toUpperCase() + text.slice(1));

        if (!stepContext.result) return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });

        if (stepContext.result.weather) {
            const result = stepContext.result.weather;
            const temp = Math.floor(result.weather.temp - 273.15);
            const msg = `The weather in **${ convertToTitleCase(result.location) }** is **${ result.weather.weather.description }** and the temprature is **${ temp }**° Celsius today.`;
            await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
        }

        const handleCovidWrongInput = async (results) => {
            if (!results.stats) {
                const msg = 'Sorry, country stats not found, please try again later or search for another country!';
                return await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
            }
        };

        if (stepContext.result.statistics) {
            const result = stepContext.result.statistics;
            await handleCovidWrongInput(result);
            if (result.stats) {
                const date = (result.stats.lastupdate ? result.stats.lastupdate : new Date().toLocaleDateString());
                StatsCard.body[0].text = `Corona Virus Statistics for ${ result.name }`;
                StatsCard.body[1].columns[0].items[0].text = `Last updated ${ new Date(date.split('T')[0]).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }`;
                StatsCard.body[2].columns[0].items[1].text = `${ result.stats.confirmed }`;
                StatsCard.body[2].columns[0].items[3].text = `${ result.stats.recovered }`;
                StatsCard.body[2].columns[0].items[5].text = `${ result.stats.deaths }`;
                const statsCard = CardFactory.adaptiveCard(StatsCard);
                await stepContext.context.sendActivity({ attachments: [statsCard] });
            }
        }

        /* Restart the main dialog with a different message the second time around */
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }
}

module.exports.MainDialog = MainDialog;
