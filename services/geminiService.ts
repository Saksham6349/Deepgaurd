import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Removed global instantiation to ensure we capture the API key 
// only when the function is called (after user selection)
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFraud = async (
  content: string,
  type: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'TEXT'
): Promise<AnalysisResult> => {
  try {
    // Instantiate here to pick up the key if it was just set via window.aistudio
    // The API key must be obtained exclusively from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // gemini-3-flash-preview supports multimodal inputs efficiently
    const model = 'gemini-3-flash-preview'; 
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        riskScore: {
          type: Type.INTEGER,
          description: "A score from 0 to 100 indicating the likelihood of the content being a deepfake, manipulated, or fraudulent. 0 is safe, 100 is definitely fraud.",
        },
        verdict: {
          type: Type.STRING,
          enum: ["SAFE", "SUSPICIOUS", "FRAUD"],
          description: "The final classification of the content.",
        },
        confidence: {
          type: Type.INTEGER,
          description: "Confidence percentage in the analysis (0-100).",
        },
        artifactsFound: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of specific artifacts or anomalies detected (e.g., 'robotic voice cadence', 'video glitching', 'inconsistent lighting', 'AI generated text patterns').",
        },
        reasoning: {
          type: Type.STRING,
          description: "A concise forensic explanation of why this verdict was reached.",
        },
      },
      required: ["riskScore", "verdict", "confidence", "artifactsFound", "reasoning"],
    };

    let parts = [];
    let systemPrompt = "";

    switch (type) {
      case 'IMAGE':
        systemPrompt = "You are DeepFraud's advanced forensic engine. Analyze this image for signs of AI generation, deepfake manipulation, photoshop editing, or identity spoofing. Look for lighting inconsistencies, anatomical errors, background warping, and noise patterns.";
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: content } });
        break;
      case 'AUDIO':
        systemPrompt = "You are DeepFraud's audio forensic engine. Analyze this audio for signs of AI voice cloning, robotic artifacts, unnatural breathing patterns, or spliced audio. Determine if the voice is human or synthetic.";
        // Assuming MP3 for generic upload, but the API handles common formats.
        parts.push({ inlineData: { mimeType: 'audio/mp3', data: content } });
        break;
      case 'VIDEO':
        systemPrompt = "You are DeepFraud's video forensic engine. Analyze this video frame-by-frame (as provided) for deepfake face swaps, lip-sync errors, temporal inconsistencies, and unnatural movements.";
        parts.push({ inlineData: { mimeType: 'video/mp4', data: content } });
        break;
      case 'TEXT':
        systemPrompt = "You are DeepFraud's text forensic engine. Analyze this text for patterns typical of LLM generation, phishing attempts, social engineering, or scam scripts.";
        parts.push({ text: content });
        break;
    }

    parts.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as AnalysisResult;
    
    return {
      ...result,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error("DeepFraud Analysis Error:", error);
    return {
      riskScore: 0,
      verdict: 'SUSPICIOUS',
      confidence: 0,
      artifactsFound: ["Analysis failed", "API Error"],
      reasoning: "The system encountered an error communicating with the forensic engine.",
      timestamp: new Date().toISOString(),
    };
  }
};