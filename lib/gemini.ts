import Groq from 'groq-sdk'

export async function generateStudyPlan(topic: string) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const prompt = `You are an expert study planner. Generate a complete study plan for the topic: "${topic}".

Respond ONLY with a valid JSON object, no markdown, no backticks, no extra text.

{
  "key_concepts": ["concept 1", "concept 2", "concept 3", "concept 4", "concept 5"],
  "summary": "A 2-3 sentence overview of the topic",
  "study_plan": [
    { "day": 1, "title": "Introduction", "tasks": ["task 1", "task 2"] },
    { "day": 2, "title": "Core concepts", "tasks": ["task 1", "task 2"] },
    { "day": 3, "title": "Deep dive", "tasks": ["task 1", "task 2"] },
    { "day": 4, "title": "Practice", "tasks": ["task 1", "task 2"] },
    { "day": 5, "title": "Revision", "tasks": ["task 1", "task 2"] }
  ],
  "flashcards": [
    { "front": "Question 1?", "back": "Answer 1" },
    { "front": "Question 2?", "back": "Answer 2" },
    { "front": "Question 3?", "back": "Answer 3" },
    { "front": "Question 4?", "back": "Answer 4" },
    { "front": "Question 5?", "back": "Answer 5" },
    { "front": "Question 6?", "back": "Answer 6" },
    { "front": "Question 7?", "back": "Answer 7" },
    { "front": "Question 8?", "back": "Answer 8" }
  ],
  "quiz": [
    { "question": "Question 1?", "options": ["A", "B", "C", "D"], "answer": "A" },
    { "question": "Question 2?", "options": ["A", "B", "C", "D"], "answer": "B" },
    { "question": "Question 3?", "options": ["A", "B", "C", "D"], "answer": "C" },
    { "question": "Question 4?", "options": ["A", "B", "C", "D"], "answer": "A" },
    { "question": "Question 5?", "options": ["A", "B", "C", "D"], "answer": "D" }
  ],
  "revision_dates": [1, 3, 7, 14, 30]
}`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const text = completion.choices[0]?.message?.content || ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}