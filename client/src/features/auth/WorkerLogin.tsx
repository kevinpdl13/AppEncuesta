import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

// WorkerLogin v2.0 — Carga período vigente tras el login

export function WorkerLogin() {
  const [cedula, setCedula] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTrabajador, setPeriodoActual, setEncuestaConfig, limpiarSesionWorker } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Early return — validar formato antes de llamar la BD
    if (!cedula.trim()) {
      setError('Por favor, ingrese su cédula.');
      return;
    }
    if (!/^\d{10}$/.test(cedula.trim())) {
      setError('La cédula debe contener exactamente 10 dígitos numéricos.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 1. Autenticar trabajador
      const trabajador = await api.ingresarTrabajador(cedula.trim());

      // 2. Guardar en store
      limpiarSesionWorker();
      setTrabajador(trabajador);
      setPeriodoActual(null); // Se elegirá después
      setEncuestaConfig(null);
      navigate('/worker/encuesta');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-in fade-in zoom-in duration-300">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-primary font-bold">Encuesta Laboral</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Ingresa con tu cédula de identidad para participar
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Input
              id="worker-cedula-input"
              type="text"
              placeholder="Ej: 0123456789"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              disabled={loading}
              className="text-center text-lg tracking-widest"
              maxLength={10}
            />
          </div>
          {error && (
            <p className="text-sm text-danger text-center bg-danger/10 py-2 px-3 rounded-lg">
              {error}
            </p>
          )}
          <Button id="worker-login-btn" type="submit" disabled={loading} className="w-full h-12 text-lg">
            {loading ? 'Verificando...' : 'Ingresar a mi Encuesta'}
          </Button>
          <div className="mt-4 text-center flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-primary hover:underline transition"
            >
              ← Volver al Inicio
            </button>
            <a
              href="/auth/admin"
              className="text-xs text-muted-foreground hover:text-primary transition underline-offset-4 hover:underline"
            >
              ¿Administrador? Inicia sesión aquí
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
