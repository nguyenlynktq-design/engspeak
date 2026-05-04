import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello"
    });
    console.log("TEXT SUCCESS:", res.text);
  } catch (e) {
    console.error("TEXT ERROR:", e.message, e.status);
  }

  try {
    const res = await ai.models.generateContent({
      model: "imagen-3.0-generate-002",
      contents: "A cat"
    });
    console.log("IMAGE SUCCESS:", res);
  } catch (e) {
    console.error("IMAGE ERROR:", e.message, e.status);
  }
}
test();
