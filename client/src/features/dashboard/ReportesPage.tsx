import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { BarChart2, Medal, Trophy, Award } from 'lucide-react';

const PAGE_SIZE = 10;

type RankingRow = {
  puntaje_total: number;
  fecha_inicio: string;
  temas: { titulo: string } | null;
  trabajadores: { id: string; nombres: string; apellidos: string; cedula: string; area: string } | null;
  resultados_ruleta: { premios: { nombre: string } | null } | null;
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

const MedalIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return < Trophy size={20} className="text-yellow-500" />;
  if (rank === 2) return < Medal size={20} className="text-gray-400" />;
  if (rank === 3) return < Award size={20} className="text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
};

export function ReportesPage() {
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroArea, setFiltroArea] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await api.getRankingTrabajadores();
        setRanking(data as unknown as RankingRow[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const areas = [...new Set(ranking.map((r) => r.trabajadores?.area).filter(Boolean))];
  const filtrado = filtroArea ? ranking.filter((r) => r.trabajadores?.area === filtroArea) : ranking;

  const { paginaActual, setPaginaActual, totalPaginas, inicio, itemsPagina: filtradoPagina } = usePagination(filtrado, PAGE_SIZE);

  const totalParticipaciones = ranking.length;
  const promedio = totalParticipaciones > 0
    ? Math.round(ranking.reduce((sum, r) => sum + r.puntaje_total, 0) / totalParticipaciones)
    : 0;
  const maxPuntaje = ranking.length > 0 ? Math.max(...ranking.map((r) => r.puntaje_total)) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Reportes y Ranking</h2>
        <p className="text-muted-foreground mt-1">Clasificación de participantes por puntaje</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
              <BarChart2 size={20} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Total Participaciones</p>
            <p className="text-3xl font-extrabold mt-1">{totalParticipaciones}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center mb-3">
              <Trophy size={20} className="text-success" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Puntaje Máximo</p>
            <p className="text-3xl font-extrabold mt-1">{maxPuntaje} pts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
              <Award size={20} className="text-amber-500" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Promedio de Puntos</p>
            <p className="text-3xl font-extrabold mt-1">{promedio} pts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro por área */}
      {areas.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFiltroArea('')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!filtroArea ? 'bg-primary text-white' : 'bg-white border border-border text-muted-foreground hover:bg-gray-50'}`}
          >
            Todos
          </button>
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setFiltroArea(area!)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filtroArea === area ? 'bg-primary text-white' : 'bg-white border border-border text-muted-foreground hover:bg-gray-50'}`}
            >
              {area}
            </button>
          ))}
        </div>
      )}

      {/* Carga / Error / Vacío */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {error && <p className="text-danger bg-danger/10 p-4 rounded-xl">{error}</p>}
      {!loading && filtrado.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No hay participaciones registradas aún.</p>
          </CardContent>
        </Card>
      )}

      {/* Tabla de ranking */}
      {!loading && filtrado.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-center px-4 sm:px-6 py-4 font-semibold text-muted-foreground w-16">#</th>
                  <th className="text-left px-4 sm:px-6 py-4 font-semibold text-muted-foreground">Trabajador</th>
                  <th className="text-left px-4 sm:px-6 py-4 font-semibold text-muted-foreground hidden sm:table-cell">Área</th>
                  <th className="text-left px-4 sm:px-6 py-4 font-semibold text-muted-foreground hidden md:table-cell">Encuesta</th>
                  <th className="text-center px-4 sm:px-6 py-4 font-semibold text-muted-foreground">Puntaje</th>
                  <th className="text-center px-4 sm:px-6 py-4 font-semibold text-muted-foreground hidden sm:table-cell">Premio</th>
                  <th className="text-right px-4 sm:px-6 py-4 font-semibold text-muted-foreground hidden md:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtradoPagina.map((row, idx) => {
                  const rank = inicio + idx + 1;
                  const w = row.trabajadores;
                  const t = row.temas;
                  const premio = row.resultados_ruleta?.premios?.nombre;
                  const pct = maxPuntaje > 0 ? (row.puntaje_total / maxPuntaje) * 100 : 0;

                  return (
                    <tr key={`${row.trabajadores?.id}-${row.fecha_inicio}`} className={`border-b border-border/50 hover:bg-gray-50 transition-colors ${rank <= 3 ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <MedalIcon rank={rank} />
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {w?.nombres.charAt(0)}{w?.apellidos.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold">{w ? `${w.nombres} ${w.apellidos}` : '—'}</div>
                            <div className="text-xs text-muted-foreground font-mono">{w?.cedula}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                        <span className="bg-primary/5 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                          {w?.area ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {t?.titulo ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="font-extrabold text-lg">{row.puntaje_total}</span>
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center hidden sm:table-cell">
                        {premio
                          ? <span className="text-xs font-semibold bg-success/10 text-success px-2 py-1 rounded-full">🎁 {premio}</span>
                          : <span className="text-xs text-muted-foreground">—</span>
                        }
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right text-xs text-muted-foreground whitespace-nowrap hidden md:table-cell">
                        {formatFecha(row.fecha_inicio)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            inicio={inicio}
            totalItems={filtrado.length}
            pageSize={PAGE_SIZE}
            label="participaciones"
            onPageChange={setPaginaActual}
          />
        </Card>
      )}
    </div>
  );
}
