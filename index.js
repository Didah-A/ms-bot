/* index.js is used to setup and configure your bot */

const path = require('path');
const restify = require('restify');

/* Import required bot services. */
const { BotFrameworkAdapter, ConversationState, InputHints, MemoryStorage, UserState } = require('botbuilder');

const { WeatherCheckRecognizer } = require('./dialogs/WeatherCheckRecognizer');

/* This bot's main dialog. */
const { DialogAndWelcomeBot } = require('./bots/dialogAndWelcomeBot');
const { MainDialog } = require('./dialogs/mainDialog');

/* the bot's weather dialog */
const { WeatherDialog } = require('./dialogs/weatherDialog');
const { HelpDialog } = require('./dialogs/helpDialog');
const WEATHER_DIALOG = 'weatherDialog';
const HELP_DIALOG = 'helpDialog';

const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

/* Create adapter. */
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

/* Catch-all for errors. */
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    /* Send a trace activity, which will be displayed in Bot Framework Emulator */
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    /* Send a message to the user */
    let onTurnErrorMessage = 'The bot encounted an error or bug.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    onTurnErrorMessage = 'To continue to run this bot, please fix the bot source code.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    /* Clear out state */
    await conversationState.delete(context);
};

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

/* If configured, pass in the weatherCheckRecognizer.  (Defining it externally allows it to be mocked for tests) */
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = { applicationId: LuisAppId, endpointKey: LuisAPIKey, endpoint: `https://${ LuisAPIHostName }` };

const luisRecognizer = new WeatherCheckRecognizer(luisConfig);

/* Create the main dialog. */
const weatherDialog = new WeatherDialog(WEATHER_DIALOG);
const helpDialog = new HelpDialog(HELP_DIALOG);
const dialog = new MainDialog(luisRecognizer, weatherDialog, helpDialog);
const bot = new DialogAndWelcomeBot(conversationState, userState, dialog);

/* Create HTTP server */
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

/* Listen for incoming activities and route them to your bot main dialog. */
server.post('/api/messages', (req, res) => {
    /* Route received a request to adapter for processing */
    adapter.processActivity(req, res, async (turnContext) => {
        /* route to bot activity handler. */
        await bot.run(turnContext);
    });
});
