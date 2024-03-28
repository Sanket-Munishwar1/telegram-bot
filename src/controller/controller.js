// controller.js

import TelegramBot from 'node-telegram-bot-api';
import { downloadAndSaveImage, errorHandler, waitingTexts, sendMessage ,checkUserExistence, storeUserData, createOrUpdateMealEntry } from "../utils/helper.js";
import { openAiVision } from "../utils/helper.js"; // Import the openAiVision function

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });


bot.on('message', async (msg) => {
    try {
        const chatId = msg.chat.id;
        const userName = `${msg.from.first_name} ${msg.from.last_name || ""}`;



        if (msg.from.is_bot) {
            await sendMessage(chatId, "Bot messages are not allowed !");
            return;
        }

        console.log(`Received message: ${JSON.stringify(msg)}`);

        const messageText = msg.text || "";
        if (msg.photo && msg.photo.length > 0) {
            // Handle images
            await sendMessage(msg.chat.id, waitingTexts[Math.random() * waitingTexts.length | 0]);
            const photo = msg.photo[msg.photo.length - 1];
            console.log('Received photo:', photo);

            const fileDetails = await downloadAndSaveImage(photo.file_id, chatId, userName);

            console.log('vision details:', fileDetails.content);
            await sendMessage(msg.chat.id, fileDetails.content);
            return;
        }

        if (!messageText) {
            errorHandler("no message text", 'handleMessage');
            return;
        }

        try {
            if (messageText.charAt(0) === "/") {
                const command = messageText.substring(1);
                switch (command) {
                    case "start":
                        await sendMessage(chatId, "Hey there iam your friendly neighbourhood bot! Whenever you dig into a meal, toss me a 📷 pic of it! I'll take a swing at guessing the macros, calories, caffeine, and ingredients. Let's keep that diet game strong! 💪🥦 ");
                        return;

                    default:
                        return;
                }
            } else {
                
                // Send the message to OpenAI for processing
                const openaiResponse = await openAiVision(messageText);
                if (openaiResponse) {
                    // Extract the response from OpenAI and send it to the user
                     messageText = openaiResponse.choices[0].message.text;
                    console.log('OpenAI response:', messageText);
                    await sendMessage(chatId, messageText);
                    
                } else {
                    // Handle if OpenAI response is null
                    await sendMessage(chatId, 'Hey, Please share the image !');
                }
               
                return;
                
            }
        } catch (error) {
            errorHandler(error, 'handleMessage');
        }
        
    } catch (error) {
        console.error(error);
    }
});

export { bot };
