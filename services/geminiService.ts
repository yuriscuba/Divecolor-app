import { GoogleGenAI, Modality } from "@google/genai";
import { IdentificationResult, GroundingSource } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const correctColor = async (
  base64: string,
  mimeType: string,
  filter: string
): Promise<string> => {
  try {
    const promptText = `Act as a professional underwater photo editor. Your task is to correct the colors and white balance of this image to make it look natural and vibrant, as if viewed with the naked eye underwater. The photo was taken in ${filter} water conditions. Do not crop, resize, or add any elements to the image. Only perform color correction.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // FIX: Safely parse the response to find the image data by iterating through parts.
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    throw new Error("Failed to get corrected image from Gemini API.");
  } catch (error) {
    console.error("Error in correctColor:", error);
    throw new Error("Could not process the image. Please try again.");
  }
};

export const identifySpecies = async (
  base64: string,
  mimeType: string
): Promise<IdentificationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: "Identify the primary marine species in this image. Provide its common name, scientific name, a brief and engaging description, its typical habitat, and its conservation status, If there are many fish, focus only on the most prominent ones. Format the response in Markdown." },
          { inlineData: { data: base64, mimeType } }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // FIX: Use the .text property to get the text response.
    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    // FIX: Correctly filter and cast sources.
    const sources = groundingChunks.filter((chunk: any): chunk is GroundingSource => chunk.web) as GroundingSource[];

    return { text, sources };
  } catch (error) {
    console.error("Error in identifySpecies:", error);
    throw new Error("Could not identify the species. Please try another image.");
  }
};
