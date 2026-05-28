import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-success/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="z-10 w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
