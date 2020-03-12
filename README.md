# Demo
[link](https://webchat.botframework.com/embed/didah/gemini?b=didah&s=Xa1OncAYinE._zg9HuSkUAYCVCnc6yxlPmjNihvzEKNGcDU1e9UXen4&username=You)

# Weather Bot
This a weather Bot that shows the weather for any city in the world.

- It has been created using [Bot Framework](https://dev.botframework.com), it shows how to:
- Use [LUIS](https://www.luis.ai) to implement core AI capabilities
- Implement a multi-turn conversation using Dialogs
- Handle user interruptions for such things as `Help` or `Cancel`
- Prompt for and validate requests for information from the user
- Demonstrate how to handle any unexpected errors

## screenshots
![Screenshot 2020-03-12 at 17 17 12](https://user-images.githubusercontent.com/25657649/76530822-581dd700-6485-11ea-8db3-58b0efffe14f.png)


## Prerequisites
- [Node.js](https://nodejs.org) version 10.14 or higher
    ```bash
    # determine node version
    node --version
    ```
# To run the bot locally
- Download the bot code from the Build blade in the Azure Portal (make sure you click "Yes" when asked "Include app settings in the downloaded zip file?").
    - If you clicked "No" you will need to copy all the Application Settings properties from your App Service to your local .env file.
- Install modules
    ```bash
    npm install
    ```
- Run the bot
    ```bash
    npm start
    ```

# Testing the bot using Bot Framework Emulator
[Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.5.2 or greater from [here](https://github.com/Microsoft/BotFramework-Emulator/releases)

## Connect to the bot using Bot Framework Emulator
- Launch Bot Framework Emulator
- File -> Open Bot
- Enter a Bot URL of `http://localhost:3978/api/messages`
