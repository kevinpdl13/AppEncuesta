import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     summary: Iniciar sesión como administrador
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/worker/login:
 *   post:
 *     summary: Iniciar sesión como trabajador (Cédula)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cedula:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       404:
 *         description: Cédula no registrada
 */
router.post('/worker/login', async (req, res) => {
  const { cedula } = req.body;

  try {
    const trabajador = await prisma.trabajador.findUnique({
      where: { cedula, activo: true }
    });

    if (!trabajador) {
      return res.status(404).json({ error: 'Cédula no registrada o trabajador inactivo.' });
    }

    const token = jwt.sign(
      { id: trabajador.id, cedula: trabajador.cedula, role: 'worker' },
      process.env.JWT_SECRET as string,
      { expiresIn: '2h' }
    );

    res.json({ token, trabajador });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
