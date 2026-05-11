import { Request, Response } from 'express';
import { HandleChatMessageUseCase } from '../../application/use-cases/handle-chat-message.use-case';

/**
 * US-17: Controlador del Chatbot de Soporte Automatizado.
 * 
 * Expone los endpoints REST para el chat del estudiante.
 * Sigue el mismo patrón que SwapController y MarketplaceController.
 * 
 * Endpoints:
 * - POST   /chat/sessions                    → Crear sesión
 * - POST   /chat/sessions/:sessionId/messages → Enviar mensaje
 * - GET    /chat/sessions/:sessionId          → Obtener historial
 * - DELETE /chat/sessions/:sessionId          → Cerrar sesión
 */
export class ChatbotController {
  constructor(private readonly chatUseCase: HandleChatMessageUseCase) {}

  /**
   * POST /chat/sessions
   * Crea una nueva sesión de chat para un estudiante.
   */
  async createSession(req: Request, res: Response) {
    try {
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: 'El campo studentId es requerido.'
        });
      }

      const session = await this.chatUseCase.createSession(studentId);

      return res.status(201).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          studentId: session.studentId,
          status: session.status,
          messages: session.messages,
          createdAt: session.createdAt
        }
      });
    } catch (error: any) {
      console.error('[ChatbotController] createSession Error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /chat/sessions/:sessionId/messages
   * Envía un mensaje del estudiante y recibe la respuesta del asistente.
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'El campo message es requerido.'
        });
      }

      const assistantMessage = await this.chatUseCase.sendMessage(sessionId, message);

      return res.status(200).json({
        success: true,
        data: {
          id: assistantMessage.id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          timestamp: assistantMessage.timestamp
        }
      });
    } catch (error: any) {
      console.error('[ChatbotController] sendMessage Error:', error);

      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message.includes('vacío') || error.message.includes('excede') || error.message.includes('no está activa')) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /chat/sessions/:sessionId
   * Obtiene el historial completo de una sesión.
   */
  async getSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await this.chatUseCase.getSession(sessionId);

      return res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          studentId: session.studentId,
          status: session.status,
          messages: session.messages,
          createdAt: session.createdAt,
          lastActivityAt: session.lastActivityAt
        }
      });
    } catch (error: any) {
      console.error('[ChatbotController] getSession Error:', error);

      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ success: false, error: error.message });
      }

      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /chat/sessions/:sessionId
   * Cierra una sesión de chat.
   */
  async closeSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      await this.chatUseCase.closeSession(sessionId);

      return res.status(200).json({
        success: true,
        message: `Sesión ${sessionId} cerrada correctamente.`
      });
    } catch (error: any) {
      console.error('[ChatbotController] closeSession Error:', error);

      if (error.message.includes('no encontrada')) {
        return res.status(404).json({ success: false, error: error.message });
      }

      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
