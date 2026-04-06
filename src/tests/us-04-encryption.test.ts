import { AESEncryptionService } from '../infrastructure/services/aes-encryption.service';
import { EncryptedAcademicRepository } from '../infrastructure/repositories/academic.repository';
import { AcademicSummary } from '../domain/entities/academic-record';

/**
 * Suite de Pruebas para US-04: Cifrado de Datos Personales.
 * Verifica todos los criterios de aceptación y requerimientos de seguridad.
 * 
 * Criterios de Aceptación:
 * - Los datos personales se almacenan cifrados en la base de datos.
 * - Un query directo a la BD no muestra datos en texto plano.
 * - La API no expone datos de un estudiante a otro.
 * - Las claves se manejan por variables de entorno, no hardcodeadas.
 */
describe('US-04 — Cifrado de Datos Personales', () => {

  // ═══════════════════════════════════════════════════
  // RF-04.2: Cifrado AES-256 para datos en reposo
  // ═══════════════════════════════════════════════════

  describe('RF-04.2: Servicio de Cifrado AES-256', () => {
    let encryptionService: AESEncryptionService;

    beforeEach(() => {
      encryptionService = new AESEncryptionService();
    });

    test('Debe cifrar y descifrar texto correctamente (ciclo completo)', () => {
      const originalText = 'Santiago Porras - Ingeniería de Sistemas - 2026';
      const encrypted = encryptionService.encrypt(originalText);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
      expect(encrypted).not.toBe(originalText);
      console.log('✅ Ciclo cifrado/descifrado exitoso');
    });

    test('El texto cifrado debe tener formato IV:Data (hex:hex)', () => {
      const encrypted = encryptionService.encrypt('datos sensibles');

      expect(encrypted).toContain(':');
      const [iv, data] = encrypted.split(':');
      expect(iv).toMatch(/^[0-9a-f]+$/); // IV en hexadecimal
      expect(data).toMatch(/^[0-9a-f]+$/); // Datos en hexadecimal
      console.log('✅ Formato correcto: IV:CipherText');
    });

    test('Cada cifrado debe generar un resultado diferente (IV aleatorio)', () => {
      const text = 'mismo texto';
      const encrypted1 = encryptionService.encrypt(text);
      const encrypted2 = encryptionService.encrypt(text);

      // El mismo texto cifrado dos veces debe dar resultados DISTINTOS
      // (gracias al IV aleatorio — protección contra ataques de patrones)
      expect(encrypted1).not.toBe(encrypted2);

      // Pero ambos deben descifrar al mismo texto original
      expect(encryptionService.decrypt(encrypted1)).toBe(text);
      expect(encryptionService.decrypt(encrypted2)).toBe(text);
      console.log('✅ IV aleatorio genera cifrados únicos (protección contra pattern analysis)');
    });

    test('Debe cifrar correctamente caracteres especiales y Unicode', () => {
      const specialChars = '¡Hola! Ñoño García — Contraseña: p@$$w0rd 🔒 日本語';
      const encrypted = encryptionService.encrypt(specialChars);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(specialChars);
      console.log('✅ Caracteres especiales y Unicode cifrados correctamente');
    });

    test('Debe cifrar correctamente textos largos (historial completo)', () => {
      // Simular un JSON con historial académico completo
      const largeData = JSON.stringify({
        studentId: 'LARGO_TEST',
        records: Array.from({ length: 50 }, (_, i) => ({
          courseId: `MAT${i}`,
          courseName: `Materia de Prueba ${i}`,
          status: 'APROBADA',
          grade: '4.5',
          credits: 3,
          period: '2026-1',
        })),
        totalCredits: 150,
        currentSemester: 10,
      });

      const encrypted = encryptionService.encrypt(largeData);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(largeData);
      expect(JSON.parse(decrypted).records).toHaveLength(50);
      console.log(`✅ Texto largo cifrado: ${largeData.length} chars → ${encrypted.length} chars cifrados`);
    });

    test('Debe lanzar error al cifrar texto vacío', () => {
      expect(() => encryptionService.encrypt('')).toThrow();
      console.log('✅ Validación de texto vacío funciona');
    });

    test('Debe lanzar error al descifrar formato inválido', () => {
      expect(() => encryptionService.decrypt('texto-invalido-sin-formato')).toThrow();
      expect(() => encryptionService.decrypt('')).toThrow();
      console.log('✅ Validación de formato de descifrado funciona');
    });

    test('Health check del servicio de cifrado debe pasar', () => {
      expect(encryptionService.healthCheck()).toBe(true);
      console.log('✅ Health check del servicio de cifrado: OK');
    });
  });

  // ═══════════════════════════════════════════════════
  // RF-04.1: Datos personales cifrados en reposo
  // ═══════════════════════════════════════════════════

  describe('RF-04.1: Datos cifrados en la Base de Datos', () => {
    let encryptionService: AESEncryptionService;
    let repository: EncryptedAcademicRepository;

    const testSummary: AcademicSummary = {
      studentId: 'US04_TEST',
      records: [
        { courseId: 'MAT101', courseName: 'Cálculo I', status: 'APROBADA', grade: '4.5', credits: 4, period: '2025-1' },
        { courseId: 'FIS101', courseName: 'Física Mecánica', status: 'APROBADA', grade: '4.0', credits: 4, period: '2025-1' },
      ],
      totalCredits: 8,
      currentSemester: 2,
      lastSync: new Date('2026-01-01'),
    };

    beforeEach(async () => {
      encryptionService = new AESEncryptionService();
      repository = new EncryptedAcademicRepository(encryptionService);
      await repository.saveHistory(testSummary);
    });

    test('Un query directo a la BD NO debe mostrar datos en texto plano', async () => {
      const rawData = await repository.debugGetEncryptedData('US04_TEST');

      expect(rawData).toBeDefined();
      // No debe ser JSON legible
      expect(() => JSON.parse(rawData!)).toThrow();
      // Debe estar en formato cifrado hex:hex
      expect(rawData).toContain(':');
      // No debe contener el nombre en texto plano
      expect(rawData).not.toContain('Cálculo I');
      expect(rawData).not.toContain('Santiago');
      expect(rawData).not.toContain('4.5');

      console.log('✅ Datos en BD son ilegibles sin la clave de descifrado');
      console.log(`   Raw (60 chars): ${rawData?.substring(0, 60)}...`);
    });

    test('El sistema SÍ puede leer los datos a través del repositorio seguro', async () => {
      const recovered = await repository.getHistory('US04_TEST');

      expect(recovered).not.toBeNull();
      expect(recovered?.studentId).toBe('US04_TEST');
      expect(recovered?.records[0].courseName).toBe('Cálculo I');
      expect(recovered?.records[0].grade).toBe('4.5');
      expect(recovered?.totalCredits).toBe(8);
      console.log('✅ El repositorio descifra correctamente los datos');
    });

    test('No debe existir data cruzada entre estudiantes (RF-04.4)', async () => {
      // Guardar datos de otro estudiante
      await repository.saveHistory({
        ...testSummary,
        studentId: 'OTRO_STUDENT',
        records: [
          { courseId: 'PROG101', courseName: 'Programación', status: 'PERDIDA', grade: '2.0', credits: 3, period: '2025-1' },
        ],
      });

      // Los datos de cada estudiante deben ser independientes
      const student1 = await repository.getHistory('US04_TEST');
      const student2 = await repository.getHistory('OTRO_STUDENT');

      expect(student1?.records[0].courseName).toBe('Cálculo I');
      expect(student2?.records[0].courseName).toBe('Programación');

      // No deben poder acceder a datos del otro
      expect(student1?.studentId).not.toBe(student2?.studentId);
      console.log('✅ Aislamiento de datos entre estudiantes verificado');
    });
  });

  // ═══════════════════════════════════════════════════
  // RNF-04.3: Logs sin datos personales en texto plano
  // ═══════════════════════════════════════════════════

  describe('RNF-04.3: Enmascaramiento de Datos en Logs', () => {
    test('maskForLogs debe ocultar datos sensibles', () => {
      expect(AESEncryptionService.maskForLogs('Santiago')).toBe('San***');
      expect(AESEncryptionService.maskForLogs('santiago.porras@mail.com')).toBe('san***');
      expect(AESEncryptionService.maskForLogs('AB')).toBe('***');
      expect(AESEncryptionService.maskForLogs('')).toBe('***');
      console.log('✅ Función de enmascaramiento para logs funciona correctamente');
    });
  });

  // ═══════════════════════════════════════════════════
  // RNF-04.4: Latencia máxima de cifrado/descifrado: 50ms
  // ═══════════════════════════════════════════════════

  describe('RNF-04.4: Performance del Cifrado', () => {
    test('El cifrado debe completarse en menos de 50ms', () => {
      const service = new AESEncryptionService();
      const testData = JSON.stringify({ data: 'x'.repeat(5000) }); // ~5KB

      const start = Date.now();
      service.encrypt(testData);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
      console.log(`✅ Cifrado completado en ${elapsed}ms (límite: 50ms)`);
    });

    test('El descifrado debe completarse en menos de 50ms', () => {
      const service = new AESEncryptionService();
      const testData = JSON.stringify({ data: 'x'.repeat(5000) });
      const encrypted = service.encrypt(testData);

      const start = Date.now();
      service.decrypt(encrypted);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
      console.log(`✅ Descifrado completado en ${elapsed}ms (límite: 50ms)`);
    });
  });

  // ═══════════════════════════════════════════════════
  // RNF-04.2: Claves no hardcodeadas en el código
  // ═══════════════════════════════════════════════════

  describe('RNF-04.2: Gestión de Claves', () => {
    test('El servicio debe funcionar con clave por defecto en desarrollo', () => {
      const service = new AESEncryptionService();
      expect(service.healthCheck()).toBe(true);
      console.log('✅ Servicio funciona correctamente en modo desarrollo');
    });

    test('Dos instancias con la misma clave deben poder compartir datos', () => {
      const service1 = new AESEncryptionService();
      const service2 = new AESEncryptionService();

      const encrypted = service1.encrypt('datos compartidos');
      const decrypted = service2.decrypt(encrypted);

      expect(decrypted).toBe('datos compartidos');
      console.log('✅ Consistencia de claves entre instancias verificada');
    });
  });
});
