export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

export interface TransactionItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Transaction {
  id: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  transaction_date: string;
  status: string;
  items: TransactionItem[];
  item_count?: number;
}

export interface ReceiptData {
  transaction: {
    id: number;
    transaction_date: string;
    total_amount: number;
    amount_paid: number;
    change_amount: number;
  };
  store: {
    name: string;
    address: string;
    phone: string;
  };
  items: TransactionItem[];
  receipt_html: string;
}

export interface DailyReport {
  date: string;
  kpi: {
    total_revenue: number;
    total_transactions: number;
    average_transaction: number;
    total_items_sold: number;
  };
  transactions: Transaction[];
  stock_alerts: StockAlert[];
  stock_inventory: StockInventoryItem[];
}

export interface StockInventoryItem {
  product_id: number;
  name: string;
  price: number;
  stock_quantity: number;
  status: "normal" | "low" | "out_of_stock";
}

export interface StockAlert {
  product_id: number;
  name: string;
  stock_quantity: number;
  status: "normal" | "low" | "out_of_stock";
}

export interface MonthlyReport {
  filters: {
    month: number;
    year: number;
  };
  kpi: {
    total_revenue: number;
    total_transactions: number;
    average_per_day: number;
    total_items_sold: number;
  };
  monthly_data: {
    month: string;
    total_transactions: number;
    total_revenue: number;
    total_items_sold: number;
  }[];
  daily_breakdown: {
    date: string;
    transactions: number;
    revenue: number;
  }[];
  stock_summary: {
    total_products: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors?: { field?: string; message: string }[];
}
