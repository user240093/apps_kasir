"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Package,
  CalendarDays,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/transaksi", label: "Transaksi", icon: ShoppingCart },
  { href: "/stok", label: "Kelola Stok", icon: Package },
  { href: "/laporan/harian", label: "Laporan Harian", icon: CalendarDays },
  { href: "/laporan/bulanan", label: "Laporan Bulanan", icon: TrendingUp },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-[260px]"
      } min-h-screen bg-white border-r border-slate-200 shadow-md flex flex-col transition-all duration-300`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
        {!collapsed && (
          <h1 className="text-lg font-bold text-emerald-600 whitespace-nowrap">
            Kasir Toko
          </h1>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          aria-label={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${
                collapsed ? "justify-center" : "gap-3"
              } px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
