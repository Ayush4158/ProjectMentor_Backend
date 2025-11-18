import { ApiError } from "../helper/ApiError.js";
import { GoogleGenAI } from "@google/genai";
import { ApiResponse } from "../helper/ApiResponse.js";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_KEY });

export const aiAssistance = async (req, res) => {
  try {

    const { message } = req.body;
    console.log('backend',message)
    if (!message) {
      throw new ApiError(404, "No message received");
    }

    // Define the system prompt (role + objective)
    const systemPrompt = `
    You are an AI assistant integrated into a software project management platform.
    Your role is to act as a "Project Problem-Solving Mentor" — helping developers 
    and teams with issues related to their project such as debugging, feature planning,
    best practices, code improvement, architecture suggestions, and tech stack guidance.
    Be clear, concise, and practical. Avoid unnecessary theory; focus on actionable help.
    `;

    // Send both the prompt and user message to the model
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: systemPrompt
      }
    });

    console.log('response: ', response)

    for await (const chunk of response) {
      console.log('chunk ',chunk.candidates[0].content.parts[0].text) // this is working
      const text = chunk.candidates[0].content.parts[0].text;
      console.log("text", text)
      if (text) {
        res.write(`data: ${text}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Error generating content:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error.message,
      }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
};
