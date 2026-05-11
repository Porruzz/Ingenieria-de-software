import { v4 as uuidv4 } from 'uuid';
import { ChatRepositoryPort } from '../../application/ports/chat-repository.port';
import { ChatSession, ChatMessage } from '../../domain/entities/chatbot';

/**
 * US-17: Repositorio en memoria de sesiones de chat.
 * 
 * Almacena las sesiones y mensajes del chatbot.
 * Sigue el mismo patrón que InMemoryMarketplaceRepository y
 * InMemorySwapRepository del proyecto.
 * 
 * En producción, se migraría a PostgreSQL o Redis para persistencia
 * entre reinicios del servidor.
 */
export class InMemoryChatRepository implements ChatRepositoryPort {
  private readonly sessions: Map<string, ChatSession> = new Map();

  async createSession(studentId: string): Promise<ChatSession> {
    const session: ChatSession = {
      sessionId: uuidv4(),
      studentId,
      messages: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      lastActivityAt: new Date()
    };

    this.sessions.set(session.sessionId, session);
    console.log(`[US-17] Sesión ${session.sessionId} creada para estudiante ${studentId}`);

    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`[US-17] Sesión ${sessionId} no encontrada al agregar mensaje.`);
    }

    session.messages.push(message);
    session.lastActivityAt = new Date();
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`[US-17] Sesión ${sessionId} no encontrada al cerrar.`);
    }

    session.status = 'CLOSED';
    session.lastActivityAt = new Date();
    console.log(`[US-17] Sesión ${sessionId} cerrada. Total mensajes: ${session.messages.length}`);
  }

  async getActiveSessionsByStudent(studentId: string): Promise<ChatSession[]> {
    const activeSessions: ChatSession[] = [];
    for (const session of this.sessions.values()) {
      if (session.studentId === studentId && session.status === 'ACTIVE') {
        activeSessions.push(session);
      }
    }
    return activeSessions;
  }
}
