import { NotificationServicePort } from '../../application/ports/notification-service.port';
import { IStudentRepository } from '../../domain/repositories/student-repository';
import nodemailer from 'nodemailer';

export class EmailNotificationService implements NotificationServicePort {
  private transporter: nodemailer.Transporter;

  constructor(private studentRepo: IStudentRepository) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async notifyStudent(studentId: string, subject: string, message: string): Promise<void> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) {
      console.warn(`[EmailService] No se encontró el estudiante con ID ${studentId} para enviar notificación.`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"OptimaAcademia Soporte" <${process.env.SMTP_USER}>`,
        to: student.emailInstitucional,
        subject: subject,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #4A90E2; text-align: center;">OptimaAcademia</h2>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="color: #333; font-size: 16px; line-height: 1.5;">${message.replace(/\n/g, '<br>')}</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">Este es un mensaje automático, por favor no respondas a este correo.</p>
          </div>
        `,
      });
      console.log(`[EmailService] Correo enviado exitosamente a: ${student.emailInstitucional} | Asunto: ${subject}`);
    } catch (error) {
      console.error(`[EmailService] Error al enviar correo a ${student.emailInstitucional}:`, error);
      // Para propósitos de demostración, imprimimos en consola si falla el envío (ej. credenciales no configuradas)
      console.log(`[Fallback] Simulando envío a ${student.emailInstitucional}: ${message}`);
    }
  }
}
