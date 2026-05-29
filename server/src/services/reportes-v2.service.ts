import prisma from '../lib/prisma';

export class ReportesV2Service {
  /**
   * REPORTE 1: Dashboard KPI por período
   */
  static async getKpiData(periodoId: string) {
    const [totalAnonimas, totalEvaluaciones, totalTrabajadores] = await Promise.all([
      prisma.sesionEncuesta.count({
        where: {
          periodoId,
          encuestaConfig: { tipo: 'ANONIMA' }
        }
      }),
      prisma.sesionEncuesta.count({
        where: {
          periodoId,
          encuestaConfig: { tipo: 'EVALUACION' },
          trabajadorId: { not: null }
        }
      }),
      prisma.trabajador.count({ where: { activo: true } })
    ]);

    const participacionPct = totalTrabajadores > 0
      ? Math.round((totalEvaluaciones / totalTrabajadores) * 100)
      : 0;

    return {
      totalSesionesAnonimas: totalAnonimas,
      totalSesionesEvaluaciones: totalEvaluaciones,
      totalTrabajadoresActivos: totalTrabajadores,
      participacionEvaluacionPct: participacionPct
    };
  }

  /**
   * REPORTE 2: Encuesta ANÓNIMA
   */
  static async getAnonimoReport(periodoId: string, encuestaConfigId: string, areaId?: string) {
    const respuestas = await prisma.respuesta.findMany({
      where: {
        sesion: {
          periodoId,
          encuestaConfigId,
          ...(areaId ? { areaId } : {})
        },
        valorNumerico: { not: null },
        pregunta: { activo: true }
      },
      select: {
        valorNumerico: true,
        pregunta: {
          select: {
            id: true,
            enunciado: true,
            orden: true,
            grupo: { select: { id: true, nombre: true, orden: true } },
            subGrupo: { select: { id: true, nombre: true, orden: true } }
          }
        }
      }
    });

    const totalSesiones = await prisma.sesionEncuesta.count({
      where: {
        periodoId,
        encuestaConfigId,
        ...(areaId ? { areaId } : {})
      }
    });

    const sesionesDb = await prisma.sesionEncuesta.findMany({
      where: {
        periodoId,
        encuestaConfigId,
        ...(areaId ? { areaId } : {})
      },
      include: {
        area: { select: { nombre: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const sesiones = sesionesDb.map((s, idx) => ({
      id: s.id,
      numero: sesionesDb.length - idx,
      fecha: s.createdAt,
      area: s.area?.nombre ?? 'No especificada',
      puntaje: s.puntajeTotal
    }));

    type ConteoLikert = { 1: number; 2: number; 3: number };
    type PreguntaStats = {
      preguntaId: string;
      enunciado: string;
      orden: number;
      grupo: { id: string; nombre: string; orden: number } | null;
      subGrupo: { id: string; nombre: string; orden: number } | null;
      conteo: ConteoLikert;
      total: number;
    };

    const mapaPreguntas = new Map<string, PreguntaStats>();

    for (const r of respuestas) {
      const pid = r.pregunta.id;
      if (!mapaPreguntas.has(pid)) {
        mapaPreguntas.set(pid, {
          preguntaId: pid,
          enunciado: r.pregunta.enunciado,
          orden: r.pregunta.orden,
          grupo: r.pregunta.grupo,
          subGrupo: r.pregunta.subGrupo,
          conteo: { 1: 0, 2: 0, 3: 0 },
          total: 0
        });
      }
      const stats = mapaPreguntas.get(pid)!;
      const val = r.valorNumerico as number;
      if (val === 1 || val === 2 || val === 3) {
        stats.conteo[val]++;
        stats.total++;
      }
    }

    const filas = Array.from(mapaPreguntas.values())
      .sort((a, b) => {
        const ga = a.grupo?.orden ?? 0;
        const gb = b.grupo?.orden ?? 0;
        if (ga !== gb) return ga - gb;
        const sa = a.subGrupo?.orden ?? 0;
        const sb = b.subGrupo?.orden ?? 0;
        if (sa !== sb) return sa - sb;
        return a.orden - b.orden;
      })
      .map((s, idx) => {
        const pct = totalSesiones > 0
          ? Math.round((s.conteo[3] / totalSesiones) * 10000) / 100
          : 0;
        const promedio = s.total > 0
          ? Math.round(((s.conteo[1] * 1 + s.conteo[2] * 2 + s.conteo[3] * 3) / s.total) * 100) / 100
          : 0;
        return {
          numero: idx + 1,
          preguntaId: s.preguntaId,
          grupo: s.grupo?.nombre ?? '—',
          subGrupo: s.subGrupo?.nombre ?? '—',
          enunciado: s.enunciado,
          mala: s.conteo[1],
          buena: s.conteo[2],
          muyBuena: s.conteo[3],
          total: s.total,
          porcentajeMuyBuena: pct,
          promedio
        };
      });

    const gruposMap = new Map<string, number[]>();
    for (const f of filas) {
      if (!gruposMap.has(f.grupo)) gruposMap.set(f.grupo, []);
      gruposMap.get(f.grupo)!.push(f.porcentajeMuyBuena);
    }
    const promediosPorGrupo: Record<string, number> = {};
    gruposMap.forEach((pcts, grupoNombre) => {
      promediosPorGrupo[grupoNombre] =
        Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 100) / 100;
    });

    return { totalSesiones, filas, promediosPorGrupo, sesiones };
  }

  /**
   * REPORTE 3: Encuesta de EVALUACION
   */
  static async getEvaluacionReport(periodoId: string, areaId?: string, encuestaConfigId?: string) {
    const sesiones = await prisma.sesionEncuesta.findMany({
      where: {
        periodoId,
        ...(encuestaConfigId ? { encuestaConfigId } : {}),
        encuestaConfig: { tipo: 'EVALUACION' },
        trabajadorId: { not: null },
        ...(areaId ? { trabajador: { areaId } } : {})
      },
      include: {
        trabajador: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            cedula: true,
            area: true,
            areaRel: { select: { nombre: true } }
          }
        },
        respuestas: {
          where: {
            pregunta: { activo: true }
          },
          select: {
            esCorrecta: true,
            puntosObtenidos: true,
            respuestaDada: true,
            valorNumerico: true,
            pregunta: {
              select: {
                id: true,
                enunciado: true,
                tipoPregunta: true,
                respuestaCorrecta: true,
                grupo: { select: { nombre: true } },
                subGrupo: { select: { nombre: true } }
              }
            }
          }
        }
      },
      orderBy: { trabajador: { apellidos: 'asc' } }
    });

    const areaStats = new Map<string, {
      nombre: string;
      total: number;
      correctas: number;
      participantes: number;
    }>();

    const resultado = sesiones.map(s => {
      const correctas = s.respuestas.filter(r => r.esCorrecta).length;
      const total = s.respuestas.length;
      const pct = total > 0 ? Math.round((correctas / total) * 10000) / 100 : 0;
      const areaNombre = s.trabajador?.areaRel?.nombre ?? s.trabajador?.area ?? 'Sin asignar';

      if (!areaStats.has(areaNombre)) {
        areaStats.set(areaNombre, { nombre: areaNombre, total: 0, correctas: 0, participantes: 0 });
      }
      const as = areaStats.get(areaNombre)!;
      as.correctas += correctas;
      as.total += total;
      as.participantes += 1;

      return {
        trabajadorId: s.trabajador?.id,
        nombres: s.trabajador?.nombres,
        apellidos: s.trabajador?.apellidos,
        cedula: s.trabajador?.cedula,
        area: areaNombre,
        sesionId: s.id,
        puntajeTotal: s.puntajeTotal,
        totalPreguntas: total,
        correctas,
        porcentajeAcierto: pct,
        respuestas: s.respuestas
      };
    });

    const estadisticasPorArea = Array.from(areaStats.values()).map(a => ({
      ...a,
      porcentajeAcierto: a.total > 0
        ? Math.round((a.correctas / a.total) * 10000) / 100
        : 0
    }));

    return { sesiones: resultado, estadisticasPorArea };
  }

  /**
   * REPORTE 4: Tendencia por área
   */
  static async getTendenciaAreas() {
    const [areas, periodos] = await Promise.all([
      prisma.area.findMany({
        where: { activo: true },
        select: { id: true, nombre: true }
      }),
      prisma.periodo.findMany({
        orderBy: { fechaInicio: 'asc' },
        select: { id: true, nombre: true }
      })
    ]);

    const resultado = await Promise.all(
      areas.map(async (area) => {
        const dataPorPeriodo = await Promise.all(
          periodos.map(async (periodo) => {
            const respuestas = await prisma.respuesta.findMany({
              where: {
                sesion: {
                  periodoId: periodo.id,
                  trabajador: { areaId: area.id },
                  encuestaConfig: { tipo: 'EVALUACION' }
                }
              },
              select: { esCorrecta: true }
            });
            const total = respuestas.length;
            const correctas = respuestas.filter(r => r.esCorrecta).length;
            return {
              periodoId: periodo.id,
              periodoNombre: periodo.nombre,
              pct: total > 0
                ? Math.round((correctas / total) * 10000) / 100
                : null
            };
          })
        );
        return { areaId: area.id, areaNombre: area.nombre, dataPorPeriodo };
      })
    );

    return { periodos, areas: resultado };
  }
}
