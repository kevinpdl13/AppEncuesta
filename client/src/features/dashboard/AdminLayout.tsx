import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, HelpCircle, Users, Gift,
  LogOut, Bell, Menu, X, MapPin, Calendar, BarChart,
  ShieldCheck, ClipboardList
} from 'lucide-react';

export function AdminLayout() {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { navigate('/auth/admin'); return; }
    setAdminEmail('admin@encuesta.com');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/auth/admin');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Períodos', path: '/admin/periodos', icon: <Calendar size={20} /> },
    { name: 'Áreas', path: '/admin/areas', icon: <MapPin size={20} /> },
    { name: 'Preguntas', path: '/admin/preguntas', icon: <HelpCircle size={20} /> },
    { name: 'Trabajadores', path: '/admin/trabajadores', icon: <Users size={20} /> },
    { name: 'Premios', path: '/admin/premios', icon: <Gift size={20} /> },
    { name: 'Reportes', path: '/admin/reportes', icon: <BarChart size={20} /> },
    { name: 'Análisis Encuesta', path: '/admin/analisis-encuesta', icon: <ShieldCheck size={20} /> },
    { name: 'Análisis Evaluación', path: '/admin/analisis-evaluacion', icon: <ClipboardList size={20} /> },
  ];

  // Extraer iniciales del email para avatar
  const iniciales = adminEmail ? adminEmail.slice(0, 2).toUpperCase() : 'AD';

  const SidebarContent = () => (
    <>
      <div className="h-20 flex items-center px-8 border-b border-gray-100/50 md:border-none">
        <div className="w-8 h-8 bg-primary rounded-lg shadow-sm mr-3 flex items-center justify-center text-white font-bold transform -skew-x-6">
          E
        </div>
        <span className="font-bold text-xl tracking-tight">EncuestaLab</span>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto p-2 text-muted-foreground hover:bg-gray-100 rounded-full">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-6">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-[#eff0fe] text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-gray-50 hover:text-foreground'
              }`
            }
          >
            {item.icon}
            <span className="text-[15px]">{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-6 border-t border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold shrink-0">
            {iniciales}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate">{adminEmail || 'Administrador'}</span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </div>
        <button
          id="admin-logout-btn"
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-[15px] font-medium text-muted-foreground hover:bg-red-50 hover:text-danger rounded-xl w-full transition-colors"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#f4f7f6] w-full overflow-hidden text-foreground relative">
      {/* Sidebar Desktop */}
      <aside className="w-[280px] bg-white border-r border-[#e5e7eb] flex-col hidden md:flex z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile (Drawer) */}
      <div 
        className={`fixed inset-0 bg-black/40 z-50 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside className={`fixed inset-y-0 left-0 w-[280px] bg-white z-[60] flex flex-col md:hidden transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
        <SidebarContent />
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 sm:h-20 bg-[#f4f7f6] flex items-center justify-between px-4 sm:px-8 shrink-0 z-10 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-muted-foreground hover:bg-white rounded-lg transition-colors border border-gray-200 shadow-sm"
            >
              <Menu size={22} />
            </button>
            <span className="font-bold text-base sm:text-lg text-foreground truncate max-w-[200px]">Panel Administrativo</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="relative p-2 text-muted-foreground hover:bg-white rounded-full transition-colors">
              <Bell className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 pt-4 sm:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
