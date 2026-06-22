"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiGetProducts, apiAddToCart, apiUpdateCartItem, apiRemoveCartItem, apiClearCart, apiGetCart, apiCreateTransaction, apiGetReceipt, fmt } from "@/lib/api";
import type { Product, Cart } from "@/lib/types";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, X, AlertTriangle } from "lucide-react";

export default function TransaksiPage() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, item_count: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  const [showPayment, setShowPayment] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [completedTx, setCompletedTx] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const payInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setProductLoading(true);
    const [pRes, cRes] = await Promise.all([apiGetProducts(), apiGetCart()]);
    if (pRes.success && pRes.data) setProducts(pRes.data.products);
    if (cRes.success && cRes.data) setCart(cRes.data);
    setProductLoading(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "F9" || (e.ctrlKey && e.key === "b")) { e.preventDefault(); if (cart.items.length > 0) setShowPayment(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart.items.length]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddToCart(product: Product) {
    if (product.stock_quantity === 0) return;
    setAddingIds((prev) => new Set(prev).add(product.id));
    const res = await apiAddToCart(product.id, 1);
    if (res.success && res.data) setCart(res.data);
    setAddingIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; });
  }

  async function handleUpdateQty(product_id: number, delta: number) {
    const item = cart.items.find((c) => c.product_id === product_id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      const res = await apiRemoveCartItem(product_id);
      if (res.success && res.data) setCart(res.data);
    } else {
      const res = await apiUpdateCartItem(product_id, newQty);
      if (res.success && res.data) setCart(res.data);
    }
  }

  async function handleRemoveItem(product_id: number) {
    const res = await apiRemoveCartItem(product_id);
    if (res.success && res.data) setCart(res.data);
  }

  async function handleClearCart() {
    const res = await apiClearCart();
    if (res.success && res.data) setCart(res.data);
    setShowClearConfirm(false);
  }

  async function handlePay() {
    setPayError("");
    const paid = parseInt(amountPaid.replace(/\D/g, ""), 10);
    if (isNaN(paid) || paid <= 0) {
      setPayError("Jumlah bayar harus diisi dengan angka");
      return;
    }
    if (paid < cart.total) {
      setPayError(`Uang tidak mencukupi. Total: Rp${fmt(cart.total)}`);
      return;
    }
    setPaying(true);
    const res = await apiCreateTransaction({
      amount_paid: paid,
      items: cart.items.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
    });
    setPaying(false);
    if (res.success && res.data) {
      setCompletedTx(res.data.id);
      setCart({ items: [], total: 0, item_count: 0 });
      setAmountPaid("");
      setShowPayment(false);
      loadData();
    } else {
      setPayError(res.message);
    }
  }

  async function handlePrintReceipt() {
    if (!completedTx) return;
    const res = await apiGetReceipt(completedTx);
    if (res.success && res.data) {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`<!DOCTYPE html><html><head><title>Cetak Struk</title></head><body>${res.data.receipt_html}</body></html>`);
        win.document.close();
        win.print();
      }
    }
    setCompletedTx(null);
  }

  const changeAmount = parseInt(amountPaid.replace(/\D/g, ""), 10) - cart.total;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Terminal POS Transaksi
      </h2>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* ── Product Catalog ── */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col min-h-0">
          <div className="relative mb-4 shrink-0">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk... (F2)"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {productLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={24} className="animate-spin text-emerald-600" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Search size={48} className="mb-3" />
                <p className="text-sm mb-1">Produk tidak ditemukan</p>
                <p className="text-xs text-slate-400 max-w-xs text-center">
                  Pastikan ejaan nama barang sudah benar atau daftarkan produk baru di menu Kelola Stok.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((product) => {
                  const isOut = product.stock_quantity === 0;
                  const isAdding = addingIds.has(product.id);
                  return (
                    <div
                      key={product.id}
                      className={`border rounded-lg overflow-hidden shadow-sm transition-all ${
                        isOut ? "border-red-200 opacity-70" : "border-slate-200 hover:shadow-md"
                      }`}
                    >
                      <div className="h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        {product.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                        <p className="text-base font-bold text-emerald-600">Rp{fmt(product.price)}</p>
                        <StockBadge stock={product.stock_quantity} />
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isOut || isAdding}
                        className="w-full py-2 bg-emerald-600 text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] transition-all disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        {isAdding ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Plus size={16} />
                        )}
                        {isAdding ? "..." : "Tambah"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Cart Panel ── */}
        <div className="w-full lg:w-80 bg-white rounded-lg border border-slate-200 shadow-md p-4 flex flex-col shrink-0 max-h-[600px] lg:max-h-none">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ShoppingCart size={18} />
            Keranjang Belanja
            {cart.item_count > 0 && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-auto">
                {cart.item_count}
              </span>
            )}
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <ShoppingCart size={32} className="mb-2" />
                <p className="text-xs">Belum ada item</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-sm font-bold text-emerald-600">Rp{fmt(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleUpdateQty(item.product_id, -1)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(item.product_id, 1)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.product_id)}
                    className="p-1.5 rounded hover:bg-red-100 text-red-500 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 pt-4 mt-4 space-y-3 shrink-0">
            <div className="flex justify-between text-lg font-bold text-slate-900">
              <span>Total</span>
              <span className="text-emerald-600">Rp{fmt(cart.total)}</span>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.items.length === 0}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] transition-all shadow-sm disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              Bayar & Cetak Struk (F9)
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={cart.items.length === 0}
              className="w-full py-2 border border-red-500 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              Kosongkan Keranjang
            </button>
          </div>
        </div>
      </div>

      {/* ── Clear Cart Confirmation Modal ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-500 shrink-0" />
              <h3 className="text-lg font-semibold text-slate-900">Kosongkan Keranjang?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Apakah Anda yakin ingin menghapus seluruh isi keranjang belanja saat ini?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleClearCart}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Ya, Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Pembayaran</h3>
              <button
                onClick={() => { setShowPayment(false); setPayError(""); }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

              <div
                className="space-y-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !paying) handlePay();
                }}
              >
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">Total Tagihan</p>
                <p className="text-[32px] font-bold text-emerald-600 leading-tight">Rp{fmt(cart.total)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Jumlah Bayar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">Rp</span>
                  <input
                    ref={payInputRef}
                    type="text"
                    inputMode="numeric"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                  />
                </div>
                {payError && <p className="mt-1 text-xs text-red-500">{payError}</p>}
              </div>

              {parseInt(amountPaid || "0", 10) >= cart.total && cart.total > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-700">Kembalian</p>
                  <p className="text-2xl font-bold text-emerald-600">Rp{fmt(changeAmount)}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowPayment(false); setPayError(""); }}
                  className="px-4 py-2.5 bg-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] transition-all disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {paying && <Loader2 size={18} className="animate-spin" />}
                  {paying ? "Memproses..." : "Bayar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Success + Print Modal ── */}
      {completedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
          onKeyDown={(e) => { if (e.key === "Enter") handlePrintReceipt(); }}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={24} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Transaksi Berhasil!
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Transaksi #{completedTx} telah tercatat.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setCompletedTx(null)}
                className="px-4 py-2.5 bg-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-300 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={handlePrintReceipt}
                className="px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] transition-all"
              >
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Habis</span>;
  if (stock <= 5)
    return <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Sisa {stock}</span>;
  return <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Stok: {stock}</span>;
}
