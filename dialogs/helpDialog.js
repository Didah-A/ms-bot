const { CardFactory, InputHints } = require('botbuilder');
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const HelpCard = require('../bots/resources/helpCard.json');

const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class HelpDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'helpDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.displayCard.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async displayCard(stepContext) {
        const saySomething = 'Say something like "**Get corona virus statistics** or **check the weather for London**" to get the best results';
        await stepContext.context.sendActivity(saySomething, saySomething, InputHints.IgnoringInput);
        const helpCard = CardFactory.adaptiveCard(HelpCard);
        await stepContext.context.sendActivity({ attachments: [helpCard] });
        return await stepContext.endDialog();
    };

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        const cityDetails = stepContext.options;
        return await stepContext.endDialog(cityDetails);
    }
}

module.exports.HelpDialog = HelpDialog;
