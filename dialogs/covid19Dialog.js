// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { Covid19API } = require('../API/covid19API');
const { countries } = require('./countries.js');

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class Covid19Dialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'covid19Dialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.getCountry.bind(this),
                this.getCovid19Stats.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a city has not been provided, prompt for one.
     */
    async getCountry(stepContext) {
        const countryDetails = stepContext.options;

        if (!countryDetails.name) {
            const messageText = 'Which country do you want to search the statistics for?';
            const msg = MessageFactory.suggestedActions(['Kenya', 'USA', 'United Kingdom', 'Italy'], messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(countryDetails.name);
    }

    /**
     * Confirm the information the user has provided.
     */
    async getCovid19Stats(stepContext) {
        try {
            const countryDetails = stepContext.options;
            countryDetails.name = stepContext.result;

            if (stepContext.result.toLowerCase() === 'usa') { countryDetails.name = 'United States of America'; }

            const countryCode = countries.get(countryDetails.name.toLowerCase());

            /* Capture the results of the previous step */
            const GetStatistics = new Covid19API();
            countryDetails.stats = await GetStatistics.getCovid19StatsByCountry(countryCode);
            return await stepContext.next(countryDetails.stats);
        } catch {
            const didntUnderstandMessageText = 'Sorry, I couldn\'t find that. Please enter a valid full Country name';
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
            return await stepContext.endDialog();
        }
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        const countryDetails = stepContext.options;
        return await stepContext.endDialog({ statistics: countryDetails });
    }
}

module.exports.Covid19Dialog = Covid19Dialog;
