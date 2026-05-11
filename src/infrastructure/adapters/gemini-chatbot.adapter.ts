import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatbotServicePort } from '../../application/ports/chatbot-service.port';
import { ChatMessage, ChatbotSystemContext, CHATBOT_DEFAULTS } from '../../domain/entities/chatbot';

/**
 * US-17: Adaptador de Gemini AI para el chatbot.
 * 
 * Implementa el puerto ChatbotServicePort usando Google Gemini.
 * El proyecto ya incluye @google/generative-ai en las dependencias.
 * 
 * Diseño:
 * - Convierte el historial de ChatMessage[] al formato de Gemini
 * - Inyecta el system prompt con conocimiento del enrollment-optimizer
 * - Maneja errores de la API con fallback graceful
 */
export class GeminiChatbotAdapter implements ChatbotServicePort {
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.0-flash') {
    if (!apiKey || apiKey.trim() === '') {
      console.warn('[US-17] GEMINI_API_KEY no configurada. El chatbot operará en modo fallback.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
    this.modelName = modelName;
  }

  async generateResponse(
    history: ChatMessage[],
    userMessage: string,
    systemContext: ChatbotSystemContext
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      // Construir el prompt con system context
      const systemPrompt = this.buildSystemPrompt(systemContext);

      // Convertir historial al formato de Gemini
      const chatHistory = this.convertHistory(history);

      // Crear el chat con historial
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: 'Instrucciones del sistema: ' + systemPrompt }]
          },
          {
            role: 'model',
            parts: [{ text: 'Entendido. Soy OptiBot, el asistente virtual del Enrollment Optimizer. Estoy listo para ayudar a los estudiantes con sus dudas sobre la plataforma. Responderé en español, de forma amigable y concisa.' }]
          },
          ...chatHistory
        ]
      });

      // Enviar el mensaje del usuario
      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const text = response.text();

      if (!text || text.trim() === '') {
        return this.getFallbackResponse(userMessage);
      }

      return text.trim();
    } catch (error: any) {
      console.error(`[US-17] Error en Gemini API: ${error.message}`);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Construye el system prompt con contexto dinámico.
   */
  private buildSystemPrompt(context: ChatbotSystemContext): string {
    return `${CHATBOT_DEFAULTS.SYSTEM_PROMPT}

Contexto actual:
- Plataforma: ${context.platformName}
- Periodo académico: ${context.currentPeriod}
- Funcionalidades activas: ${context.availableFeatures.join(', ')}`;
  }

  /**
   * Convierte el historial de ChatMessage[] al formato que espera Gemini.
   */
  private convertHistory(messages: ChatMessage[]): Array<{ role: string; parts: Array<{ text: string }> }> {
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'student' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
  }

  /**
   * Respuesta de fallback cuando la IA no está disponible.
   * Usa pattern matching básico para dar respuestas útiles sin IA.
   */
  private getFallbackResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase();

    if (lower.includes('intercambio') || lower.includes('swap') || lower.includes('cupo')) {
      return '📋 **Proceso de Intercambio de Cupos:**\n' +
        '1. Publica una oferta en el Marketplace con la sección que quieres cambiar.\n' +
        '2. Otro estudiante interesado registra su interés.\n' +
        '3. El sistema valida prerrequisitos y compatibilidad.\n' +
        '4. Ambos confirman el intercambio (US-10).\n' +
        '5. Se formaliza legalmente en el SIA (US-11).\n' +
        'Para más detalles, visita la sección de Marketplace en la plataforma.';
    }

    if (lower.includes('horario') || lower.includes('schedule')) {
      return '📅 **Generación de Horarios:**\n' +
        'El sistema genera automáticamente 3 propuestas de horario optimizadas considerando:\n' +
        '- Tus zonas prohibidas\n' +
        '- Tiempo de desplazamiento\n' +
        '- Materias perdidas (priorizadas)\n' +
        '- Materias críticas (alta criticidad)\n' +
        'Ve a "Generar Horario" para comenzar.';
    }

    if (lower.includes('prerrequisito') || lower.includes('prerequisito')) {
      return '📚 **Prerrequisitos:**\n' +
        'El sistema valida automáticamente si cumples con los prerrequisitos ' +
        'de cada materia antes de incluirla en tu horario. Si no los cumples, ' +
        'la materia no aparecerá en tus propuestas. Sincroniza tu historial ' +
        'académico para que la validación sea precisa.';
    }

    if (lower.includes('hola') || lower.includes('buenas') || lower.includes('hey')) {
      return '¡Hola! 👋 Estoy aquí para ayudarte. Puedo resolver dudas sobre ' +
        'intercambio de cupos, generación de horarios, prerrequisitos y más. ' +
        '¿Qué necesitas saber?';
    }

    return '🤖 Gracias por tu mensaje. En este momento estoy operando en modo limitado. ' +
      'Puedo ayudarte con preguntas sobre:\n' +
      '- Intercambio de cupos\n' +
      '- Generación de horarios\n' +
      '- Prerrequisitos\n' +
      '- Funcionalidades de la plataforma\n' +
      'Por favor, intenta reformular tu pregunta o contacta a soporte técnico.';
  }
}
