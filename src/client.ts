import "dotenv/config";
import OpenAi from 'openai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Check your .env file.");
}

export const gemini = new OpenAi({
    apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});