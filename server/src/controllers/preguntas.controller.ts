import { Request, Response } from 'express';
import { PreguntasService } from '../services/preguntas.service';

export class PreguntasController {
  static async getPreguntas(req: Request, res: Response) {
    const { tipo, grupo_id, sub_grupo_id, encuesta_config_id, tema_id } = req.query;
    try {
      const data = await PreguntasService.getPreguntas({
        tipo: tipo as string,
        grupo_id: grupo_id as string,
        sub_grupo_id: sub_grupo_id as string,
        encuesta_config_id: encuesta_config_id as string,
        tema_id: tema_id as string
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getPreguntasByTema(req: Request, res: Response) {
    const temaId = req.params.temaId as string;
    try {
      const data = await PreguntasService.getPreguntasByTema(temaId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getPreguntasByEncuestaConfig(req: Request, res: Response) {
    const configId = req.params.configId as string;
    try {
      const data = await PreguntasService.getPreguntasByEncuestaConfig(configId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async postPregunta(req: Request, res: Response) {
    const {
      enunciado,
      respuestaCorrecta,
      puntos,
      temaId,
      tipoPregunta,
      grupoId,
      subGrupoId,
      encuestaConfigId,
      orden
    } = req.body;

    try {
      const data = await PreguntasService.crearPregunta({
        enunciado,
        respuestaCorrecta,
        puntos,
        temaId,
        tipoPregunta,
        grupoId,
        subGrupoId,
        encuestaConfigId,
        orden
      });
      res.status(201).json(data);
    } catch (err: any) {
      if (err.message.includes('obligatorio') || err.message.includes('V/F')) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  static async putPregunta(req: Request, res: Response) {
    const id = req.params.id as string;
    const {
      enunciado,
      respuestaCorrecta,
      puntos,
      temaId,
      tipoPregunta,
      grupoId,
      subGrupoId,
      encuestaConfigId,
      orden,
      activo
    } = req.body;

    try {
      const data = await PreguntasService.actualizarPregunta(id, {
        enunciado,
        respuestaCorrecta,
        puntos,
        temaId,
        tipoPregunta,
        grupoId,
        subGrupoId,
        encuestaConfigId,
        orden,
        activo
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async deletePregunta(req: Request, res: Response) {
    const id = req.params.id as string;
    try {
      await PreguntasService.eliminarPregunta(id);
      res.status(204).send();
    } catch (err: any) {
      if (err.message.includes('No se puede eliminar')) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }
}
