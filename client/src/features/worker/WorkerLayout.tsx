import { Outlet, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export function WorkerLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col font-sans">
      {/* Background decoration - identical blur orbs to LandingPage */}
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-[500px] sm:h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-[600px] sm:h-[600px] bg-success/10 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/4" />

      {/* Navbar - premium glassmorphism, matching LandingPage */}
      <nav className="z-20 w-full px-6 py-4 flex justify-between items-center glass border-b border-border/50 sticky top-0 bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg transform -skew-x-6">
            E
          </div>
          <span className="text-lg sm:text-xl font-bold text-foreground">
            Encuesta<span className="text-primary">Laboral</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-200 border border-gray-200/50 hover:border-primary/20 bg-white/80 cursor-pointer shadow-sm shrink-0"
        >
          <ChevronLeft size={14} /> <span className="hidden sm:inline">Regresar al </span>Inicio
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-10 w-full max-w-5xl mx-auto transition-all duration-500">
        <div className="w-full bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] flex flex-col flex-1 sm:flex-initial sm:min-h-[420px] transition-all duration-300">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 py-5 text-center text-muted-foreground text-xs border-t border-border/50 glass bg-white/50">
        <p>&copy; {new Date().getFullYear()} EncuestaLaboral App. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
