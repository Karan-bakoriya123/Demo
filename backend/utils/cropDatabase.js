/**
 * Crop Knowledge Database
 * Contains growth stages, water needs, pesticide schedules, and temperature ranges
 * for major Indian crops.
 */

const cropDatabase = {
  wheat: {
    name: 'Wheat', nameHi: 'गेहूं', emoji: '🌾',
    totalDays: 120,
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', startDay: 0, endDay: 15, icon: '🌱', waterNeed: 'moderate' },
      { name: 'Tillering', nameHi: 'कल्ले फूटना', startDay: 16, endDay: 45, icon: '🌿', waterNeed: 'high' },
      { name: 'Jointing', nameHi: 'गांठ बनना', startDay: 46, endDay: 70, icon: '🎋', waterNeed: 'high' },
      { name: 'Heading', nameHi: 'बाली निकलना', startDay: 71, endDay: 95, icon: '🌾', waterNeed: 'moderate' },
      { name: 'Ripening', nameHi: 'पकना', startDay: 96, endDay: 120, icon: '🟡', waterNeed: 'low' },
    ],
    optimalTemp: { min: 15, max: 25 },
    criticalTemp: { min: 5, max: 38 },
    waterPerDay: 4.5,
    totalWaterNeeded: 450,
    pesticideSchedule: [
      { day: 25, type: 'Herbicide', nameHi: 'खरपतवार नाशक', description: 'Weed control spray' },
      { day: 55, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Rust & blight prevention' },
      { day: 80, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Aphid control' },
    ],
    optimalPH: { min: 6.0, max: 7.5 },
    optimalMoisture: { min: 40, max: 65 },
  },
  rice: {
    name: 'Rice', nameHi: 'धान', emoji: '🌾',
    totalDays: 130,
    stages: [
      { name: 'Nursery', nameHi: 'नर्सरी', startDay: 0, endDay: 25, icon: '🌱', waterNeed: 'high' },
      { name: 'Transplanting', nameHi: 'रोपाई', startDay: 26, endDay: 40, icon: '🌿', waterNeed: 'very_high' },
      { name: 'Tillering', nameHi: 'कल्ले', startDay: 41, endDay: 75, icon: '🎋', waterNeed: 'very_high' },
      { name: 'Panicle Init.', nameHi: 'बाली बनना', startDay: 76, endDay: 100, icon: '🌾', waterNeed: 'high' },
      { name: 'Ripening', nameHi: 'पकाव', startDay: 101, endDay: 130, icon: '🟡', waterNeed: 'moderate' },
    ],
    optimalTemp: { min: 22, max: 32 },
    criticalTemp: { min: 10, max: 42 },
    waterPerDay: 8,
    totalWaterNeeded: 1000,
    pesticideSchedule: [
      { day: 20, type: 'Herbicide', nameHi: 'खरपतवार नाशक', description: 'Pre-emergence weed control' },
      { day: 50, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Stem borer control' },
      { day: 75, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Blast disease prevention' },
    ],
    optimalPH: { min: 5.5, max: 7.0 },
    optimalMoisture: { min: 70, max: 100 },
  },
  maize: {
    name: 'Maize', nameHi: 'मक्का', emoji: '🌽',
    totalDays: 95,
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', startDay: 0, endDay: 10, icon: '🌱', waterNeed: 'moderate' },
      { name: 'Vegetative', nameHi: 'वानस्पतिक वृद्धि', startDay: 11, endDay: 45, icon: '🌿', waterNeed: 'high' },
      { name: 'Tasseling', nameHi: 'फूल आना', startDay: 46, endDay: 65, icon: '🌸', waterNeed: 'very_high' },
      { name: 'Grain Fill', nameHi: 'दाना भरना', startDay: 66, endDay: 85, icon: '🌽', waterNeed: 'high' },
      { name: 'Maturity', nameHi: 'पकाव', startDay: 86, endDay: 95, icon: '🟡', waterNeed: 'low' },
    ],
    optimalTemp: { min: 18, max: 32 },
    criticalTemp: { min: 8, max: 40 },
    waterPerDay: 6,
    totalWaterNeeded: 550,
    pesticideSchedule: [
      { day: 15, type: 'Herbicide', nameHi: 'खरपतवार नाशक', description: 'Post-emergence weed control' },
      { day: 40, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Fall armyworm control' },
      { day: 60, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Downy mildew prevention' },
    ],
    optimalPH: { min: 5.8, max: 7.0 },
    optimalMoisture: { min: 40, max: 65 },
  },
  soybean: {
    name: 'Soybean', nameHi: 'सोयाबीन', emoji: '🟢',
    totalDays: 100,
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', startDay: 0, endDay: 12, icon: '🌱', waterNeed: 'moderate' },
      { name: 'Vegetative', nameHi: 'पत्ती वृद्धि', startDay: 13, endDay: 40, icon: '🌿', waterNeed: 'moderate' },
      { name: 'Flowering', nameHi: 'फूल', startDay: 41, endDay: 65, icon: '🌸', waterNeed: 'high' },
      { name: 'Pod Fill', nameHi: 'फली भरना', startDay: 66, endDay: 88, icon: '🫛', waterNeed: 'high' },
      { name: 'Maturity', nameHi: 'पकाव', startDay: 89, endDay: 100, icon: '🟡', waterNeed: 'low' },
    ],
    optimalTemp: { min: 20, max: 30 },
    criticalTemp: { min: 10, max: 38 },
    waterPerDay: 5,
    totalWaterNeeded: 480,
    pesticideSchedule: [
      { day: 20, type: 'Herbicide', nameHi: 'खरपतवार नाशक', description: 'Broadleaf weed control' },
      { day: 45, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Whitefly & aphid control' },
      { day: 65, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Rust prevention' },
    ],
    optimalPH: { min: 6.0, max: 7.0 },
    optimalMoisture: { min: 45, max: 65 },
  },
  cotton: {
    name: 'Cotton', nameHi: 'कपास', emoji: '🌸',
    totalDays: 160,
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', startDay: 0, endDay: 15, icon: '🌱', waterNeed: 'moderate' },
      { name: 'Squaring', nameHi: 'कली बनना', startDay: 16, endDay: 60, icon: '🌿', waterNeed: 'high' },
      { name: 'Flowering', nameHi: 'फूल', startDay: 61, endDay: 100, icon: '🌸', waterNeed: 'very_high' },
      { name: 'Boll Dev.', nameHi: 'टिंडा बनना', startDay: 101, endDay: 140, icon: '⚪', waterNeed: 'high' },
      { name: 'Opening', nameHi: 'चुनाई', startDay: 141, endDay: 160, icon: '☁️', waterNeed: 'low' },
    ],
    optimalTemp: { min: 25, max: 35 },
    criticalTemp: { min: 15, max: 43 },
    waterPerDay: 5.5,
    totalWaterNeeded: 700,
    pesticideSchedule: [
      { day: 30, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Jassid & whitefly control' },
      { day: 65, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Bollworm control' },
      { day: 90, type: 'Herbicide', nameHi: 'खरपतवार नाशक', description: 'Weed management' },
      { day: 110, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Pink bollworm control' },
    ],
    optimalPH: { min: 6.0, max: 8.0 },
    optimalMoisture: { min: 45, max: 70 },
  },
  mustard: {
    name: 'Mustard', nameHi: 'सरसों', emoji: '🟡',
    totalDays: 110,
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', startDay: 0, endDay: 10, icon: '🌱', waterNeed: 'low' },
      { name: 'Rosette', nameHi: 'पत्ती वृद्धि', startDay: 11, endDay: 40, icon: '🌿', waterNeed: 'moderate' },
      { name: 'Flowering', nameHi: 'फूल', startDay: 41, endDay: 70, icon: '🌼', waterNeed: 'high' },
      { name: 'Pod Fill', nameHi: 'फली', startDay: 71, endDay: 95, icon: '🫛', waterNeed: 'moderate' },
      { name: 'Maturity', nameHi: 'पकाव', startDay: 96, endDay: 110, icon: '🟡', waterNeed: 'low' },
    ],
    optimalTemp: { min: 10, max: 25 },
    criticalTemp: { min: 3, max: 35 },
    waterPerDay: 3,
    totalWaterNeeded: 280,
    pesticideSchedule: [
      { day: 20, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Aphid control' },
      { day: 45, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'White rust prevention' },
    ],
    optimalPH: { min: 6.0, max: 7.5 },
    optimalMoisture: { min: 35, max: 55 },
  },
  potato: {
    name: 'Potato', nameHi: 'आलू', emoji: '🥔',
    totalDays: 90,
    stages: [
      { name: 'Sprouting', nameHi: 'अंकुरण', startDay: 0, endDay: 20, icon: '🌱', waterNeed: 'moderate' },
      { name: 'Vegetative', nameHi: 'पत्ती वृद्धि', startDay: 21, endDay: 50, icon: '🌿', waterNeed: 'high' },
      { name: 'Tuber Init.', nameHi: 'कंद बनना', startDay: 51, endDay: 70, icon: '🥔', waterNeed: 'very_high' },
      { name: 'Maturity', nameHi: 'पकाव', startDay: 71, endDay: 90, icon: '🟡', waterNeed: 'low' },
    ],
    optimalTemp: { min: 15, max: 22 },
    criticalTemp: { min: 5, max: 32 },
    waterPerDay: 5.5,
    totalWaterNeeded: 480,
    pesticideSchedule: [
      { day: 15, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Early blight prevention' },
      { day: 40, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Aphid & tuber moth control' },
      { day: 55, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Late blight control' },
    ],
    optimalPH: { min: 5.5, max: 6.5 },
    optimalMoisture: { min: 50, max: 70 },
  },
  tomato: {
    name: 'Tomato', nameHi: 'टमाटर', emoji: '🍅',
    totalDays: 100,
    stages: [
      { name: 'Seedling', nameHi: 'पौध', startDay: 0, endDay: 20, icon: '🌱', waterNeed: 'moderate' },
      { name: 'Vegetative', nameHi: 'पत्ती वृद्धि', startDay: 21, endDay: 50, icon: '🌿', waterNeed: 'high' },
      { name: 'Flowering', nameHi: 'फूल', startDay: 51, endDay: 70, icon: '🌸', waterNeed: 'very_high' },
      { name: 'Fruiting', nameHi: 'फल', startDay: 71, endDay: 90, icon: '🍅', waterNeed: 'high' },
      { name: 'Harvest', nameHi: 'कटाई', startDay: 91, endDay: 100, icon: '🔴', waterNeed: 'moderate' },
    ],
    optimalTemp: { min: 18, max: 28 },
    criticalTemp: { min: 8, max: 38 },
    waterPerDay: 5,
    totalWaterNeeded: 480,
    pesticideSchedule: [
      { day: 25, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Early blight spray' },
      { day: 45, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Whitefly & mite control' },
      { day: 65, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Late blight control' },
    ],
    optimalPH: { min: 6.0, max: 7.0 },
    optimalMoisture: { min: 50, max: 70 },
  },
  onion: {
    name: 'Onion', nameHi: 'प्याज', emoji: '🧅',
    totalDays: 120,
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', startDay: 0, endDay: 15, icon: '🌱', waterNeed: 'moderate' },
      { name: 'Vegetative', nameHi: 'पत्ती वृद्धि', startDay: 16, endDay: 60, icon: '🌿', waterNeed: 'high' },
      { name: 'Bulb Init.', nameHi: 'कंद बनना', startDay: 61, endDay: 90, icon: '🧅', waterNeed: 'high' },
      { name: 'Maturity', nameHi: 'पकाव', startDay: 91, endDay: 120, icon: '🟡', waterNeed: 'low' },
    ],
    optimalTemp: { min: 13, max: 24 },
    criticalTemp: { min: 5, max: 35 },
    waterPerDay: 4,
    totalWaterNeeded: 380,
    pesticideSchedule: [
      { day: 30, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Purple blotch control' },
      { day: 60, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Thrips control' },
    ],
    optimalPH: { min: 6.0, max: 7.0 },
    optimalMoisture: { min: 40, max: 60 },
  },
  sugarcane: {
    name: 'Sugarcane', nameHi: 'गन्ना', emoji: '🎋',
    totalDays: 300,
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', startDay: 0, endDay: 30, icon: '🌱', waterNeed: 'moderate' },
      { name: 'Tillering', nameHi: 'कल्ले', startDay: 31, endDay: 90, icon: '🌿', waterNeed: 'high' },
      { name: 'Grand Growth', nameHi: 'तेज वृद्धि', startDay: 91, endDay: 200, icon: '🎋', waterNeed: 'very_high' },
      { name: 'Ripening', nameHi: 'पकाव', startDay: 201, endDay: 300, icon: '🟡', waterNeed: 'low' },
    ],
    optimalTemp: { min: 20, max: 35 },
    criticalTemp: { min: 10, max: 45 },
    waterPerDay: 7,
    totalWaterNeeded: 1500,
    pesticideSchedule: [
      { day: 30, type: 'Herbicide', nameHi: 'खरपतवार नाशक', description: 'Weed control' },
      { day: 60, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Pyrilla control' },
      { day: 120, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Top borer control' },
    ],
    optimalPH: { min: 6.0, max: 7.5 },
    optimalMoisture: { min: 55, max: 75 },
  },
  chana: {
    name: 'Gram (Chana)', nameHi: 'चना', emoji: '🫘',
    totalDays: 100,
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', startDay: 0, endDay: 10, icon: '🌱', waterNeed: 'low' },
      { name: 'Vegetative', nameHi: 'पत्ती वृद्धि', startDay: 11, endDay: 40, icon: '🌿', waterNeed: 'moderate' },
      { name: 'Flowering', nameHi: 'फूल', startDay: 41, endDay: 65, icon: '🌸', waterNeed: 'moderate' },
      { name: 'Pod Fill', nameHi: 'फली भरना', startDay: 66, endDay: 88, icon: '🫘', waterNeed: 'moderate' },
      { name: 'Maturity', nameHi: 'पकाव', startDay: 89, endDay: 100, icon: '🟡', waterNeed: 'low' },
    ],
    optimalTemp: { min: 15, max: 25 },
    criticalTemp: { min: 5, max: 35 },
    waterPerDay: 3,
    totalWaterNeeded: 270,
    pesticideSchedule: [
      { day: 25, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Wilt prevention' },
      { day: 50, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Pod borer control' },
    ],
    optimalPH: { min: 6.0, max: 7.5 },
    optimalMoisture: { min: 30, max: 50 },
  },
  bajra: {
    name: 'Bajra', nameHi: 'बाजरा', emoji: '🌾',
    totalDays: 85,
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', startDay: 0, endDay: 8, icon: '🌱', waterNeed: 'low' },
      { name: 'Vegetative', nameHi: 'वृद्धि', startDay: 9, endDay: 40, icon: '🌿', waterNeed: 'moderate' },
      { name: 'Flowering', nameHi: 'फूल', startDay: 41, endDay: 60, icon: '🌸', waterNeed: 'high' },
      { name: 'Grain Fill', nameHi: 'दाना', startDay: 61, endDay: 78, icon: '🌾', waterNeed: 'moderate' },
      { name: 'Maturity', nameHi: 'पकाव', startDay: 79, endDay: 85, icon: '🟡', waterNeed: 'low' },
    ],
    optimalTemp: { min: 25, max: 35 },
    criticalTemp: { min: 15, max: 42 },
    waterPerDay: 3.5,
    totalWaterNeeded: 280,
    pesticideSchedule: [
      { day: 20, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'Shoot fly control' },
      { day: 45, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Downy mildew control' },
    ],
    optimalPH: { min: 6.0, max: 7.5 },
    optimalMoisture: { min: 30, max: 55 },
  },
};

/**
 * Get crop data with case-insensitive fuzzy matching
 */
const getCropData = (cropType) => {
  if (!cropType) return null;
  const key = cropType.toLowerCase().trim();

  // Direct match
  if (cropDatabase[key]) return cropDatabase[key];

  // Fuzzy match by crop name or nameHi
  for (const [k, crop] of Object.entries(cropDatabase)) {
    if (
      crop.name.toLowerCase().includes(key) ||
      key.includes(k) ||
      crop.nameHi.includes(cropType)
    ) {
      return crop;
    }
  }

  // Default generic fallback
  return {
    name: cropType, nameHi: cropType, emoji: '🌱',
    totalDays: 100,
    stages: [
      { name: 'Germination', nameHi: 'अंकुरण', startDay: 0, endDay: 15, icon: '🌱', waterNeed: 'moderate' },
      { name: 'Vegetative', nameHi: 'वृद्धि', startDay: 16, endDay: 55, icon: '🌿', waterNeed: 'moderate' },
      { name: 'Flowering', nameHi: 'फूल', startDay: 56, endDay: 80, icon: '🌸', waterNeed: 'high' },
      { name: 'Maturity', nameHi: 'पकाव', startDay: 81, endDay: 100, icon: '🟡', waterNeed: 'low' },
    ],
    optimalTemp: { min: 20, max: 30 },
    criticalTemp: { min: 10, max: 40 },
    waterPerDay: 5,
    totalWaterNeeded: 450,
    pesticideSchedule: [
      { day: 30, type: 'Insecticide', nameHi: 'कीटनाशक', description: 'General pest control' },
      { day: 60, type: 'Fungicide', nameHi: 'फफूंदनाशक', description: 'Disease prevention' },
    ],
    optimalPH: { min: 6.0, max: 7.5 },
    optimalMoisture: { min: 40, max: 65 },
  };
};

module.exports = { cropDatabase, getCropData };
