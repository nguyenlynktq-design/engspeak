import { GoogleGenAI, Modality } from "@google/genai";

// --- API Key Management ---
let cachedAI: GoogleGenAI | null = null;
let cachedKey: string = "";

function getAI(apiKey?: string): GoogleGenAI {
  const key = apiKey || localStorage.getItem("gemini_api_key") || process.env.GEMINI_API_KEY || "";
  if (!key) {
    throw new Error("API_KEY_MISSING");
  }
  if (cachedAI && cachedKey === key) return cachedAI;
  cachedAI = new GoogleGenAI({ apiKey: key });
  cachedKey = key;
  return cachedAI;
}

export function clearCachedAI() {
  cachedAI = null;
  cachedKey = "";
}

// --- Model Fallback Chain ---
const TEXT_MODEL_CHAIN = [
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemini-2.5-flash",
];

const IMAGE_MODEL = "gemini-2.5-flash-image";

const TTS_MODEL = "gemini-3.1-flash-tts-preview";

async function withRetry<T>(
  fn: (model: string) => Promise<T>,
  models: string[],
  maxRetries: number = 2
): Promise<T> {
  let lastError: any = null;
  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(model);
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.httpStatusCode || 0;
        const msg = err?.message || "";
        
        // If rate limited or server error, try next model/retry
        if (status === 429 || status >= 500 || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("overloaded")) {
          console.warn(`Model ${model} attempt ${attempt + 1} failed (${status}): ${msg}`);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          break; // try next model
        }
        // For other errors (auth, bad request), throw immediately
        throw err;
      }
    }
  }
  throw lastError || new Error("All models failed");
}

// --- Types ---
export interface VocabularyItem {
  word: string;
  ipa: string;
  meaning: string;
}

export interface ContentGenerationResult {
  prompt: string;
  readingText: string;
  topicName: string;
  translation: string;
  vocabulary: VocabularyItem[];
}

export type EnglishLevel = "Starters" | "Movers" | "Flyers" | "A1" | "A2" | "B1" | "B2";

// --- Content Generation ---
export const generateContent = async (
  input: string,
  level: EnglishLevel,
  mode: "generate" | "useInput" = "generate",
  imageData?: string,
  userName?: string,
  userAge?: string,
  apiKey?: string
): Promise<ContentGenerationResult> => {
  const ai = getAI(apiKey);

  const systemInstruction = `You are an expert educational content creator for English learners, strictly following the CEFR (Common European Framework of Reference for Languages) and Cambridge English Qualifications standards (Starters, Movers, Flyers, KET, PET).
  
  Your task is to generate:
  1. An image generation prompt for a children's book illustration (3D Pixar style, high-quality 2D vector, extremely vibrant, bright saturated colors, clean sharp lines, high contrast, cinematic lighting, 8k resolution style, very clear and detailed).
  2. A reading passage in English appropriate for the level: ${level}. 
     ${mode === 'useInput' 
       ? "CRITICAL: If the user provided text, use that EXACT text as the 'readingText'. If the user provided an image, perform OCR to extract the English text from the image and use it as the 'readingText'. Do NOT summarize or rewrite the main passage, keep it as close to the source as possible. You MUST still generate the other fields based on this specific text." 
       : "The content MUST be professional, educational, and follow Cambridge curriculum styles. Use clear, descriptive, and engaging language with a tone that sounds like a native English-speaking child or a friendly teacher speaking to a child. The passage should be about the topic and the image. For lower levels (Starters, Movers, Flyers), use short, rhythmic sentences (like a chant or poem) where each line is a complete thought and starts with a capital letter."
     }
  3. A short, catchy, and exciting title/topic name for this lesson (max 5 words). EVEN IN 'useInput' MODE, you must create a concise title based on the content if the input was long text.
  4. A Vietnamese translation of the reading passage.
  5. A list of 3-5 key vocabulary words from the text with their IPA pronunciation and Vietnamese meaning.
  
  Cambridge Level Specifics:
  - Starters (Pre-A1): Focus on nouns, colors, numbers, and simple actions. 20-40 words.
  - Movers (A1): Simple present, present continuous, basic descriptions. 40-60 words.
  - Flyers (A2): Past simple, future with 'going to', comparisons. 60-80 words.
  - A1/A2: Standard CEFR elementary content.
  - B1/B2: More complex structures, opinions, and abstract concepts.
  
  User Information (if provided):
  - Name: ${userName || 'Unknown'}
  - Age: ${userAge || 'Unknown'}
  
  If the name and age are provided, you can optionally incorporate them into the reading passage if it makes sense.
  
  Output the result in JSON format with these keys: "prompt", "readingText", "topicName", "translation", "vocabulary".
  - "prompt": string (English)
  - "readingText": string (English)
  - "topicName": string (English)
  - "translation": string (Vietnamese)
  - "vocabulary": array of objects { "word": string, "ipa": string, "meaning": string }
  
  The "prompt" should be in English, describing a visual scene that complements the text.
  The "readingText" should be the educational passage (either generated or extracted/provided).
  The "topicName" MUST be a short (max 5 words) catchy title for the lesson. If the user's input was a long text, extract/create a title for it.`;

  const parts: any[] = [{ text: `Topic/Content: ${input}\nLevel: ${level}\nMode: ${mode}` }];
  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData.split(",")[1],
      },
    });
  }

  return withRetry(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { 
        systemInstruction,
        responseMimeType: "application/json"
      },
    });

    try {
      const result = JSON.parse(response.text || "{}");
      return {
        prompt: result.prompt || "",
        readingText: result.readingText || "",
        topicName: result.topicName || (input.length < 50 ? input : "English Lesson"),
        translation: result.translation || "",
        vocabulary: result.vocabulary || []
      };
    } catch (e) {
      console.error("Failed to parse JSON response", e);
      return { 
        prompt: "", 
        readingText: "", 
        topicName: input || "General English",
        translation: "",
        vocabulary: []
      };
    }
  }, TEXT_MODEL_CHAIN);
};

// --- Image Generation ---
export const generateImage = async (
  prompt: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1",
  apiKey?: string
): Promise<string> => {
  const ai = getAI(apiKey);

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from Gemini");
};

// --- PCM to WAV ---
function pcmToWav(base64Pcm: string, sampleRate: number = 24000): string {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const buffer = new ArrayBuffer(44 + bytes.length);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + bytes.length, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM = 1)
  view.setUint16(20, 1, true);
  // channel count (mono = 1)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, bytes.length, true);

  // write PCM data
  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(bytes);

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

// --- Audio Generation (TTS) ---
export const generateAudio = async (text: string, level: EnglishLevel, apiKey?: string): Promise<string> => {
  const ai = getAI(apiKey);
  
  // Clean text: remove excessive whitespace and newlines, and truncate to avoid issues on long text
  const cleanedText = text.replace(/\s+/g, ' ').trim().substring(0, 1000);
  
  if (!cleanedText) {
    throw new Error("Text to speak is empty");
  }

  // User requested normal reading speed (1.0) and native child voice
  let speedInstruction = "Read at a normal, natural pace (1.0 speed)";
  if (["Starters", "Movers", "Flyers"].includes(level)) {
    speedInstruction = "Read at a clear, friendly, and natural pace suitable for children (slightly slower if needed but NOT artificial)";
  }

  const systemInstruction = `You are a native English speaker with a warm and clear voice.
Your SOLE task is to read the provided English text exactly as it is written.
${speedInstruction}
Output ONLY the audio data. Do NOT provide any text response, translations, or explanations.`;

  // Add a retry loop for robustness
  let lastError = null;
  // 'Puck' is a youthful/child-like voice. 'Zephyr' and 'Kore' are alternatives.
  const voices = ['Puck', 'Kore', 'Zephyr', 'Fenrir']; 
  
  for (let i = 0; i < 3; i++) {
    try {
      const currentVoice = voices[i % voices.length];
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: cleanedText }] }],
        config: {
          systemInstruction,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: currentVoice as any },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return pcmToWav(base64Audio);
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Audio generation attempt ${i + 1} failed with voice ${voices[i % voices.length]}:`, err);
      
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  if (lastError) {
    console.error("Gemini TTS Final Failure:", lastError);
  }
  throw lastError || new Error("No audio data returned from Gemini");
};

// --- Speech Evaluation ---
export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  cefrLevel?: string;
  isComplete: boolean;
  missingContent?: string;
  criteriaScores?: {
    pronunciation: number;
    stress: number;
    intonation: number;
    fluency: number;
    connectedSpeech: number;
  };
  ipaAnalysis?: {
    word: string;
    correctIpa: string;
    studentIpa: string;
    tip: string;
  }[];
  standardSentences?: string[];
  personalizedExercises?: string[];
}

export const evaluateSpeech = async (
  originalText: string,
  audioData: string,
  level: EnglishLevel,
  apiKey?: string
): Promise<EvaluationResult> => {
  const ai = getAI(apiKey);
  
  const systemInstruction = `Bạn là một giám khảo chấm phát âm tiếng Anh chuẩn quốc tế (IPA, CEFR) cực kỳ nghiêm túc nhưng cũng rất yêu thương, đóng vai cô Ly English.

Bối cảnh: Học sinh đang luyện đọc một đoạn văn cụ thể.
Nhiệm vụ: Nghe audio và đối soát VIDEO/AUDIO với Nội dung bài đọc gốc (Original Text).

🚨 BƯỚC 0: KIỂM TRA ĐỘ HOÀN THÀNH TUYỆT ĐỐI (ZERO TOLERANCE)
- Bạn phải đối soát TỪNG TỪ MỘT (WORD-BY-WORD). 
- Nếu học sinh bỏ sót dù chỉ 1-2 từ trong bài (omission), bạn phải đánh dấu là "isComplete": false.
- "missingContent": Ghi chính xác những từ hoặc cụm từ mà học sinh đã bỏ sót.
- "feedback": Nhắc nhở bé một cách nhẹ nhàng nhưng rõ ràng rằng bé đã đọc thiếu từ nào và yêu cầu đọc lại toàn bộ bài.
- NẾU "isComplete": false, KHÔNG ĐƯỢC CHẤM ĐIỂM CÁC TIÊU CHÍ KHÁC (để null hoặc 0).

🚨 NẾU ĐÃ ĐỌC ĐỦ 100% TỪ:
1. Chấm điểm từng tiêu chí (thang 10):
   - Pronunciation Accuracy (IPA chuẩn xác).
   - Word Stress (Trọng âm từ).
   - Intonation (Ngữ điệu lên xuống).
   - Fluency (Tốc độ và sự trôi chảy).
   - Connected Speech (Nối âm, nuốt âm đặc trưng người bản ngữ).

2. Xếp loại:
   - Tổng điểm: Điểm trung bình có trọng số.
   - Xếp loại CEFR (A1-C2).

3. Phân tích lỗi sai cụ thể (IPA Analysis):
   - Chỉ ra từ sai, IPA chuẩn vs IPA học sinh đọc sai.
   - Gợi ý cách sửa: Khẩu hình miệng, vị trí lưỡi, cách bật hơi.

PHONG CÁCH PHẢN HỒI (Cô Ly English):
- "Chào con, cô Ly đây! Cô đã nghe rất kỹ bài của con..."
- Nếu thiếu từ: "Ôi, cô thấy bài đọc của con rất hay nhưng con lỡ 'quên' mất 1-2 từ rồi. Con hãy đọc lại thật đầy đủ các từ [liệt kê từ thiếu] để cô chấm điểm 10 cho con nhé!"
- Màu sắc phản hồi: Tươi sáng, khích lệ.

Output định dạng JSON:
{
  "isComplete": boolean,
  "missingContent": string,
  "score": number,
  "cefrLevel": string,
  "criteriaScores": { "pronunciation": number, "stress": number, "intonation": number, "fluency": number, "connectedSpeech": number },
  "feedback": string,
  "ipaAnalysis": [ { "word": string, "correctIpa": string, "studentIpa": string, "tip": string } ],
  "standardSentences": string[],
  "personalizedExercises": string[],
  "strengths": string[],
  "improvements": string[]
}`;

  return withRetry(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: `Original Text: ${originalText}\nTarget Level: ${level}` },
            {
              inlineData: {
                mimeType: "audio/wav",
                data: audioData,
              },
            },
          ],
        },
      ],
      config: { 
        systemInstruction,
        responseMimeType: "application/json"
      },
    });

    try {
      const result = JSON.parse(response.text || "{}");
      return {
        isComplete: result.isComplete ?? true,
        missingContent: result.missingContent || "",
        score: result.score || 0,
        cefrLevel: result.cefrLevel || "A1",
        criteriaScores: result.criteriaScores,
        feedback: result.feedback || "Không thể đánh giá.",
        ipaAnalysis: result.ipaAnalysis || [],
        standardSentences: result.standardSentences || [],
        personalizedExercises: result.personalizedExercises || [],
        strengths: result.strengths || [],
        improvements: result.improvements || []
      };
    } catch (e) {
      console.error("Failed to parse evaluation response", e);
      throw new Error("Failed to evaluate speech");
    }
  }, TEXT_MODEL_CHAIN);
};
