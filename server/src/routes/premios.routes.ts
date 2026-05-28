import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, isAdmin } from '../middlewares/auth';

const router = Router();

router.get('/activos', authenticateToken, async (req, res) => {
  try {
    const premios = await prisma.premio.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' }
    });
    res.json(premios);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const premios = await prisma.premio.findMany({
      orderBy: { orden: 'asc' }
    });
    res.json(premios);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const premio = await prisma.premio.create({ data: req.body });
    res.json(premio);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const premio = await prisma.premio.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(premio);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resultado', authenticateToken, async (req, res) => {
  const { sesion_id, premio_id } = req.body;
  try {
    const resultado = await prisma.resultadoRuleta.create({
      data: { sesionId: sesion_id, premioId: premio_id }
    });
    res.json(resultado);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
