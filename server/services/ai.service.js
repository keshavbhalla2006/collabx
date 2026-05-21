const Groq = require('groq-sdk');
require('dotenv').config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const generateQuestion = async ({ topic, difficulty, language }) => {

  const prompt = `
You are a technical interview question generator for a collaborative coding platform called CollabX.

Generate a coding problem with the following requirements:
- Topic: ${topic || 'Data Structures and Algorithms'}
- Difficulty: ${difficulty || 'Medium'}
- Programming Language context: ${language || 'Any'}

Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation outside the JSON.

The JSON must follow this exact structure:
{
  "title": "Problem title here",
  "difficulty": "Easy | Medium | Hard",
  "topic": "topic name",
  "description": "Full problem description. Explain what the function should do clearly.",
  "examples": [
    {
      "input": "example input here",
      "output": "expected output here",
      "explanation": "why this is the output"
    },
    {
      "input": "another input",
      "output": "another output",
      "explanation": "explanation"
    }
  ],
  "constraints": [
    "constraint 1 e.g. 1 <= nums.length <= 10^4",
    "constraint 2",
    "constraint 3"
  ],
  "hints": [
    "First hint to help if stuck",
    "Second hint"
  ],
  "starterCode": {
    "javascript": "function solution() {\n  // your code here\n}",
    "python": "def solution():\n    # your code here\n    pass",
    "java": "public class Main {\n  public static void main(String[] args) {\n    // your code here\n  }\n}",
    "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n  // your code here\n  return 0;\n}"
  }
}
`;

  const response = await client.chat.completions.create({
    model:       'llama-3.3-70b-versatile',  // best free model on Groq
    messages:    [{ role: 'user', content: prompt }],
    max_tokens:  2000,
    temperature: 0.7,
  });

  const raw = response.choices[0].message.content.trim();

  // Strip markdown fences if model wraps the JSON
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const question = JSON.parse(cleaned);
  return question;
};

module.exports = { generateQuestion };