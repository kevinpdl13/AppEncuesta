import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from './features/auth/AuthLayout';
import { WorkerLogin } from './features/auth/WorkerLogin';
import { AdminLogin } from './features/auth/AdminLogin';
import { AdminLayout } from './features/dashboard/AdminLayout';
import { Dashboard } from './features/dashboard/Dashboard';
import { PreguntasPage } from './features/dashboard/PreguntasPage';
import { TrabajadoresPage } from './features/dashboard/TrabajadoresPage';
import { PremiosPage } from './features/dashboard/PremiosPage';
import { ReportesPage } from './features/dashboard/ReportesPage';
// v2.0 — nuevas páginas
import { PeriodosPage } from './features/dashboard/PeriodosPage';
import { AreasPage } from './features/dashboard/AreasPage';
import { ReportesV2Page } from './features/dashboard/ReportesV2Page';
import { EvaluacionesPage } from './features/dashboard/EvaluacionesPage';
// Worker
import { WorkerLayout } from './features/worker/WorkerLayout';
import { Encuesta } from './features/worker/Encuesta';
import { Ruleta } from './features/worker/Ruleta';
import { LandingPage } from './features/landing/LandingPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'worker', element: <WorkerLogin /> },
      { path: 'admin', element: <AdminLogin /> },
    ],
  },
  {
    path: '/worker',
    element: <WorkerLayout />,
    children: [
      { path: '', element: <Navigate to="encuesta" replace /> },
      { path: 'encuesta', element: <Encuesta /> },
      { path: 'ruleta', element: <Ruleta /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: '', element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      // v2.0
      { path: 'periodos', element: <PeriodosPage /> },
      { path: 'areas', element: <AreasPage /> },
      { path: 'analisis-encuesta', element: <ReportesV2Page /> },
      { path: 'analisis-evaluacion', element: <EvaluacionesPage /> },
      // legacy
      { path: 'encuestas', element: <Navigate to="/admin/periodos" replace /> },
      { path: 'preguntas', element: <PreguntasPage /> },
      { path: 'trabajadores', element: <TrabajadoresPage /> },
      { path: 'premios', element: <PremiosPage /> },
      { path: 'reportes', element: <ReportesPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
