const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Fallback logic
const leafFallback = () => ({
  healthStatus: 'Moderate', healthScore: 72, disease: 'Minor Nutrient Deficiency', 
  details: 'Patti mein halki peelahat hai. Nitrogen ki kami ho sakti hai.',
  pesticide: { needed: true, name: 'DAP', dosage: '50kg/acre', timing: 'Morning' },
  waterStatus: { deficiency: false, message: 'Pani theek hai.' },
  harvestEstimate: { daysRemaining: 45, message: '45 din mein tayyar.' },
  tips: ['Neem oil use karein', 'Organic khaad badhayein'], isMock: true
});

const soilFallback = () => ({
  soilType: 'Domat (Loamy)', soilColor: 'Dark Brown', moisture: 45, 
  details: 'Achhi mitti hai kheti ke liye.',
  suitableCrops: [{ name: 'Gehu', suitability: 'Excellent' }, { name: 'Dhan', suitability: 'Good' }],
  nutrients: { nitrogen: 60, phosphorus: 35, potassium: 40 },
  improvements: ['Compost use karein', 'Crop rotation apnaayein'],
  pH: 6.8, isMock: true
});

const analyzeWithGemini = async (imageBase64, type) => {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY || !GEMINI_KEY.startsWith('AIza')) return null;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    
    // Dynamically extract MIME type
    let mimeType = 'image/jpeg';
    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    if (mimeMatch) mimeType = mimeMatch[1];
    
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imagePart = { inlineData: { data: base64Data, mimeType } };

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let prompt = type === 'leaf' ? 
      `Analyze leaf image. Respond ONLY with JSON: { "plantName": "string", "healthStatus": "Healthy/Moderate/Unhealthy", "healthScore": 0-100, "disease": "name", "details": "Hinglish info", "pesticide": {"needed": bool, "name": "string", "dosage": "string", "timing": "string"}, "waterStatus": {"deficiency": bool, "message": "string"}, "harvestEstimate": {"daysRemaining": number, "message": "string"}, "tips": ["tip1", "tip2"], "isMock": false }` :
      `Analyze soil image. Respond ONLY with JSON: { "soilType": "string", "soilColor": "string", "moisture": number (0-100), "details": "Hinglish info", "suitableCrops": [{"name": "string", "suitability": "string"}], "nutrients": {"nitrogen": number (0-200), "phosphorus": number (0-150), "potassium": number (0-200)}, "improvements": ["tip1", "tip2"], "pH": number (0-14), "isMock": false }`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();
    
    // Robust JSON Extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not extract JSON from Gemini response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error(`❌ Scanner Gemini Error:`, err.message);
    return null;
  }
};

// HuggingFace Model Call for Leaf Disease
const analyzeWithHuggingFace = async (imageBase64) => {
  const HF_KEY = process.env.HUGGINGFACE_API_KEY;
  if (!HF_KEY) return null;

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const MODEL_URL = "https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_plant_disease";
    
    const response = await axios.post(MODEL_URL, imageBuffer, {
      headers: {
        "Authorization": `Bearer ${HF_KEY}`,
        "Content-Type": "application/octet-stream"
      }
    });

    const topPrediction = response.data[0]; 
    const plantName = topPrediction.label.split('___')[0].replace(/_/g, ' ') || 'Unknown Plant';
    const diseaseName = topPrediction.label.replace(/_/g, ' ').split('---')[1] || topPrediction.label;
    const isHealthy = topPrediction.label.toLowerCase().includes('healthy');

    return {
      plantName: plantName,
      healthStatus: isHealthy ? 'Healthy' : 'Unhealthy',
      healthScore: Math.round(topPrediction.score * 100),
      disease: isHealthy ? 'None' : diseaseName,
      details: `HuggingFace AI Analysis: ${isHealthy ? 'Plant looks healthy.' : 'Detected ' + diseaseName + '.'}`,
      pesticide: { 
        needed: !isHealthy, 
        name: isHealthy ? 'None' : 'Consult Expert', 
        dosage: isHealthy ? '-' : 'As required', 
        timing: isHealthy ? '-' : 'Morning/Evening' 
      },
      waterStatus: { deficiency: false, message: 'Monitor regularly.' },
      harvestEstimate: { daysRemaining: 30, message: 'Keep monitoring.' },
      tips: ['Maintain soil moisture', 'Check for pests weekly'],
      isMock: false
    };
  } catch (error) {
    console.error("❌ HuggingFace API Error:", error.message);
    return null;
  }
};

const scanLeaf = async (req, res) => {
  // Try HuggingFace first for precise disease detection
  let result = await analyzeWithHuggingFace(req.body.image);
  
  // Fallback to Gemini if HuggingFace fails (e.g. cold start timeout)
  if (!result) {
    console.log("Falling back to Gemini for Leaf Scan...");
    result = await analyzeWithGemini(req.body.image, 'leaf');
  }

  res.json(result || leafFallback());
};

const scanSoil = async (req, res) => {
  const result = await analyzeWithGemini(req.body.image, 'soil');
  res.json(result || soilFallback());
};

module.exports = { scanLeaf, scanSoil };
