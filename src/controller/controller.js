// controller.js

import TelegramBot from 'node-telegram-bot-api';
import { downloadAndSaveImage, errorHandler, waitingTexts, sendMessage ,checkUserExistence, storeUserData, createOrUpdateMealEntry,checkUserUsage,todayData ,weekData, monthData,sendMessageWithKeyboard} from "../utils/helper.js";
import { openAiVision } from "../utils/helper.js"; // Import the openAiVision function

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });


bot.on('message', async (msg) => {
    try {
        const chatId = msg.chat.id;
        const userName = `${msg.from.first_name} ${msg.from.last_name || ""}`;

        //checking the user 
        const firstName = msg.from.first_name || "";
        const lastName = msg.from.last_name || "";
        const userExists = await checkUserExistence(chatId);
        if (!userExists) {
           
            await storeUserData(chatId, firstName, lastName );
        }

        const upgradePlanUrl = await checkUserUsage(chatId);
        if (upgradePlanUrl) {
            await sendMessage(chatId, `Your magic meals credit has been used up. Please upgrade your plan: ${upgradePlanUrl}`);
            return;
        }

        // Create or update meal entry for the user for the current month
        await createOrUpdateMealEntry(chatId, userName);




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
            if (!fileDetails.success) {
                // Check if the content of the response indicates the need to upgrade the plan
                if (fileDetails.content === 'Your magic meals credit has been used up. Please upgrade your plan.') {
                    // Send the message with the upgrade plan link
                    const updatePlan = "https://www.magicslides.app/tools"
                    await sendMessage(chatId, `${fileDetails.content} ${updatePlan}.`);
                } else {
                    // Handle other errors or messages as needed
                    await sendMessage(chatId, 'An error occurred. Please try again later.');
                }
                return;
            }

            console.log('vision details:', fileDetails.content);
            await sendMessage(msg.chat.id, fileDetails.content);
            
            const keyboardOptions = {
                reply_markup: JSON.stringify({
                  inline_keyboard: [
                    [
                        { text: '📅 Today', callback_data: 'today' },
                        { text: '📆 Week', callback_data: 'week' },
                        { text: '🗓️ Month', callback_data: 'month' }
                    ]
                  ],
                }),
              };
              await sendMessageWithKeyboard(chatId, 'Pick a time frame.', keyboardOptions);
           
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
            }if(messageText){
                
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
bot.on('callback_query', async (callbackQuery) => {
    const action = callbackQuery.data; // The data from the button callback
    const msg = callbackQuery.message; // The original message object from Telegram
    const chatId = msg.chat.id; // The chat ID where the callback comes from
  
    // Respond to the callback query to acknowledge it, required by the Telegram API
    bot.answerCallbackQuery(callbackQuery.id)
      .then(() => console.log(`Answered callback query from ${chatId}`))
      .catch(console.error);
  
    // Perform different actions based on the callback data
    switch (action) {
      case 'today':
        // Call your function for 'today' and send the result back to the user
        const todayResult = await todayData(chatId);
        await sendMessage(chatId, `Today's data: ${JSON.stringify(todayResult)}`);
        break;
      case 'week':
        // Call your function for 'week' and send the result back to the user
        const weekResult = await weekData(chatId);
        await sendMessage(chatId, `Week's data: ${JSON.stringify(weekResult)}`);
        break;
      case 'month':
        // Call your function for 'month' and send the result back to the user
        const monthResult = await monthData(chatId);
        await sendMessage(chatId, `Month's data: ${JSON.stringify(monthResult)}`);
        break;
      default:
        // Handle unknown callback
        await sendMessage(chatId, "I'm not sure what you're asking for.");
        break;
    }
  });

export { bot };
