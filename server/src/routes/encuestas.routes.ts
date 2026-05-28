import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, isAdmin } from '../middlewares/auth';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();

// ─────────────────────────────────────────────────────────────
// CREAR SESIÓN (Evaluación o Anónima)
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/encuestas/sesion:
 *   post:
 *     summary: Crear sesión de encuesta de EVALUACION (con trabajador) o ANÓNIMA (sin identificación)
 *     tags: [Encuestas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [EVALUACION, ANONIMA]
 *               trabajador_id:
 *                 type: string
 *                 description: Solo requerido si tipo=EVALUACION
 *               encuesta_config_id:
 *                 type: string
 *               periodo_id:
 *                 type: string
 *               tema_id:
 *                 type: string
 *                 description: Legacy v1.0
 *               puntaje_total:
 *                 type: number
 *               respuestas:
 *                 type: array
 */
router.post('/sesion', async (req: any, res: any) => {
  const {
    tipo = 'EVALUACION',
    trabajador_id,
    encuesta_config_id,
    periodo_id,
    tema_id,
    puntaje_total = 0,
    fecha_fin,
    respuestas,
    area_id,
    areaId
  } = req.body;

  // Si es evaluación, requiere token de autenticación obligatorio
  if (tipo !== 'ANONIMA') {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado para la evaluación.' });
    }
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      req.user = decoded;
      // Validar que el token corresponda al trabajador_id enviado por seguridad
      if (req.user.id !== trabajador_id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso no autorizado para este trabajador.' });
      }
    } catch (err) {
      return res.status(403).json({ error: 'Token inválido o expirado para la evaluación.' });
    }
  }

  // Guardar: EVALUACION requiere trabajador_id
  if (tipo === 'EVALUACION' && !trabajador_id) {
    return res.status(400).json({ error: 'Las encuestas de EVALUACION requieren trabajador_id.' });
  }

  // Guardar: ANONIMA no debe recibir trabajador_id
  if (tipo === 'ANONIMA' && trabajador_id) {
    return res.status(400).json({ error: 'Las encuestas ANÓNIMAS no deben incluir trabajador_id.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Para EVALUACION: verificar que el trabajador no haya respondido esta config en este período
      if (tipo === 'EVALUACION' && encuesta_config_id && periodo_id) {
        const sesionExistente = await tx.sesionEncuesta.findFirst({
          where: {
            trabajadorId: trabajador_id,
            encuestaConfigId: encuesta_config_id,
            periodoId: periodo_id
          }
        });
        if (sesionExistente) {
          throw new Error('DUPLICATE_SESION: El trabajador ya respondió esta encuesta en el período actual.');
        }
      }

      // Crear sesión — anon_token solo para ANONIMA
      const sesion = await tx.sesionEncuesta.create({
        data: {
          trabajadorId: tipo === 'EVALUACION' ? trabajador_id : null,
          temaId: tema_id ?? null,
          periodoId: periodo_id ?? null,
          encuestaConfigId: encuesta_config_id ?? null,
          anonToken: tipo === 'ANONIMA' ? randomUUID() : null,
          areaId: area_id ?? areaId ?? null,
          puntajeTotal: puntaje_total,
          fechaFin: fecha_fin ? new Date(fecha_fin) : null
        }
      });

      // Guardar respuestas si vienen en el mismo request
      if (respuestas && Array.isArray(respuestas) && respuestas.length > 0) {
        await tx.respuesta.createMany({
          data: respuestas.map((r: any) => ({
            sesionId: sesion.id,
            preguntaId: r.pregunta_id,
            respuestaDada: r.respuesta_dada ?? null,       // null para Likert
            valorNumerico: r.valor_numerico ?? null,        // 1,2,3 para Likert
            esCorrecta: r.es_correcta ?? false,
            puntosObtenidos: r.puntos_obtenidos ?? 0
          }))
        });
      }

      return sesion;
    });

    res.json(result);
  } catch (err: any) {
    if (err.message?.startsWith('DUPLICATE_SESION')) {
      return res.status(409).json({ error: err.message.replace('DUPLICATE_SESION: ', '') });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// VERIFICAR SI TRABAJADOR YA RESPONDIÓ EN EL PERÍODO
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/encuestas/verificar:
 *   get:
 *     summary: Verificar si un trabajador ya respondió una encuesta config en un período
 *     tags: [Encuestas]
 *     parameters:
 *       - in: query
 *         name: trabajador_id
 *       - in: query
 *         name: encuesta_config_id
 *       - in: query
 *         name: periodo_id
 */
router.get('/verificar', authenticateToken, async (req, res) => {
  const { trabajador_id, encuesta_config_id, periodo_id } = req.query;
  if (!trabajador_id || !encuesta_config_id || !periodo_id) {
    return res.status(400).json({ error: 'Parámetros requeridos: trabajador_id, encuesta_config_id, periodo_id.' });
  }
  try {
    const sesion = await prisma.sesionEncuesta.findFirst({
      where: {
        trabajadorId: trabajador_id as string,
        encuestaConfigId: encuesta_config_id as string,
        periodoId: periodo_id as string
      },
      select: { id: true, createdAt: true }
    });
    res.json({ yaRespondio: !!sesion, sesion: sesion ?? null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// HISTORIAL (Admin) — con filtros opcionales
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/encuestas/historial:
 *   get:
 *     summary: Historial de sesiones (Admin) con filtros opcionales
 *     tags: [Encuestas]
 *     parameters:
 *       - in: query
 *         name: periodo_id
 *       - in: query
 *         name: tipo
 *         schema:
 *           enum: [EVALUACION, ANONIMA]
 *       - in: query
 *         name: area_id
 */
router.get('/historial', authenticateToken, isAdmin, async (req, res) => {
  const { periodo_id, tipo, area_id } = req.query;
  try {
    const sesiones = await prisma.sesionEncuesta.findMany({
      where: {
        ...(periodo_id ? { periodoId: periodo_id as string } : {}),
        ...(tipo ? { encuestaConfig: { tipo: tipo as any } } : {}),
        ...(area_id ? { trabajador: { areaId: area_id as string } } : {})
      },
      include: {
        trabajador: {
          select: { nombres: true, apellidos: true, cedula: true, area: true, areaRel: { select: { nombre: true } } }
        },
        encuestaConfig: { select: { nombre: true, tipo: true } },
        periodo: { select: { nombre: true } },
        tema: { select: { titulo: true } },
        _count: { select: { respuestas: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 300
    });
    res.json(sesiones);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// HISTORIAL DE RESPUESTAS INDIVIDUALES (Admin)
// ─────────────────────────────────────────────────────────────
router.get('/respuestas', authenticateToken, isAdmin, async (req, res) => {
  try {
    const respuestas = await prisma.respuesta.findMany({
      include: {
        pregunta: {
          select: { enunciado: true }
        },
        sesion: {
          include: {
            trabajador: {
              select: { nombres: true, apellidos: true, cedula: true, area: true }
            },
            tema: {
              select: { titulo: true }
            },
            encuestaConfig: {
              select: { nombre: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    // Formatear para que coincida con lo que espera RespuestasPage.tsx
    const formatted = respuestas.map(r => ({
      id: r.id,
      es_correcta: r.esCorrecta,
      puntos_obtenidos: r.puntosObtenidos,
      created_at: r.createdAt.toISOString(),
      preguntas: {
        enunciado: r.pregunta.enunciado
      },
      encuestas_sesiones: {
        fecha_inicio: r.sesion.fechaInicio.toISOString(),
        puntaje_total: r.sesion.puntajeTotal,
        // Usar tema.titulo o config.nombre por compatibilidad
        temas: {
          titulo: r.sesion.tema?.titulo ?? r.sesion.encuestaConfig?.nombre ?? 'Sin Encuesta Asignada'
        },
        trabajadores: r.sesion.trabajador ? {
          nombres: r.sesion.trabajador.nombres,
          apellidos: r.sesion.trabajador.apellidos,
          cedula: r.sesion.trabajador.cedula,
          area: r.sesion.trabajador.area
        } : null
      }
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
