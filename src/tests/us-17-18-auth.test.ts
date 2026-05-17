import { RegisterStudentUseCase } from '../application/use-cases/auth/register-student';
import { LoginStudentUseCase } from '../application/use-cases/auth/login-student';
import { RequestPasswordResetUseCase } from '../application/use-cases/auth/request-password-reset';
import { ResetPasswordUseCase } from '../application/use-cases/auth/reset-password';
import { IStudentRepository } from '../domain/repositories/student-repository';
import { Student } from '../domain/entities/student';
import { CryptoService } from '../infrastructure/security/crypto-service';
import { NotificationServicePort } from '../application/ports/notification-service.port';
import { PasswordHasher } from '../infrastructure/security/password-hasher';

// In-Memory implementation of the student repository specifically for unit and integration testing
class InMemoryStudentRepository implements IStudentRepository {
  private readonly students: Map<string, Student> = new Map();

  async findById(id: string): Promise<Student | null> {
    return this.students.get(id) || null;
  }

  async findByEmail(email: string): Promise<Student | null> {
    for (const student of this.students.values()) {
      if (student.emailInstitucional === email) {
        return student;
      }
    }
    return null;
  }

  async findByResetToken(token: string): Promise<Student | null> {
    for (const student of this.students.values()) {
      if (student.resetPasswordToken === token) {
        return student;
      }
    }
    return null;
  }

  async createStudent(student: Student, passwordHash: string): Promise<void> {
    // Recreate student with hashed password so getters work correctly in memory
    const studentWithHash = new Student({
      ...(student as any).props,
      passwordHash
    });
    this.students.set(student.id, studentWithHash);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const student = this.students.get(id);
    if (student) {
      const updated = new Student({
        ...(student as any).props,
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null
      });
      this.students.set(id, updated);
    }
  }

  async updateResetToken(id: string, token: string | null, expires: Date | null): Promise<void> {
    const student = this.students.get(id);
    if (student) {
      const updated = new Student({
        ...(student as any).props,
        resetPasswordToken: token,
        resetPasswordExpires: expires
      });
      this.students.set(id, updated);
    }
  }

  async updateLogistics(id: string, tiempoTrasladoMin: number, bufferSeguridadMin: number): Promise<void> {
    const student = this.students.get(id);
    if (student) {
      const updated = new Student({
        ...(student as any).props,
        tiempoTrasladoMin,
        bufferSeguridadMin
      });
      this.students.set(id, updated);
    }
  }
}

// Mock notification service to capture and assert reset links
class MockNotificationService implements NotificationServicePort {
  lastNotification: { studentId: string; subject: string; message: string } | null = null;
  
  async notifyStudent(studentId: string, subject: string, message: string): Promise<void> {
    this.lastNotification = { studentId, subject, message };
  }
}

describe('US-17 & US-18: Autenticación de Estudiantes y Recuperación de Contraseña', () => {
  let studentRepo: InMemoryStudentRepository;
  let cryptoService: CryptoService;
  let notificationService: MockNotificationService;

  let registerUseCase: RegisterStudentUseCase;
  let loginUseCase: LoginStudentUseCase;
  let requestResetUseCase: RequestPasswordResetUseCase;
  let resetPasswordUseCase: ResetPasswordUseCase;

  const validRegistrationCommand = {
    identificacionUniversidad: 'UN-2026-98',
    nombreCompleto: 'Juan Rodríguez',
    emailInstitucional: 'j.rodriguez@optima.edu.co',
    password: 'securePassword123'
  };

  beforeEach(() => {
    studentRepo = new InMemoryStudentRepository();
    cryptoService = new CryptoService('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    notificationService = new MockNotificationService();

    registerUseCase = new RegisterStudentUseCase(studentRepo);
    loginUseCase = new LoginStudentUseCase(studentRepo, cryptoService);
    requestResetUseCase = new RequestPasswordResetUseCase(studentRepo, notificationService);
    resetPasswordUseCase = new ResetPasswordUseCase(studentRepo);
  });

  describe('US-17: Registro de Estudiantes', () => {
    it('debería registrar un estudiante correctamente si los datos son válidos', async () => {
      const student = await registerUseCase.execute(validRegistrationCommand);

      expect(student).toBeDefined();
      expect(student.id).toBeDefined();
      expect(student.nombreCompleto).toBe('Juan Rodríguez');
      expect(student.emailInstitucional).toBe('j.rodriguez@optima.edu.co');
      expect(student.passwordHash).toBeDefined();
      expect(student.passwordHash).not.toBe(validRegistrationCommand.password); // Ensure hashed password

      // Verify that it is stored in the repo
      const stored = await studentRepo.findById(student.id);
      expect(stored).toBeDefined();
      expect(stored?.passwordHash).toBe(student.passwordHash);
    });

    it('debería lanzar un error si faltan campos obligatorios', async () => {
      const invalidCommand = {
        ...validRegistrationCommand,
        password: ''
      };

      await expect(registerUseCase.execute(invalidCommand))
        .rejects.toThrow('Todos los campos obligatorios');
    });

    it('debería lanzar un error si el correo no tiene un formato válido', async () => {
      const invalidCommand = {
        ...validRegistrationCommand,
        emailInstitucional: 'invalidEmail'
      };

      await expect(registerUseCase.execute(invalidCommand))
        .rejects.toThrow('El correo electrónico debe ser una cuenta institucional válida.');
    });

    it('debería lanzar un error si la contraseña tiene menos de 6 caracteres', async () => {
      const invalidCommand = {
        ...validRegistrationCommand,
        password: '123'
      };

      await expect(registerUseCase.execute(invalidCommand))
        .rejects.toThrow('La contraseña debe tener al menos 6 caracteres.');
    });

    it('debería lanzar un error si el correo institucional ya se encuentra registrado', async () => {
      await registerUseCase.execute(validRegistrationCommand);

      await expect(registerUseCase.execute(validRegistrationCommand))
        .rejects.toThrow('El correo institucional ya se encuentra registrado.');
    });
  });

  describe('US-17: Login de Estudiante', () => {
    beforeEach(async () => {
      await registerUseCase.execute(validRegistrationCommand);
    });

    it('debería iniciar sesión correctamente con credenciales válidas y retornar un token cifrado', async () => {
      const result = await loginUseCase.execute({
        emailInstitucional: validRegistrationCommand.emailInstitucional,
        password: validRegistrationCommand.password
      });

      expect(result).toBeDefined();
      expect(result.student).toBeDefined();
      expect(result.student.emailInstitucional).toBe(validRegistrationCommand.emailInstitucional);
      expect(result.token).toBeDefined();

      // Verify the token can be decrypted by CryptoService
      const decryptedPayloadStr = cryptoService.decrypt(result.token);
      const decryptedPayload = JSON.parse(decryptedPayloadStr);

      expect(decryptedPayload.studentId).toBe(result.student.id);
      expect(decryptedPayload.email).toBe(result.student.emailInstitucional);
      expect(decryptedPayload.expiresAt).toBeGreaterThan(Date.now());
    });

    it('debería denegar el acceso si la contraseña es incorrecta', async () => {
      await expect(loginUseCase.execute({
        emailInstitucional: validRegistrationCommand.emailInstitucional,
        password: 'wrongPassword'
      })).rejects.toThrow('Credenciales incorrectas o usuario no registrado.');
    });

    it('debería denegar el acceso si el correo electrónico no existe', async () => {
      await expect(loginUseCase.execute({
        emailInstitucional: 'nonexistent@optima.edu.co',
        password: validRegistrationCommand.password
      })).rejects.toThrow('Credenciales incorrectas o usuario no registrado.');
    });
  });

  describe('US-18: Solicitud de Restablecimiento de Contraseña (Forgot Password)', () => {
    beforeEach(async () => {
      await registerUseCase.execute(validRegistrationCommand);
    });

    it('debería generar un token de restablecimiento y enviar el enlace por correo', async () => {
      const response = await requestResetUseCase.execute({
        emailInstitucional: validRegistrationCommand.emailInstitucional
      });

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.token.length).toBe(32); // Hex 16 bytes = 32 chars
      expect(response.resetLink).toContain(response.token);

      // Verify the notification service was triggered
      expect(notificationService.lastNotification).toBeDefined();
      expect(notificationService.lastNotification?.subject).toBe('Restablecimiento de contraseña');
      expect(notificationService.lastNotification?.message).toContain(response.resetLink);

      // Verify saved in repository
      const student = await studentRepo.findByEmail(validRegistrationCommand.emailInstitucional);
      expect(student?.resetPasswordToken).toBe(response.token);
      expect(student?.resetPasswordExpires).toBeDefined();
      expect(student?.resetPasswordExpires!.getTime()).toBeGreaterThan(Date.now());
    });

    it('debería fallar si el correo ingresado no existe', async () => {
      await expect(requestResetUseCase.execute({
        emailInstitucional: 'unknown@optima.edu.co'
      })).rejects.toThrow('El correo electrónico ingresado no se encuentra registrado.');
    });
  });

  describe('US-18: Confirmación de Restablecimiento de Contraseña', () => {
    let resetToken: string;

    beforeEach(async () => {
      await registerUseCase.execute(validRegistrationCommand);
      const resetRes = await requestResetUseCase.execute({
        emailInstitucional: validRegistrationCommand.emailInstitucional
      });
      resetToken = resetRes.token;
    });

    it('debería restablecer la contraseña correctamente con un token válido y no expirado', async () => {
      const newPassword = 'myNewSuperSecurePassword123';

      await resetPasswordUseCase.execute({
        token: resetToken,
        newPassword
      });

      // Verify that the login works with the new password
      const loginRes = await loginUseCase.execute({
        emailInstitucional: validRegistrationCommand.emailInstitucional,
        password: newPassword
      });

      expect(loginRes.student).toBeDefined();

      // Verify that the old password no longer works
      await expect(loginUseCase.execute({
        emailInstitucional: validRegistrationCommand.emailInstitucional,
        password: validRegistrationCommand.password
      })).rejects.toThrow('Credenciales incorrectas o usuario no registrado.');

      // Verify that token fields are cleared in the repo
      const student = await studentRepo.findById(loginRes.student.id);
      expect(student?.resetPasswordToken).toBeNull();
      expect(student?.resetPasswordExpires).toBeNull();
    });

    it('debería fallar si el token es inválido', async () => {
      await expect(resetPasswordUseCase.execute({
        token: 'invalidToken123456789',
        newPassword: 'newPassword123'
      })).rejects.toThrow('El token de restablecimiento no es válido o ha expirado.');
    });

    it('debería fallar si el token ha expirado', async () => {
      // Simulate expired token in repo
      const student = await studentRepo.findByEmail(validRegistrationCommand.emailInstitucional);
      expect(student).toBeDefined();

      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      await studentRepo.updateResetToken(student!.id, resetToken, expiredDate);

      await expect(resetPasswordUseCase.execute({
        token: resetToken,
        newPassword: 'newPassword123'
      })).rejects.toThrow('El enlace de restablecimiento ha expirado.');

      // Verify token cleared
      const updatedStudent = await studentRepo.findById(student!.id);
      expect(updatedStudent?.resetPasswordToken).toBeNull();
    });

    it('debería fallar si la nueva contraseña tiene menos de 6 caracteres', async () => {
      await expect(resetPasswordUseCase.execute({
        token: resetToken,
        newPassword: '123'
      })).rejects.toThrow('La nueva contraseña debe tener al menos 6 caracteres.');
    });
  });
});
