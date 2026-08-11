import { GoogleGenAI } from '@google/genai'

// Vite는 VITE_ 로 시작하는 환경변수만 클라이언트에서 사용 가능
const apiKey = import.meta.env.VITE_GEMINI_API_KEY

export const ai = new GoogleGenAI({ apiKey })

/**
 * Gemini Interactions API로 텍스트를 요청합니다.
 * @param {string} input
 * @returns {Promise<string>}
 */
export async function askGemini(input) {
  const interaction = await ai.interactions.create({
    model: 'gemini-3.6-flash',
    input,
  })

  // SDK 버전에 따라 camelCase / snake_case 둘 다 대비
  return interaction.outputText ?? interaction.output_text ?? ''
}
