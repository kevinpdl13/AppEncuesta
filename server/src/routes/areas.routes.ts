import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, isAdmin } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/areas:
 *   get:
 *     summary: Obtener todas las áreas (Admin)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de áreas
 */
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { trabajadores: true } }
      }
    });
    res.json(areas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/areas/activas:
 *   get:
 *     summary: Obtener áreas activas (Público/Worker)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de áreas activas
 */
router.get('/activas', async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true }
    });
    res.json(areas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del área es obligatorio.' });
  }
  try {
    const area = await prisma.area.create({
      data: { nombre: nombre.trim(), descripcion }
    });
    res.status(201).json(area);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un área con ese nombre.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const area = await prisma.area.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(area);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Verificar si tiene trabajadores asignados
    const count = await prisma.trabajador.count({
      where: { areaId: req.params.id as string }
    });
    if (count > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: el área tiene ${count} trabajador(es) asignado(s). Reasigna los trabajadores primero.`
      });
    }
    await prisma.area.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
