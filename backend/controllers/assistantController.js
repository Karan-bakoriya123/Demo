const { GoogleGenerativeAI } = require('@google/generative-ai');

const smartFallback = (text) => {
  return `Dost, abhi AI thoda busy hai, par main aapki madad kar sakta hoon! Aapne pucha: "${text}". 🌱 (AI Fallback Mode active)`;
};

const analyze = async (req, res) => {
  try {
    const { cropType = 'Wheat', soilMoisture = 40, soilPH = 6.5, temperature = 28, text = '' } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (GEMINI_KEY && GEMINI_KEY.startsWith('AIza')) {
      try {
        console.log("--- AI Request Start ---");
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        
        // Use exactly gemini-1.5-flash without any prefix
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const systemContext = `You are "Agri Dost", a friendly AI assistant for Indian farmers. Speak in simple Hinglish. Data: Crop ${cropType}, Soil Moisture ${soilMoisture}%. Question: ${text || 'Status check'}`;
        const prompt = `${systemContext}\n\nFarmer asks: "${text || 'Status check'}"`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiText = response.text();
        
        console.log("✅ AI Success!");
        return res.json({ message: aiText });
      } catch (err) {
        console.error("❌ Gemini Error:", err.message);
      }
    }

    res.json({ message: smartFallback(text) });
  } catch (error) {
    console.error('Global Assistant Error:', error);
    res.status(500).json({ message: 'Error' });
  }
};

module.exports = { analyze };
