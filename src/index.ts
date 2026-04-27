import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Core Infrastructure
import { CryptoService } from './infrastructure/security/crypto-service';
import { RedisService } from './infrastructure/cache/redis-service';
import { PostgresTimeBlockRepository } from './infrastructure/database/postgres-time-block-repository';
import { PostgresStudentRepository } from './infrastructure/database/postgres-student-repository';

// Use Cases
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

// Controllers
import { TimeBlockController } from './interfaces/controllers/time-block-controller';
import { StudentController } from './interfaces/controllers/student-controller';
import { CriticalSubjectController } from './interfaces/controllers/critical-subject-controller';
import { MarketplaceController } from './interfaces/controllers/marketplace-controller';
import { SyncController } from './interfaces/controllers/sync-controller';
import { ScheduleController } from './interfaces/controllers/schedule-controller';
import { SwapController } from './interfaces/controllers/swap-controller';

// Adapters & Repositories
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


dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());

// Dependency Injection Setup
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

// US-01 Setup
const timeBlockRepo = new PostgresTimeBlockRepository(pool, cryptoService);
const manageTimeBlocksUseCase = new ManageTimeBlocksUseCase(timeBlockRepo, redisService);
const timeBlockController = new TimeBlockController(manageTimeBlocksUseCase);

// US-03 Setup
const studentRepo = new PostgresStudentRepository(pool);
const updateStudentLogisticsUseCase = new UpdateStudentLogisticsUseCase(studentRepo, redisService);
const studentController = new StudentController(updateStudentLogisticsUseCase);

// Shared Dependencies
const prereqRepo = new InMemoryPrerequisiteRepository();
const academicRepo = new EncryptedAcademicRepository(cryptoService);
const validatePrerequisitesUseCase = new ValidatePrerequisites(academicRepo, prereqRepo);
const enrollmentSystem = new InMemoryEnrollmentSystemAdapter();

// US-02 Setup (Sync)
const siaAdapter = new SiaAdapter();
const syncUseCase = new SyncAcademicHistory(siaAdapter, academicRepo);
const syncController = new SyncController(syncUseCase);

// US-05 Setup (Schedule Architect)
const courseOfferingAdapter = new InMemoryCourseOfferingAdapter();
const scheduleRepo = new InMemoryScheduleRepository();
const generateScheduleUseCase = new GenerateOptimalSchedule(courseOfferingAdapter, scheduleRepo);
const scheduleController = new ScheduleController(generateScheduleUseCase);

// US-07 Setup (Criticality)
const criticalSubjectRepo = new InMemoryCriticalSubjectRepository();
const calculateCriticalityUseCase = new CalculateCriticalityUseCase(criticalSubjectRepo, prereqRepo);
const criticalSubjectController = new CriticalSubjectController(calculateCriticalityUseCase);

// US-10 & US-11 Setup (Swap Confirmation & Formalization)
const swapRepo = new InMemorySwapRepository();
const confirmSwapUseCase = new ConfirmBilateralSwapUseCase(swapRepo);
const formalizeSwapUseCase = new FormalizeSwapUseCase(swapRepo, enrollmentSystem);
const swapController = new SwapController(confirmSwapUseCase, formalizeSwapUseCase);



// US-12 Setup (Marketplace)
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

// Routes
const router = express.Router();

// US-01 & US-03
router.post('/students/:studentId/time-blocks', (req, res) => timeBlockController.createBlock(req, res));
router.get('/students/:studentId/time-blocks', (req, res) => timeBlockController.getBlocks(req, res));
router.put('/students/:studentId/time-blocks/:blockId', (req, res) => timeBlockController.updateBlock(req, res));
router.delete('/students/:studentId/time-blocks/:blockId', (req, res) => timeBlockController.deleteBlock(req, res));
router.put('/students/:studentId/logistics', (req, res) => studentController.updateLogistics(req, res));

// US-02
router.post('/sync', (req, res) => syncController.sync(req, res));

// US-05
router.post('/schedules/generate', (req, res) => scheduleController.generate(req, res));

// US-07
router.get('/students/:studentId/criticality', (req, res) => criticalSubjectController.getCriticality(req, res));

// US-10 & US-11
router.patch('/swaps/confirm', (req, res) => swapController.confirm(req, res));
router.post('/swaps/formalize', (req, res) => swapController.formalize(req, res));
router.post('/swaps/reject', (req, res) => swapController.reject(req, res));


// US-12
router.post('/marketplace/offers', (req, res) => marketplaceController.publish(req, res));
router.get('/marketplace/courses/:courseId/offers', (req, res) => marketplaceController.getOffersByCourse(req, res));
router.post('/marketplace/offers/:offerId/interests', (req, res) => marketplaceController.interest(req, res));

app.use('/api', router);

// SEEDING: Datos de prueba para que Santiago pueda probar Swaps (US-10 y US-11) inmediatamente
const seedMatch = async () => {
  const dummyMatch: SwapMatch = {
    matchId: 'SW-98235-RUIZ',
    status: 'PENDIENTE_CONFIRMACION',
    studentA: {
      id: 'santiago-123',
      delivers: 'SEC-MAT101-A',
      receives: 'SEC-PROG101-B',
      confirmed: false
    },
    studentB: {
      id: 'roberto-martinez',
      delivers: 'SEC-PROG101-B',
      receives: 'SEC-MAT101-A',
      confirmed: false
    },
    improvementA: 15.5,
    improvementB: 12.2,
    systemSafetyHash: 'SAFE-8823-X',
    createdAt: new Date()
  };

  // Seed para US-11 (Inscripciones oficiales en el SIA)
  (enrollmentSystem as any).addEnrollment({
    enrollmentId: 'SEC-FIS101-A',
    studentId: 'santiago-123',
    courseId: 'FIS101',
    sectionId: 'A',
    status: 'ACTIVO'
  });
  (enrollmentSystem as any).addEnrollment({
    enrollmentId: 'SEC-MAT102-B',
    studentId: 'elena-garcia',
    courseId: 'MAT102',
    sectionId: 'B',
    status: 'ACTIVO'
  });

  const dummyMatch2: SwapMatch = {
    matchId: 'SW-98234-MART',
    status: 'APROBADO',
    studentA: {
      id: 'santiago-123',
      delivers: 'SEC-FIS101-A',
      receives: 'SEC-MAT102-B',
      confirmed: true
    },
    studentB: {
      id: 'elena-garcia',
      delivers: 'SEC-MAT102-B',
      receives: 'SEC-FIS101-A',
      confirmed: true
    },
    improvementA: 20.1,
    improvementB: 18.5,
    systemSafetyHash: 'SAFE-9941-Z',
    createdAt: new Date()
  };


  await swapRepo.saveMatch(dummyMatch);
  await swapRepo.saveMatch(dummyMatch2);
  console.log('[Seed] Datos de prueba inyectados: Match SW-98235-RUIZ y SW-98234-MART listos.');
};



seedMatch();

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`[Server] Corriendo en puerto ${PORT}`);
  console.log(`[CORS] Permitido para http://localhost:5173`);
});


