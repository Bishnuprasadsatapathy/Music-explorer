import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Initialize Gemini API client on server-side
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: !!apiKey && apiKey !== "MY_GEMINI_API_KEY",
      service: "SonicAI Server-Side DSP Engine",
    });
  });

  // API 1: Auto-EQ Endpoint
  app.post("/api/ai/auto-eq", async (req, res) => {
    try {
      const { trackTitle, genre, bpm, audioMetrics, listeningIntent } = req.body;

      const prompt = `You are SonicAI, an expert audio engineer and digital signal processing (DSP) specialist.
Analyze the following active audio characteristics and recommend an optimal 10-band graphic equalizer profile (+/- 12dB across 60Hz, 120Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz, 20kHz).

Audio Characteristics:
- Track Title / Genre: "${trackTitle || 'Unknown'}" (${genre || 'General'})
- BPM: ${bpm || 120}
- User Listening Intent: "${listeningIntent || 'Balanced High Fidelity'}"
- Audio Feature Metrics:
  - RMS Volume: ${audioMetrics?.rmsVolume ?? 0.5}
  - Spectral Centroid (Brightness): ${audioMetrics?.spectralCentroidHz ?? 1500} Hz
  - Peak Loudness: ${audioMetrics?.peakDb ?? -12} dB

Provide a professional acoustic tuning recommendation in JSON format.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedGenre: { type: Type.STRING },
              energyLevel: { type: Type.STRING, description: "Low, Medium, High, or Dynamic" },
              spectralBrightness: { type: Type.STRING, description: "Dark, Warm, Balanced, or Bright" },
              recommendedBands: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "Array of exactly 10 EQ gain values in dB from -12 to +12 for [60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000, 20000] Hz",
              },
              bass: { type: Type.NUMBER, description: "Low shelf gain adjustment (-6 to +6 dB)" },
              mid: { type: Type.NUMBER, description: "Mid peaking gain adjustment (-6 to +6 dB)" },
              treble: { type: Type.NUMBER, description: "High shelf gain adjustment (-6 to +6 dB)" },
              recommendedMode: { type: Type.STRING, description: "Name of the mode, e.g. 'Acoustic Warmth', 'EDM Punch', 'Vocal Presence'" },
              explanation: { type: Type.STRING, description: "Concise audio engineer explanation of why these specific bands were adjusted." },
              confidenceScore: { type: Type.NUMBER, description: "Confidence percentage (1-100)" },
            },
            required: ["detectedGenre", "recommendedBands", "bass", "mid", "treble", "recommendedMode", "explanation", "confidenceScore"],
          },
        },
      });

      const resultText = response.text || "{}";
      const resultData = JSON.parse(resultText);
      res.json({ success: true, data: resultData });
    } catch (error) {
      console.error("Auto-EQ Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate AI Auto-EQ recommendation",
      });
    }
  });

  // API 2: Room Acoustic Calibration Endpoint
  app.post("/api/ai/room-analysis", async (req, res) => {
    try {
      const { roomType, estimatedSizeSqFt, micSpectrum, wallType, speakerPosition } = req.body;

      const prompt = `You are an acoustic consultant and room calibration expert.
Analyze the following room measurement data captured via phone/microphone acoustic pink-noise sweep:

Room Profile:
- Room Type: "${roomType || 'Living Room'}"
- Estimated Size: ${estimatedSizeSqFt || 250} sq ft
- Wall Surface: "${wallType || 'Drywall & Glass'}"
- Speaker Placement: "${speakerPosition || 'Near Corner / Wall'}"
- Microphone Spectrum Sample Points (dB level across low, mid, high frequencies): ${JSON.stringify(micSpectrum || [65, 72, 68, 60, 55, 52, 48, 45, 42, 38])}

Analyze room resonances, boundary gain, flutter reflections, and high-frequency dampening.
Return a room correction EQ profile (+/- 12dB across 10 bands) to counteract room node defects.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roomType: { type: Type.STRING },
              estimatedSizeSqFt: { type: Type.NUMBER },
              bassResonance: { type: Type.STRING, description: "LOW, MEDIUM, HIGH, or CRITICAL" },
              midReflection: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" },
              highFrequencyLoss: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" },
              calculatedCorrections: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "Array of 10 correction EQ values in dB to compensate for room nodes",
              },
              recommendedEQ: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "Array of 10 final target EQ values in dB",
              },
              acousticAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 practical tips to improve room acoustics (e.g., rug placement, curtain, speaker isolation)",
              },
            },
            required: ["roomType", "bassResonance", "midReflection", "highFrequencyLoss", "calculatedCorrections", "recommendedEQ", "acousticAdvice"],
          },
        },
      });

      const resultText = response.text || "{}";
      const resultData = JSON.parse(resultText);
      res.json({ success: true, data: resultData });
    } catch (error) {
      console.error("Room Analysis Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze room acoustics",
      });
    }
  });

  // API 3: Natural Language Sound Assistant Endpoint
  app.post("/api/ai/assistant", async (req, res) => {
    try {
      const { userPrompt, currentBands, speakerModel } = req.body;

      const prompt = `You are SonicAI Assistant, an elite mastering audio engineer.
The user is requesting custom sound adjustment using natural language:

User Request: "${userPrompt}"
Active Speaker Hardware: "${speakerModel || 'Sonic Pulse Studio'}"
Current 10-Band EQ Settings: ${JSON.stringify(currentBands || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])}

Translate the user's natural language request into precise 10-band equalizer band gains (-12dB to +12dB for [60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000, 20000] Hz), quick tone offsets (bass, mid, treble), and a professional audio explanation.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              userPrompt: { type: Type.STRING },
              intentCategory: { type: Type.STRING, description: "e.g. Vocal Enhancement, Sub-Bass Boost, Cinema Spatial, High-End Air" },
              adjustedBands: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "Array of exactly 10 EQ gain values in dB from -12 to +12",
              },
              bass: { type: Type.NUMBER, description: "Bass offset (-6 to +6 dB)" },
              mid: { type: Type.NUMBER, description: "Mid offset (-6 to +6 dB)" },
              treble: { type: Type.NUMBER, description: "Treble offset (-6 to +6 dB)" },
              explanation: { type: Type.STRING, description: "Clear explanation of how the filter adjustments achieve the user's goal." },
              audioEngineeringInsights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2-3 technical mastering insights regarding psychoacoustics or frequency masking.",
              },
            },
            required: ["userPrompt", "intentCategory", "adjustedBands", "bass", "mid", "treble", "explanation", "audioEngineeringInsights"],
          },
        },
      });

      const resultText = response.text || "{}";
      const resultData = JSON.parse(resultText);
      res.json({ success: true, data: resultData });
    } catch (error) {
      console.error("AI Assistant Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to execute AI Sound Assistant request",
      });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SonicAI DSP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
