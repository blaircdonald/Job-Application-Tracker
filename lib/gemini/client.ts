import { GoogleGenAI } from "@google/genai"

export const GEMINI_RESUME_MODEL = "gemini-3.1-flash-lite"

let geminiClient: GoogleGenAI | null = null

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }

  return geminiClient
}
