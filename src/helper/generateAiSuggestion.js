import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_KEY })

export async function generateAISuggestion(commitMessage, codeChanges){
  try {
    const prompt = `
    You are an expert senior code reviewer.

    A developer made a commit with the message: "${commitMessage}"

    Here are the code changes:
    ${codeChanges}

    Please provide:
    1. A short summary of what changed.
    2. Suggestions for improvements or optimizations.
    3. Any best-practice violations, warnings, or potential bugs.
        `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    })

    // console.log(response.text)

    return response?.text;

  } catch (error) {
    console.log("AI suggestion error: ", error.message);
    return "Unable to generate AI suggestion"
  }
}