import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middlewares/auth';
import { PreguntasController } from '../controllers/preguntas.controller';

const router = Router();

/**
 * @swagger
 * /api/preguntas:
 *   get:
 *     summary: Obtener todas las preguntas con filtros (Admin)
 *     tags: [Preguntas]
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           enum: [VERDADERO_FALSO, LIKERT_3]
 *       - in: query
 *         name: grupo_id
 *       - in: query
 *         name: sub_grupo_id
 *       - in: query
 *         name: encuesta_config_id
 *       - in: query
 *         name: tema_id
 */
router.get('/', authenticateToken, isAdmin, PreguntasController.getPreguntas);

/**
 * @swagger
 * /api/preguntas/tema/{temaId}:
 *   get:
 *     summary: Obtener preguntas activas por tema legacy (Worker)
 *     tags: [Preguntas]
 */
router.get('/tema/:temaId', authenticateToken, PreguntasController.getPreguntasByTema);

/**
 * @swagger
 * /api/preguntas/encuesta-config/{configId}:
 *   get:
 *     summary: Obtener preguntas activas de una EncuestaConfig (Worker)
 *     tags: [Preguntas]
 *     description: Retorna preguntas planas en orden de respuesta. No expone respuestaCorrecta.
 */
router.get('/encuesta-config/:configId', PreguntasController.getPreguntasByEncuestaConfig);

router.post('/', authenticateToken, isAdmin, PreguntasController.postPregunta);

router.put('/:id', authenticateToken, isAdmin, PreguntasController.putPregunta);

router.delete('/:id', authenticateToken, isAdmin, PreguntasController.deletePregunta);

export default router;
