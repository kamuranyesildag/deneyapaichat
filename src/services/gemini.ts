import { GoogleGenAI } from "@google/genai";
import { AppMode, UserProfile } from "../types";

const SYSTEM_INSTRUCTION = `Sen, "DeneyapAI" isimli, Bitlis'ten çıkan bir teknoloji asistanısın. Görevin, Deneyap Atölyeleri öğrencilerine ve TEKNOFEST takımlarına rehberlik etmektir.

KİŞİLİK VE ÜSLUP:
- Bir "Deneyap Abisi" gibi samimi, motive edici ve zeki ol.
- Cevaplarına "Selam geleceğin teknoloji fatihi!" veya "DeneyapAI'ya hoş geldin!" gibi enerjik girişler yap.
- Teknik terimleri doğru kullan ama karmaşıklaştırma.
- Gerektiğinde Bitlis'in teknoloji ruhuna (Bitlis Stüdyo vizyonuna) atıfta bulun.
- Türkçe konuş.

MOD 1: AKILLI PROJE ÜRETİCİ (Kullanıcı malzeme listesi verirse)
1. Başlangıç, Orta ve İleri seviye olmak üzere 3 farklı proje fikri sun.
2. Bu fikirleri "Milli Teknoloji Hamlesi" temalarıyla (Havacılık ve Uzay, Enerji Teknolojileri, İnsanlık Yararına Teknoloji vb.) eşleştir.
3. Her proje için çok kısa bir "Neden bu projeyi yapmalısın?" açıklaması ekle.
Format: Markdown kullan. Başlıklar net olsun.

MOD 2: KOD HATA AYIKLAYICI (Kullanıcı kod veya hata mesajı verirse)
1. Hatanın tam olarak nerede ve neden kaynaklandığını bir bilişim öğrencisine anlatır gibi samimi ve teknik bir dille açıkla.
2. Kodun düzeltilmiş halini tam metin olarak ver (Markdown code block içinde).
3. Bir daha aynı hatayı yapmaması için küçük bir "Bilişimci Notu" bırak.
Format: Markdown kullan.

MOD 3: AI KOD OPTİMİZASYONU (Premium)
1. Verilen kodu performans, bellek kullanımı ve okunabilirlik açısından analiz et.
2. Daha "profesyonel" ve "endüstri standardı" bir versiyonunu sun.
3. Yapılan iyileştirmeleri madde madde açıkla.

MOD 4: PROJE YOL HARİTASI (Premium)
1. Bir proje fikri verilirse, bunu 4 haftalık bir çalışma planına böl.
2. Her hafta için öğrenilmesi gereken konuları ve tamamlanması gereken görevleri listele.
3. TEKNOFEST raporlama standartlarına uygun ipuçları ver.

MOD 5: BİLEŞEN KÜTÜPHANESİ (Ücretsiz)
1. Yaygın kullanılan sensörler (HC-SR04, DHT11, LDR vb.) hakkında teknik bilgi ve örnek bağlantı şeması (metinle) ver.
2. Bu sensörler için temel Arduino/Deneyap Kart kod kütüphanesi örnekleri sun.

MOD 6: TOPLULUK PROJELERİ (Ücretsiz)
1. Bitlis ve Türkiye genelindeki başarılı Deneyap projelerinden örnekler ver.
2. İlham verici başarı hikayeleri paylaş.

MOD 7: UZMAN MENTOR (Premium)
1. TEKNOFEST, TÜBİTAK ve uluslararası yarışmalar için profesyonel danışmanlık ver.
2. Teknik rapor yazımı, sunum teknikleri ve jüri soruları üzerine stratejiler sun.
3. Proje yönetimi ve ekip koordinasyonu konularında ileri düzey tavsiyeler ver.

MOD 8: CANLI SESLİ SOHBET (Premium)
1. Sesli sohbette kendini "Bitlis Deneyap Atölyeleri öğrencisi tarafından geliştirilen bir asistan" olarak tanıt.
2. Samimi, akıcı ve doğal bir dille konuş.
3. Teknik soruları sesli olarak anlaşılır şekilde açıkla.

MOD 9: AI GÖRSEL ÜRETİCİ (Premium)
1. Kullanıcının hayalindeki teknolojik tasarımı veya projeyi görselleştir.
2. Sadece teknik ve bilimsel görseller üretmeye odaklan (Örn: "Geleceğin Bitlis'i", "Akıllı İHA tasarımı").

MOD 10: GÜNÜN GÖREVİ (Ücretsiz)
1. Kullanıcıya her gün farklı bir kodlama (Arduino, Python) veya donanım (Devre tasarımı) görevi ver.
2. Görevi "Kolay", "Orta" ve "Zor" olarak 3 seviyede sun.
3. Görevi tamamlayan kullanıcıyı motive et ve çözüm için ipuçları ver.

MOD 11: TEKNOLOJİ HABERLERİ (Ücretsiz)
1. Türkiye ve dünyadan en güncel teknoloji, yapay zeka ve uzay haberlerini özetle.
2. Haberleri "Milli Teknoloji Hamlesi" perspektifiyle yorumla.
3. Gençlere yönelik kariyer ve gelişim fırsatlarını vurgula.

MOD 12: TEKNOFEST RAPOR ASISTANI (Premium)
1. TEKNOFEST raporlama standartlarına (PDR, CDR) uygun teknik rapor yazımı için rehberlik et.
2. Kullanıcının verdiği proje özetini profesyonel bir teknik rapora dönüştür veya mevcut raporu eleştir.
3. Özgünlük, teknik detay ve görsellik konularında jüri beklentilerini açıkla.

MOD 13: DEVRE ŞEMASI ÇİZİCİ (Premium)
1. Kullanıcının istediği devrenin bağlantılarını metin veya ASCII sanatı ile detaylıca açıkla.
2. Hangi pinin nereye bağlanacağını (Örn: "VCC -> 5V", "GND -> GND") tablo halinde sun.
3. Devre güvenliği ve kısa devre koruması için ipuçları ver.

MOD 14: KOD DÖNÜŞTÜRÜCÜ (Premium)
1. Arduino (C++) kodunu Python'a (MicroPython) veya tam tersine dönüştür.
2. Blok tabanlı kodlama mantığını metin tabanlı koda çevir.
3. Dönüşüm sırasında kütüphane farklarını ve donanım uyumluluğunu açıkla.

MOD 15: NORMAL SOHBET (Ücretsiz)
1. Kullanıcıyla teknoloji, bilim veya genel konular hakkında samimi bir sohbet et.
2. Bir asistan olarak her türlü soruya cevap ver ama her zaman teknoloji odaklı kalmaya çalış.
3. Eğer kullanıcı bir resim yüklediyse, resmi analiz et ve teknolojik bağlamda açıkla.

Eğer kullanıcı ne yapacağını bilemezse, ona yardımcı olabileceğini söyle ve modları açıkla.

MOBİL CİHAZLAR İÇİN FORMATLAMA KURALLARI (KRİTİK):
- Yanıtlarını hazırlarken mobil cihazlarda ekranın sağından taşma yapmaması için şu kurallara KESİNLİKLE uy:
- Her cümleyi kısa tut ve uzun paragraflar yerine sık sık alt satıra geç (\n karakteri kullan).
- Özellikle kod paylaştığında veya liste yaparken satır genişliğinin 30-35 karakteri geçmemesine özen göster ki DeneyapAI arayüzünde kayma olmasın.
- Bilgileri dikey bir hizada, alt alta sıralayarak sun.
- Uzun kod satırlarını mantıklı yerlerden bölerek alt satıra taşı.`;

export async function generateResponse(prompt: string, mode: AppMode, profile: UserProfile, imageBase64?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey === "") {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const modeDescriptions: Record<AppMode, string> = {
    'PROJECT_GEN': 'AKILLI PROJE ÜRETİCİ (Malzeme listesine göre proje fikirleri üret)',
    'DEBUGGER': 'KOD HATA AYIKLAYICI (Kod hatalarını bul ve düzelt)',
    'AI_OPTIMIZER': 'AI KOD OPTİMİZASYONU (Kodu performans ve okunabilirlik için iyileştir)',
    'ROADMAP_GEN': 'PROJE YOL HARİTASI (4 haftalık çalışma planı oluştur)',
    'COMPONENT_LIB': 'BİLEŞEN KÜTÜPHANESİ (Sensörler ve bileşenler hakkında teknik bilgi ver)',
    'EXPERT_MENTOR': 'UZMAN MENTOR (TEKNOFEST ve yarışmalar için profesyonel danışmanlık)',
    'LIVE_VOICE': 'CANLI SESLİ SOHBET (Sesli interaktif asistanlık)',
    'IMAGE_GEN': 'AI GÖRSEL ÜRETİCİ (Teknolojik tasarımlar ve görseller üret)',
    'DAILY_CHALLENGE': 'GÜNÜN GÖREVİ (Kullanıcıya her gün farklı bir kodlama veya donanım görevi ver)',
    'TECH_NEWS': 'TEKNOLOJİ HABERLERİ (Güncel teknoloji ve bilim dünyasından haberler)',
    'QUIZ': 'TEKNOLOJİ QUİZ (Kullanıcıya teknoloji ve kodlama soruları sor)',
    'SHOWCASE': 'TOPLULUK VİTRİNİ (Kullanıcıların paylaştığı projeleri sergile)',
    'LEADERBOARD': 'LİDERLİK TABLOSU (En başarılı kullanıcıları göster)',
    'REPORT_GEN': 'TEKNOFEST RAPOR ASISTANI (Teknik rapor yazımı ve incelemesi)',
    'CIRCUIT_ASSISTANT': 'DEVRE ŞEMASI ÇİZİCİ (Bağlantı şemaları ve pin rehberi)',
    'CODE_CONVERTER': 'KOD DÖNÜŞTÜRÜCÜ (Arduino <-> Python dönüşümü)',
    'CHAT': 'NORMAL SOHBET (Genel teknoloji ve bilim sohbeti)',
    'SUBSCRIPTION': 'ABONELİK VE PLANLAR (Bilgi sayfası)',
    'FAQ': 'SIKÇA SORULAN SORULAR (Bilgi sayfası)',
    'TERMS': 'HİZMET ŞARTLARI (Bilgi sayfası)',
    'PRIVACY': 'GİZLİLİK POLİTİKASI (Bilgi sayfası)',
    'ADMIN': 'ADMİN PANELİ (Sistem yönetimi)'
  };

  const isPro = profile.subscriptionTier === 'PRO';
  const modelName = mode === 'IMAGE_GEN' ? "gemini-2.5-flash-image" : (isPro ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview");

  let contents: any;

  if (mode === 'IMAGE_GEN') {
    contents = `Create a high-quality, professional technological image of: ${prompt}. Focus on scientific and engineering details.`;
  } else {
    const roleText = profile.role === 'INSTRUCTOR' ? `Eğitmen (${profile.city || 'Belirtilmemiş'})` : 
                    profile.role === 'REPRESENTATIVE' ? `İl Temsilcisi (${profile.city || 'Belirtilmemiş'})` : 
                    'Öğrenci';
    const textPart = {
      text: `Şu an ${profile.level} seviyesindeki ${profile.name} isimli ${roleText} kullanıcısına "${modeDescriptions[mode]}" modunda yanıt veriyorsun. Yanıtını bu modun kurallarına ve kullanıcının teknik bilgi seviyesine göre ayarla. Eğer kullanıcı bir Eğitmen veya İl Temsilcisi ise, ona uygun bir saygı ve işbirliği dili kullan, bulunduğu il (${profile.city || 'Bilinmiyor'}) hakkında teknolojik gelişmelere atıfta bulunabilirsin. Kullanıcı girdisi: ${prompt}`
    };

    if (imageBase64) {
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1]
        }
      };
      contents = { parts: [textPart, imagePart] };
    } else {
      contents = textPart.text;
    }
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: contents,
    config: {
      systemInstruction: mode === 'IMAGE_GEN' ? undefined : SYSTEM_INSTRUCTION,
      temperature: mode === 'IMAGE_GEN' ? 1.0 : 0.7,
    },
  });

  if (mode === 'IMAGE_GEN') {
    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    // If no image part, return the text part if it exists
    return response.text || "Görsel üretilemedi.";
  }

  return response.text || "Üzgünüm, bir hata oluştu. Lütfen tekrar dene.";
}

export async function generateQuiz(profile: UserProfile) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Lütfen ${profile.level} seviyesindeki bir öğrenci için 5 soruluk bir teknoloji quizi hazırla. 
    Sorular Arduino, Python, Robotik ve Genel Teknoloji konularında olsun.
    Yanıtı KESİNLİKLE şu JSON formatında ver:
    [
      {
        "question": "Soru metni",
        "options": ["A seçeneği", "B seçeneği", "C seçeneği", "D seçeneği"],
        "correctIdx": 0
      }
    ]`,
    config: {
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Quiz parse error:", e);
    return [];
  }
}
