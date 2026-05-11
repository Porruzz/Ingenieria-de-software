/**
 * US-17: Entidades de dominio para el módulo de Soporte Automatizado (Chatbot).
 * Modela las sesiones de chat, mensajes y la clasificación de intenciones
 * del estudiante respecto a procesos de intercambio de cupos.
 */

/** Rol del emisor del mensaje */
export type ChatRole = 'student' | 'assistant' | 'system';

/** Intención detectada en el mensaje del estudiante */
export type ChatIntent =
  | 'SWAP_PROCESS'          // Cómo funciona un intercambio
  | 'SWAP_STATUS'           // Estado de mi intercambio actual
  | 'PREREQUISITE_QUERY'    // Dudas sobre prerrequisitos
  | 'SCHEDULE_HELP'         // Ayuda con generación de horarios
  | 'MARKETPLACE_HELP'      // Cómo publicar/buscar ofertas
  | 'CRITICALITY_QUERY'     // Qué es el índice de criticidad
  | 'GENERAL_HELP'          // Ayuda general de la plataforma
  | 'GREETING'              // Saludo
  | 'UNKNOWN';              // No clasificado

/** Mensaje individual de la conversación */
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  intent?: ChatIntent;
  timestamp: Date;
}

/** Estado de una sesión de chat */
export type SessionStatus = 'ACTIVE' | 'CLOSED' | 'EXPIRED';

/** Sesión de chat de un estudiante */
export interface ChatSession {
  sessionId: string;
  studentId: string;
  messages: ChatMessage[];
  status: SessionStatus;
  createdAt: Date;
  lastActivityAt: Date;
}

/**
 * Contexto del sistema que se inyecta al chatbot para dar respuestas
 * relevantes al dominio del enrollment-optimizer.
 */
export interface ChatbotSystemContext {
  platformName: string;
  availableFeatures: string[];
  currentPeriod: string;
}

/**
 * Constantes de dominio para el chatbot.
 */
export const CHATBOT_DEFAULTS = {
  MAX_MESSAGES_PER_SESSION: 100,
  SESSION_TIMEOUT_MINUTES: 30,
  MAX_MESSAGE_LENGTH: 2000,
  SYSTEM_PROMPT: `Eres el asistente virtual del Enrollment Optimizer, una plataforma SaaS universitaria 
para optimización de horarios académicos e intercambio de cupos. Tu nombre es "OptiBot".

Funcionalidades que conoces:
- Zonas Prohibidas (US-01): Configurar horarios donde el estudiante NO puede tener clase.
- Sincronización Académica (US-02): Importar historial desde el SIA (texto o imagen).
- Tiempos de Desplazamiento (US-03): Configurar cuánto tarda en llegar a la universidad.
- Generación de Horarios (US-05): Generar propuestas óptimas de horario con scoring.
- Validación de Prerrequisitos (US-06): Verificar si puede inscribir una materia.
- Índice de Criticidad (US-07): Mide qué tan "llave" es una materia para tu avance.
- Intercambio de Cupos (US-10/11): Confirmar y formalizar intercambios entre estudiantes.
- Marketplace (US-12): Publicar ofertas y buscar cupos disponibles.

Responde de forma amigable, concisa y en español. Si no sabes algo, dilo honestamente.
No inventes funcionalidades que no existen. Limita tus respuestas a 3-4 oraciones cuando sea posible.`
};
