import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, isAdmin } from '../middlewares/auth';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Helper: Calcula si un período está activo según sus fechas
// ─────────────────────────────────────────────────────────────
function isPeriodoVigente(periodo: { fechaInicio: Date; fechaFin: Date | null; activo: boolean }) {
  if (!periodo.activo) return false;
  const now = new Date();
  if (now < periodo.fechaInicio) return false;
  if (periodo.fechaFin && now > periodo.fechaFin) return false;
  return true;
}

/**
 * @swagger
 * /api/periodos:
 *   get:
 *     summary: Obtener todos los períodos con sus configs (Admin)
 *     tags: [Periodos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const periodos = await prisma.periodo.findMany({
      orderBy: { fechaInicio: 'desc' },
      include: {
        encuestaConfigs: {
          select: { id: true, nombre: true, tipo: true, activo: true, escalaLabels: true }
        },
        _count: { select: { sesiones: true } }
      }
    });

    // Enriquecer con estado de vigencia calculado
    const enriched = periodos.map(p => ({
      ...p,
      vigente: isPeriodoVigente(p)
    }));

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// OBTENER TODOS LOS PERÍODOS ACTIVOS/VIGENTES (Público para Workers)
// ─────────────────────────────────────────────────────────────
router.get('/activos', async (req, res) => {
  try {
    const periodos = await prisma.periodo.findMany({
      where: {
        activo: true
      },
      orderBy: { fechaInicio: 'desc' },
      include: {
        encuestaConfigs: {
          where: { activo: true },
          select: { id: true, nombre: true, tipo: true, escalaLabels: true }
        }
      }
    });
    res.json(periodos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/periodos/vigente:
 *   get:
 *     summary: Obtener el período activo actual con sus encuestas (Worker)
 *     tags: [Periodos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/vigente', async (req, res) => {
  try {
    const now = new Date();
    const periodo = await prisma.periodo.findFirst({
      where: {
        activo: true,
        fechaInicio: { lte: now },
        OR: [
          { fechaFin: null },
          { fechaFin: { gte: now } }
        ]
      },
      orderBy: { fechaInicio: 'desc' },
      include: {
        encuestaConfigs: {
          where: { activo: true },
          select: { id: true, nombre: true, tipo: true, escalaLabels: true }
        }
      }
    });

    if (!periodo) {
      return res.status(404).json({ error: 'No hay un período de encuestas activo en este momento.' });
    }

    res.json(periodo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const { nombre, descripcion, fechaInicio, fechaFin } = req.body;
  if (!nombre?.trim() || !fechaInicio) {
    return res.status(400).json({ error: 'nombre y fechaInicio son obligatorios.' });
  }
  try {
    const periodo = await prisma.periodo.create({
      data: {
        nombre: nombre.trim(),
        descripcion,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null
      }
    });
    res.status(201).json(periodo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  const { nombre, descripcion, fechaInicio, fechaFin, activo } = req.body;
  try {
    const periodo = await prisma.periodo.update({
      where: { id: req.params.id as string },
      data: {
        nombre,
        descripcion,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        activo
      }
    });
    res.json(periodo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const count = await prisma.sesionEncuesta.count({
      where: { periodoId: req.params.id as string }
    });
    if (count > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: el período tiene ${count} sesión(es) registrada(s).`
      });
    }
    await prisma.periodo.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ENCUESTA CONFIGS dentro de un período
// ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/periodos/{periodoId}/configs:
 *   post:
 *     summary: Crear una configuración de encuesta en un período (Admin)
 *     tags: [Periodos]
 */
router.post('/:periodoId/configs', authenticateToken, isAdmin, async (req, res) => {
  const { nombre, tipo, escalaLabels } = req.body;
  if (!nombre?.trim() || !tipo) {
    return res.status(400).json({ error: 'nombre y tipo son obligatorios.' });
  }
  if (!['ANONIMA', 'EVALUACION'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser ANONIMA o EVALUACION.' });
  }
  try {
    // Verificar duplicado de tipo en el mismo período
    const existing = await prisma.encuestaConfig.findFirst({
      where: { periodoId: req.params.periodoId as string, tipo: tipo as any, activo: true }
    });
    if (existing) {
      return res.status(409).json({
        error: `Ya existe una encuesta de tipo ${tipo} activa en este período.`
      });
    }

    const config = await prisma.encuestaConfig.create({
      data: {
        periodoId: req.params.periodoId as string,
        nombre: nombre.trim(),
        tipo: tipo as any,
        escalaLabels: escalaLabels ? JSON.stringify(escalaLabels) : '["Nunca","A veces","Siempre"]'
      }
    });
    res.status(201).json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:periodoId/configs/:configId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const config = await prisma.encuestaConfig.update({
      where: { id: req.params.configId as string },
      data: {
        nombre: req.body.nombre,
        escalaLabels: req.body.escalaLabels ? JSON.stringify(req.body.escalaLabels) : undefined,
        activo: req.body.activo
      }
    });
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:periodoId/configs/:configId', authenticateToken, isAdmin, async (req, res) => {
  try {
    await prisma.encuestaConfig.delete({
      where: {
        id: req.params.configId as string,
        periodoId: req.params.periodoId as string
      }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
