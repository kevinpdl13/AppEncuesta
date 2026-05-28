import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import type { Premio } from '../../types';

export function Ruleta() {
  const navigate = useNavigate();
  const { puntajeSesionActual, sesionIdActual, trabajadorActual, encuestaConfigSeleccionada, limpiarSesionWorker } = useAppStore();

  const [premios, setPremios] = useState<Premio[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [premioObtenido, setPremioObtenido] = useState<Premio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirigir si no hay sesión válida o config
  useEffect(() => {
    if (!sesionIdActual || !trabajadorActual || !encuestaConfigSeleccionada) {
      navigate('/auth/worker');
    }
  }, [sesionIdActual, trabajadorActual, encuestaConfigSeleccionada, navigate]);

  // Cargar premios activos y validar puntaje perfecto
  useEffect(() => {
    const verificarYcargar = async () => {
      if (!sesionIdActual || !trabajadorActual || !encuestaConfigSeleccionada) return;
      try {
        setLoading(true);
        setError('');

        // 1. Cargar preguntas de la evaluación para verificar el puntaje máximo
        const preguntasData = await api.getPreguntasPorConfig(encuestaConfigSeleccionada.id);
        const totalPuntosPosibles = preguntasData.reduce((sum, p) => sum + (p.puntos || 0), 0);

        if (puntajeSesionActual < totalPuntosPosibles) {
          setError(`Acceso denegado: Se requiere un puntaje perfecto (${totalPuntosPosibles} puntos) para participar en la ruleta de premios.`);
          return;
        }

        // 2. Cargar premios
        const data = await api.getPremiosActivos();
        if (data.length < 2) {
          setError('La ruleta necesita al menos 2 premios activos. Contacta al administrador.');
          return;
        }
        setPremios(data);
      } catch (err: any) {
        setError(err.message || 'Error al validar tu sesión.');
      } finally {
        setLoading(false);
      }
    };
    verificarYcargar();
  }, [sesionIdActual, trabajadorActual, encuestaConfigSeleccionada, puntajeSesionActual]);

  const handleSpin = async () => {
    if (spinning || premioObtenido || premios.length === 0 || !sesionIdActual) return;

    setSpinning(true);

    // Determinar el ganador por probabilidad ponderada
    const totalProbabilidad = premios.reduce((sum, p) => sum + p.probabilidad, 0);
    let aleatorio = Math.random() * totalProbabilidad;
    let indexGanador = 0;
    for (let i = 0; i < premios.length; i++) {
      aleatorio -= premios[i].probabilidad;
      if (aleatorio <= 0) {
        indexGanador = i;
        break;
      }
    }

    const premioGanador = premios[indexGanador];
    const wedgeAngle = 360 / premios.length;
    // El puntero está a la derecha (90 grados); ajustamos la rotación
    const targetAngle = 1800 + 90 - (wedgeAngle * indexGanador) - (wedgeAngle / 2);
    setRotation(targetAngle);

    // Esperar animación y luego guardar en BD
    setTimeout(async () => {
      try {
        await api.guardarResultadoRuleta(sesionIdActual, premioGanador.id);
        setPremioObtenido(premioGanador);
      } catch (err: any) {
        setError('Error al registrar el premio: ' + err.message);
      } finally {
        setSpinning(false);
      }
    }, 4500);
  };

  const handleFinalizarYSalir = () => {
    limpiarSesionWorker();
    navigate('/auth/worker');
  };

  // Gradiente cónico de la ruleta
  const gradientStops = premios
    .map((p, i) => {
      const step = 100 / premios.length;
      return `${p.color} ${step * i}%, ${p.color} ${step * (i + 1)}%`;
    })
    .join(', ');

  // --- Estados de borde ---
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm animate-pulse">Preparando tu ruleta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-danger font-semibold">{error}</p>
        <button onClick={() => navigate('/auth/worker')} className="mt-6 text-sm text-muted-foreground underline">
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center flex-1 py-4 animate-in fade-in zoom-in duration-500 w-full">
      <h2 className="text-[28px] font-extrabold text-gray-800 mb-2 w-full text-center tracking-tight">
        ¡Gira & Gana!
      </h2>

      {/* Puntaje obtenido */}
      <div className="w-full bg-white rounded-2xl p-4 mb-6 shadow-sm text-center">
        <p className="text-sm text-muted-foreground font-medium mb-1">Tu puntaje final</p>
        <p className="text-3xl font-extrabold text-primary">{puntajeSesionActual} pts</p>
        <p className="text-xs text-muted-foreground mt-1">
          ¡Excelente trabajo, {trabajadorActual?.nombres}!
        </p>
      </div>

      {/* Ruleta */}
      <div className="relative w-[250px] h-[250px] xs:w-[280px] xs:h-[280px] my-auto shrink-0 drop-shadow-2xl mb-8">
        {/* Puntero */}
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-0 h-0 border-t-[12px] border-b-[12px] border-l-[30px] border-t-transparent border-b-transparent border-l-white z-20 ml-2" />

        {/* Rueda */}
        <div
          className="w-full h-full rounded-full border-4 border-white shadow-inner relative overflow-hidden"
          style={{
            background: `conic-gradient(${gradientStops})`,
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 4.5s cubic-bezier(0.1, 0.7, 0.1, 1)',
          }}
        >
          {premios.map((p, i) => {
            const rot = (360 / premios.length) * i + (360 / premios.length) / 2;
            return (
              <div
                key={p.id}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[30px] h-1/2 origin-bottom text-center text-[10px] font-bold text-white/90 drop-shadow flex items-center justify-center pt-8"
                style={{ transform: `rotate(${rot}deg)` }}
              >
                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
                  {p.nombre}
                </div>
              </div>
            );
          })}
        </div>

        {/* Centro */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] z-10 flex items-center justify-center">
          <div className="w-3 h-3 bg-gray-100 rounded-full shadow-inner" />
        </div>
      </div>

      {/* CTA / Resultado */}
      {premioObtenido ? (
        <div className="mt-auto w-full text-center animate-in slide-in-from-bottom-6 duration-500">
          <p className="text-gray-500 font-semibold mb-1">🎊 ¡Felicidades, {trabajadorActual?.nombres}!</p>
          <div className="text-4xl font-extrabold text-[#64dd17] mb-2 tracking-tight drop-shadow-sm">
            {premioObtenido.nombre}
          </div>
          {premioObtenido.descripcion && (
            <p className="text-sm text-muted-foreground mb-6">{premioObtenido.descripcion}</p>
          )}
          <Button
            id="finalizar-encuesta-btn"
            onClick={handleFinalizarYSalir}
            className="w-full h-14 bg-gray-800 hover:bg-black text-white text-lg rounded-2xl shadow-lg"
          >
            Finalizar y Cerrar
          </Button>
        </div>
      ) : (
        <div className="mt-auto w-full pt-4">
          <Button
            id="girar-ruleta-btn"
            onClick={handleSpin}
            disabled={spinning || premios.length === 0}
            className="w-full h-16 bg-[#64dd17] hover:bg-green-500 text-white text-[18px] font-extrabold rounded-[1.5rem] shadow-[0_10px_20px_rgba(100,221,23,0.3)] hover:shadow-[0_12px_25px_rgba(100,221,23,0.4)] transition-all transform hover:-translate-y-1"
          >
            {spinning ? 'Girando...' : 'Girar Ruleta'}
          </Button>
        </div>
      )}
    </div>
  );
}
