import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-200 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/transaksi"
          className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 active:bg-emerald-800 active:scale-[0.98] transition-all shadow-sm"
        >
          Kembali ke Transaksi
        </Link>
      </div>
    </div>
  );
}
