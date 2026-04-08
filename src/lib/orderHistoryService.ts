// Order History localStorage service

export type OrderType = "flyer" | "ad" | "media";
export type OrderStatus = "completed" | "pending" | "cancelled";

export interface OrderRecord {
  id: string;
  orderNumber: string;
  date: string;
  type: OrderType;
  storeName: string;
  totalCost: number;
  status: OrderStatus;
  // Details
  areas?: { areaName: string; quantity?: number; priority?: string }[];
  mediaIncluded?: string[];
  quantities?: Record<string, number>;
  costs?: Record<string, number>;
  // Metadata
  clientCompany?: string;
  vendorCompany?: string;
  notes?: string;
}

const STORAGE_KEY = "mapboost_orders";

function readOrders(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OrderRecord[];
  } catch {
    return [];
  }
}

function writeOrders(orders: OrderRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function saveOrder(order: OrderRecord): void {
  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);
}

export function getOrders(): OrderRecord[] {
  return readOrders();
}

export function getOrder(id: string): OrderRecord | undefined {
  return readOrders().find((o) => o.id === id);
}
