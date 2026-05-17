import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// ── Core Infrastructure ────────────────────────────────────────────────────────
import { CryptoService } from './infrastructure/security/crypto-service';
import { RedisService } from './infrastructure/cache/redis-service';
import { PostgresTimeBlockRepository } from './infrastructure/database/postgres-time-block-repository';
import { PostgresStudentRepository } from './infrastructure/database/postgres-student-repository';

// ── Use Cases ──────────────────────────────────────────────────────────────────
import { ManageTimeBlocksUseCase } from './application/use-cases/manage-time-blocks';
import { UpdateStudentLogisticsUseCase } from './application/use-cases/update-student-logistics';
import { CalculateCriticalityUseCase } from './application/use-cases/calculate-criticality.use-case';
import { PublishOfferUseCase } from './application/use-cases/publish-offer.use-case';
import { RegisterInterestUseCase } from './application/use-cases/register-interest.use-case';
import { ValidatePrerequisites } from './application/use-cases/validate-prerequisites';
import { SyncAcademicHistory } from './application/use-cases/sync-academic-history';
import { GenerateOptimalSchedule } from './application/use-cases/generate-schedule';
import { ConfirmBilateralSwapUseCase } from './application/use-cases/confirm-bilateral-swap.use-case';
import { FormalizeSwapUseCase } from './application/use-cases/formalize-swap.use-case';
import { GetAvailableSections } from './application/use-cases/get-available-sections';
import { GenerateDemandConflictReportUseCase } from './application/use-cases/generate-demand-conflict-report.use-case';
import { GenerateConcurrencyHeatMapUseCase } from './application/use-cases/generate-concurrency-heat-map.use-case';
import { RegisterStudentUseCase } from './application/use-cases/auth/register-student';
import { LoginStudentUseCase } from './application/use-cases/auth/login-student';
import { Student } from './domain/entities/student';
import { PasswordHasher } from './infrastructure/security/password-hasher';
import { RequestPasswordResetUseCase } from './application/use-cases/auth/request-password-reset';
import { ResetPasswordUseCase } from './application/use-cases/auth/reset-password';
import { SSOLoginUseCase } from './application/use-cases/auth/sso-login';
import { HandleChatMessageUseCase } from './application/use-cases/handle-chat-message.use-case';
import { CheckSystemHealthUseCase } from './application/use-cases/check-system-health.use-case';

// ── Controllers ────────────────────────────────────────────────────────────────
import { TimeBlockController } from './interfaces/controllers/time-block-controller';
import { StudentController } from './interfaces/controllers/student-controller';
import { AuthController } from './interfaces/controllers/auth-controller';
import { CriticalSubjectController } from './interfaces/controllers/critical-subject-controller';
import { MarketplaceController } from './interfaces/controllers/marketplace-controller';
import { SyncController } from './interfaces/controllers/sync-controller';
import { ScheduleController } from './interfaces/controllers/schedule-controller';
import { SwapController } from './interfaces/controllers/swap-controller';
import { CourseController } from './interfaces/controllers/course-controller';
import { DemandConflictController } from './interfaces/controllers/demand-conflict-controller';
import { ConcurrencyHeatMapController } from './interfaces/controllers/concurrency-heat-map.controller';
import { ChatbotController } from './interfaces/controllers/chatbot-controller';
import { HealthController } from './interfaces/controllers/health-controller';

// ── Adapters & Repositories ───────────────────────────────────────────────────
import { InMemoryCriticalSubjectRepository } from './infrastructure/repositories/in-memory-critical-subject.repository';
import { InMemoryMarketplaceRepository } from './infrastructure/repositories/in-memory-marketplace.repository';
import { InMemoryEnrollmentSystemAdapter } from './infrastructure/adapters/in-memory-enrollment-system.adapter';
import { ConsoleNotificationService } from './infrastructure/services/console-notification.service';
import { InMemoryPrerequisiteRepository } from './infrastructure/repositories/prerequisite.repository';
import { EncryptedAcademicRepository } from './infrastructure/repositories/academic.repository';
import { SiaAdapter } from './infrastructure/adapters/sia-adapter';
import { InMemoryCourseOfferingAdapter } from './infrastructure/adapters/course-offering.adapter';
import { InMemoryScheduleRepository } from './infrastructure/repositories/schedule.repository';
import { InMemorySwapRepository } from './infrastructure/repositories/swap.repository';
import { SwapMatch } from './domain/entities/swap';
import { VisionSiaAdapter } from './infrastructure/adapters/vision-sia.adapter';
import multer from 'multer';

// US-17: Chatbot
import { GeminiChatbotAdapter } from './infrastructure/adapters/gemini-chatbot.adapter';
import { InMemoryChatRepository } from './infrastructure/repositories/in-memory-chat.repository';

// US-18: Stability
import { RateLimiterService } from './infrastructure/services/rate-limiter.service';
import { CircuitBreakerService } from './infrastructure/services/circuit-breaker.service';
import { createRateLimiterMiddleware } from './infrastructure/middleware/rate-limiter.middleware';

// Auth
import { AuthService } from './infrastructure/auth/auth.service';
import { createAuthMiddleware } from './infrastructure/auth/auth.middleware';
import { AuthController } from './interfaces/controllers/auth-controller';

// ── US-13 & US-16: Rutas modulares ────────────────────────────────────────────
import notificationsRouter from './infrastructure/routes/notifications.routes';
import suggestionsRouter  from './infrastructure/routes/suggestions.routes';

dotenv.config();

// ── App ────────────────────────────────────────────────────────────────────────
const app = express();

// ── Middlewares ────────────────────────────────────────────────────────────────
app.use(express.json());
<<<<<<< HEAD
app.use(cors()); // Abrir a todo para pruebas
=======
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://localhost:5174', 'http://localhost:5175'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
>>>>>>> 2709c47e8e2e43623bd38ce540b048017a18a52f
app.use(helmet());

// Multer Config (Memory Storage)
const upload = multer({ storage: multer.memoryStorage() });

// ── Dependency Injection Setup ────────────────────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'enrollment_user',
  password: process.env.DB_PASSWORD || 'enrollment_pass',
  database: process.env.DB_NAME || 'enrollment_db',
});

const cryptoService = new CryptoService(
  process.env.MASTER_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
);

const redisService = new RedisService(`redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

// US-01: Gestión de bloques de tiempo
const timeBlockRepo = new PostgresTimeBlockRepository(pool, cryptoService);
const manageTimeBlocksUseCase = new ManageTimeBlocksUseCase(timeBlockRepo, redisService);
const timeBlockController = new TimeBlockController(manageTimeBlocksUseCase);

// US-03: Actualización de logística estudiantil
const studentRepo = new PostgresStudentRepository(pool);
const updateStudentLogisticsUseCase = new UpdateStudentLogisticsUseCase(studentRepo, redisService);
const studentController = new StudentController(updateStudentLogisticsUseCase);

// Dependencias compartidas entre múltiples US
const prereqRepo = new InMemoryPrerequisiteRepository();
const academicRepo = new EncryptedAcademicRepository(cryptoService);
const validatePrerequisitesUseCase = new ValidatePrerequisites(academicRepo, prereqRepo);
const enrollmentSystem = new InMemoryEnrollmentSystemAdapter();

// US-02: Sincronización con historial académico (Vision SIA)
const visionSiaAdapter = new VisionSiaAdapter();
const syncUseCase = new SyncAcademicHistory(visionSiaAdapter, academicRepo);
const syncController = new SyncController(syncUseCase);

// US-05: Generación de horario óptimo
const courseOfferingAdapter = new InMemoryCourseOfferingAdapter();
const scheduleRepo = new InMemoryScheduleRepository();
const generateScheduleUseCase = new GenerateOptimalSchedule(courseOfferingAdapter, scheduleRepo);
const scheduleController = new ScheduleController(generateScheduleUseCase);

// US-07: Cálculo de criticidad de materias
const criticalSubjectRepo = new InMemoryCriticalSubjectRepository();
const calculateCriticalityUseCase = new CalculateCriticalityUseCase(criticalSubjectRepo, prereqRepo);
const criticalSubjectController = new CriticalSubjectController(calculateCriticalityUseCase);

// US-08: Consulta de cupos disponibles
const getAvailableSections = new GetAvailableSections();
const courseController = new CourseController(getAvailableSections);

// US-10 & US-11: Confirmación bilateral y formalización de intercambios
const swapRepo = new InMemorySwapRepository();
const confirmSwapUseCase = new ConfirmBilateralSwapUseCase(swapRepo);
const formalizeSwapUseCase = new FormalizeSwapUseCase(swapRepo, enrollmentSystem);
const swapController = new SwapController(confirmSwapUseCase, formalizeSwapUseCase);

// US-17 Setup (Chatbot)
const chatRepo = new InMemoryChatRepository();
const geminiAdapter = new GeminiChatbotAdapter(process.env.GEMINI_API_KEY || '');
const chatUseCase = new HandleChatMessageUseCase(chatRepo, geminiAdapter);
const chatbotController = new ChatbotController(chatUseCase);

// US-18 Setup (Stability & Health)
const circuitBreaker = new CircuitBreakerService();
const healthUseCase = new CheckSystemHealthUseCase(circuitBreaker);
const healthController = new HealthController(healthUseCase);
const rateLimiterService = new RateLimiterService(redisService);

// Auth Setup
const authService = new AuthService();
const authController = new AuthController(authService);
const authMiddleware = createAuthMiddleware(authService);

// US-12: Marketplace de ofertas de cupos
const marketplaceRepo = new InMemoryMarketplaceRepository();
const notificationService = new ConsoleNotificationService();
const publishOfferUseCase = new PublishOfferUseCase(enrollmentSystem, marketplaceRepo);
const registerInterestUseCase = new RegisterInterestUseCase(
  marketplaceRepo,
  enrollmentSystem,
  notificationService,
  validatePrerequisitesUseCase
);
const marketplaceController = new MarketplaceController(
  publishOfferUseCase,
  registerInterestUseCase,
  marketplaceRepo
);

// US-15: Reporte de conflictos de demanda
const generateDemandConflictReportUseCase = new GenerateDemandConflictReportUseCase(swapRepo, courseOfferingAdapter);
const demandConflictController = new DemandConflictController(generateDemandConflictReportUseCase);

// US-14: Mapa de calor de concurrencia
const generateConcurrencyHeatMapUseCase = new GenerateConcurrencyHeatMapUseCase(scheduleRepo);
const concurrencyHeatMapController = new ConcurrencyHeatMapController(generateConcurrencyHeatMapUseCase);

// US-17 & US-18: Autenticación y Restablecimiento de Contraseña
const registerStudentUseCase = new RegisterStudentUseCase(studentRepo);
const loginStudentUseCase = new LoginStudentUseCase(studentRepo, cryptoService);
const requestPasswordResetUseCase = new RequestPasswordResetUseCase(studentRepo, notificationService);
const resetPasswordUseCase = new ResetPasswordUseCase(studentRepo);
const ssoLoginUseCase = new SSOLoginUseCase(studentRepo, cryptoService);
const authController = new AuthController(
  registerStudentUseCase,
  loginStudentUseCase,
  requestPasswordResetUseCase,
  resetPasswordUseCase,
  ssoLoginUseCase
);

// ── Rutas ──────────────────────────────────────────────────────────────────────

// US-18: Aplicar Rate Limiter global
app.use(createRateLimiterMiddleware(rateLimiterService));

// US-18: Middleware de monitoreo
app.use((req, res, next) => {
  const startTime = Date.now();
  healthUseCase.incrementConnections();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    healthUseCase.recordRequest(responseTime, isError);
    healthUseCase.decrementConnections();
  });

  next();
});

const router = express.Router();

app.get('/', (_req, res) => {
  res.send('<h1>🎓 Backend de OptimaAcademia está ACTIVO</h1><p>Si ves esto, la conexión funciona.</p>');
});

// Health check — verifica que el servidor esté activo
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ── RUTAS PÚBLICAS (no requieren token) ──
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/register', (req, res) => authController.register(req, res));
router.post('/auth/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.post('/auth/reset-password', (req, res) => authController.resetPassword(req, res));
router.post('/auth/sso/callback', (req, res) => authController.ssoCallback(req, res));
router.get('/health', (req, res) => healthController.basicHealth(req, res));
router.get('/health/detailed', (req, res) => healthController.detailedHealth(req, res));

// Auth - Perfil (Ruta Protegida)
router.get('/auth/me', authMiddleware, (req, res) => authController.me(req, res));

// US-01 & US-03: Bloques de tiempo y logística
router.post('/students/:studentId/time-blocks', (req, res) => timeBlockController.createBlock(req, res));
router.get('/students/:studentId/time-blocks', (req, res) => timeBlockController.getBlocks(req, res));
router.put('/students/:studentId/time-blocks/:blockId', (req, res) => timeBlockController.updateBlock(req, res));
router.delete('/students/:studentId/time-blocks/:blockId', (req, res) => timeBlockController.deleteBlock(req, res));
router.put('/students/:studentId/logistics', (req, res) => studentController.updateLogistics(req, res));

// US-02: Sincronización (tradicional e Imagen)
router.post('/sync', (req, res) => syncController.sync(req, res));
router.post('/sync/image', upload.single('schedule'), (req, res) => syncController.syncByImage(req, res));

// US-05: Generación de horario óptimo
router.post('/schedules/generate', (req, res) => scheduleController.generate(req, res));

// US-07: Criticidad de materias
router.get('/students/:studentId/criticality', (req, res) => criticalSubjectController.getCriticality(req, res));

// US-08: Secciones y cupos disponibles
router.get('/secciones/:courseId/disponibles', (req, res) => {
  console.log(`[Backend] Petición US-08 recibida para materia: ${req.params.courseId}`);
  return courseController.getSections(req, res);
});

// US-10 & US-11: Confirmación y formalización de swaps
router.patch('/swaps/confirm', (req, res) => swapController.confirm(req, res));
router.post('/swaps/formalize', (req, res) => swapController.formalize(req, res));
router.post('/swaps/reject', (req, res) => swapController.reject(req, res));

// US-12: Marketplace de cupos
router.post('/marketplace/offers', (req, res) => marketplaceController.publish(req, res));
router.get('/marketplace/courses/:courseId/offers', (req, res) => marketplaceController.getOffersByCourse(req, res));
router.post('/marketplace/offers/:offerId/interests', (req, res) => marketplaceController.interest(req, res));

// US-15: Reportes de conflicto de demanda
router.get('/reports/demand-conflict', (req, res) => demandConflictController.getReport(req, res));

// US-14: Reportes de mapa de calor de concurrencia
router.get('/reports/concurrency-heatmap', (req, res) => concurrencyHeatMapController.getHeatMap(req, res));

// US-17: Chatbot
router.post('/chat/sessions', (req, res) => chatbotController.createSession(req, res));
router.post('/chat/sessions/:sessionId/messages', (req, res) => chatbotController.sendMessage(req, res));
router.get('/chat/sessions/:sessionId', (req, res) => chatbotController.getSession(req, res));
router.delete('/chat/sessions/:sessionId', (req, res) => chatbotController.closeSession(req, res));

app.use('/api', router);

// US-13: Sugerencias (router modular)
app.use('/api/sugerencias', suggestionsRouter);

// US-16: Notificaciones (router modular)
app.use('/api/notificaciones', notificationsRouter);

// 404 — Ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({ ok: false, message: 'Ruta no encontrada.' });
});

// ── Seeding de datos de demo ───────────────────────────────────────────────────
const seedDemoData = async () => {
  console.log('\n[Seed] ══════════════════════════════════════');
  console.log('[Seed] Inicializando datos de demo...');

  // ── Inscripciones en el SIA (necesarias para swaps) ──
  const enrollments = [
    { enrollmentId: 'SEC-PCIA5040-A', studentId: 'santiago-123', courseId: 'PCIA5040', sectionId: 'A', status: 'ACTIVO' },
    { enrollmentId: 'SEC-PCIA5008-A', studentId: 'santiago-123', courseId: 'PCIA5008', sectionId: 'A', status: 'ACTIVO' },
    { enrollmentId: 'SEC-PCIA5009-A', studentId: 'santiago-123', courseId: 'PCIA5009', sectionId: 'A', status: 'ACTIVO' },
    { enrollmentId: 'SEC-MAT101-A',   studentId: 'santiago-123', courseId: 'MAT101',   sectionId: 'A', status: 'ACTIVO' },
    { enrollmentId: 'SEC-PROG101-B',  studentId: 'roberto-martinez', courseId: 'PROG101', sectionId: 'B', status: 'ACTIVO' },
    { enrollmentId: 'SEC-FIS101-A',   studentId: 'santiago-123', courseId: 'FIS101',   sectionId: 'A', status: 'ACTIVO' },
    { enrollmentId: 'SEC-MAT102-B',   studentId: 'elena-garcia',  courseId: 'MAT102',  sectionId: 'B', status: 'ACTIVO' },
    { enrollmentId: 'SEC-PCIA5040-B', studentId: 'roberto-martinez', courseId: 'PCIA5040', sectionId: 'B', status: 'ACTIVO' },
    { enrollmentId: 'SEC-PCIA5008-B', studentId: 'elena-garcia', courseId: 'PCIA5008', sectionId: 'B', status: 'ACTIVO' },
  ];

  for (const e of enrollments) {
    (enrollmentSystem as any).addEnrollment(e);
  }
  console.log(`[Seed] ${enrollments.length} inscripciones registradas en SIA simulado.`);

  // ── Matches de Swap (diferentes estados para mostrar el flujo) ──
  const matches: SwapMatch[] = [
    {
      matchId: 'SW-98235-RUIZ',
      status: 'PENDIENTE_CONFIRMACION',
      studentA: { id: 'santiago-123', delivers: 'SEC-MAT101-A', receives: 'SEC-PROG101-B', confirmed: false },
      studentB: { id: 'roberto-martinez', delivers: 'SEC-PROG101-B', receives: 'SEC-MAT101-A', confirmed: false },
      improvementA: 15.5, improvementB: 12.2,
      systemSafetyHash: 'SAFE-8823-X', createdAt: new Date()
    },
    {
      matchId: 'SW-98234-MART',
      status: 'APROBADO',
      studentA: { id: 'santiago-123', delivers: 'SEC-FIS101-A', receives: 'SEC-MAT102-B', confirmed: true },
      studentB: { id: 'elena-garcia', delivers: 'SEC-MAT102-B', receives: 'SEC-FIS101-A', confirmed: true },
      improvementA: 20.1, improvementB: 18.5,
      systemSafetyHash: 'SAFE-9941-Z', createdAt: new Date()
    },
    {
      matchId: 'SW-2026-DEMO',
      status: 'FORMALIZADO',
      studentA: { id: 'roberto-martinez', delivers: 'SEC-PCIA5040-B', receives: 'SEC-PCIA5008-B', confirmed: true },
      studentB: { id: 'elena-garcia', delivers: 'SEC-PCIA5008-B', receives: 'SEC-PCIA5040-B', confirmed: true },
      improvementA: 25.0, improvementB: 22.3,
      systemSafetyHash: 'SAFE-DEMO-001', formalizationToken: 'FORMAL-USA-2026-001',
      createdAt: new Date('2026-05-01')
    }
  ];

  for (const m of matches) {
    await swapRepo.saveMatch(m);
  }
  console.log(`[Seed] ${matches.length} swap matches creados (PENDIENTE, APROBADO, FORMALIZADO).`);

  console.log('[Seed] ══════════════════════════════════════');
  console.log('[Seed] ✅ Demo lista. Credenciales:');
  console.log('[Seed]    📧 santiago.parra@usa.edu.co / demo123');
  console.log('[Seed]    📧 roberto.martinez@usa.edu.co / demo123');
  console.log('[Seed]    📧 elena.garcia@usa.edu.co / demo123');
  console.log('[Seed] ══════════════════════════════════════\n');
};

seedDemoData();

const seedStudent = async () => {
  try {
    const existing = await studentRepo.findByEmail('juanr@optima.edu.co');
    if (!existing) {
      const passwordHash = PasswordHasher.hash('password123');
      const demoStudent = new Student({
        id: 'juanr-123',
        identificacionUniversidad: '202310156',
        nombreCompleto: 'Juan Rodríguez',
        emailInstitucional: 'juanr@optima.edu.co',
        creditosAprobados: 85,
        promedioAcumulado: 4.2,
        trabaja: true,
        horasTrabajoSemanal: 12,
        tiempoTrasladoMin: 45,
        bufferSeguridadMin: 15,
        academicHistory: [],
        prohibitedTimeBlocks: [],
        passwordHash
      });
      await studentRepo.createStudent(demoStudent, passwordHash);
      console.log('[Seed] Estudiante de prueba "juanr@optima.edu.co" creado exitosamente.');
    } else {
      console.log('[Seed] Estudiante de prueba "juanr@optima.edu.co" ya existe.');
    }
  } catch (err) {
    console.error('[Seed] Error al sembrar estudiante de prueba:', err);
  }
};

seedStudent();

// ── Inicio del servidor ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('');
  console.log('  🎓 OptimaAcademia Backend corriendo');
  console.log(`  ➜  Health:    http://localhost:${PORT}/api/health`);
  console.log(`  ➜  US-14/15:  http://localhost:${PORT}/api/reports/...`);
  console.log(`  ➜  US-13/16:  http://localhost:${PORT}/api/sugerencias | /notificaciones`);
  console.log(`  ➜  CORS:      http://localhost:5173`);
  console.log('');
});

export default app;
