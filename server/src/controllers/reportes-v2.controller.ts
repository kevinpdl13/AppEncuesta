import { Request, Response } from 'express';
import { ReportesV2Service } from '../services/reportes-v2.service';

export class ReportesV2Controller {
  static async getKpi(req: Request, res: Response) {
    const periodoId = req.params.periodoId as string;
    try {
      const data = await ReportesV2Service.getKpiData(periodoId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getAnonimo(req: Request, res: Response) {
    const periodoId = req.params.periodoId as string;
    const encuestaConfigId = req.query.encuesta_config_id as string;
    const areaId = req.query.area_id ? (req.query.area_id as string) : undefined;

    if (!encuestaConfigId) {
      return res.status(400).json({ error: 'Parámetro encuesta_config_id requerido.' });
    }

    try {
      const data = await ReportesV2Service.getAnonimoReport(periodoId, encuestaConfigId, areaId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getEvaluacion(req: Request, res: Response) {
    const periodoId = req.params.periodoId as string;
    const areaId = req.query.area_id ? (req.query.area_id as string) : undefined;
    const encuestaConfigId = req.query.encuesta_config_id ? (req.query.encuesta_config_id as string) : undefined;

    try {
      const data = await ReportesV2Service.getEvaluacionReport(periodoId, areaId, encuestaConfigId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getTendencia(req: Request, res: Response) {
    try {
      const data = await ReportesV2Service.getTendenciaAreas();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
