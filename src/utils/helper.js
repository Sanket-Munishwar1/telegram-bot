import axios from "axios";
import fs from "fs";
import supabase from "../config/supabase.js";
import OpenAI from "openai";
import { bot } from "../controller/controller.js"
import { promises as fsPromise } from "fs";


const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI(apiKey);


// Function to handle errors
export function errorHandler(err, name, from) {
    let loggerFunction = console.log;

    loggerFunction("-----START------");
    loggerFunction("error name: " + name);

    if (from === "axios") {
        if (err.response) {
            loggerFunction(err.response.data);
            loggerFunction(err.response.status);
            loggerFunction(err.response.headers);
        } else if (err.request) {
            loggerFunction(err.request);
        } else {
            loggerFunction(err.message);
        }
    }

    loggerFunction(err);
}

// Array of waiting texts for messages
export const waitingTexts = [
    "🥗 Prepping the nutrition stats! Analyzing your delicious meal... Please wait! 🔄🔍",
    "🍔 Macros on the menu! Processing your food pic... Just a moment! 🔄👨‍🍳",
    "🍲 Cooking up the details! Examining your meal pic... Sit tight! 🔄👀",
    "🍱 Dive into the nutrition facts! Analyzing your food pic... Almost there! 🔄🔬",
    "🥦 Crunching the numbers! Your meal details are on the way... Patience! 🔄📊",
    "🍕 Pizza of patience! Processing your meal image... Hang in there! 🔄🍕",
    "🥑 Avocado analysis in progress! Your meal's nutritional breakdown coming up! 🔄🥑",
    "🍝 Stirring up the stats! Your meal's macros are being calculated... Hold tight! 🔄🍽️",
    "🍎 An apple a wait! Processing your meal pic... Stay tuned for the details! 🔄🍏",
    "🍤 Sizzling analysis! Your meal's nutrition details are sizzling in the works... 🔄🌶️",
    "🍗 Chicken-checking! Examining your meal pic for nutritional goodness... 🔄🔎",
    "🍇 Grape expectations! Your meal's macros are being analyzed... Grape things are coming! 🔄🍇",
    "🥩 Steak and stats! Your meal's nutrition details are grilling up... Just a moment! 🔄🔥",
    "🍣 Sushi scrutiny! Examining your meal pic for nutritional perfection... 🔄🍣",
    "🌽 Corn-y nutrition facts! Your meal's macros are being popped... Stay tuned! 🔄🍿",
    "🍦 Sweet wait! Processing your meal image for nutrition details... Coming soon! 🔄🍭",
    "🍚 Rice and analyze! Examining your meal pic for nutritional insights... 🔄🍚",
    "🍊 Peel of patience! Processing your meal image... Orange you excited for the details? 🔄🍊",
    "🍎 An apple a day, wait and see! Examining your meal pic for nutritional wisdom... 🔄🍏",
    "🍩 Doughnut of determination! Processing your food pic... Doughnut worry, details soon! 🔄🍩",
  ];

// Function to send a message via Telegram API
// export async function sendMessage(chatId, messageText) {
//     try {
//         // Send the message using the bot.sendMessage method
//         await bot.sendMessage(chatId, messageText);
         
//     } catch (error) {
//         // Handle any errors
//         console.error('Error sending message:', error);
//         return false; // Return false if there's an error
//     }
// }

export async function sendMessage(chatId, message) {
    try {
        // Check if the message is not empty
        if (message && message.trim() !== '') {
            // Send the message using Telegram API
            await bot.sendMessage(chatId, message);
        } else {
            console.error('Error sending message: Message text is empty');
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}




// Function to download and save an image
export async function downloadAndSaveImage(fileId, chatId, userName) {
    let parsedJson;
    let url = '';
    const filePath = `uploads/${fileId}.jpg`;

    try {
        // Download the file content using the Telegram bot
        const fileDetails = await bot.getFile(fileId);
        const fileStream = bot.getFileStream(fileId);

        // Create the uploads directory if it doesn't exist
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }

        const writeStream = fs.createWriteStream(filePath);
        fileStream.pipe(writeStream);

        // Promise to handle the stream
        const streamPromise = new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        // Wait for the stream to finish
        await streamPromise;

        console.log('Image downloaded and saved:', filePath);

        // Process image using OpenAI
        const base64Image = fs.readFileSync(filePath, { encoding: 'base64' });
        const imageURL = 'data:image/jpeg;base64,' + base64Image;
        const openaiResponse = await openAiVision(imageURL);

        // Handle OpenAI response
        if (!openaiResponse || !openaiResponse.choices || openaiResponse.choices.length === 0) {
            throw new Error('Failed to process image');
        }

        const jsonContent = openaiResponse.choices[0].message.content.match(/```json\n([\s\S]+)\n```/)[1];
        parsedJson = JSON.parse(jsonContent);

        // Upload image to Supabase
        url = await uploadFileToSupabase(filePath);
        const totalTokens = openaiResponse.usage.total_tokens;
        // Store response in Supabase
        const payload = {
            "user_id": chatId,
            "user_name": userName,
            "image_url": url,
            "response": JSON.stringify(parsedJson),
            "token_used": totalTokens,
        };
        const { data, error } = await supabase.from('meals').insert(payload);

        if (error) {
            console.error('Failed to store response in Supabase:', error);
        }

        // Construct message
        const message = `
        ✅ Done thanks for sharing 👍
        Dish Name: ${parsedJson.food_name}
        Calories: ${parsedJson.calories} kcal
        Macros:
        - Protein: ${parsedJson.macros.protein}g
        - Carbs: ${parsedJson.macros.carbs}g
        - Fat: ${parsedJson.macros.fat}g
        Likely Ingredients: ${parsedJson.likely_ingredients.map(ingredient => `\n- ${ingredient.ingredient} (${ingredient.weight}g)`)}`;


        
        const currentDate = getCurrentDate();
        // const protein = parsedJson.macros.protein;
        // const carbs = parsedJson.macros.carbs;
        // const fat = parsedJson.macros.fat;
        
        // Update the 'meals' column in the 'users' table
        // await supabase
        //     .from('users')
        //     .update({
        //         meals: {
        //             [currentDate]:{
        //                 Protein: protein,
        //                 Carbs: carbs,
        //                 Fat: fat
        //             }

        //         } // Append the usage data to existing meals data using SQL concat operator
        //     })
        //     .eq('telegram_id', chatId);


        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('meals, usage')
            .eq('telegram_id', chatId)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            throw new Error('Failed to fetch user data');
        }

        // Update the 'meals' and 'usage' columns in the 'users' table
        const existingMeals = userData.meals || {};
        const existingMealForCurrentDate = existingMeals[currentDate] || {};
        const existingUsage = userData.usage || {};
        const existingUsageForCurrentDate = existingUsage[currentDate] || { magic_meals_credit_used: 0 };
        

        const protein = parsedJson.macros.protein
        const carbs = parsedJson.macros.carbs 
        const fat = parsedJson.macros.fat 

        await supabase
            .from('users')
            .update({
                // Append the new meal data to existing meal data if it exists for the current date
                meals: { ...existingMeals, [currentDate]: { ...existingMealForCurrentDate, Protein: (existingMealForCurrentDate.Protein || 0) + protein, Carbs: (existingMealForCurrentDate.Carbs || 0) + carbs, Fat: (existingMealForCurrentDate.Fat || 0) + fat }},
                // Increment the magic_meals_credit_used value in the usage column
                usage: { ...existingUsage, [currentDate]: {magic_meals_credit: existingUsage.magic_meals_credit || 3,magic_meals_credit_used: existingUsageForCurrentDate.magic_meals_credit_used + 1 }},
            })
            .eq('telegram_id', chatId);

        return {
            success: true,
            filePath: filePath,
            fileDetails: fileDetails,
            content: message
        };
    } catch (error) {
        console.error('Error downloading and saving image:', error);
        return {
            success: false,
            filePath: filePath,
            fileDetails: null,
            content: 'Something went wrong, please try again later.'
        };
    }
}



// Function to upload a file to Supabase
export async function uploadFileToSupabase(filePath) {
    try {
        let supabaseUrl = process.env.SUPABASE_URL; // Get Supabase URL from environment variables

        // Read the file into a buffer
        const fileContent = fs.readFileSync(filePath);

        // Extract filename from filePath
        const fileName = `uploaded_${Date.now()}.jpg`; // Generate a unique filename

        // Upload the file to Supabase storage
        const { data, error } = await supabase.storage
            .from('telegram-bucket-new')
            .upload(fileName, fileContent, {
                contentType: 'image/jpeg', // Make sure to set the correct content type
                upsert: true // Replace existing files with the same path if needed
            });

        if (error) {
            console.error('Failed to upload file in bucket:', error.message);
            return null;
        }
        console.log('File uploaded successfully:', data);

        // Return the URL of the uploaded file
        let supabase_path =  data.path;

        if (supabase_path === null) {
            return null;
        }

        let getPdfUrlFromSupabase = `${supabaseUrl}/storage/v1/object/public/telegram-bucket-new/${supabase_path}`;

        return getPdfUrlFromSupabase;
    } catch (error) {
        console.error('Failed to upload file:', error.message);
    }
}

// Function to process image using OpenAI
export async function openAiVision(url) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-vision-preview',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: "text",
                            text: `here is the food i had i am on diet and want to estimate my calorie and macros, tell me ESTIMATED calories and macros, give me in json. JSON format: {
                        "food_name": "food name",
                        "calories":"estimated ballpark in kcal",
                        "macros": {"protein":"estimated in g", "carbs":"estimated in g", "fat":"estimated in g"},
                        "likely_ingredients": [{"ingredient": "ingredient_name", "weight": "estimated in g"}]
                    }, calories, macros values should be in number only no text. do not blabber just JSON:`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                "url":  url
                            }
                        },
                    ],
                },
            ],
            max_tokens: 4096
        });

        return response;
    } catch (error) {
        console.log('error', error);
        return null;
    }

}


export async function generateResponse(messageText) {
    try {
        // Call OpenAI's completion endpoint
        const response = await openai.chat.completions.create({
            model: 'gpt-4-vision-preview', // Specify the language model to use
            messages: [{
                role: "user",
                content: messageText // Pass the user's message directly
            }],
            max_tokens: 150 // Maximum number of tokens in the generated response
        });

        // Extract and return the generated text from the response
        if (response && response.choices && response.choices.length > 0) {
            const generatedText = response.choices[0].message.content[0].text;
            return generatedText;
        } else {
            console.error('Invalid response from OpenAI:', response);
            return null;
        }
    } catch (error) {
        console.error('Error generating response:', error);
        return null;
    }
}

function getCurrentDate() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = today.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
}




export async function storeUserData(chatId, firstName, lastName) {
    try {
        // Insert the user data into the Supabase table
        const currentDate = getCurrentDate()
        const payload = {
            "telegram_id":chatId,
            "name":`${firstName} ${lastName}`,
            "meals": null,
            "usage": {
                [currentDate]: {
                    "magic_meals_credit":3,
                    "magic_meals_credit_used":0,
                },
            }
        }

        const { data, error } = await supabase
            .from('users')
            .insert(payload);

        if (error) {
            console.error('Error storing user data:', error.message);
            return false;
        }

        console.log('User data stored successfully:', data);
        return true;
    } catch (error) {
        console.error('Error storing user data:', error.message);
        return false;
    }
}



export async function checkUserExistence(chatId) {
    try {
        // Query Supabase to check if the user with the provided chatId exists
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', chatId);

        if (error) {
            console.error('Error checking user existence:', error.message);
            return null;
        }

        return data.length > 0; // Returns true if user exists, false otherwise
    } catch (error) {
        console.error('Error checking user existence:', error.message);
        return null;
    }
}

// Function to create or update the meal entry for the user for the current month
export async function createOrUpdateMealEntry(chatId, userName) {
    try {
        // Get the current month and year
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Month is zero-based, so add 1
        const currentYear = currentDate.getFullYear();
        const currentMonthYear = `${currentMonth}-${currentYear}`;

        // Check if the user has a meal entry for the current month
        const { data: existingMeals, error } = await supabase
            .from('users')
            .select('meals')
            .eq('telegram_id', chatId);

        if (error) {
            console.error('Error fetching user data:', error.message);
            return false;
        }

        // If the user doesn't have a meal entry for the current month, create a new one
        if (!existingMeals || !existingMeals.length || !existingMeals[0].meals[currentMonthYear]) {
            const newMealEntry = {
                currentDate: {
                    "Carb": 0,
                    "Protein": 0,
                    "Fat": 0
                }
            };

            // Update the user's meal entry in the "users" table
            const { data: updatedUserData, error: updateError } = await supabase
                .from('users')
                .update({ meals: { ...existingMeals[0].meals, ...newMealEntry } })
                .eq('telegram_id', chatId);

            if (updateError) {
                console.error('Error updating user data:', updateError.message);
                return false;
            }

            console.log('Meal entry created successfully for:', userName);
        }

        return true;
    } catch (error) {
        console.error('Error creating or updating meal entry:', error.message);
        return false;
    }
}
