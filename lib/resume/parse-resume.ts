import { z } from "zod"

import { GEMINI_RESUME_MODEL, getGeminiClient } from "@/lib/gemini/client"
import { parsedResumeSchema, type ParsedResume } from "@/lib/resume/schema"

const RESUME_PARSE_PROMPT = `You are a resume parsing assistant. Extract all important details from the uploaded resume and return them in the provided JSON schema.

Rules:
- Extract profile information (name, email, phone, location, URLs, professional summary)
- Extract all skills as a flat list
- Extract work experience with company, title, dates, and bullet-point responsibilities
- Extract education entries with institution, degree, field of study, and dates
- Extract projects with name, description, URL, and technologies
- Extract certifications with issuer and dates
- Extract any other important links (portfolio, blog, etc.)
- Use ISO-like date strings when possible (e.g. "2020-01" or "Jan 2020")
- If a field is not found, omit it or use null
- Do not invent information that is not in the resume`

export async function parseResume(
  buffer: Buffer,
  mimeType: string
): Promise<ParsedResume> {
  const ai = getGeminiClient()
  const base64 = buffer.toString("base64")

  const response = await ai.models.generateContent({
    model: GEMINI_RESUME_MODEL,
    contents: [
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
      { text: RESUME_PARSE_PROMPT },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(parsedResumeSchema),
    },
  })

  const text = response.text
  if (!text) {
    throw new Error("Gemini returned an empty response")
  }

  return parsedResumeSchema.parse(JSON.parse(text))
}
