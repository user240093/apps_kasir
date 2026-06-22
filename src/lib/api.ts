import type {
  ApiResponse,
  User,
  Product,
  Cart,
  CartItem,
  Transaction,
  DailyReport,
  MonthlyReport,
  ReceiptData,
  StockAlert,
} from "./types";

function delay(ms: number = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function sanitizeName(name: string): string {
  return name.replace(/<[^>]*>/g, "").trim();
}

function fmt(price: number): string {
  return price.toLocaleString("id-ID");
}

const stored = typeof window !== "undefined" ? localStorage.getItem("pos_data") : null;
const initialData: {
  products: Product[];
  transactions: Transaction[];
  cart: CartItem[];
} = stored
  ? (() => {
      const parsed = JSON.parse(stored);
      const seen = new Map<number, Product>();
      parsed.products.forEach((p: Product) => seen.set(p.id, p));
      parsed.products = Array.from(seen.values());
      const seenCart = new Map<number, CartItem>();
      parsed.cart.forEach((c: CartItem) => seenCart.set(c.product_id, c));
      parsed.cart = Array.from(seenCart.values());
      return parsed;
    })()
  : {
      products: [
        { id: 1, name: "Kopi Susu", price: 15000, stock_quantity: 50, is_available: true, created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-15T10:00:00Z" },
        { id: 2, name: "Teh Manis", price: 10000, stock_quantity: 30, is_available: true },
        { id: 3, name: "Roti Bakar", price: 15000, stock_quantity: 20, is_available: true },
        { id: 4, name: "Nasi Goreng", price: 25000, stock_quantity: 15, is_available: true },
        { id: 5, name: "Air Mineral", price: 5000, stock_quantity: 0, is_available: false },
        { id: 6, name: "Mie Goreng", price: 12000, stock_quantity: 25, is_available: true },
        { id: 7, name: "Jus Jeruk", price: 12000, stock_quantity: 3, is_available: true },
        { id: 8, name: "Kentang Goreng", price: 18000, stock_quantity: 0, is_available: false },
        { id: 9, name: "Es Campur", price: 15000, stock_quantity: 10, is_available: true },
        { id: 10, name: "Pisang Goreng", price: 8000, stock_quantity: 40, is_available: true },
      ],
      transactions: [
        { id: 100, total_amount: 45000, amount_paid: 50000, change_amount: 5000, transaction_date: "2026-06-16T08:15:00Z", status: "completed", items: [{ product_id: 1, name: "Kopi Susu", quantity: 2, unit_price: 15000, subtotal: 30000 }, { product_id: 3, name: "Roti Bakar", quantity: 1, unit_price: 15000, subtotal: 15000 }], item_count: 2 },
        { id: 99, total_amount: 25000, amount_paid: 25000, change_amount: 0, transaction_date: "2026-06-16T09:30:00Z", status: "completed", items: [{ product_id: 2, name: "Teh Manis", quantity: 2, unit_price: 10000, subtotal: 20000 }, { product_id: 6, name: "Mie Goreng", quantity: 1, unit_price: 12000, subtotal: 12000 }], item_count: 2 },
        { id: 98, total_amount: 50000, amount_paid: 60000, change_amount: 10000, transaction_date: "2026-06-16T10:00:00Z", status: "completed", items: [{ product_id: 4, name: "Nasi Goreng", quantity: 2, unit_price: 25000, subtotal: 50000 }], item_count: 1 },
        { id: 97, total_amount: 18000, amount_paid: 20000, change_amount: 2000, transaction_date: "2026-06-16T11:45:00Z", status: "completed", items: [{ product_id: 8, name: "Kentang Goreng", quantity: 1, unit_price: 18000, subtotal: 18000 }], item_count: 1 },
        { id: 96, total_amount: 32000, amount_paid: 35000, change_amount: 3000, transaction_date: "2026-06-15T14:00:00Z", status: "completed", items: [{ product_id: 7, name: "Jus Jeruk", quantity: 1, unit_price: 12000, subtotal: 12000 }, { product_id: 10, name: "Pisang Goreng", quantity: 2, unit_price: 8000, subtotal: 16000 }], item_count: 2 },
        { id: 95, total_amount: 10000, amount_paid: 10000, change_amount: 0, transaction_date: "2026-06-15T15:30:00Z", status: "completed", items: [{ product_id: 2, name: "Teh Manis", quantity: 1, unit_price: 10000, subtotal: 10000 }], item_count: 1 },
      ],
      cart: [],
    };

const db = { ...initialData };

let productIdCounter = (() => {
  const max = initialData.products.reduce((m, p) => Math.max(m, p.id), 0);
  return Math.max(max, 10);
})();
let transactionIdCounter = (() => {
  const max = initialData.transactions.reduce((m, t) => Math.max(m, t.id), 0);
  return Math.max(max, 100);
})();

function save() {
  try { localStorage.setItem("pos_data", JSON.stringify({ products: db.products, transactions: db.transactions, cart: db.cart })); } catch {}
}

// ─── Auth ───────────────────────────────────────────────────────────────────

let currentUser: User | null = (() => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("pos_user");
    return stored ? JSON.parse(stored) : null;
  }
  return null;
})();

export async function apiLogin(
  username: string,
  password: string
): Promise<ApiResponse<{ token: string; user: User }>> {
  await delay(600);
  if (!username.trim() || !password.trim()) {
    return { success: false, data: null, message: "Validation failed", errors: [] };
  }
  if (username === "kasir" && password === "kasir123") {
    const user: User = { id: 1, username: "kasir", full_name: "Kasir Utama", role: "kasir" };
    const token = "dummy_token_" + Date.now();
    currentUser = user;
    if (typeof window !== "undefined") {
      localStorage.setItem("pos_token", token);
      localStorage.setItem("pos_user", JSON.stringify(user));
    }
    return { success: true, data: { token, user }, message: "Login successful" };
  }
  return { success: false, data: null, message: "Username atau password salah", errors: [] };
}

export function apiLogout(): void {
  currentUser = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_user");
  }
}

export function apiGetCurrentUser(): User | null {
  return currentUser;
}

// ─── Products ───────────────────────────────────────────────────────────────

export async function apiGetProducts(
  search?: string
): Promise<ApiResponse<{ products: Product[]; total: number }>> {
  await delay(300);
  let list = db.products;
  if (search?.trim()) {
    const q = search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }
  return {
    success: true,
    data: { products: list, total: list.length },
    message: "Success",
  };
}

export async function apiGetProductStock(
  id: number
): Promise<ApiResponse<{ id: number; name: string; stock_quantity: number; is_available: boolean }>> {
  await delay(200);
  const p = db.products.find((x) => x.id === id);
  if (!p) return { success: false, data: null, message: "Produk tidak ditemukan" };
  return { success: true, data: { id: p.id, name: p.name, stock_quantity: p.stock_quantity, is_available: p.is_available }, message: "Success" };
}

export async function apiCreateProduct(data: {
  name: string;
  price: number;
  stock_quantity: number;
}): Promise<ApiResponse<Product>> {
  await delay(500);
  const cleanName = sanitizeName(data.name);
  const dup = db.products.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
  if (dup) {
    return { success: false, data: null, message: "Nama produk sudah ada", errors: [] };
  }
  if (!cleanName) {
    return { success: false, data: null, message: "Validation failed", errors: [{ field: "name", message: "Nama produk harus diisi" }] };
  }
  if (data.price < 0) {
    return { success: false, data: null, message: "Validation failed", errors: [{ field: "price", message: "Harga jual tidak boleh negatif" }] };
  }
  if (data.stock_quantity < 0) {
    return { success: false, data: null, message: "Validation failed", errors: [{ field: "stock", message: "Stok awal tidak boleh negatif" }] };
  }
  productIdCounter++;
  const now = new Date().toISOString();
  const product: Product = {
    id: productIdCounter,
    name: cleanName,
    price: data.price,
    stock_quantity: data.stock_quantity,
    is_available: data.stock_quantity > 0,
    created_at: now,
    updated_at: now,
  };
  db.products.push(product);
  save();
  return { success: true, data: product, message: "Produk berhasil ditambahkan" };
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export async function apiGetCart(): Promise<ApiResponse<Cart>> {
  await delay(150);
  const items = db.cart;
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  return {
    success: true,
    data: { items, total, item_count: items.length },
    message: "Success",
  };
}

export async function apiAddToCart(
  product_id: number,
  quantity: number = 1
): Promise<ApiResponse<Cart>> {
  await delay(200);
  const product = db.products.find((p) => p.id === product_id);
  if (!product) return { success: false, data: null, message: "Produk tidak ditemukan" };
  if (product.stock_quantity < quantity) {
    return { success: false, data: null, message: "Stok tidak cukup" };
  }

  const existing = db.cart.find((c) => c.product_id === product_id);
  if (existing) {
    existing.quantity += quantity;
    existing.subtotal = existing.quantity * existing.price;
  } else {
    db.cart.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      subtotal: product.price * quantity,
    });
  }
  save();
  const total = db.cart.reduce((s, i) => s + i.subtotal, 0);
  return {
    success: true,
    data: { items: db.cart, total, item_count: db.cart.length },
    message: "Item added to cart",
  };
}

export async function apiUpdateCartItem(
  product_id: number,
  quantity: number
): Promise<ApiResponse<Cart>> {
  await delay(150);
  const item = db.cart.find((c) => c.product_id === product_id);
  if (!item) return { success: false, data: null, message: "Item tidak ditemukan di keranjang" };

  const product = db.products.find((p) => p.id === product_id);
  if (product && quantity > product.stock_quantity) {
    return { success: false, data: null, message: "Stok tidak cukup" };
  }

  if (quantity < 1) {
    db.cart = db.cart.filter((c) => c.product_id !== product_id);
  } else {
    item.quantity = quantity;
    item.subtotal = quantity * item.price;
  }
  save();
  const total = db.cart.reduce((s, i) => s + i.subtotal, 0);
  return {
    success: true,
    data: { items: db.cart, total, item_count: db.cart.length },
    message: "Cart updated",
  };
}

export async function apiRemoveCartItem(
  product_id: number
): Promise<ApiResponse<Cart>> {
  await delay(150);
  db.cart = db.cart.filter((c) => c.product_id !== product_id);
  save();
  const total = db.cart.reduce((s, i) => s + i.subtotal, 0);
  return {
    success: true,
    data: { items: db.cart, total, item_count: db.cart.length },
    message: "Item removed from cart",
  };
}

export async function apiClearCart(): Promise<ApiResponse<Cart>> {
  await delay(150);
  db.cart = [];
  save();
  return {
    success: true,
    data: { items: [], total: 0, item_count: 0 },
    message: "Cart cleared",
  };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function apiCreateTransaction(data: {
  amount_paid: number;
  items: { product_id: number; quantity: number }[];
}): Promise<ApiResponse<Transaction>> {
  await delay(700);
  if (db.cart.length === 0) {
    return { success: false, data: null, message: "Cart is empty" };
  }
  if (data.amount_paid < data.items.reduce((s, i) => {
    const p = db.products.find((x) => x.id === i.product_id);
    return s + (p ? p.price * i.quantity : 0);
  }, 0)) {
    return { success: false, data: null, message: "Uang tidak mencukupi" };
  }

  transactionIdCounter++;
  const now = new Date().toISOString();
  const items = db.cart.map((c) => {
    const prod = db.products.find((p) => p.id === c.product_id);
    if (prod) {
      prod.stock_quantity -= c.quantity;
      if (prod.stock_quantity < 0) prod.stock_quantity = 0;
      prod.is_available = prod.stock_quantity > 0;
      prod.updated_at = now;
    }
    return {
      product_id: c.product_id,
      name: c.name,
      quantity: c.quantity,
      unit_price: c.price,
      subtotal: c.subtotal,
    };
  });

  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const transaction: Transaction = {
    id: transactionIdCounter,
    total_amount: total,
    amount_paid: data.amount_paid,
    change_amount: data.amount_paid - total,
    transaction_date: now,
    status: "completed",
    items,
    item_count: items.length,
  };

  db.transactions.unshift(transaction);
  db.cart = [];
  save();
  return { success: true, data: transaction, message: "Transaction completed" };
}

export async function apiGetTransaction(
  id: number
): Promise<ApiResponse<Transaction>> {
  await delay(200);
  const t = db.transactions.find((x) => x.id === id);
  if (!t) return { success: false, data: null, message: "Transaksi tidak ditemukan" };
  return { success: true, data: t, message: "Success" };
}

export async function apiGetReceipt(
  id: number
): Promise<ApiResponse<ReceiptData>> {
  await delay(300);
  const t = db.transactions.find((x) => x.id === id);
  if (!t) return { success: false, data: null, message: "Transaksi tidak ditemukan" };
  const receiptHtml = generateReceiptHtml(t);
  return {
    success: true,
    data: {
      transaction: {
        id: t.id,
        transaction_date: t.transaction_date,
        total_amount: t.total_amount,
        amount_paid: t.amount_paid,
        change_amount: t.change_amount,
      },
      store: { name: "Toko Sederhana", address: "Jl. Contoh No. 123", phone: "081234567890" },
      items: t.items,
      receipt_html: receiptHtml,
    },
    message: "Success",
  };
}

function generateReceiptHtml(t: Transaction): string {
  const date = new Date(t.transaction_date);
  const dateStr = date.toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit" });
  const timeStr = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const itemsHtml = t.items
    .map(
      (i) =>
        `<tr><td>${i.name} x${i.quantity}</td><td style="text-align:right">${fmt(i.subtotal)}</td></tr>`
    )
    .join("");

  return `
    <div class="receipt" style="width:80mm;font-family:monospace;font-size:12px;padding:8px">
      <div style="text-align:center;margin-bottom:8px">
        <strong>TOKO SEDERHANA</strong><br>
        Jl. Contoh No. 123<br>
        Telp: 081234567890
      </div>
      <div style="border-top:1px dashed #000;margin:8px 0"></div>
      <div>No: #${t.id}</div>
      <div>Tgl: ${dateStr} ${timeStr}</div>
      <div style="border-top:1px dashed #000;margin:8px 0"></div>
      <table style="width:100%;font-size:11px">${itemsHtml}</table>
      <div style="border-top:1px dashed #000;margin:8px 0"></div>
      <table style="width:100%;font-weight:bold">
        <tr><td>TOTAL</td><td style="text-align:right">${fmt(t.total_amount)}</td></tr>
        <tr><td>BAYAR</td><td style="text-align:right">${fmt(t.amount_paid)}</td></tr>
        <tr><td>KEMBALI</td><td style="text-align:right">${fmt(t.change_amount)}</td></tr>
      </table>
      <div style="border-top:1px dashed #000;margin:8px 0"></div>
      <div style="text-align:center;font-size:10px">Terima kasih atas kunjungan Anda</div>
    </div>`;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function apiGetDailyReport(
  date?: string
): Promise<ApiResponse<DailyReport>> {
  await delay(500);
  const today = date || new Date().toISOString().slice(0, 10);
  const dayTx = db.transactions.filter((t) => t.transaction_date?.startsWith(today));
  const totalRevenue = dayTx.reduce((s, t) => s + t.total_amount, 0);
  const totalItems = dayTx.reduce((s, t) => s + (t.item_count || 0), 0);

  const allInventory: StockAlert[] = db.products.map((p) => ({
    product_id: p.id,
    name: p.name,
    stock_quantity: p.stock_quantity,
    status: p.stock_quantity === 0 ? "out_of_stock" : p.stock_quantity <= 5 ? "low" : "normal",
  }));

  const stockInventory = [...allInventory]
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .map((item) => {
      const product = db.products.find((p) => p.id === item.product_id);
      return { ...item, price: product ? product.price : 0 };
    });

  return {
    success: true,
    data: {
      date: today,
      kpi: {
        total_revenue: totalRevenue,
        total_transactions: dayTx.length,
        average_transaction: dayTx.length > 0 ? Math.round(totalRevenue / dayTx.length) : 0,
        total_items_sold: totalItems,
      },
      transactions: dayTx.map((t) => ({ ...t, item_count: t.item_count || t.items.length })),
      stock_alerts: allInventory.filter((a) => a.status !== "normal"),
      stock_inventory: stockInventory,
    },
    message: "Success",
  };
}

export async function apiGetMonthlyReport(
  month?: number,
  year?: number
): Promise<ApiResponse<MonthlyReport>> {
  await delay(600);
  const m = month ?? new Date().getMonth() + 1;
  const y = year ?? new Date().getFullYear();

  const filteredTx = db.transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getMonth() + 1 === m && d.getFullYear() === y;
  });

  const totalRevenue = filteredTx.reduce((s, t) => s + t.total_amount, 0);
  const totalItems = filteredTx.reduce((s, t) => s + (t.item_count || t.items.length), 0);

  const dailyMap = new Map<string, { transactions: number; revenue: number }>();
  filteredTx.forEach((t) => {
    const day = t.transaction_date.slice(0, 10);
    const cur = dailyMap.get(day) || { transactions: 0, revenue: 0 };
    cur.transactions++;
    cur.revenue += t.total_amount;
    dailyMap.set(day, cur);
  });

  const inStock = db.products.filter((p) => p.stock_quantity > 5).length;
  const lowStock = db.products.filter((p) => p.stock_quantity >= 1 && p.stock_quantity <= 5).length;
  const outOfStock = db.products.filter((p) => p.stock_quantity === 0).length;

  return {
    success: true,
    data: {
      filters: { month: m, year: y },
      kpi: {
        total_revenue: totalRevenue,
        total_transactions: filteredTx.length,
        average_per_day: dailyMap.size > 0 ? Math.round(totalRevenue / dailyMap.size) : 0,
        total_items_sold: totalItems,
      },
      monthly_data: [
        {
          month: `${y}-${String(m).padStart(2, "0")}`,
          total_transactions: filteredTx.length,
          total_revenue: totalRevenue,
          total_items_sold: totalItems,
        },
      ],
      daily_breakdown: Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      stock_summary: {
        total_products: db.products.length,
        in_stock: inStock,
        low_stock: lowStock,
        out_of_stock: outOfStock,
      },
    },
    message: "Success",
  };
}

export { fmt };
