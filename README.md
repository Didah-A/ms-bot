
view the bot [here](https://webchat.botframework.com/embed/didah?s=26kGR_R81uY.v3IowE4WMVIG0R1KVVJuuATF58OSbvbXo46vsFazjyQ)

# Covid-19 statistics and Weather updates Bot
This a Covid-19 statistics and Weather updates Bot.

- It has been created using [Bot Framework](https://dev.botframework.com), it shows how to:
- Use [LUIS](https://www.luis.ai) to implement core AI capabilities
- Implement a multi-turn conversation using Dialogs
- Handle user interruptions for such things as `Help` or `Cancel`
- Prompt for and validate requests for information from the user
- Demonstrate how to handle any unexpected errors

## screenshots
![Screenshot 2020-03-29 at 14 13 33](https://user-images.githubusercontent.com/25657649/77847670-8f9bbb80-71c7-11ea-8867-373163ac5310.png)

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
