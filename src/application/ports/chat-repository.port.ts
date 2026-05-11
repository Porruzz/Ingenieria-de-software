import { ChatSession, ChatMessage } from '../../domain/entities/chatbot';

/**
 * US-17: Puerto del repositorio de sesiones de chat.
 * 
 * Abstrae la persistencia de las sesiones y mensajes del chatbot.
 * Permite migrar de in-memory a PostgreSQL o Redis sin afectar el use case.
 */
export interface ChatRepositoryPort {
  /**
   * Crea una nueva sesión de chat para un estudiante.
   * @param studentId ID del estudiante que inicia la sesión
   * @returns La sesión creada
   */
  createSession(studentId: string): Promise<ChatSession>;

  /**
   * Obtiene una sesión existente por su ID.
   * @param sessionId ID de la sesión
   * @returns La sesión o null si no existe
   */
  getSession(sessionId: string): Promise<ChatSession | null>;

  /**
   * Agrega un mensaje a una sesión existente.
   * @param sessionId ID de la sesión
   * @param message Mensaje a agregar
   */
  addMessage(sessionId: string, message: ChatMessage): Promise<void>;

  /**
   * Cierra una sesión de chat.
   * @param sessionId ID de la sesión a cerrar
   */
  closeSession(sessionId: string): Promise<void>;

  /**
   * Obtiene todas las sesiones activas de un estudiante.
   * @param studentId ID del estudiante
   * @returns Lista de sesiones activas
   */
  getActiveSessionsByStudent(studentId: string): Promise<ChatSession[]>;
}
