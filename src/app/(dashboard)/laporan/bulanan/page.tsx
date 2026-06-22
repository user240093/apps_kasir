"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiGetMonthlyReport, fmt } from "@/lib/api";
import type { MonthlyReport } from "@/lib/types";
import { Loader2 } from "lucide-react";

const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function LaporanBulananPage() {
  const { isAuthenticated } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiGetMonthlyReport(month, year);
    if (res.success && res.data) setReport(res.data);
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [isAuthenticated, month, year, load]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Laporan Pendapatan & Stok Bulanan
      </h2>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Pilih Bulan
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Pilih Tahun
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
          >
            {[2024, 2025, 2026, 2027].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
        </div>
      ) : !report ? (
        <p className="text-sm text-slate-400 text-center py-8">Gagal memuat laporan</p>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Total Omzet" value={`Rp${fmt(report.kpi.total_revenue)}`} color="text-emerald-600" />
            <KpiCard label="Total Transaksi" value={String(report.kpi.total_transactions)} color="text-blue-600" />
            <KpiCard label="Rata-rata per Hari" value={`Rp${fmt(report.kpi.average_per_day)}`} color="text-slate-900" />
            <KpiCard label="Item Terjual" value={String(report.kpi.total_items_sold)} color="text-purple-600" />
          </div>

          {/* ── Daily Breakdown Chart ── */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              Grafik Pendapatan Harian - {months[month - 1]} {year}
            </h3>
            {report.daily_breakdown.length === 0 ? (
              <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                Belum ada data untuk periode ini
              </div>
            ) : (
              <div className="h-48 flex items-end gap-1">
                {report.daily_breakdown.map((day) => {
                  const maxRevenue = Math.max(...report.daily_breakdown.map((d) => d.revenue));
                  const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center"
                      title={`${day.date}: Rp${fmt(day.revenue)} (${day.transactions} tx)`}
                    >
                      <div
                        className="w-full bg-emerald-500 rounded-t hover:bg-emerald-600 transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <span className="text-[10px] text-slate-400 mt-1 rotate-45 origin-left whitespace-nowrap">
                        {day.date.slice(8, 10)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Daily Breakdown Table ── */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Rincian Harian</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 text-sm font-bold text-slate-700">
                    <th className="text-left px-4 py-3">Tanggal</th>
                    <th className="text-right px-4 py-3">Transaksi</th>
                    <th className="text-right px-4 py-3">Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {report.daily_breakdown.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    report.daily_breakdown.map((day, i) => (
                      <tr
                        key={day.date}
                        className={`${
                          i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        } hover:bg-emerald-50/30 transition-colors text-sm`}
                      >
                        <td className="px-4 py-3 text-slate-700">
                          {new Date(day.date + "T00:00:00").toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900">{day.transactions}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          Rp{fmt(day.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Stock Summary ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-700 mb-1">Stok Aman</p>
              <p className="text-2xl font-bold text-emerald-600">{report.stock_summary.in_stock}</p>
              <p className="text-xs text-emerald-500 mt-1">dari {report.stock_summary.total_products} produk</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-700 mb-1">Stok Menipis</p>
              <p className="text-2xl font-bold text-amber-600">{report.stock_summary.low_stock}</p>
              <p className="text-xs text-amber-500 mt-1">Perlu restok segera</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-1">Stok Habis</p>
              <p className="text-2xl font-bold text-red-600">{report.stock_summary.out_of_stock}</p>
              <p className="text-xs text-red-500 mt-1">Produk tidak tersedia</p>
            </div>
          </div>

          {/* ── Products Needing Restock ── */}
          {report.stock_summary.low_stock + report.stock_summary.out_of_stock > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-bold text-red-800 mb-2">
                Produk Perlu Restok
              </h4>
              <p className="text-xs text-red-600">
                {report.stock_summary.low_stock} produk menipis dan {report.stock_summary.out_of_stock} produk habis dari total {report.stock_summary.total_products} produk.
                Kunjungi halaman Kelola Stok untuk detail.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
