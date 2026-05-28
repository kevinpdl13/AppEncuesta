import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './lib/swagger';

// Import Routes — v1.0
import authRoutes from './routes/auth.routes';
import temasRoutes from './routes/temas.routes';
import preguntasRoutes from './routes/preguntas.routes';
import trabajadoresRoutes from './routes/trabajadores.routes';
import encuestasRoutes from './routes/encuestas.routes';
import premiosRoutes from './routes/premios.routes';
import reportesRoutes from './routes/reportes.routes';
// Import Routes — v2.0 (períodos, grupos, áreas, reportes avanzados)
import areasRoutes from './routes/areas.routes';
import periodosRoutes from './routes/periodos.routes';
import gruposRoutes from './routes/grupos.routes';
import reportesV2Routes from './routes/reportes-v2.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url} - Authorization Header: ${req.headers['authorization'] ? 'Present' : 'Absent'}`);
  next();
});

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes — v1.0
app.use('/api/auth', authRoutes);
app.use('/api/temas', temasRoutes);
app.use('/api/preguntas', preguntasRoutes);
app.use('/api/trabajadores', trabajadoresRoutes);
app.use('/api/encuestas', encuestasRoutes);
app.use('/api/premios', premiosRoutes);
app.use('/api/reportes', reportesRoutes);
// Routes — v2.0
app.use('/api/areas', areasRoutes);
app.use('/api/periodos', periodosRoutes);
app.use('/api/grupos', gruposRoutes);
app.use('/api/reportes-v2', reportesV2Routes);

// Health check and root redirect
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
