import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, isAdmin } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/temas/activos:
 *   get:
 *     summary: Obtener temas activos (Público/Worker)
 *     tags: [Temas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de temas activos
 */
router.get('/activos', authenticateToken, async (req, res) => {
  try {
    const temas = await prisma.tema.findMany({
      where: { activo: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(temas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/temas:
 *   get:
 *     summary: Obtener todos los temas (Admin)
 *     tags: [Temas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los temas
 */
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const temas = await prisma.tema.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(temas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const tema = await prisma.tema.create({ data: req.body });
    res.json(tema);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const tema = await prisma.tema.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(tema);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.tema.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'No se puede eliminar: el tema tiene preguntas asociadas.' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
