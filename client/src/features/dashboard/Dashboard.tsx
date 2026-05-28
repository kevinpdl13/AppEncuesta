import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { ArrowUpRight, Users, ClipboardList, Star, HelpCircle } from 'lucide-react';
import { api } from '../../lib/api';

type Stats = {
  totalTrabajadoresActivos: number;
  totalEncuestados: number;
  promedioPuntos: number;
  totalPreguntasActivas: number;
};

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="hover:-translate-y-1 transition-transform duration-300">
      <CardContent className="p-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
          {icon}
        </div>
        <h4 className="text-[15px] font-semibold text-muted-foreground mb-1">{title}</h4>
        <div className="text-4xl font-bold text-foreground tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const data = await api.getEstadisticasDashboard();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargarStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-danger p-8">
        <p className="font-semibold">Error al cargar el dashboard</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Resumen de actividad de tu encuesta laboral.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Trabajadores Activos"
          value={stats?.totalTrabajadoresActivos ?? 0}
          icon={<Users size={22} className="text-primary" />}
          color="bg-primary/10"
        />
        <StatCard
          title="Participaciones Totales"
          value={stats?.totalEncuestados ?? 0}
          icon={<ClipboardList size={22} className="text-success" />}
          color="bg-success/10"
        />
        <StatCard
          title="Promedio de Puntos"
          value={stats?.promedioPuntos ?? 0}
          icon={<ArrowUpRight size={22} className="text-amber-500" />}
          color="bg-amber-50"
        />
        <StatCard
          title="Preguntas Activas"
          value={stats?.totalPreguntasActivas ?? 0}
          icon={<HelpCircle size={22} className="text-violet-500" />}
          color="bg-violet-50"
        />
      </div>

      {/* Accesos rápidos */}
      <div>
        <h3 className="text-xl font-bold tracking-tight mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Gestionar Preguntas', href: '/admin/preguntas', emoji: '📝', desc: 'Crear, editar y activar preguntas V/F' },
            { label: 'Ver Trabajadores', href: '/admin/trabajadores', emoji: '👷', desc: 'Registrar y gestionar trabajadores' },
            { label: 'Configurar Premios', href: '/admin/premios', emoji: '🎁', desc: 'Gestionar premios de la ruleta' },
          ].map((item) => (
            <a key={item.href} href={item.href}>
              <Card className="hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col gap-3">
                  <span className="text-3xl">{item.emoji}</span>
                  <div>
                    <h4 className="font-bold text-foreground">{item.label}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>

      {/* Nota sobre el modelo de datos */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 flex items-start gap-4">
          <Star size={22} className="text-primary mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground mb-1">Base de datos conectada</h4>
            <p className="text-sm text-muted-foreground">
              Todos los datos mostrados son reales y provienen de tu base de datos en Supabase.
              Los módulos de Preguntas, Trabajadores, Premios y Reportes están en construcción.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
