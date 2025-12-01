import Sentiment from 'sentiment';

const sentiment = new Sentiment();

// Keywords for categorization
const CATEGORIES = {
    'Machinery': ['tractor', 'harvester', 'combine', 'plow', 'repair', 'deere', 'kubota', 'mahindra', 'breakdown', 'parts'],
    'Pest/Disease': ['pest', 'worm', 'locust', 'fungus', 'blight', 'rot', 'yellowing', 'beetle', 'infestation', 'spray'],
    'Economics': ['price', 'cost', 'market', 'mandi', 'rate', 'subsidy', 'loan', 'profit', 'loss', 'expensive', 'cheap'],
};

// Simple location dictionary (expand as needed)
const LOCATIONS = [
    'Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 'Texas', 'California', 'Iowa', 'Brazil', 'Ukraine', 'China', 'India', 'Nashik', 'Vidarbha'
];

interface AnalysisResult {
    sentiment_score: number;
    category: 'General' | 'Machinery' | 'Pest/Disease' | 'Economics';
    detected_keywords: string[];
    detected_location?: string;
}

export function analyzeText(text: string): AnalysisResult {
    const lowerText = text.toLowerCase();

    // 1. Sentiment Analysis
    const sentimentResult = sentiment.analyze(text);

    // 2. Keyword Extraction & Categorization
    let category: AnalysisResult['category'] = 'General';
    const detected_keywords: string[] = [];
    let maxMatches = 0;

    Object.entries(CATEGORIES).forEach(([cat, keywords]) => {
        const matches = keywords.filter(k => lowerText.includes(k));
        if (matches.length > 0) {
            detected_keywords.push(...matches);
            if (matches.length > maxMatches) {
                maxMatches = matches.length;
                category = cat as AnalysisResult['category'];
            }
        }
    });

    // 3. Location Detection
    const detected_location = LOCATIONS.find(loc => text.includes(loc));

    return {
        sentiment_score: sentimentResult.score,
        category,
        detected_keywords: Array.from(new Set(detected_keywords)), // Dedupe
        detected_location
    };
}
