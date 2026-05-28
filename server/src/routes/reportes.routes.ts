import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, isAdmin } from '../middlewares/auth';

const router = Router();

router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [sesiones, trabajadoresCount, preguntasCount, temasCount] = await Promise.all([
      prisma.sesionEncuesta.findMany({ select: { id: true, puntajeTotal: true } }),
      prisma.trabajador.count({ where: { activo: true } }),
      prisma.pregunta.count({ where: { activo: true } }),
      prisma.tema.count({ where: { activo: true } }),
    ]);

    const totalEncuestados = sesiones.length;
    const promedioPuntos = totalEncuestados > 0
      ? Math.round(sesiones.reduce((sum, s) => sum + s.puntajeTotal, 0) / totalEncuestados)
      : 0;

    res.json({
      totalTrabajadoresActivos: trabajadoresCount,
      totalEncuestados,
      promedioPuntos,
      totalPreguntasActivas: preguntasCount,
      totalTemasActivos: temasCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ranking', authenticateToken, isAdmin, async (req, res) => {
  try {
    const sessions = await prisma.sesionEncuesta.findMany({
      include: {
        tema: { select: { titulo: true } },
        trabajador: { select: { id: true, nombres: true, apellidos: true, cedula: true, area: true } },
        resultado: { include: { premio: { select: { nombre: true } } } }
      },
      orderBy: { puntajeTotal: 'desc' }
    });

    // Format to match old Supabase response structure if needed by frontend
    const formatted = sessions.map(s => ({
      puntaje_total: s.puntajeTotal,
      fecha_inicio: s.fechaInicio,
      temas: s.tema,
      trabajadores: s.trabajador,
      resultados_ruleta: s.resultado ? { premios: s.resultado.premio } : null
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
