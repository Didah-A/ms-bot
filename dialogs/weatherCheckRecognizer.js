const { LuisRecognizer } = require('botbuilder-ai');

class WeatherCheckRecognizer {
    constructor(config) {
        const luisIsConfigured = config && config.applicationId && config.endpointKey && config.endpoint;
        if (luisIsConfigured) {
            this.recognizer = new LuisRecognizer(config, {}, true);
        }
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume. (@DIDAH)
     * @param {TurnContext} context
     */
    async executeLuisQuery(context) {
        return await this.recognizer.recognize(context);
    }

    getCityEntity(result) {
        if (result.entities.$instance.City) return { city: result.entities.$instance.City[0].text };
    }
}

module.exports.WeatherCheckRecognizer = WeatherCheckRecognizer;
