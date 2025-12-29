
// AI API functionality restored using Google GenAI SDK.
import { GoogleGenAI, Type } from "@google/genai";
import { Server } from "../types";

// Initialize the Gemini API client using the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini 3 Pro to analyze server inventory and answer complex queries about the infrastructure.
 */
export async function analyzeInventory(servers: Server[], userPrompt: string): Promise<string> {
  try {
    // Prepare a concise context for the model
    const serverContext = JSON.stringify(servers.map(s => ({
      name: s.name,
      ip: s.ipAddress,
      os: `${s.os} ${s.osVersion}`,
      resources: `${s.cpu} vCPU, ${s.memory} RAM`,
      owner: s.owner,
      dept: s.department,
      backup: s.isBackedUp ? 'Aktif' : 'Yok',
      patched: s.lastPatchedDate
    })));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Sen Nesine.com altyapı ekibi için bir analiz uzmanısın. 
Envanter verileri: ${serverContext}

Kullanıcı sorusu: "${userPrompt}"

Lütfen verileri analiz et ve profesyonel, Türkçe bir yanıt dön. Teknik detaylara ve risklere (yedekleme, yama durumu vb.) vurgu yap.`,
    });

    return response.text || "Modelden yanıt alınamadı.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI Analizi sırasında bir hata oluştu. Lütfen bağlantınızı kontrol edin.";
  }
}

/**
 * Uses Gemini's JSON mode to parse messy text input into structured Server objects.
 */
export async function parseUnstructuredServers(text: string): Promise<Server[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Aşağıdaki metinden sunucu bilgilerini ayıkla: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              ipAddress: { type: Type.STRING },
              os: { type: Type.STRING, enum: ['Linux', 'Windows', 'Other'] },
              osVersion: { type: Type.STRING },
              cpu: { type: Type.STRING },
              memory: { type: Type.STRING },
              vCenterName: { type: Type.STRING },
              department: { type: Type.STRING },
              owner: { type: Type.STRING },
              isBackedUp: { type: Type.BOOLEAN }
            },
            required: ['name', 'ipAddress']
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results.map((s: any) => ({
      ...s,
      id: Math.random().toString(36).substr(2, 9),
      disk: '50 GB',
      infraType: 'Virtual',
      installationDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    })) as Server[];
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Metin analiz edilemedi. Lütfen daha net bir veri girin.");
  }
}
