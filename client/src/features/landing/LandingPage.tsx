import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { BarChart3, Gift, Lock, ClipboardList } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function LandingPage() {
  const navigate = useNavigate();
  const { setTrabajador, setPeriodoActual, setEncuestaConfig, limpiarSesionWorker } = useAppStore();

  const handleComenzarAnonima = () => {
    limpiarSesionWorker();
    setTrabajador(null);
    setPeriodoActual(null);
    setEncuestaConfig(null);
    navigate('/worker/encuesta');
  };

  const features = [
    {
      icon: <Lock className="h-5 w-5 text-purple-600" />,
      title: 'Diagnóstico de Inocuidad Anónimo',
      description: 'Evalúa de forma segura y privada el cumplimiento de normas de inocuidad e higiene seleccionando tu área de trabajo.'
    },
    {
      icon: <ClipboardList className="h-5 w-5 text-blue-600" />,
      title: 'Evaluaciones de Inocuidad',
      description: 'Mide y certifica los conocimientos sobre BPM, alérgenos y calidad alimentaria ingresando con tu cédula de identidad.'
    },
    {
      icon: <Gift className="h-5 w-5 text-emerald-600" />,
      title: 'Incentivos y Premios',
      description: 'Recompensa el compromiso con la inocuidad permitiendo a los trabajadores girar la ruleta de premios al finalizar.'
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-amber-500" />,
      title: 'Reportes y Filtros por Área',
      description: 'Monitorea el cumplimiento de inocuidad e higiene mediante dashboards detallados con distribución global por departamentos.'
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-success/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/4" />

      {/* Navbar */}
      <nav className="z-20 w-full px-4 sm:px-6 py-3 flex justify-between items-center glass border-b border-border/50 sticky top-0 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
            E
          </div>
          <span className="text-lg sm:text-xl font-bold text-foreground truncate max-w-[120px] sm:max-w-none">
            Encuesta<span className="text-primary">Laboral</span>
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <a href="/auth/admin" className="text-xs sm:text-sm font-semibold text-primary hover:bg-primary/5 px-4 py-2 rounded-full transition duration-200">
            Administrador
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-10 w-full max-w-6xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mt-6 sm:mt-10 mb-8 sm:mb-12 animate-in slide-in-from-bottom-8 fade-in duration-700">
          <div className="inline-block mb-3.5 px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            Inocuidad y Calidad Alimentaria
          </div>
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-4 sm:mb-5 leading-tight">
            Evalúa el conocimiento en <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-success">inocuidad alimentaria</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto px-2">
            Plataforma integrada para el diagnóstico y evaluación de prácticas de inocuidad, higiene y buenas prácticas de manufactura (BPM) de forma anónima por áreas y mediante evaluaciones de personal premiadas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 px-4 w-full sm:w-auto">
            <Button 
              size="lg" 
              className="h-11 sm:h-12 px-6 text-sm sm:text-base rounded-full w-full sm:w-auto shadow-md shadow-purple-600/15 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 transition"
              onClick={handleComenzarAnonima}
            >
              <Lock className="w-4.5 h-4.5" /> Comenzar Encuesta Anónima
            </Button>
            <Button 
              size="lg" 
              className="h-11 sm:h-12 px-6 text-sm sm:text-base rounded-full w-full sm:w-auto shadow-md shadow-blue-600/15 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition"
              onClick={() => navigate('/auth/worker')}
            >
              <ClipboardList className="w-4.5 h-4.5" /> Comenzar Evaluación
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full mb-8 sm:mb-12 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300 fill-mode-both">
          {features.map((feature, index) => (
            <Card key={index} className="glass border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/40">
              <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/80 flex items-center justify-center mb-3 shadow-xs border border-border/50">
                  {feature.icon}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-normal">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="z-10 py-4 text-center text-muted-foreground text-[10px] sm:text-xs border-t border-border/50 glass shrink-0">
        <p className="px-4">&copy; {new Date().getFullYear()} EncuestaLaboral App. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
