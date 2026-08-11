import { GoogleGenAI } from '@google/genai/web'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

function getClient() {
  if (!apiKey) {
    throw new Error(
      'API 키가 없습니다. Netlify → Environment variables에 VITE_GEMINI_API_KEY를 등록한 뒤 다시 배포하세요.',
    )
  }

  return new GoogleGenAI({ apiKey })
}

/**
 * Gemini Interactions API로 텍스트를 요청합니다.
 * @param {string} input
 * @returns {Promise<string>}
 */
export async function askGemini(input) {
  const ai = getClient()

  const interaction = await ai.interactions.create({
    model: 'gemini-3.6-flash',
    input,
  })

  return interaction.outputText ?? interaction.output_text ?? ''
}
