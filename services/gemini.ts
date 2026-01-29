
// Always use the latest Google GenAI SDK imports and initialization
import { GoogleGenAI } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getStudyAssistantResponse = async (
  prompt: string,
  context: {
    syllabus: string;
    calendar: string;
    notes: string;
    sources: string;
  },
  imageData?: { mimeType: string; data: string }
) => {
  const systemInstruction = `
    You are an expert Spanish language academic assistant for Doon University Semester IV students.
    You are grounded in the following academic materials:
    
    SYLLABUS DATA:
    ${context.syllabus}
    
    ACADEMIC CALENDAR:
    ${context.calendar}
    
    STUDENT PERSONAL NOTES:
    ${context.notes}
    
    EXTERNAL SOURCES UPLOADED BY STUDENT:
    ${context.sources}
    
    GUIDELINES:
    1. Always use English unless specifically asked to translate or provide examples in Spanish.
    2. Bold key academic terms and important deadlines.
    3. If asked about syllabus topics, reference the specific course code (e.g., SPC251).
    4. Provide concise, high-value academic advice.
    5. Be encouraging and professional.
    6. When creating study guides, focus on the verbatim objectives provided in the syllabus.
  `;

  try {
    const parts: any[] = [{ text: prompt }];
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.data,
        },
      });
    }

    // Call generateContent with the model name and prompt/parts combined
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      },
    });

    // Access the .text property directly, not as a function
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error communicating with AI Assistant. Please check your connection and try again.";
  }
};
