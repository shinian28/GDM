
import { GoogleGenAI, Type } from "@google/genai";

export async function generateRandomFunction(): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Generate a mathematically interesting 2D non-linear function for optimization testing (e.g., variation of Rosenbrock, Beale, or a custom quadratic). Return ONLY the math string using 'x' and 'y' variables, compatible with mathjs syntax (e.g., 'x^2 + 10*y^2'). Do not include 'f(x,y)='.",
    config: {
      temperature: 0.9,
      responseMimeType: "text/plain",
    },
  });

  return response.text?.trim() || "x^2 + 10*y^2";
}

export async function explainConvergence(history: any[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const data = JSON.stringify(history.map(h => ({ x: h.point.x, y: h.point.y, val: h.value })));
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on this optimization path: ${data}, explain the convergence behavior of the Conjugate Gradient Method. Why did it take this many steps? Keep it concise and educational.`,
  });

  return response.text || "No explanation available.";
}
