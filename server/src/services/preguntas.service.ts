import prisma from '../lib/prisma';

export class PreguntasService {
  static async getPreguntas(filters: {
    tipo?: string;
    grupo_id?: string;
    sub_grupo_id?: string;
    encuesta_config_id?: string;
    tema_id?: string;
  }) {
    const preguntas = await prisma.pregunta.findMany({
      where: {
        ...(filters.tipo ? { tipoPregunta: filters.tipo as any } : {}),
        ...(filters.grupo_id ? { grupoId: filters.grupo_id } : {}),
        ...(filters.sub_grupo_id ? { subGrupoId: filters.sub_grupo_id } : {}),
        ...(filters.encuesta_config_id ? { encuestaConfigId: filters.encuesta_config_id } : {}),
        ...(filters.tema_id ? { temaId: filters.tema_id } : {})
      },
      include: {
        tema: { select: { titulo: true } },
        grupo: { select: { nombre: true } },
        subGrupo: { select: { nombre: true } }
      },
      orderBy: [{ grupoId: 'asc' }, { subGrupoId: 'asc' }, { orden: 'asc' }]
    });

    return preguntas.map(p => ({
      ...p,
      respuesta_correcta: p.respuestaCorrecta
    }));
  }

  static async getPreguntasByTema(temaId: string) {
    return prisma.pregunta.findMany({
      where: { temaId, activo: true },
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        enunciado: true,
        tipoPregunta: true,
        puntos: true,
        orden: true
      }
    });
  }

  static async getPreguntasByEncuestaConfig(configId: string) {
    const preguntas = await prisma.pregunta.findMany({
      where: {
        encuestaConfigId: configId,
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

    return preguntas.map(p => ({
      ...p,
      respuesta_correcta: p.respuestaCorrecta
    }));
  }

  static async crearPregunta(data: {
    enunciado: string;
    tipoPregunta?: 'VERDADERO_FALSO' | 'LIKERT_3';
    respuestaCorrecta?: boolean | null;
    puntos?: number;
    temaId?: string | null;
    grupoId?: string | null;
    subGrupoId?: string | null;
    encuestaConfigId?: string | null;
    orden?: number;
  }) {
    if (!data.enunciado?.trim()) {
      throw new Error('El enunciado es obligatorio.');
    }
    if (data.tipoPregunta === 'VERDADERO_FALSO' && data.respuestaCorrecta === undefined) {
      throw new Error('Las preguntas V/F requieren respuestaCorrecta.');
    }

    return prisma.pregunta.create({
      data: {
        enunciado: data.enunciado.trim(),
        respuestaCorrecta: data.tipoPregunta === 'VERDADERO_FALSO' ? data.respuestaCorrecta : null,
        puntos: data.puntos ?? 10,
        temaId: data.temaId ?? null,
        tipoPregunta: data.tipoPregunta ?? 'VERDADERO_FALSO',
        grupoId: data.grupoId ?? null,
        subGrupoId: data.subGrupoId ?? null,
        encuestaConfigId: data.encuestaConfigId ?? null,
        orden: data.orden ?? 0
      }
    });
  }

  static async actualizarPregunta(id: string, data: {
    enunciado?: string;
    respuestaCorrecta?: boolean | null;
    puntos?: number;
    temaId?: string | null;
    tipoPregunta?: 'VERDADERO_FALSO' | 'LIKERT_3';
    grupoId?: string | null;
    subGrupoId?: string | null;
    encuestaConfigId?: string | null;
    orden?: number;
    activo?: boolean;
  }) {
    const payload: any = {};
    if (data.enunciado !== undefined) payload.enunciado = data.enunciado?.trim();
    if (data.respuestaCorrecta !== undefined) payload.respuestaCorrecta = data.respuestaCorrecta;
    if (data.puntos !== undefined) payload.puntos = data.puntos;
    if (data.temaId !== undefined) payload.temaId = data.temaId;
    if (data.tipoPregunta !== undefined) payload.tipoPregunta = data.tipoPregunta;
    if (data.grupoId !== undefined) payload.grupoId = data.grupoId;
    if (data.subGrupoId !== undefined) payload.subGrupoId = data.subGrupoId;
    if (data.encuestaConfigId !== undefined) payload.encuestaConfigId = data.encuestaConfigId;
    if (data.orden !== undefined) payload.orden = data.orden;
    if (data.activo !== undefined) payload.activo = data.activo;

    return prisma.pregunta.update({
      where: { id },
      data: payload
    });
  }

  static async eliminarPregunta(id: string) {
    try {
      return await prisma.pregunta.delete({ where: { id } });
    } catch (err: any) {
      if (err.code === 'P2003') {
        throw new Error('No se puede eliminar: la pregunta ya tiene respuestas registradas. Desactívala en su lugar.');
      }
      throw err;
    }
  }
}
