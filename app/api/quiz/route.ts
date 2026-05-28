import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json()
    if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 })

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const prompt = `Generate 5 multiple choice quiz questions about "${topic}".
Respond ONLY with valid JSON, no markdown, no backticks.

{
  "quiz": [
    { "question": "Question?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Option A" },
    { "question": "Question?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Option B" },
    { "question": "Question?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Option C" },
    { "question": "Question?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Option D" },
    { "question": "Question?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Option A" }
  ]
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const text = completion.choices[0]?.message?.content || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Quiz error:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}