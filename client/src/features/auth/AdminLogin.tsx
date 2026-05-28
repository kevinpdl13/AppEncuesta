import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Early return — validaciones de formato
    if (!email.trim()) {
      setError('El correo electrónico es requerido.');
      return;
    }
    if (!password) {
      setError('La contraseña es requerida.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Autenticación con nuestro nuevo backend
      await api.loginAdmin(email.trim(), password);

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error inesperado al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-in fade-in zoom-in duration-300">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-primary font-bold">Panel Administrativo</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Gestión de Encuestas, Premios y RRHH
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="admin-email-input"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Input
            id="admin-password-input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {error && (
            <p className="text-sm text-danger text-center bg-danger/10 py-2 px-3 rounded-lg">
              {error}
            </p>
          )}
          <Button id="admin-login-btn" type="submit" disabled={loading} className="w-full h-12 text-lg">
            {loading ? 'Ingresando...' : 'Acceder al Dashboard'}
          </Button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-primary hover:underline transition"
            >
              ← Volver al Inicio
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
