import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatSession, ChatbotSystemContext, CHATBOT_DEFAULTS } from '../../domain/entities/chatbot';
import { ChatRepositoryPort } from '../ports/chat-repository.port';
import { ChatbotServicePort } from '../ports/chatbot-service.port';

/**
 * US-17: Caso de uso — Manejar Mensaje de Chat.
 * 
 * Procesa un mensaje entrante del estudiante, genera la respuesta
 * del asistente virtual, y persiste ambos en la sesión.
 * 
 * Responsabilidades:
 * - Validar longitud del mensaje y estado de la sesión
 * - Invocar al servicio de IA para generar respuesta
 * - Persistir el intercambio completo (pregunta + respuesta)
 * - Gestionar ciclo de vida de sesiones (crear, cerrar, expirar)
 */
export class HandleChatMessageUseCase {
  private readonly systemContext: ChatbotSystemContext = {
    platformName: 'Enrollment Optimizer',
    availableFeatures: [
      'Zonas Prohibidas', 'Sincronización Académica', 'Tiempos de Desplazamiento',
      'Generación de Horarios', 'Validación de Prerrequisitos', 'Índice de Criticidad',
      'Confirmación de Intercambios', 'Formalización Legal', 'Marketplace de Cupos'
    ],
    currentPeriod: '2026-2'
  };

  constructor(
    private readonly chatRepo: ChatRepositoryPort,
    private readonly chatbotService: ChatbotServicePort
  ) {}

  /**
   * Crea una nueva sesión de chat para un estudiante.
   * @param studentId ID del estudiante
   * @returns Sesión creada con mensaje de bienvenida
   */
  async createSession(studentId: string): Promise<ChatSession> {
    if (!studentId || studentId.trim() === '') {
      throw new Error('[US-17] El ID del estudiante es requerido para iniciar una sesión.');
    }

    console.log(`[US-17] Creando sesión de chat para estudiante: ${studentId}`);

    const session = await this.chatRepo.createSession(studentId);

    // Mensaje de bienvenida automático
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      sessionId: session.sessionId,
      role: 'assistant',
      content: '¡Hola! 👋 Soy OptiBot, el asistente virtual del Enrollment Optimizer. ' +
        'Estoy disponible 24/7 para ayudarte con dudas sobre intercambio de cupos, ' +
        'generación de horarios, prerrequisitos y más. ¿En qué puedo ayudarte?',
      intent: 'GREETING',
      timestamp: new Date()
    };

    await this.chatRepo.addMessage(session.sessionId, welcomeMessage);
    session.messages.push(welcomeMessage);

    return session;
  }

  /**
   * Procesa un mensaje del estudiante y genera la respuesta del asistente.
   * @param sessionId ID de la sesión activa
   * @param userMessageContent Texto del mensaje del estudiante
   * @returns El mensaje de respuesta del asistente
   */
  async sendMessage(sessionId: string, userMessageContent: string): Promise<ChatMessage> {
    // Validaciones
    if (!userMessageContent || userMessageContent.trim() === '') {
      throw new Error('[US-17] El mensaje no puede estar vacío.');
    }

    if (userMessageContent.length > CHATBOT_DEFAULTS.MAX_MESSAGE_LENGTH) {
      throw new Error(
        `[US-17] El mensaje excede el límite de ${CHATBOT_DEFAULTS.MAX_MESSAGE_LENGTH} caracteres.`
      );
    }

    // Obtener sesión
    const session = await this.chatRepo.getSession(sessionId);
    if (!session) {
      throw new Error(`[US-17] Sesión ${sessionId} no encontrada.`);
    }
    if (session.status !== 'ACTIVE') {
      throw new Error(`[US-17] La sesión ${sessionId} no está activa (estado: ${session.status}).`);
    }

    // Validar límite de mensajes por sesión
    if (session.messages.length >= CHATBOT_DEFAULTS.MAX_MESSAGES_PER_SESSION) {
      throw new Error(
        `[US-17] La sesión alcanzó el límite de ${CHATBOT_DEFAULTS.MAX_MESSAGES_PER_SESSION} mensajes. Por favor, inicia una nueva sesión.`
      );
    }

    // Persistir mensaje del estudiante
    const userMessage: ChatMessage = {
      id: uuidv4(),
      sessionId,
      role: 'student',
      content: userMessageContent.trim(),
      timestamp: new Date()
    };
    await this.chatRepo.addMessage(sessionId, userMessage);

    // Generar respuesta con IA
    const history = [...session.messages, userMessage];
    let responseContent: string;

    try {
      responseContent = await this.chatbotService.generateResponse(
        history,
        userMessageContent,
        this.systemContext
      );
    } catch (error: any) {
      console.error(`[US-17] Error al generar respuesta de IA: ${error.message}`);
      responseContent = 'Lo siento, estoy teniendo dificultades técnicas en este momento. ' +
        'Por favor, intenta de nuevo en unos segundos. Si el problema persiste, ' +
        'puedes contactar a soporte técnico directamente.';
    }

    // Persistir respuesta del asistente
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      sessionId,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date()
    };
    await this.chatRepo.addMessage(sessionId, assistantMessage);

    console.log(`[US-17] Mensaje procesado en sesión ${sessionId} para estudiante ${session.studentId}`);

    return assistantMessage;
  }

  /**
   * Obtiene el historial completo de una sesión.
   * @param sessionId ID de la sesión
   * @returns Sesión con todos sus mensajes
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    const session = await this.chatRepo.getSession(sessionId);
    if (!session) {
      throw new Error(`[US-17] Sesión ${sessionId} no encontrada.`);
    }
    return session;
  }

  /**
   * Cierra una sesión de chat.
   * @param sessionId ID de la sesión a cerrar
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = await this.chatRepo.getSession(sessionId);
    if (!session) {
      throw new Error(`[US-17] Sesión ${sessionId} no encontrada.`);
    }

    await this.chatRepo.closeSession(sessionId);
    console.log(`[US-17] Sesión ${sessionId} cerrada correctamente.`);
  }
}
