const { MessageFactory, InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, weatherDialog, helpDialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!weatherDialog) throw new Error('[MainDialog]: Missing parameter \'weatherDialog\' is required');

        if (!helpDialog) throw new Error('[MainDialog]: Missing parameter \'helpDialog\' is required');

        /**
         * Define the main dialog and its related components.
         * This is a sample "check for weather" dialog.
         *
         * */

        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(weatherDialog)
            .addDialog(helpDialog)
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

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'Hi there! What can I help you with today?\nSay something like "**check the weather for London**" or "**Help**"';
        const promptMessage = MessageFactory.suggestedActions(['check the weather', 'Help'], messageText, InputHints.ExpectingInput);
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the weatherDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const cityDetails = {};

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

        if (stepContext.result) {
            const result = stepContext.result;
            const temp = Math.floor(result.weather.temp - 273.15);
            const msg = `The weather in **${ convertToTitleCase(result.location) }** is **${ result.weather.weather.description }** and the temprature is **${ temp }**° Celsius today.`;
            await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
        }

        /* Restart the main dialog with a different message the second time around */
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }
}

module.exports.MainDialog = MainDialog;
