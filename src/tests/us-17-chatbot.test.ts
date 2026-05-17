import { HandleChatMessageUseCase } from '../application/use-cases/handle-chat-message.use-case';
import { ChatRepositoryPort } from '../application/ports/chat-repository.port';
import { ChatbotServicePort } from '../application/ports/chatbot-service.port';
import { ChatSession, ChatMessage } from '../domain/entities/chatbot';

describe('US-17 — Soporte Automatizado (Chatbot)', () => {
  let chatRepo: jest.Mocked<ChatRepositoryPort>;
  let chatbotService: jest.Mocked<ChatbotServicePort>;
  let chatUseCase: HandleChatMessageUseCase;

  const mockStudentId = 'santiago-123';
  const mockSessionId = 'session-001';

  beforeEach(() => {
    chatRepo = {
      createSession: jest.fn(),
      getSession: jest.fn(),
      addMessage: jest.fn(),
      closeSession: jest.fn(),
      getActiveSessionsByStudent: jest.fn(),
    };

    chatbotService = {
      generateResponse: jest.fn(),
    };

    chatUseCase = new HandleChatMessageUseCase(chatRepo, chatbotService);
  });

  // ====== CREAR SESIÓN ======

  test('US-17: Debería crear una sesión de chat con mensaje de bienvenida', async () => {
    const mockSession: ChatSession = {
      sessionId: mockSessionId,
      studentId: mockStudentId,
      messages: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      lastActivityAt: new Date()
    };

    chatRepo.createSession.mockResolvedValue(mockSession);
    chatRepo.addMessage.mockResolvedValue();

    const session = await chatUseCase.createSession(mockStudentId);

    expect(session.sessionId).toBe(mockSessionId);
    expect(session.studentId).toBe(mockStudentId);
    expect(session.status).toBe('ACTIVE');
    expect(session.messages).toHaveLength(1); // Mensaje de bienvenida
    expect(session.messages[0].role).toBe('assistant');
    expect(session.messages[0].content).toContain('OptiBot');
    expect(chatRepo.addMessage).toHaveBeenCalledTimes(1);
  });

  test('US-17: Debería fallar al crear sesión sin studentId', async () => {
    await expect(chatUseCase.createSession('')).rejects.toThrow('El ID del estudiante es requerido');
  });

  // ====== ENVIAR MENSAJE ======

  test('US-17: Debería procesar un mensaje y devolver respuesta del asistente', async () => {
    const mockSession: ChatSession = {
      sessionId: mockSessionId,
      studentId: mockStudentId,
      messages: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      lastActivityAt: new Date()
    };

    chatRepo.getSession.mockResolvedValue(mockSession);
    chatbotService.generateResponse.mockResolvedValue('El proceso de intercambio funciona así...');
    chatRepo.addMessage.mockResolvedValue();

    const response = await chatUseCase.sendMessage(mockSessionId, '¿Cómo funciona el intercambio de cupos?');

    expect(response.role).toBe('assistant');
    expect(response.content).toBe('El proceso de intercambio funciona así...');
    // 2 llamadas: una para el mensaje del usuario, otra para la respuesta
    expect(chatRepo.addMessage).toHaveBeenCalledTimes(2);
  });

  test('US-17: Debería rechazar mensaje vacío', async () => {
    await expect(chatUseCase.sendMessage(mockSessionId, '')).rejects.toThrow('no puede estar vacío');
  });

  test('US-17: Debería rechazar mensaje que excede el límite', async () => {
    const longMessage = 'a'.repeat(2001);
    await expect(chatUseCase.sendMessage(mockSessionId, longMessage)).rejects.toThrow('excede el límite');
  });

  test('US-17: Debería fallar si la sesión no existe', async () => {
    chatRepo.getSession.mockResolvedValue(null);
    await expect(chatUseCase.sendMessage('fake-session', 'hola')).rejects.toThrow('no encontrada');
  });

  test('US-17: Debería fallar si la sesión no está activa', async () => {
    const closedSession: ChatSession = {
      sessionId: mockSessionId,
      studentId: mockStudentId,
      messages: [],
      status: 'CLOSED',
      createdAt: new Date(),
      lastActivityAt: new Date()
    };

    chatRepo.getSession.mockResolvedValue(closedSession);
    await expect(chatUseCase.sendMessage(mockSessionId, 'hola')).rejects.toThrow('no está activa');
  });

  // ====== FALLBACK DE IA ======

  test('US-17: Debería dar respuesta de fallback cuando la IA falla (disponibilidad 24/7)', async () => {
    const mockSession: ChatSession = {
      sessionId: mockSessionId,
      studentId: mockStudentId,
      messages: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      lastActivityAt: new Date()
    };

    chatRepo.getSession.mockResolvedValue(mockSession);
    chatbotService.generateResponse.mockRejectedValue(new Error('API Gemini no disponible'));
    chatRepo.addMessage.mockResolvedValue();

    // No debería lanzar error — debe dar fallback graceful
    const response = await chatUseCase.sendMessage(mockSessionId, '¿Cómo hago un intercambio?');

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('dificultades técnicas');
    expect(chatRepo.addMessage).toHaveBeenCalledTimes(2);
  });

  // ====== CERRAR SESIÓN ======

  test('US-17: Debería cerrar una sesión existente', async () => {
    const mockSession: ChatSession = {
      sessionId: mockSessionId,
      studentId: mockStudentId,
      messages: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      lastActivityAt: new Date()
    };

    chatRepo.getSession.mockResolvedValue(mockSession);
    chatRepo.closeSession.mockResolvedValue();

    await chatUseCase.closeSession(mockSessionId);

    expect(chatRepo.closeSession).toHaveBeenCalledWith(mockSessionId);
  });

  test('US-17: Debería fallar al cerrar sesión inexistente', async () => {
    chatRepo.getSession.mockResolvedValue(null);
    await expect(chatUseCase.closeSession('fake')).rejects.toThrow('no encontrada');
  });

  // ====== OBTENER SESIÓN ======

  test('US-17: Debería obtener el historial completo de una sesión', async () => {
    const messages: ChatMessage[] = [
      { id: 'msg-1', sessionId: mockSessionId, role: 'assistant', content: 'Bienvenido', timestamp: new Date() },
      { id: 'msg-2', sessionId: mockSessionId, role: 'student', content: 'Hola', timestamp: new Date() },
      { id: 'msg-3', sessionId: mockSessionId, role: 'assistant', content: 'Hola, ¿en qué te ayudo?', timestamp: new Date() },
    ];

    const mockSession: ChatSession = {
      sessionId: mockSessionId,
      studentId: mockStudentId,
      messages,
      status: 'ACTIVE',
      createdAt: new Date(),
      lastActivityAt: new Date()
    };

    chatRepo.getSession.mockResolvedValue(mockSession);

    const session = await chatUseCase.getSession(mockSessionId);

    expect(session.messages).toHaveLength(3);
    expect(session.messages[0].role).toBe('assistant');
    expect(session.messages[1].role).toBe('student');
  });
});
