const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai"); // Assuming v0.10.0 or later

const app = express();
const PORT = 3000;

// --- Environment Variables ---
// It's highly recommended to load sensitive data like API keys from environment variables
// Example: const API_KEY = process.env.GEMINI_API_KEY;
const API_KEY = "YOUR_API_KEY"; // Replace with your actual API key or load from env

// --- Middleware ---
app.use(cors({ origin: "*" })); // Consider restricting origins in production
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// --- AI Setup ---
const genAI = new GoogleGenerativeAI(API_KEY);

const generationConfig = {
    temperature: 0.7, // Adjust creativity vs. factuality
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048, // Adjust based on expected response size
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- Helper Functions ---

// Note: The SDK's JSON mode often handles parsing, but this provides a fallback/validation layer.
function parseAIResponse(jsonString, schemaValidator) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!schemaValidator(parsed)) {
        throw new Error("Parsed data does not match expected schema.");
    }
    return parsed;
  } catch (error) {
    console.error("Failed to parse or validate AI response:", error.message);
    console.error("Attempted to parse:", jsonString);
    return null;
  }
}

// Validator for the /get-questions response
function validateQuestionsSchema(data) {
    if (!Array.isArray(data)) return false;
    return data.every(item =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.question === 'string' &&
        typeof item.codeSnippet === 'string' &&
        typeof item.answer === 'string'
    );
}

// Validator for the /check-answers response
function validateResultsSchema(data) {
    if (!Array.isArray(data)) return false;
    return data.every(item =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.question === 'string' &&
        typeof item.codeSnippet === 'string' &&
        typeof item.correctAnswer === 'string' && // Note: Field name consistency
        typeof item.userAnswer === 'string' &&
        typeof item.isCorrect === 'boolean'
    );
}


// --- Core Logic for Question Generation ---
async function generateQuestions(
  noQuestions = 5,
  topics = "basic JavaScript methods and functions",
  difficulty = "BASIC" // Consider validating difficulty against allowed values
) {
  // Define the desired JSON structure for the AI
  const responseSchema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        question: { type: "STRING" },
        codeSnippet: { type: "STRING" },
        answer: { type: "STRING" },
      },
      required: ["question", "codeSnippet", "answer"],
    },
  };

  const prompt = `Generate and return exactly ${noQuestions} coding questions about ${topics}.
Each question must include a codeSnippet, question, and answer.
Format the output strictly as a JSON array of objects according to the provided schema.
Use standard JSON string escaping for any special characters within the strings (e.g., \\n for newline, \\t for tab, \\" for quote).

- Make the questions diverse and relevant to ${topics}.
- Code snippets must be valid JavaScript.
- Questions should be at a ${difficulty} level.
- The 'answer' field should contain only the expected output value (e.g., a number, string, boolean) without any extra text, explanations, or code formatting. It will be used for direct comparison.

Return ONLY the JSON array.`;

  try {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest", // Use a specific or latest model
        generationConfig: { ...generationConfig, responseMimeType: "application/json", responseSchema },
        safetySettings,
    });

    const result = await model.generateContent(prompt);
    const response = result.response; // Access the response object
    const responseText = response.text(); // Get the text content

    // Use the helper for parsing and validation
    const questions = parseAIResponse(responseText, validateQuestionsSchema);
    return questions;

  } catch (error) {
      console.error("Error calling Google Generative AI for questions:", error);
      // Handle specific API errors if possible (e.g., rate limits, blocked content)
      throw new Error("Failed to generate questions via AI."); // Re-throw or return null/error indicator
  }
}

// --- Core Logic for Answer Checking ---
async function checkAnswersWithAI(answers) {
    // Define the desired JSON structure for the AI's response
    const responseSchema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                question: { type: "STRING" },
                codeSnippet: { type: "STRING" },
                correctAnswer: { type: "STRING" }, // Matches expected output field
                userAnswer: { type: "STRING" },
                isCorrect: { type: "BOOLEAN" },
            },
            required: ["question", "codeSnippet", "correctAnswer", "userAnswer", "isCorrect"],
        },
    };


  const prompt = `You are an AI assistant evaluating user answers to coding questions.
You will receive a JSON array containing coding questions, their correct answers, and the user's submitted answers.
Analyze each user's answer based on the provided correct answer.
Determine if the user's answer is correct. Allow for minor variations if the core logic or output is essentially right (e.g., slight formatting differences might be okay, but incorrect values are not). Consider explanations only if they accurately lead to the correct answer.
Return a JSON array of objects, mirroring the input structure but adding an 'isCorrect' boolean field (true or false) for each question.
Format the output strictly as a JSON array according to the provided schema.

Example Input Item:
{ "question": "What is the output?", "codeSnippet": "console.log(1+1)", "correctAnswer": "2", "userAnswer": "The output is 2" }

Example Output Item:
{ "question": "What is the output?", "codeSnippet": "console.log(1+1)", "correctAnswer": "2", "userAnswer": "The output is 2", "isCorrect": true }


Return ONLY the JSON array.`;

  // Prepare the list for the AI prompt, ensuring field names match the prompt description
  const listForAI = answers.map(item => ({
    question: item.question,
    codeSnippet: item.codeSnippet,
    correctAnswer: item.answer, // Map 'answer' from input to 'correctAnswer' for AI
    userAnswer: item.userAnswer,
  }));

  const listString = JSON.stringify(listForAI, null, 2); // Stringify for the prompt

  try {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest", // Use a model good at instruction following
        generationConfig: { ...generationConfig, responseMimeType: "application/json", responseSchema },
        safetySettings,
    });

    // Construct the full prompt for the AI
    const fullPrompt = `${prompt}\n\nHere is the list of answers to evaluate:\n${listString}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const responseText = response.text();

    // Use the helper for parsing and validation
    const checkedResults = parseAIResponse(responseText, validateResultsSchema);
    return checkedResults;

  } catch (error) {
    console.error("Error calling Google Generative AI for checking answers:", error);
    throw new Error("Failed to check answers via AI.");
  }
}


// --- API Routes ---

app.post("/api/get-questions", async (req, res) => {
  const { noQuestions, topics, difficulty } = req.body;

  if (
    !noQuestions ||
    !topics ||
    typeof noQuestions !== "number" ||
    noQuestions <= 0 ||
    typeof topics !== "string" ||
    topics.trim() === "" ||
    (difficulty && typeof difficulty !== 'string') // Optional difficulty validation
  ) {
    return res.status(400).json({
      error:
        "Invalid input: Provide 'noQuestions' (positive number) and 'topics' (non-empty string). 'difficulty' (string) is optional.",
    });
  }

  try {
    const questions = await generateQuestions(noQuestions, topics, difficulty);
    if (!questions) {
      // Error logged in generateQuestions or parseAIResponse
      return res.status(500).json({ error: "AI response could not be processed or validated." });
    }
    res.json({ questions });
  } catch (err) {
    // Error logged in generateQuestions
    res.status(500).json({ error: "Failed to generate questions." });
  }
});


app.post("/api/check-answers", async (req, res) => {
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "Invalid input: 'answers' must be a non-empty array." });
  }

  // Deeper validation of array items
  const isValidStructure = answers.every(item =>
    item &&
    typeof item === 'object' &&
    typeof item.question === 'string' &&
    typeof item.codeSnippet === 'string' &&
    typeof item.answer === 'string' && // This is the correct answer from your system
    typeof item.userAnswer === 'string' // This is the user's submitted answer
  );

  if (!isValidStructure) {
      console.error("Invalid item structure received in /api/check-answers request:", answers.find(item => item)); // Log the first invalid item
      return res.status(400).json({ error: "Each item in 'answers' must be an object with string properties: 'question', 'codeSnippet', 'answer', 'userAnswer'." });
  }


  try {
    const results = await checkAnswersWithAI(answers);
    if (!results) {
        // Error logged in checkAnswersWithAI or parseAIResponse
        return res.status(500).json({ error: "AI response for answer checking could not be processed or validated." });
    }
    res.json({ results });
  } catch (err) {
    // Error logged in checkAnswersWithAI
    res.status(500).json({ error: "An internal error occurred while checking answers." });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (API_KEY === "YOUR_API_KEY") {
      console.warn("⚠️ API Key is not set. Please replace 'YOUR_API_KEY' or use environment variables.");
  }
});