"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiGetProducts, apiCreateProduct, fmt } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Plus, Search, Loader2, X } from "lucide-react";

export default function StokPage() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadProducts = useCallback(async () => {
    const res = await apiGetProducts();
    if (res.success && res.data) setProducts(res.data.products);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, [isAuthenticated, loadProducts]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Manajemen Stok Barang
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] transition-all shadow-sm"
        >
          <Plus size={18} />
          Tambah Barang Baru
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 text-sm font-bold text-slate-700">
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Nama</th>
                <th className="text-right px-4 py-3">Harga Jual</th>
                <th className="text-center px-4 py-3">Stok</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Tidak ada data produk
                  </td>
                </tr>
              ) : (
                filtered.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    } hover:bg-emerald-50/30 transition-colors text-sm`}
                  >
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      PRD{String(item.id).padStart(4, "0")}
                    </td>
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

      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadProducts();
          }}
        />
      )}
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

function AddProductModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; price?: string; stock?: string }>({});
  const [apiError, setApiError] = useState("");

  async function handleSave() {
    setErrors({});
    setApiError("");

    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Nama produk harus diisi";
    const priceNum = price === "" || price === "-" ? NaN : parseInt(price, 10);
    if (isNaN(priceNum)) errs.price = "Harga jual harus diisi";
    else if (priceNum < 0) errs.price = "Harga jual tidak boleh negatif";
    const stockNum = stock === "" || stock === "-" ? NaN : parseInt(stock, 10);
    if (isNaN(stockNum)) errs.stock = "Stok awal harus diisi";
    else if (stockNum < 0) errs.stock = "Stok awal tidak boleh negatif";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const res = await apiCreateProduct({
      name: name.trim(),
      price: priceNum,
      stock_quantity: stockNum,
    });
    setSaving(false);

    if (res.success) {
      onSuccess();
    } else {
      if (res.errors && res.errors.length > 0) {
        const apiErrs: typeof errors = {};
        for (const e of res.errors) {
          if (e.field === "name") apiErrs.name = e.message;
          else if (e.field === "price") apiErrs.price = e.message;
          else if (e.field === "stock") apiErrs.stock = e.message;
        }
        if (Object.keys(apiErrs).length > 0) setErrors(apiErrs);
        else setApiError(res.message);
      } else {
        setApiError(res.message);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Tambah Produk Baru
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {apiError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama produk"
              autoFocus
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                errors.name ? "border-red-500" : "border-slate-300 focus:border-emerald-500"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Harga Jual <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9-]/g, ""))}
                placeholder="0"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                  errors.price ? "border-red-500" : "border-slate-300 focus:border-emerald-500"
                }`}
              />
            </div>
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Stok Awal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={stock}
              onChange={(e) => setStock(e.target.value.replace(/[^0-9-]/g, ""))}
              placeholder="0"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                errors.stock ? "border-red-500" : "border-slate-300 focus:border-emerald-500"
              }`}
            />
            {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-300 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] transition-all disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
