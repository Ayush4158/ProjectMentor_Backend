import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_KEY });

export async function taskGenerator({ name, objective, description, techStack }) {
  try {
    const prompt = `
      You are an AI Software mentor. Based on this project info:
      Project Name: ${name}
      Objective: ${objective}
      Description: ${description}
      Tech Stack: ${techStack}

      Generate **high-level development tasks** required to complete this project. 
      Each task should take approximately **1 full day or more** to complete, so that the total number of tasks is small (e.g., 5-15 for fullstack apps). 
      Avoid very small steps like "install library" or "add a button". Focus on meaningful deliverables, e.g., "Implement user authentication system" or "Create REST API for project management".

      For each task, include:
        1. "title" – short, descriptive task name which the task name should contain proper meaning of the task
        2. "description" – detailed explanation of what needs to be done, if there is a backend specify some important api endpoint and for frontend specify some important pages
        3. "hint" – guidance or tips (useful for beginners) here for backend talk little deep for api endpoint and for frontend talk little deep for the pages

      Follow any workflow provided in the project description.

      Return **ONLY valid JSON** in this exact format:
      [
        {"title": "...", "description": "...", "hint": "..."},
        ...
      ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              hint: { type: Type.STRING },
            },
            required: ["title", "description", "hint"],
          },
        },
      },
    });

    // Make sure the output is a real JS array
    let tasks = [];
    if (response.parsed) {
      // Some SDK versions auto-parse JSON
      tasks = response.parsed;
    } else if (response.text) {
      // Fallback: parse JSON string manually
      try {
        tasks = JSON.parse(response.text);
      } catch (err) {
        console.error("Failed to parse AI response as JSON:", err);
      }
    }

    return tasks;
  } catch (err) {
    console.error("⚠️ Error generating tasks with Gemini:", err);
    return [];
  }
}
