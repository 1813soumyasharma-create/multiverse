import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API Key not configured on server' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelsToTry = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-1.5-flash-latest"];
    let botText = "";
    let success = false;
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({ model: modelName, contents: prompt });
        botText = response.text || "No response.";
        success = true;
        break;
      } catch (error: any) {
        lastError = error;
        if (error.message.includes("503") || error.message.includes("high demand")) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    if (!success) throw lastError;
    res.status(200).json({ text: botText });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
