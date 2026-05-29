import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middlewares/auth';
import { PeriodosController } from '../controllers/periodos.controller';

const router = Router();

/**
 * @swagger
 * /api/periodos:
 *   get:
 *     summary: Obtener todos los períodos con sus configs (Admin)
 *     tags: [Periodos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, isAdmin, PeriodosController.getPeriodos);

// OBTENER TODOS LOS PERÍODOS ACTIVOS/VIGENTES (Público para Workers)
router.get('/activos', PeriodosController.getActivos);

/**
 * @swagger
 * /api/periodos/vigente:
 *   get:
 *     summary: Obtener el período activo actual con sus encuestas (Worker)
 *     tags: [Periodos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/vigente', PeriodosController.getVigente);

router.post('/', authenticateToken, isAdmin, PeriodosController.postPeriodo);

router.put('/:id', authenticateToken, isAdmin, PeriodosController.putPeriodo);

router.delete('/:id', authenticateToken, isAdmin, PeriodosController.deletePeriodo);

// ENCUESTA CONFIGS dentro de un período

/**
 * @swagger
 * /api/periodos/{periodoId}/configs:
 *   post:
 *     summary: Crear una configuración de encuesta en un período (Admin)
 *     tags: [Periodos]
 */
router.post('/:periodoId/configs', authenticateToken, isAdmin, PeriodosController.postEncuestaConfig);

router.put('/:periodoId/configs/:configId', authenticateToken, isAdmin, PeriodosController.putEncuestaConfig);

router.delete('/:periodoId/configs/:configId', authenticateToken, isAdmin, PeriodosController.deleteEncuestaConfig);

export default router;
