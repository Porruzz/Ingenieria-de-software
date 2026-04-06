import { ManageStudentProfile } from '../application/use-cases/manage-student-profile';
import { InMemoryStudentProfileRepository } from '../infrastructure/repositories/student-profile.repository';

describe('US-01 & US-03: Gestión de Perfil de Vida', () => {
  let profileManager: ManageStudentProfile;
  let repository: InMemoryStudentProfileRepository;
  const studentId = 'TEST-STUDENT-001';

  beforeEach(async () => {
    repository = new InMemoryStudentProfileRepository();
    profileManager = new ManageStudentProfile(repository);
    await repository.createInitialProfile(studentId, 'Test User');
  });

  describe('US-01: Zonas Prohibidas (Trabajo/Bienestar)', () => {
    it('debería guardar zonas prohibidas válidas', async () => {
      const zones = [
        { day: 'Lunes', startTime: '18:00', endTime: '22:00', label: 'Trabajo' }
      ];

      await profileManager.setForbiddenZones(studentId, zones);
      
      const profile = await repository.getStudentProfile(studentId);
      expect(profile?.forbiddenZones).toHaveLength(1);
      expect(profile?.forbiddenZones[0].label).toBe('Trabajo');
    });

    it('debería fallar si la hora de fin es menor a la de inicio', async () => {
      const invalidZones = [
        { day: 'Martes', startTime: '10:00', endTime: '08:00', label: 'Error' }
      ];

      await expect(profileManager.setForbiddenZones(studentId, invalidZones))
        .rejects.toThrow('[US-01] Error en bloque (Error): La hora de fin debe ser mayor a la de inicio.');
    });
  });

  describe('US-03: Tiempos de Desplazamiento', () => {
    it('debería guardar un tiempo de desplazamiento válido', async () => {
      await profileManager.setCommuteTime(studentId, 45);
      
      const profile = await repository.getStudentProfile(studentId);
      expect(profile?.commuteTimeMinutes).toBe(45);
    });

    it('debería rechazar tiempos de desplazamiento irreales (p.ej. negativos o > 4hrs)', async () => {
      await expect(profileManager.setCommuteTime(studentId, -10))
        .rejects.toThrow('[US-03] El tiempo de desplazamiento debe estar entre 0 y 240 minutos');
        
      await expect(profileManager.setCommuteTime(studentId, 300))
        .rejects.toThrow('[US-03] El tiempo de desplazamiento debe estar entre 0 y 240 minutos');
    });
  });
});
