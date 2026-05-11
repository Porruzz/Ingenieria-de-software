import { ChatMessage, ChatbotSystemContext } from '../../domain/entities/chatbot';

/**
 * US-17: Puerto del servicio de chatbot (IA).
 * 
 * Abstrae el proveedor de IA utilizado para generar respuestas.
 * Permite intercambiar Gemini por cualquier otro LLM sin afectar
 * la lógica de negocio.
 */
export interface ChatbotServicePort {
  /**
   * Genera una respuesta del chatbot dado el historial de la conversación
   * y el mensaje actual del estudiante.
   * 
   * @param history Historial de mensajes previos (contexto conversacional)
   * @param userMessage Mensaje actual del estudiante
   * @param systemContext Contexto del sistema para respuestas más relevantes
   * @returns El texto de respuesta generado por la IA
   */
  generateResponse(
    history: ChatMessage[],
    userMessage: string,
    systemContext: ChatbotSystemContext
  ): Promise<string>;
}
