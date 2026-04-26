import { NotificationServicePort } from '../../application/ports/notification-service.port';

export class ConsoleNotificationService implements NotificationServicePort {
  async notifyStudent(studentId: string, subject: string, message: string): Promise<void> {
    console.log(`[Notification] To: ${studentId} | Subject: ${subject} | Message: ${message}`);
  }
}
