import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, isAdmin } from '../middlewares/auth';

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
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  const { tipo, grupo_id, sub_grupo_id, encuesta_config_id, tema_id } = req.query;
  try {
    const preguntas = await prisma.pregunta.findMany({
      where: {
        ...(tipo ? { tipoPregunta: tipo as any } : {}),
        ...(grupo_id ? { grupoId: grupo_id as string } : {}),
        ...(sub_grupo_id ? { subGrupoId: sub_grupo_id as string } : {}),
        ...(encuesta_config_id ? { encuestaConfigId: encuesta_config_id as string } : {}),
        ...(tema_id ? { temaId: tema_id as string } : {})
      },
      include: {
        tema: { select: { titulo: true } },
        grupo: { select: { nombre: true } },
        subGrupo: { select: { nombre: true } }
      },
      orderBy: [{ grupoId: 'asc' }, { subGrupoId: 'asc' }, { orden: 'asc' }]
    });
    const mapped = preguntas.map(p => ({
      ...p,
      respuesta_correcta: p.respuestaCorrecta
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/preguntas/tema/{temaId}:
 *   get:
 *     summary: Obtener preguntas activas por tema legacy (Worker)
 *     tags: [Preguntas]
 */
router.get('/tema/:temaId', authenticateToken, async (req, res) => {
  try {
    const preguntas = await prisma.pregunta.findMany({
      where: { temaId: req.params.temaId as string, activo: true },
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        enunciado: true,
        tipoPregunta: true,
        puntos: true,
        orden: true
        // No exponer respuestaCorrecta al worker
      }
    });
    res.json(preguntas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/preguntas/encuesta-config/{configId}:
 *   get:
 *     summary: Obtener preguntas activas de una EncuestaConfig (Worker)
 *     tags: [Preguntas]
 *     description: Retorna preguntas planas en orden de respuesta. No expone respuestaCorrecta.
 */
router.get('/encuesta-config/:configId', async (req, res) => {
  try {
    const preguntas = await prisma.pregunta.findMany({
      where: {
        encuestaConfigId: req.params.configId as string,
        activo: true
      },
      orderBy: [{ grupoId: 'asc' }, { subGrupoId: 'asc' }, { orden: 'asc' }],
      select: {
        id: true,
        enunciado: true,
        tipoPregunta: true,
        puntos: true,
        orden: true,
        grupoId: true,
        subGrupoId: true,
        grupo: { select: { nombre: true } },
        subGrupo: { select: { nombre: true } },
        respuestaCorrecta: true
      }
    });
    const mapped = preguntas.map(p => ({
      ...p,
      respuesta_correcta: p.respuestaCorrecta
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const {
    enunciado,
    respuestaCorrecta,
    puntos,
    temaId,
    tipoPregunta,
    grupoId,
    subGrupoId,
    encuestaConfigId,
    orden
  } = req.body;

  if (!enunciado?.trim()) {
    return res.status(400).json({ error: 'El enunciado es obligatorio.' });
  }
  if (tipoPregunta === 'VERDADERO_FALSO' && respuestaCorrecta === undefined) {
    return res.status(400).json({ error: 'Las preguntas V/F requieren respuestaCorrecta.' });
  }

  try {
    const pregunta = await prisma.pregunta.create({
      data: {
        enunciado: enunciado.trim(),
        respuestaCorrecta: tipoPregunta === 'VERDADERO_FALSO' ? respuestaCorrecta : null,
        puntos: puntos ?? 10,
        temaId: temaId ?? null,
        tipoPregunta: tipoPregunta ?? 'VERDADERO_FALSO',
        grupoId: grupoId ?? null,
        subGrupoId: subGrupoId ?? null,
        encuestaConfigId: encuestaConfigId ?? null,
        orden: orden ?? 0
      }
    });
    res.status(201).json(pregunta);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  const {
    enunciado,
    respuestaCorrecta,
    puntos,
    temaId,
    tipoPregunta,
    grupoId,
    subGrupoId,
    encuestaConfigId,
    orden,
    activo
  } = req.body;

  try {
    const data: any = {};
    if (enunciado !== undefined) data.enunciado = enunciado?.trim();
    if (respuestaCorrecta !== undefined) data.respuestaCorrecta = respuestaCorrecta;
    if (puntos !== undefined) data.puntos = puntos;
    if (temaId !== undefined) data.temaId = temaId;
    if (tipoPregunta !== undefined) data.tipoPregunta = tipoPregunta;
    if (grupoId !== undefined) data.grupoId = grupoId;
    if (subGrupoId !== undefined) data.subGrupoId = subGrupoId;
    if (encuestaConfigId !== undefined) data.encuestaConfigId = encuestaConfigId;
    if (orden !== undefined) data.orden = orden;
    if (activo !== undefined) data.activo = activo;

    const pregunta = await prisma.pregunta.update({
      where: { id: req.params.id as string },
      data
    });
    res.json(pregunta);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.pregunta.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: 'No se puede eliminar: la pregunta ya tiene respuestas registradas. Desactívala en su lugar.'
      });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
