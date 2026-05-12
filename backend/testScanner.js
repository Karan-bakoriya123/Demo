const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const base64Data = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8A/wD/2Q==";
    const imagePart = { inlineData: { data: base64Data, mimeType: 'image/jpeg' } };
    const prompt = `Analyze soil image. Respond ONLY with JSON: { "soilType": "string", "soilColor": "string", "moisture": "string", "details": "Hinglish info", "suitableCrops": [{"name": "string", "suitability": "string"}], "nutrients": {"nitrogen": "string", "phosphorus": "string", "potassium": "string"}, "improvements": ["tip1", "tip2"], "pH": "string", "isMock": false }`;
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();
    console.log("Raw Response:", text);
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    console.log("Parsed JSON:", JSON.parse(text));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
