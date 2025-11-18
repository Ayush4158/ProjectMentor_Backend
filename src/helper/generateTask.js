import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateTaskWithAI = async ({ name, objective, description, techStack }) => {
  // const prompt = `
  //   You are an AI Software mentor. Based on this project info:
  //   Project Name: ${name}
  //   Objective: ${objective}
  //   Description: ${description}
  //   Tech Stack: ${techStack}

  //   Generate clear, step-by-step development tasks required to complete this project.
  //   For each task, include:
  //     1. "title" – short task name
  //     2. "description" – what needs to be done
  //     3. "hint" – guidance or explanation on how to do it (useful for beginners)

  //   Follow the workflow described in the description if provided.

  //   Number of tasks depends on project complexity (e.g., 5-8 for small projects, 15-20 for fullstack apps).
  //   Each task should take 1-2 days to complete, and by the end of the tasks the project should be fully completed.
  //   Include frontend, backend, database, and other required parts if necessary.

  //   Return ONLY valid JSON in this exact format:
  //   [
  //     {"title": "...", "description": "...", "hint": "..."},
  //     ...
  //   ]
  // `;
  const prompt = `
  You are an AI Software mentor. Based on this project info:
  Project Name: ${name}
  Objective: ${objective}
  Description: ${description}
  Tech Stack: ${techStack}

  Generate clear, step-by-step development task titles required to complete this project.
  Each title should describe a meaningful step in the development process.

  - Do NOT include descriptions or hints.
  - The number of tasks should depend on project complexity:
      - 5–8 for small projects (like simple apps)
      - 10–20 for fullstack applications
  - Each task should be short (around 4–8 words).

  Return ONLY valid JSON in this exact format:
  [
    "Setup project environment",
    "Initialize GitHub repository",
    "Design database schema",
    "Build authentication system",
    ...
  ]
`;


  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const text = response.output[0]?.content[0]?.text;

    if (!text) {
      console.error("No text returned from AI response:", response);
      return [];
    }

    const tasks = JSON.parse(text);

    return tasks.map((task) => ({ ...task, status: "pending" }));
  } catch (err) {
    console.error("Error parsing AI response or generating tasks:", err);
    return [];
  }
};
