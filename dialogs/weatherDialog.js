// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { WeatherAPI } = require('../API/weatherAPI');

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class WeatherDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'weatherDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.getCityStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a destination city has not been provided, prompt for one.
     */
    async getCityStep(stepContext) {
        const cityDetails = stepContext.options;

        if (!cityDetails.location) {
            const messageText = 'What city would you like to search the weather for?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(cityDetails.location);
    }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        try {
            const cityDetails = stepContext.options;

            // Capture the results of the previous step
            cityDetails.location = stepContext.result;
            const GetWeather = new WeatherAPI('new');
            cityDetails.weather = await GetWeather.getWeatherByCity(cityDetails.location);
            return await stepContext.next(cityDetails.weather);
        } catch {
            const didntUnderstandMessageText = 'Sorry, I couldn\'t find that. Please enter a valid City';
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
            return await stepContext.endDialog();
        }
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        const cityDetails = stepContext.options;
        return await stepContext.endDialog(cityDetails);
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.WeatherDialog = WeatherDialog;
