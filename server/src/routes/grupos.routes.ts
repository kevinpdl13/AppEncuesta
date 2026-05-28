import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, isAdmin } from '../middlewares/auth';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GRUPOS
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/grupos/config/{configId}:
 *   get:
 *     summary: Obtener grupos con subgrupos y preguntas de una config (Admin/Worker)
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/config/:configId', authenticateToken, async (req, res) => {
  try {
    const grupos = await prisma.grupo.findMany({
      where: { encuestaConfigId: req.params.configId as string },
      orderBy: { orden: 'asc' },
      include: {
        subGrupos: {
          orderBy: { orden: 'asc' },
          include: {
            preguntas: {
              where: { activo: true },
              orderBy: { orden: 'asc' },
              select: {
                id: true,
                enunciado: true,
                tipoPregunta: true,
                orden: true,
                // respuestaCorrecta no se expone al worker
              }
            }
          }
        },
        // Preguntas directas en el grupo sin subgrupo
        preguntas: {
          where: { activo: true, subGrupoId: null },
          orderBy: { orden: 'asc' },
          select: {
            id: true,
            enunciado: true,
            tipoPregunta: true,
            orden: true
          }
        }
      }
    });
    res.json(grupos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/grupos:
 *   post:
 *     summary: Crear un grupo dentro de una EncuestaConfig (Admin)
 *     tags: [Grupos]
 */
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const { encuestaConfigId, nombre, descripcion, orden } = req.body;
  if (!encuestaConfigId || !nombre?.trim()) {
    return res.status(400).json({ error: 'encuestaConfigId y nombre son obligatorios.' });
  }
  try {
    const grupo = await prisma.grupo.create({
      data: {
        encuestaConfigId,
        nombre: nombre.trim(),
        descripcion,
        orden: orden ?? 0
      }
    });
    res.status(201).json(grupo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const grupo = await prisma.grupo.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(grupo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.grupo.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// SUBGRUPOS (anidados bajo grupos)
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/grupos/{grupoId}/subgrupos:
 *   post:
 *     summary: Crear un subgrupo dentro de un grupo (Admin)
 *     tags: [Grupos]
 */
router.post('/:grupoId/subgrupos', authenticateToken, isAdmin, async (req, res) => {
  const { nombre, orden } = req.body;
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del subgrupo es obligatorio.' });
  }
  try {
    const subGrupo = await prisma.subGrupo.create({
      data: {
        grupoId: req.params.grupoId as string,
        nombre: nombre.trim(),
        orden: orden ?? 0
      }
    });
    res.status(201).json(subGrupo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/subgrupos/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const subGrupo = await prisma.subGrupo.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(subGrupo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/subgrupos/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.subGrupo.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
