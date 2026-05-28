import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, isAdmin } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/trabajadores:
 *   get:
 *     summary: Obtener todos los trabajadores (Admin)
 *     tags: [Trabajadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de trabajadores
 */
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const trabajadores = await prisma.trabajador.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(trabajadores);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const trabajador = await prisma.trabajador.create({ data: req.body });
    res.json(trabajador);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un trabajador registrado con esa cédula.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const trabajador = await prisma.trabajador.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(trabajador);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/trabajadores/{id}/respondio/{temaId}:
 *   get:
 *     summary: Verificar si un trabajador ya respondió un tema hoy
 *     tags: [Trabajadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: temaId
 *         required: true
 *     responses:
 *       200:
 *         description: Booleano indicando si respondió
 */
router.get('/:id/respondio/:temaId', authenticateToken, async (req, res) => {
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);

  try {
    const sesion = await prisma.sesionEncuesta.findFirst({
      where: {
        trabajadorId: req.params.id as string,
        temaId: req.params.temaId as string,
        fechaInicio: { gte: hoyInicio }
      }
    });
    res.json({ respondio: !!sesion });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
