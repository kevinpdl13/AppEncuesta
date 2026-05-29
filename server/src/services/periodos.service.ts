import prisma from '../lib/prisma';

export class PeriodosService {
  private static isPeriodoVigente(periodo: { fechaInicio: Date; fechaFin: Date | null; activo: boolean }) {
    if (!periodo.activo) return false;
    const now = new Date();
    if (now < periodo.fechaInicio) return false;
    if (periodo.fechaFin && now > periodo.fechaFin) return false;
    return true;
  }

  static async getAllPeriodos() {
    const periodos = await prisma.periodo.findMany({
      orderBy: { fechaInicio: 'desc' },
      include: {
        encuestaConfigs: {
          select: { id: true, nombre: true, tipo: true, activo: true, escalaLabels: true }
        },
        _count: { select: { sesiones: true } }
      }
    });

    return periodos.map(p => ({
      ...p,
      vigente: this.isPeriodoVigente(p)
    }));
  }

  static async getActivosPeriodos() {
    return prisma.periodo.findMany({
      where: { activo: true },
      orderBy: { fechaInicio: 'desc' },
      include: {
        encuestaConfigs: {
          where: { activo: true },
          select: { id: true, nombre: true, tipo: true, escalaLabels: true }
        }
      }
    });
  }

  static async getVigentePeriodo() {
    const now = new Date();
    return prisma.periodo.findFirst({
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
  }

  static async crearPeriodo(data: { nombre: string; descripcion?: string; fechaInicio: string; fechaFin?: string }) {
    return prisma.periodo.create({
      data: {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null
      }
    });
  }

  static async actualizarPeriodo(id: string, data: { nombre?: string; descripcion?: string; fechaInicio?: string; fechaFin?: string | null; activo?: boolean }) {
    return prisma.periodo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaFin: data.fechaFin === null ? null : (data.fechaFin ? new Date(data.fechaFin) : undefined),
        activo: data.activo
      }
    });
  }

  static async eliminarPeriodo(id: string) {
    const count = await prisma.sesionEncuesta.count({
      where: { periodoId: id }
    });
    if (count > 0) {
      throw new Error(`No se puede eliminar: el período tiene ${count} sesión(es) registrada(s).`);
    }
    return prisma.periodo.delete({ where: { id } });
  }

  static async crearEncuestaConfig(periodoId: string, data: { nombre: string; tipo: 'ANONIMA' | 'EVALUACION'; escalaLabels?: string[] }) {
    // Verificar duplicado de tipo en el mismo período
    const existing = await prisma.encuestaConfig.findFirst({
      where: { periodoId, tipo: data.tipo, activo: true }
    });
    if (existing) {
      throw new Error(`Ya existe una encuesta de tipo ${data.tipo} activa en este período.`);
    }

    return prisma.encuestaConfig.create({
      data: {
        periodoId,
        nombre: data.nombre.trim(),
        tipo: data.tipo,
        escalaLabels: data.escalaLabels ? JSON.stringify(data.escalaLabels) : '["Nunca","A veces","Siempre"]'
      }
    });
  }

  static async actualizarEncuestaConfig(configId: string, data: { nombre?: string; escalaLabels?: string[]; activo?: boolean }) {
    return prisma.encuestaConfig.update({
      where: { id: configId },
      data: {
        nombre: data.nombre,
        escalaLabels: data.escalaLabels ? JSON.stringify(data.escalaLabels) : undefined,
        activo: data.activo
      }
    });
  }

  static async eliminarEncuestaConfig(periodoId: string, configId: string) {
    return prisma.encuestaConfig.delete({
      where: {
        id: configId,
        periodoId
      }
    });
  }
}
