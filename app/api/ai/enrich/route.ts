import OpenAI from "openai";

export async function POST(request: Request) {
  const openai = new OpenAI();
  const { title, description } = await request.json();

  if (!title || typeof title !== "string") {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a task management assistant. Rewrite the given task title and description to be clearer, more specific, and more actionable.
IMPORTANT: Keep the SAME LANGUAGE as the input. Do NOT translate. If the input is in Bulgarian, write in Bulgarian. If in English, write in English.
Return a JSON object with exactly these fields:
- title: string (clear, concise, imperative form, 3-8 words)
- description: string (detailed, actionable description, 1-3 sentences)

Preserve the core meaning. Make it professional and motivating.`,
      },
      {
        role: "user",
        content: JSON.stringify({ title, description: description ?? "" }),
      },
    ],
  });

  const result = JSON.parse(completion.choices[0].message.content!) as {
    title: string;
    description: string;
  };
  return Response.json(result);
}
