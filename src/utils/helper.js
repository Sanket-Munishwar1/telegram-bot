import axios from "axios";
import fs from "fs";
import supabase from "../config/supabase.js";
import OpenAI from "openai";
import { bot } from "../controller/controller.js";
import { promises as fsPromise } from "fs";
import exp from "constants";
import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI(apiKey);
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Ensure you have this key securely stored or configured in your environment variables
});

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
export async function sendMessage(chatId, messageText) {
  try {
    // Send the message using the bot.sendMessage method
    await bot.sendMessage(chatId, messageText);
  } catch (error) {
    // Handle any errors
    console.error("Error sending message:", error);
    return false; // Return false if there's an error
  }
}




// Function to download and save an image
// export async function downloadAndSaveImage(fileId, chatId, userName) {
//   let parsedJson;
//   let url = "";
//   const filePath = `uploads/${fileId}.jpg`;

//   try {
//     // Download the file content using the Telegram bot
//     const fileDetails = await bot.getFile(fileId);
//     const fileStream = bot.getFileStream(fileId);

//     // Create the uploads directory if it doesn't exist
//     if (!fs.existsSync("uploads")) {
//       fs.mkdirSync("uploads");
//     }

//     const writeStream = fs.createWriteStream(filePath);
//     fileStream.pipe(writeStream);

//     // Promise to handle the stream
//     const streamPromise = new Promise((resolve, reject) => {
//       writeStream.on("finish", resolve);
//       writeStream.on("error", reject);
//     });

//     // Wait for the stream to finish
//     await streamPromise;

//     console.log("Image downloaded and saved:", filePath);

//     // Process image using OpenAI
//     const base64Image = fs.readFileSync(filePath, { encoding: "base64" });
//     const imageURL = "data:image/jpeg;base64," + base64Image;
//     const openaiResponse = await openAiVision(imageURL);

//     // Handle OpenAI response
//     if (
//       !openaiResponse ||
//       !openaiResponse.choices ||
//       openaiResponse.choices.length === 0
//     ) {
//       throw new Error("Failed to process image");
//     }

//     const jsonContent = openaiResponse.choices[0].message.content.match(
//       /```json\n([\s\S]+)\n```/
//     )[1];
//     parsedJson = JSON.parse(jsonContent);

//     // Upload image to Supabase
//     url = await uploadFileToSupabase(filePath);
//     const totalTokens = openaiResponse.usage.total_tokens;
//     // Store response in Supabase
//     const payload = {
//       user_id: chatId,
//       user_name: userName,
//       image_url: url,
//       response: JSON.stringify(parsedJson),
//       token_used: totalTokens,
//     };
//     const { data, error } = await supabase.from("meals").insert(payload);

//     if (error) {
//       console.error("Failed to store response in Supabase:", error);
//     }

//     // Construct message
//     const message = `
//         ✅ Done thanks for sharing 👍
//         Dish Name: ${parsedJson.food_name}
//         Calories: ${parsedJson.calories} kcal
//         Macros:
//         - Protein: ${parsedJson.macros.protein}g
//         - Carbs: ${parsedJson.macros.carbs}g
//         - Fat: ${parsedJson.macros.fat}g
//         Likely Ingredients: ${parsedJson.likely_ingredients.map(
//           (ingredient) => `\n- ${ingredient.ingredient} (${ingredient.weight}g)`
//         )}`;

//     const currentDate = getCurrentDate();

//     const { data: userData, error: userError } = await supabase
//         .from('users')
//         .select('meals, usage')
//         .eq('telegram_id', chatId)
//         .single();

//     if (userError) {
//         console.error('Error fetching user data:', userError);
//         throw new Error('Failed to fetch user data');
//     }



//     const existingUsage = userData.usage || {};
//     const existingUsageForCurrentDate = existingUsage[currentDate] || { magic_meals_credit_used: 0 };

//     // Calculate remaining magic meals credit
//     const remainingCredit = existingUsageForCurrentDate.magic_meals_credit - existingUsageForCurrentDate.magic_meals_credit_used;

//     // If remaining credit is zero, return early without saving the data
//     if (remainingCredit <= 0) {
//       const message = `Your magic meals credit has been used up. Please upgrade your plan.`;
//       return {
//         success: false,
//         filePath: filePath,
//         fileDetails: null,
//         content: message,
//       };
//     }


//     // Update the 'meals' and 'usage' columns in the 'users' table
//     const existingMeals = userData.meals || {};
//     const existingMealForCurrentDate = existingMeals[currentDate] || {};
//     // const existingUsage = userData.usage || {};
//     // const existingUsageForCurrentDate = existingUsage[currentDate] || { magic_meals_credit_used: 0 };

//     const protein = parsedJson.macros.protein
//     const carbs = parsedJson.macros.carbs
//     const fat = parsedJson.macros.fat

//     await supabase
//         .from('users')
//         .update({
//             // Append the new meal data to existing meal data if it exists for the current date
//             meals: { ...existingMeals, [currentDate]: { ...existingMealForCurrentDate, Protein: (existingMealForCurrentDate.Protein || 0) + protein, Carbs: (existingMealForCurrentDate.Carbs || 0) + carbs, Fat: (existingMealForCurrentDate.Fat || 0) + fat }},
//             // Increment the magic_meals_credit_used value in the usage column
//             usage: { ...existingUsage, [currentDate]: {magic_meals_credit: existingUsage.magic_meals_credit || 50,magic_meals_credit_used: existingUsageForCurrentDate.magic_meals_credit_used + 1 }},
//         })
//         .eq('telegram_id', chatId);
    
//     return {
//       success: true,
//       filePath: filePath,
//       fileDetails: fileDetails,
//       content: message,
//     };
//   } catch (error) {
//     console.error("Error downloading and saving image:", error); 
//     return {
//       success: false,
//       filePath: filePath,
//       fileDetails: null,
//       content: "Something went wrong, please try again later.",
//     };
//   }
// }




export async function downloadAndSaveImage(fileId, chatId, userName) {
    let parsedJson;
    const filePath = `uploads/${fileId}.jpg`;
  
    try {
      // Download the file content using the Telegram bot
      const fileDetails = await bot.getFile(fileId);
      const fileStream = bot.getFileStream(fileId);
  
      // Create the uploads directory if it doesn't exist
      if (!fs.existsSync("uploads")) {
        fs.mkdirSync("uploads");
      }
  
      // Save the file
      const writeStream = fs.createWriteStream(filePath);
      fileStream.pipe(writeStream);
  
      // Wait for the file to finish writing
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
  
      console.log("Image downloaded and saved:", filePath);
  
      // Process image using OpenAI
      const base64Image = fs.readFileSync(filePath, { encoding: "base64" });
      const imageURL = "data:image/jpeg;base64," + base64Image;
      const openaiResponse = await openAiVision(imageURL);
  
      if (!openaiResponse || !openaiResponse.choices || openaiResponse.choices.length === 0) {
        throw new Error("Failed to process image with OpenAI.");
      }
  
      // Extracting processed information
      const jsonContent = openaiResponse.choices[0].message.content.match(/```json\n([\s\S]+)\n```/)[1];
      parsedJson = JSON.parse(jsonContent);
  
      // Fetch the user's current data
      const currentDate = getCurrentDate();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('meals, usage')
        .eq('telegram_id', chatId)
        .single();
  
      if (userError) {
        throw new Error('Failed to fetch user data');
      }
  
      // Update user's credit usage
      const existingUsage = userData.usage || {};
      const existingUsageForCurrentDate = existingUsage[currentDate] || { magic_meals_credit_used: 0, magic_meals_credit: 50 };
      if (existingUsageForCurrentDate.magic_meals_credit - existingUsageForCurrentDate.magic_meals_credit_used <= 0) {
        return {
          success: false,
          content: "Your magic meals credit has been used up. Please upgrade your plan.",
        };
      }
  
      // Deduct one credit
      existingUsageForCurrentDate.magic_meals_credit_used++;
  
      // Update the user's record with the new credit count
      await supabase
        .from('users')
        .update({
          usage: { ...existingUsage, [currentDate]: existingUsageForCurrentDate },
        })
        .eq('telegram_id', chatId);
  
      // Construct success message with analyzed data
      const message = `
        ✅ Done! Thanks for sharing! 👍
        Dish Name: ${parsedJson.food_name}
        Calories: ${parsedJson.calories} kcal
        Macros:
        - Protein: ${parsedJson.macros.protein}g
        - Carbs: ${parsedJson.macros.carbs}g
        - Fat: ${parsedJson.macros.fat}g
        Likely Ingredients: ${parsedJson.likely_ingredients.map(ingredient => `\n- ${ingredient.ingredient} (${ingredient.weight}g)`).join('')}
      `;
  
      return {
        success: true,
        filePath: filePath,
        fileDetails: fileDetails,
        content: message,
      };
    } catch (error) {
      console.error("Error in downloadAndSaveImage:", error);
      return {
        success: false,
        filePath: null,
        content: "An error occurred during the image processing.",
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
      .from("telegram-bucket-new")
      .upload(fileName, fileContent, {
        contentType: "image/jpeg", // Make sure to set the correct content type
        upsert: true, // Replace existing files with the same path if needed
      });

    if (error) {
      console.error("Failed to upload file in bucket:", error.message);
      return null;
    }
    console.log("File uploaded successfully:", data);

    // Return the URL of the uploaded file
    let supabase_path = data.path;

    if (supabase_path === null) {
      return null;
    }

    let getPdfUrlFromSupabase = `${supabaseUrl}/storage/v1/object/public/telegram-bucket-new/${supabase_path}`;

    return getPdfUrlFromSupabase;
  } catch (error) {
    console.error("Failed to upload file:", error.message);
  }
}



// Function to send a message with an inline keyboard via Telegram API
export async function sendMessageWithKeyboard(chatId, messageText, options) {
    try {
      // Send the message using the bot.sendMessage method with options
      await bot.sendMessage(chatId, messageText, options);
    } catch (error) {
      // Handle any errors
      console.error("Error sending message with keyboard:", error);
      return false; // Return false if there's an error
    }
  }
  


// Function to process image using OpenAI
// export async function openAiVision(url) {
//   try {
//     const response = await anthropic.messages.create({
//       model: "claude-3-sonnet-20240229",
//       temperature: 1,
//       messages: [
//         {
//           role: "user",
//           content: [
//             {
//               type: "text",
//               text: `here is the food i had i am on diet and want to estimate my calorie and macros, tell me ESTIMATED calories and macros, give me in json. JSON format: {
//                         "food_name": "food name",
//                         "calories":"estimated ballpark in kcal",
//                         "macros": {"protein":"estimated in g", "carbs":"estimated in g", "fat":"estimated in g"},
//                         "likely_ingredients": [{"ingredient": "ingredient_name", "weight": "estimated in g"}]
//                     }, calories, macros values should be in number only no text. do not blabber just JSON:`,
//             },
//             {
//               type: "image_url",
//               image_url: {
//                 url: url,
//               },
//             },
//           ],
//           max_tokens: 4000,
//         },
//       ],
     
//     });
//     console.log(response)
//     return response;
//   } catch (error) {
//     console.log("error", error);
//     return null;
//   }
// }
export async function openAiVision(url) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `here is the food i had i am on diet and want to estimate my calorie and macros, tell me ESTIMATED calories and macros, give me in json. JSON format: {
                        "food_name": "food name",
                        "calories":"estimated ballpark in kcal",
                        "macros": {"protein":"estimated in g", "carbs":"estimated in g", "fat":"estimated in g"},
                        "likely_ingredients": [{"ingredient": "ingredient_name", "weight": "estimated in g"}]
                    }, calories, macros values should be in number only no text. do not blabber just JSON:`,
            },
            {
              type: "image_url",
              image_url: {
                url: url,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
    });
    console.log(response)
    return response;
  } catch (error) {
    console.log("error", error);
    return null;
  }
}

export async function generateResponse(messageText) {
  try {
    // Call OpenAI's completion endpoint
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview", // Specify the language model to use
      messages: [
        {
          role: "user",
          content: messageText, // Pass the user's message directly
        },
      ],
      max_tokens: 150, // Maximum number of tokens in the generated response
    });

    // Extract and return the generated text from the response
    if (response && response.choices && response.choices.length > 0) {
      const generatedText = response.choices[0].message.content[0].text;
      return generatedText;
    } else {
      console.error("Invalid response from OpenAI:", response);
      return null;
    }
  } catch (error) {
    console.error("Error generating response:", error);
    return null;
  }
}

function getCurrentDate() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
  const yyyy = today.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}

export async function storeUserData(chatId, firstName, lastName) {
  try {
    // Insert the user data into the Supabase table
    const currentDate = getCurrentDate();
    const payload = {
      telegram_id: chatId,
      name: `${firstName} ${lastName}`,
      meals: null,
      usage: {
        [currentDate]: {
          magic_meals_credit: 50,
          magic_meals_credit_used: 0,
        },
      },
    };

    const { data, error } = await supabase.from("users").insert(payload);

    if (error) {
      console.error("Error storing user data:", error.message);
      return false;
    }

    console.log("User data stored successfully:", data);
    return true;
  } catch (error) {
    console.error("Error storing user data:", error.message);
    return false;
  }
}

export async function checkUserExistence(chatId) {
  try {
    // Query Supabase to check if the user with the provided chatId exists
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", chatId);

    if (error) {
      console.error("Error checking user existence:", error.message);
      return null;
    }

    return data.length > 0; // Returns true if user exists, false otherwise
  } catch (error) {
    console.error("Error checking user existence:", error.message);
    return null;
  }
}

// Function to create or update the meal entry for the user for the current month
// export async function createOrUpdateMealEntry(chatId, userName) {
//   try {
//     // Get the current month and year
//     const currentDate = new Date();
//     // const currentMonth = currentDate.getMonth() + 1; // Month is zero-based, so add 1
//     // const currentYear = currentDate.getFullYear();
//     // const currentMonthYear = `${currentMonth}-${currentYear}`;

//     // Check if the user has a meal entry for the current month
//     const { data: existingMeals, error } = await supabase
//       .from("users")
//       .select("meals")
//       .eq("telegram_id", chatId);
      

//     if (error) {
//       console.error("Error fetching user data:", error.message);
//       return false;
//     }

//     // If the user doesn't have a meal entry for the current month, create a new one
//     if (
//       !existingMeals ||
//       !existingMeals.length ||
//       !existingMeals[0].meals[currentDate]
//     ) {
      

//       // Update the user's meal entry in the "users" table
//       const { data: updatedUserData, error: updateError } = await supabase
//         .from("users")
//         .update({ meals: { ...existingMeals[0].meals } })
//         .eq("telegram_id", chatId);

//       if (updateError) {
//         console.error("Error updating user data:", updateError.message);
//         return false;
//       }

//       console.log("Meal entry created successfully for:", userName);
//     }

//     return true;
//   } catch (error) {
//     console.error("Error creating or updating meal entry:", error.message);
//     return false;
//   }
// }


export async function createOrUpdateMealEntry(chatId, userName, mealData) {
    const currentDate = getCurrentDate();
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("meals, usage")
        .eq("telegram_id", chatId)
        .single();
  
      if (error) throw new Error('Error fetching user data.');
  
      const existingMeals = userData.meals || {};
      const existingMealForCurrentDate = existingMeals[currentDate] || { Protein: 0, Carbs: 0, Fat: 0 };
  
      // Merge new meal data with existing meal data for the current date
      const updatedMealData = {
        ...existingMealForCurrentDate,
        Protein: (existingMealForCurrentDate.Protein || 0) + (mealData.Protein || 0),
        Carbs: (existingMealForCurrentDate.Carbs || 0) + (mealData.Carbs || 0),
        Fat: (existingMealForCurrentDate.Fat || 0) + (mealData.Fat || 0)
      };
  
      const { data: updatedData, error: updateError } = await supabase
        .from('users')
        .update({
          meals: {
            ...existingMeals,
            [currentDate]: updatedMealData,
          },
        })
        .eq('telegram_id', chatId);
  
      if (updateError) throw new Error('Error updating meal data.');
  
      console.log("Meal entry updated successfully for:", userName);
      return true;
    } catch (error) {
      console.error("Error in createOrUpdateMealEntry:", error);
      return false;
    }
  }



export async function checkUserUsage(chatId) {
    try {
        // Query Supabase to get the user's usage data
        const { data, error } = await supabase
            .from('users')
            .select('usage')
            .eq('telegram_id', chatId)
            .single();

        if (error) {
            console.error('Error fetching user usage data:', error);
            throw new Error('Failed to fetch user usage data');
        }

        // Check if user's usage data exists and contains the currentDate
        const usage = data?.usage;
        const currentDate = getCurrentDate();
        if (!usage || !usage[currentDate]) {
            console.error('Usage data for current date not found');
            return null;
        }

        // Check if 'magic_meals_credit' property exists within usage[currentDate]
        if (!usage[currentDate].hasOwnProperty('magic_meals_credit')) {
            console.error('magic_meals_credit property not found in usage');
            return null;
        }

        // Check if magic meals credit has been used up
        const remainingCredit = usage[currentDate].magic_meals_credit - usage[currentDate].magic_meals_credit_used;
        if (remainingCredit <= 0) {
            // Return the URL to upgrade the plan
            return 'https://your-upgrade-plan-url.com';
        }

        // Return null if credit hasn't been used up
        return null;
    } catch (error) {
        console.error('Error checking user usage:', error);
        return null;
    }
}



export async function todayData(chatId) {
    try {
        const currentDate = getCurrentDate(); // Get current date in 'dd-mm-yyyy' format
        const previousDate = getPreviousDate(currentDate)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('meals')
            .eq('telegram_id', chatId)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            throw new Error('Failed to fetch user data');
        }

        const meals = userData.meals || {};
        const todayData = meals[previousDate] || {};

        // Calculate total Protein, Carbs, and Fat for today
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        if (todayData) {
            totalProtein = todayData.Protein || 0;
            totalCarbs = todayData.Carbs || 0;
            totalFat = todayData.Fat || 0;
        }

        return { totalProtein, totalCarbs, totalFat };
    } catch (error) {
        console.error('Error calculating totals for today:', error);
        throw error;
    }
}

// Function to get previous date
function getPreviousDate(date) {
    const parts = date.split('-').map(Number);
    const [dd, mm, yyyy] = parts;
    const currentDate = new Date(yyyy, mm - 1, dd);
    const previousDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    return `${String(previousDate.getDate()).padStart(2, '0')}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${previousDate.getFullYear()}`;
}


export async function weekData(chatId) {
    try {
        const currentDate = getCurrentDate(); // Get current date in 'dd-mm-yyyy' format
        const dates = getLast7Dates(currentDate);
        console.log('Last 7 days dates:', dates);

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('meals')
            .eq('telegram_id', chatId)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            throw new Error('Failed to fetch user data');
        }

        const meals = userData.meals || {};
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        // Calculate totals for the last 7 days
        for (const date of dates) {
            const data = meals[date] || {};
            totalProtein += data.Protein || 0;
            totalCarbs += data.Carbs || 0;
            totalFat += data.Fat || 0;
        }

        return { totalProtein, totalCarbs, totalFat };
    } catch (error) {
        console.error('Error calculating totals for the last 7 days:', error);
        throw error;
    }
}

function getLast7Dates(currentDate) {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
        const previousDate = getPreviousDate1(currentDate, i);
        dates.push(previousDate);
    }
    return dates;
}

function getPreviousDate1(date, days) {
    const parts = date.split('-').map(Number);
    const [dd, mm, yyyy] = parts;
    const currentDate = new Date(yyyy, mm - 1, dd);
    const previousDate = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000);
    return `${String(previousDate.getDate()).padStart(2, '0')}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-${previousDate.getFullYear()}`;
}



export async function monthData(chatId) {
    try {
        const currentDate = getCurrentDate(); // Get current date in 'dd-mm-yyyy' format
        const dates = getLast30Dates(currentDate);
        console.log('Last 30 days dates:', dates);

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('meals')
            .eq('telegram_id', chatId)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            throw new Error('Failed to fetch user data');
        }

        const meals = userData.meals || {};
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        // Calculate totals for the last 30 days
        for (const date of dates) {
            const data = meals[date] || {};
            totalProtein += data.Protein || 0;
            totalCarbs += data.Carbs || 0;
            totalFat += data.Fat || 0;
        }

        return { totalProtein, totalCarbs, totalFat };
    } catch (error) {
        console.error('Error calculating totals for the last 30 days:', error);
        throw error;
    }
}

function getLast30Dates(currentDate) {
    const dates = [];
    for (let i = 1; i <= 30; i++) {
        const previousDate = getPreviousDate1(currentDate, i);
        dates.push(previousDate);
    }
    return dates;
}


