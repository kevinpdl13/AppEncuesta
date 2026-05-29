import { Request, Response } from 'express';
import { PeriodosService } from '../services/periodos.service';

export class PeriodosController {
  static async getPeriodos(req: Request, res: Response) {
    try {
      const data = await PeriodosService.getAllPeriodos();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getActivos(req: Request, res: Response) {
    try {
      const data = await PeriodosService.getActivosPeriodos();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getVigente(req: Request, res: Response) {
    try {
      const data = await PeriodosService.getVigentePeriodo();
      if (!data) {
        return res.status(404).json({ error: 'No hay un período de encuestas activo en este momento.' });
      }
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async postPeriodo(req: Request, res: Response) {
    const { nombre, descripcion, fechaInicio, fechaFin } = req.body;
    if (!nombre?.trim() || !fechaInicio) {
      return res.status(400).json({ error: 'nombre y fechaInicio son obligatorios.' });
    }
    try {
      const data = await PeriodosService.crearPeriodo({ nombre, descripcion, fechaInicio, fechaFin });
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async putPeriodo(req: Request, res: Response) {
    const id = req.params.id as string;
    const { nombre, descripcion, fechaInicio, fechaFin, activo } = req.body;
    try {
      const data = await PeriodosService.actualizarPeriodo(id, { nombre, descripcion, fechaInicio, fechaFin, activo });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async deletePeriodo(req: Request, res: Response) {
    const id = req.params.id as string;
    try {
      await PeriodosService.eliminarPeriodo(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async postEncuestaConfig(req: Request, res: Response) {
    const periodoId = req.params.periodoId as string;
    const { nombre, tipo, escalaLabels } = req.body;
    if (!nombre?.trim() || !tipo) {
      return res.status(400).json({ error: 'nombre y tipo son obligatorios.' });
    }
    if (!['ANONIMA', 'EVALUACION'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo debe ser ANONIMA o EVALUACION.' });
    }
    try {
      const data = await PeriodosService.crearEncuestaConfig(periodoId, { nombre, tipo, escalaLabels });
      res.status(201).json(data);
    } catch (err: any) {
      if (err.message.includes('Ya existe')) {
        return res.status(409).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  static async putEncuestaConfig(req: Request, res: Response) {
    const configId = req.params.configId as string;
    const { nombre, escalaLabels, activo } = req.body;
    try {
      const data = await PeriodosService.actualizarEncuestaConfig(configId, { nombre, escalaLabels, activo });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteEncuestaConfig(req: Request, res: Response) {
    const periodoId = req.params.periodoId as string;
    const configId = req.params.configId as string;
    try {
      await PeriodosService.eliminarEncuestaConfig(periodoId, configId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
