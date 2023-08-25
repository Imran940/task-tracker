import openai from "@/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { todos } = await request.json();
  console.log(todos);

  //communicate with openAi GPT
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 0.8,
    n: 1,
    stream: false,
    messages: [
      {
        role: "system",
        content:
          "When responding, welcome the user always as Mr.Imran Shaikh and say welcome to the platform! Limit the response to 200 characters",
      },
      {
        role: "user",
        content: `Hi there, provide a summary of the following tasks. Count how many tasks are in each category such as To do, in progress and done, then tell the user to have a productive day! here's the data: ${JSON.stringify(
          todos
        )}`,
      },
    ],
  });
  const { data } = response;
  console.log(data);
  console.log(data.choices[0].message);
  return NextResponse.json(data.choices[0].message);
}
