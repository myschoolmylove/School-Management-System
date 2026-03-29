import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SyncAdmission {
  title: string;
  date: string;
  deadline: string;
  type: "School" | "College" | "University";
  location: string;
  applyUrl: string;
  desc: string;
  isFuture?: boolean;
}

export interface SyncResult {
  name: string;
  date: string;
  status: "Announced" | "Expected" | "Pending";
  type: "Matric" | "Inter";
  url: string;
}

export const syncAdmissionsWithAI = async (institutions: string[]): Promise<SyncAdmission[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a deep search for the latest 2026 admission details for these institutions in Pakistan: ${institutions.join(", ")}. 
      
      STRICT REQUIREMENT:
      - ONLY look for educational institutes (Schools, Colleges, Universities). 
      - IGNORE any other types of organizations or businesses.
      
      SEARCH STRATEGY:
      1. Visit the official website of each institution.
      2. Look for 'Admissions', 'Apply Now', or 'News' sections.
      3. Identify the specific programs (Undergraduate, Graduate) and their deadlines for the 2026 session.
      4. Verify if the admission is currently 'Open' or 'Upcoming' (Future).
      
      ANALYSIS:
      - Extract the exact application URL (not just the homepage).
      - Summarize the key requirements or features mentioned on the page.
      - Ensure the deadline is in YYYY-MM-DD format.
      - Set 'isFuture' to true if the admission has NOT started yet but is announced for a future date.
      
      Return the data in a structured JSON format.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING, description: "e.g. Aug 01, 2026" },
              deadline: { type: Type.STRING, description: "YYYY-MM-DD" },
              type: { type: Type.STRING, enum: ["School", "College", "University"] },
              location: { type: Type.STRING },
              applyUrl: { type: Type.STRING },
              desc: { type: Type.STRING },
              isFuture: { type: Type.BOOLEAN, description: "True if admission is announced but not yet open" }
            },
            required: ["title", "deadline", "type", "location", "applyUrl"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error syncing admissions with AI:", error);
    throw error;
  }
};

export const syncResultsWithAI = async (boards: string[]): Promise<SyncResult[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a targeted search for the latest 2026 result announcement dates for these educational boards in Pakistan: ${boards.join(", ")}. 
      
      SEARCH STRATEGY:
      1. Search for official notifications on the board's official portal (e.g., biselahore.com, bisegrw.edu.pk).
      2. Look for 'Result Gazette', 'Press Release', or 'Notification' sections.
      3. Identify the specific class (Matric/Inter) and session (Annual 2026).
      4. Distinguish between 'Announced' (result is live) and 'Expected' (date provided but not yet live).
      
      ANALYSIS:
      - Extract the direct link to the result checking page if available.
      - Verify the date from multiple sources if the official site is not updated.
      
      Return the data in a structured JSON format.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              date: { type: Type.STRING, description: "e.g. Jul 15, 2026" },
              status: { type: Type.STRING, enum: ["Announced", "Expected", "Pending"] },
              type: { type: Type.STRING, enum: ["Matric", "Inter"] },
              url: { type: Type.STRING }
            },
            required: ["name", "date", "status", "type", "url"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error syncing results with AI:", error);
    throw error;
  }
};

export const searchInstitutionsWithAI = async (query: string): Promise<SyncAdmission[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for educational institutions in Pakistan based on this query: "${query}". 
      
      STRICT REQUIREMENT:
      - ONLY return educational institutes (Schools, Colleges, Universities). 
      - IGNORE any other types of organizations or businesses.
      - Focus on finding current or upcoming admission details for 2026.
      
      Return the data in a structured JSON format.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING, description: "e.g. Aug 01, 2026" },
              deadline: { type: Type.STRING, description: "YYYY-MM-DD" },
              type: { type: Type.STRING, enum: ["School", "College", "University"] },
              location: { type: Type.STRING },
              applyUrl: { type: Type.STRING },
              desc: { type: Type.STRING },
              isFuture: { type: Type.BOOLEAN }
            },
            required: ["title", "deadline", "type", "location", "applyUrl"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error searching institutions with AI:", error);
    throw error;
  }
};
