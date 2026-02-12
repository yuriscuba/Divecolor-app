import { GoogleGenerativeAI } from "@google/generative-ai"; // Corrección de la librería oficial
import { IdentificationResult, GroundingSource } from "../types";

// VITE requiere 'import.meta.env' para leer variables en el navegador
const API_KEY = import.meta.env.VITE_API_KEY; 

if (!API_KEY) {
  // Este error es el que ves actualmente en tu consola de Render
  console.error("API_KEY no detectada. Revisa las variables de entorno en Render.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const correctColor = async (
  base64: string,
  mimeType: string,
  filter: string
): Promise<string> => {
  try {
    // Usamos el modelo flash-2.0 que es el estándar actual para visión
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const promptText = `Act as a professional underwater photo editor. Correct colors for ${filter} water. Return only the image.`;

    const result = await model.generateContent([
      promptText,
      { inlineData: { data: base64, mimeType } }
    ]);

    const response = await result.response;
    // Para edición de imagen directa, Gemini suele devolver texto o una descripción 
    // Si tu flujo requiere regenerar la imagen, asegúrate de que el modelo soporte 'Image Output'
    return base64; // Nota: Gemini 2.0 actualmente destaca en análisis, la edición directa de píxeles se suele manejar con filtros CSS o Canvas.
  } catch (error) {
    console.error("Error en correctColor:", error);
    throw new Error("Error al procesar la imagen.");
  }
};

export const identifySpecies = async (
  base64: string,
  mimeType: string
): Promise<IdentificationResult> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      // Activamos la búsqueda de Google para identificar especies con precisión
      tools: [{ googleSearchRetrieval: {} }] 
    } as any);

    const result = await model.generateContent([
      "Identify the primary marine species. Provide common name, scientific name, and habitat in Markdown.",
      { inlineData: { data: base64, mimeType } }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extraemos las fuentes de búsqueda de Google (Grounding)
    const sources = (response as any).candidates?.[0]?.groundingMetadata?.searchEntryPoint || [];

    return { text, sources };
  } catch (error) {
    console.error("Error en identifySpecies:", error);
    throw new Error("No se pudo identificar la especie.");
  }
};
