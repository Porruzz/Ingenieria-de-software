export interface NotificationServicePort {
  /**
   * RNF-12.3: Latencia de Notificación
   * Envía una notificación en tiempo real a un estudiante.
   * @param studentId Estudiante a notificar
   * @param subject Asunto
   * @param message Mensaje
   */
  notifyStudent(studentId: string, subject: string, message: string): Promise<void>;
}
