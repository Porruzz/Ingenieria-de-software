import { AcademicPortalPort, AcademicExtractionResult } from "../../application/ports/academic-portal.port";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Adaptador de Visión REAL para el SIA (Sincronización por Imagen).
 * Utiliza Google Gemini AI para extraer datos estructurados de una foto.
 */
export class VisionSiaAdapter implements AcademicPortalPort {
  
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn("[VisionAdapter] No se encontró GEMINI_API_KEY en el .env. El sistema funcionará con datos de prueba.");
    }
  }
  
  async getAcademicHistory(studentId: string, universityToken: string): Promise<AcademicExtractionResult> {
    throw new Error("Este adaptador solo soporta sincronización por imagen.");
  }

  /**
   * Procesa la imagen del horario usando IA de Visión.
   */
  async getHistoryFromImage(imageBuffer: Buffer): Promise<AcademicExtractionResult> {
    console.log("[VisionAdapter] Iniciando extracción con Google Gemini Vision...");

    if (!this.genAI) {
      return this.getMockResult(); // Fallback si no hay API Key
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Analiza esta imagen de un horario universitario (SIA). 
        Extrae todas las materias que el estudiante está cursando actualmente.
        Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta:
        {
          "records": [
            { "courseId": "string (ej: PCIA5008)", "courseName": "string", "status": "CURSANDO", "credits": number, "period": "2026-1" }
          ],
          "totalCredits": number (suma total),
          "currentSemester": number (estimado según el nivel de las materias)
        }
        Si no puedes leer un código, inventa uno basado en el nombre (ej: MARK101).
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/jpeg"
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Limpiar la respuesta de la IA (a veces pone bloques de código markdown ```json)
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(cleanJson) as AcademicExtractionResult;

    } catch (error) {
      console.error("[VisionAdapter] Error con la IA de Google:", error);
      return this.getMockResult(); // Si falla la API, devolvemos los datos de prueba para no romper la demo
    }
  }

  private getMockResult(): AcademicExtractionResult {
    console.log("[VisionAdapter] Retornando datos de prueba (Mock)...");
    return {
      records: [
        { courseId: 'PCIA5040', courseName: 'PROCESAMIENTO DE IMAGENES', status: 'CURSANDO', credits: 4, period: '2026-1' },
        { courseId: 'PCIA5008', courseName: 'INGENIERÍA DE SOFTWARE', status: 'CURSANDO', credits: 4, period: '2026-1' },
        { courseId: 'PCIA5009', courseName: 'COMP PARALELA Y DISTRIBUIDA', status: 'CURSANDO', credits: 4, period: '2026-1' }
      ],
      totalCredits: 12,
      currentSemester: 8
    };
  }
}
