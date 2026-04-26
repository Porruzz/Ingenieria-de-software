import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { CryptoService } from './infrastructure/security/crypto-service';
import { RedisService } from './infrastructure/cache/redis-service';
import { PostgresTimeBlockRepository } from './infrastructure/database/postgres-time-block-repository';
import { PostgresStudentRepository } from './infrastructure/database/postgres-student-repository';
import { ManageTimeBlocksUseCase } from './application/use-cases/manage-time-blocks';
import { UpdateStudentLogisticsUseCase } from './application/use-cases/update-student-logistics';
import { TimeBlockController } from './interfaces/controllers/time-block-controller';
import { StudentController } from './interfaces/controllers/student-controller';
import { CriticalSubjectController } from './interfaces/controllers/critical-subject-controller';
import { MarketplaceController } from './interfaces/controllers/marketplace-controller';
import { CalculateCriticalityUseCase } from './application/use-cases/calculate-criticality.use-case';
import { PublishOfferUseCase } from './application/use-cases/publish-offer.use-case';
import { RegisterInterestUseCase } from './application/use-cases/register-interest.use-case';
import { ValidatePrerequisites } from './application/use-cases/validate-prerequisites';
import { InMemoryCriticalSubjectRepository } from './infrastructure/repositories/in-memory-critical-subject.repository';
import { InMemoryMarketplaceRepository } from './infrastructure/repositories/in-memory-marketplace.repository';
import { InMemoryEnrollmentSystemAdapter } from './infrastructure/adapters/in-memory-enrollment-system.adapter';
import { ConsoleNotificationService } from './infrastructure/services/console-notification.service';
import { InMemoryPrerequisiteRepository } from './infrastructure/repositories/prerequisite.repository';
import { EncryptedAcademicRepository } from './infrastructure/repositories/academic.repository';

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
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

const timeBlockRepo = new PostgresTimeBlockRepository(pool, cryptoService);
const manageTimeBlocksUseCase = new ManageTimeBlocksUseCase(timeBlockRepo, redisService);
const timeBlockController = new TimeBlockController(manageTimeBlocksUseCase);

const studentRepo = new PostgresStudentRepository(pool);
const updateStudentLogisticsUseCase = new UpdateStudentLogisticsUseCase(studentRepo, redisService);
const studentController = new StudentController(updateStudentLogisticsUseCase);

// US-07 & US-12 Shared dependencies
const prereqRepo = new InMemoryPrerequisiteRepository();
const academicRepo = new EncryptedAcademicRepository(cryptoService);
const validatePrerequisitesUseCase = new ValidatePrerequisites(academicRepo, prereqRepo);

// US-07 Setup
const criticalSubjectRepo = new InMemoryCriticalSubjectRepository();
const calculateCriticalityUseCase = new CalculateCriticalityUseCase(criticalSubjectRepo, prereqRepo);
const criticalSubjectController = new CriticalSubjectController(calculateCriticalityUseCase);

// US-12 Setup
const marketplaceRepo = new InMemoryMarketplaceRepository();
const enrollmentSystem = new InMemoryEnrollmentSystemAdapter();
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

router.post('/students/:studentId/time-blocks', (req, res) => timeBlockController.createBlock(req, res));
router.get('/students/:studentId/time-blocks', (req, res) => timeBlockController.getBlocks(req, res));
router.put('/students/:studentId/time-blocks/:blockId', (req, res) => timeBlockController.updateBlock(req, res));
router.delete('/students/:studentId/time-blocks/:blockId', (req, res) => timeBlockController.deleteBlock(req, res));

router.put('/students/:studentId/logistics', (req, res) => studentController.updateLogistics(req, res));

// US-07 Routes
router.get('/students/:studentId/criticality', (req, res) => criticalSubjectController.getCriticality(req, res));

// US-12 Routes
router.post('/marketplace/offers', (req, res) => marketplaceController.publish(req, res));
router.get('/marketplace/courses/:courseId/offers', (req, res) => marketplaceController.getOffersByCourse(req, res));
router.post('/marketplace/offers/:offerId/interests', (req, res) => marketplaceController.interest(req, res));

app.use('/api', router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Corriendo en puerto ${PORT}`);
});

