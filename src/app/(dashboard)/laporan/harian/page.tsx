"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiGetDailyReport, apiGetTransaction, fmt } from "@/lib/api";
import type { DailyReport, Transaction } from "@/lib/types";
import { Loader2, X, AlertTriangle } from "lucide-react";

export default function LaporanHarianPage() {
  const { isAuthenticated } = useAuth();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiGetDailyReport();
    if (res.success && res.data) setReport(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [isAuthenticated, load]);

  async function handleViewDetail(id: number) {
    setDetailLoading(true);
    const res = await apiGetTransaction(id);
    if (res.success && res.data) setDetailTx(res.data);
    setDetailLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Laporan Pendapatan & Stok Harian
      </h2>

      <p className="text-sm text-slate-500 mb-4">{today}</p>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Pendapatan"
          value={`Rp${report ? fmt(report.kpi.total_revenue) : "0"}`}
          color="text-emerald-600"
        />
        <KpiCard
          label="Jumlah Transaksi"
          value={String(report?.kpi.total_transactions ?? 0)}
          color="text-blue-600"
        />
        <KpiCard
          label="Rata-rata Transaksi"
          value={`Rp${report ? fmt(report.kpi.average_transaction) : "0"}`}
          color="text-slate-900"
        />
        <KpiCard
          label="Item Terjual"
          value={String(report?.kpi.total_items_sold ?? 0)}
          color="text-purple-600"
        />
      </div>

      {/* ── Stock Alerts ── */}
      {report && report.stock_alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <h4 className="text-sm font-bold text-red-800">Produk Perlu Perhatian</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.stock_alerts.map((a) => (
              <span
                key={a.product_id}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  a.status === "out_of_stock"
                    ? "bg-red-200 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {a.name} (Stok: {a.stock_quantity})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Stock Inventory Table ── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Inventaris Stok Barang
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 text-sm font-bold text-slate-700">
                <th className="text-left px-4 py-3">Nama Barang</th>
                <th className="text-right px-4 py-3">Harga Jual</th>
                <th className="text-center px-4 py-3">Sisa Stok</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {report && report.stock_inventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Tidak ada data produk
                  </td>
                </tr>
              ) : (
                report?.stock_inventory.map((item, i) => (
                  <tr
                    key={item.product_id}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    } hover:bg-emerald-50/30 transition-colors text-sm`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      Rp{fmt(item.price)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-900">
                      {item.stock_quantity}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StockBadge stock={item.stock_quantity} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transaction Table ── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Daftar Transaksi Hari Ini
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 text-sm font-bold text-slate-700">
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Waktu</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Item</th>
                <th className="text-center px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!report || report.transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Tidak ada data transaksi hari ini
                  </td>
                </tr>
              ) : (
                report.transactions.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    } hover:bg-emerald-50/30 transition-colors text-sm cursor-pointer`}
                    onClick={() => handleViewDetail(tx.id)}
                  >
                    <td className="px-4 py-3 font-mono text-slate-500">#{tx.id}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(tx.transaction_date).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      Rp{fmt(tx.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {tx.item_count || tx.items.length}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-emerald-600 font-medium">Detail</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transaction Detail Modal ── */}
      {detailTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Detail Transaksi #{detailTx.id}
              </h3>
              <button
                onClick={() => setDetailTx(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-emerald-600" />
              </div>
            ) : (
              <>
                <div className="text-sm text-slate-500 mb-4">
                  {new Date(detailTx.transaction_date).toLocaleString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="bg-slate-100 text-xs font-bold text-slate-700">
                      <th className="text-left px-3 py-2">Produk</th>
                      <th className="text-center px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Harga</th>
                      <th className="text-right px-3 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailTx.items.map((item) => (
                      <tr key={item.product_id} className="border-b border-slate-100">
                        <td className="px-3 py-2 font-medium">{item.name}</td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">Rp{fmt(item.unit_price)}</td>
                        <td className="px-3 py-2 text-right font-semibold">Rp{fmt(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-slate-200 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total</span>
                    <span className="font-bold text-emerald-600">Rp{fmt(detailTx.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bayar</span>
                    <span>Rp{fmt(detailTx.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kembali</span>
                    <span className="font-medium">Rp{fmt(detailTx.change_amount)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
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

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Habis</span>;
  if (stock <= 5)
    return <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Menipis</span>;
  return <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Aman</span>;
}
