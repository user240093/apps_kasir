"use client";

import { User, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-md shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700">
          <User size={18} className="text-slate-400" />
          <span className="text-sm font-medium">{user?.full_name || "Kasir"}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
          aria-label="Keluar aplikasi"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
