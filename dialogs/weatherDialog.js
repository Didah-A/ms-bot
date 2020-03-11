// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

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
                this.originStep.bind(this),
                this.travelDateStep.bind(this),
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

    // /**
    //  * If a travel date has not been provided, prompt for one.
    //  * This will use the DATE_RESOLVER_DIALOG.
    //  */
    // async travelDateStep(stepContext) {
    //     const bookingDetails = stepContext.options;

    //     // Capture the results of the previous step
    //     bookingDetails.origin = stepContext.result;
    //     if (!bookingDetails.travelDate || this.isAmbiguous(bookingDetails.travelDate)) {
    //         return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: bookingDetails.travelDate });
    //     }
    //     return await stepContext.next(bookingDetails.travelDate);
    // }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const cityDetails = stepContext.options;

        // Capture the results of the previous step
        cityDetails.location = stepContext.result;
        const messageText = `Confirm you are searching for ${ cityDetails.location }?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const cityDetails = stepContext.options;
            return await stepContext.endDialog(cityDetails);
        }
        return await stepContext.endDialog();
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.WeatherDialog = WeatherDialog;
