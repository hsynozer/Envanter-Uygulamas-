
import { GoogleGenAI, Type } from "@google/genai";
import { Server, OSFamily, InfrastructureType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeInventory(servers: Server[], userPrompt: string) {
  const model = "gemini-3-pro-preview";
  
  const inventoryContext = servers.map(s => ({
    name: s.name,
    ip: s.ipAddress,
    os: `${s.os} ${s.osVersion}`,
    vc: s.vCenterName,
    team: s.department,
    backup: s.isBackedUp ? 'Yes' : 'No',
    lastPatched: s.lastPatchedDate || 'Bilinmiyor'
  }));

  const systemInstruction = `
    Sen bir kıdemli sistem yöneticisi ve altyapı mimarısın. 
    Sana sunulan sunucu envanterini analiz etmen isteniyor.
    Verilen JSON listesini kullanarak soruları yanıtla, riskleri belirle (yedeklenmeyenler, eski OS sürümleri, son 90 gündür yama almayanlar vb.) 
    veya istenilen istatistikleri çıkar. Yanıtlarını profesyonel ve kısa tut. 
    Mümkünse Markdown formatında yanıt ver.
  `;

  const prompt = `
    Envanter Verisi: ${JSON.stringify(inventoryContext)}
    
    Kullanıcı Sorusu: ${userPrompt}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.";
  }
}

export async function parseUnstructuredServers(text: string): Promise<Server[]> {
  const model = "gemini-3-pro-preview";

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        ipAddress: { type: Type.STRING },
        os: { type: Type.STRING, description: "Only 'Linux' or 'Windows' or 'Other'" },
        osVersion: { type: Type.STRING },
        cpu: { type: Type.STRING, description: "Extract the numeric core count. E.g., '4'" },
        memory: { type: Type.STRING, description: "Extract RAM size. E.g., '8 GB'" },
        disk: { type: Type.STRING, description: "Always set this to '50 GB' regardless of input" },
        infraType: { type: Type.STRING, description: "Only 'Virtual' or 'Physical'" },
        vCenterName: { type: Type.STRING },
        installationDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
        lastPatchedDate: { type: Type.STRING, description: "YYYY-MM-DD format. If not mentioned, return null." },
        department: { type: Type.STRING },
        owner: { type: Type.STRING },
        techTeam: { type: Type.STRING },
        isBackedUp: { type: Type.BOOLEAN },
      },
      required: ["name", "ipAddress", "os"],
    }
  };

  const systemInstruction = `
    Sen bir veri dönüştürme uzmanısın. Kullanıcının verdiği karışık sunucu bilgilerini analiz et.
    Metin içindeki sunucu adlarını, IP'leri, işletim sistemlerini ayıkla.
    KRİTİK KURAL: IPv6 adresi (içinde ':' olan adresler) içeren sunucuları KESİNLİKLE LİSTEYE EKLEME.
    Sadece standart IPv4 (örn: 192.168.1.1) adreslerini işle.
    CPU tespiti yaparken yanında birim olmayan küçük sayıları (1-128 arası) vCPU olarak değerlendir.
    DİSK bilgisini metinde ne yazarsa yazsın '50 GB' olarak ayarla.
    YAMA TARİHİ bilgisi metinde geçmiyorsa asla uydurma, null döndür.
    OS alanı sadece 'Linux', 'Windows' veya 'Other' olmalıdır.
    Çıktıyı mutlaka JSON formatında döndür.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Şu metinden sunucu listesi çıkar (IPv6'ları atla): \n\n${text}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      os: (item.os === 'Linux' || item.os === 'Windows' || item.os === 'Other') ? item.os : 'Other',
      cpu: item.cpu || '1',
      memory: item.memory || '4 GB',
      disk: '50 GB',
      lastPatchedDate: item.lastPatchedDate || '',
      infraType: (item.infraType === 'Virtual' || item.infraType === 'Physical') ? item.infraType : 'Virtual',
      updatedAt: new Date().toISOString()
    })) as Server[];
  } catch (error) {
    console.error("AI Parse Error:", error);
    throw new Error("Metin analiz edilemedi.");
  }
}
