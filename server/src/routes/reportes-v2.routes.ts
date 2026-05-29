import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middlewares/auth';
import { ReportesV2Controller } from '../controllers/reportes-v2.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────
// REPORTE 1: Dashboard KPI por período
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/reportes-v2/periodo/{periodoId}/kpi:
 *   get:
 *     summary: KPIs generales de un período (Admin)
 *     tags: [ReportesV2]
 *     security:
 *       - bearerAuth: []
 */
router.get('/periodo/:periodoId/kpi', authenticateToken, isAdmin, ReportesV2Controller.getKpi);

// ─────────────────────────────────────────────────────────────
// REPORTE 2: Encuesta ANÓNIMA — tabla tipo imagen de referencia
// Filas: N° | Grupo | Sub-grupo | Pregunta | Mala | Buena | Muy buena | %
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/reportes-v2/periodo/{periodoId}/anonimo:
 *   get:
 *     summary: Reporte tabla anónima por grupo/subgrupo (como imagen referencia)
 *     tags: [ReportesV2]
 *     parameters:
 *       - in: query
 *         name: encuesta_config_id
 *         required: true
 */
router.get('/periodo/:periodoId/anonimo', authenticateToken, isAdmin, ReportesV2Controller.getAnonimo);

// ─────────────────────────────────────────────────────────────
// REPORTE 3: Encuesta de EVALUACION — por área y persona
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/reportes-v2/periodo/{periodoId}/evaluacion:
 *   get:
 *     summary: Reporte de evaluación por área/persona (Admin)
 *     tags: [ReportesV2]
 *     parameters:
 *       - in: query
 *         name: area_id
 *       - in: query
 *         name: encuesta_config_id
 */
router.get('/periodo/:periodoId/evaluacion', authenticateToken, isAdmin, ReportesV2Controller.getEvaluacion);

// ─────────────────────────────────────────────────────────────
// REPORTE 4: Tendencia por área (gráfico de barras agrupadas)
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/reportes-v2/tendencia-areas:
 *   get:
 *     summary: Promedio de respuestas correctas por área en todos los períodos
 *     tags: [ReportesV2]
 */
router.get('/tendencia-areas', authenticateToken, isAdmin, ReportesV2Controller.getTendencia);

export default router;
