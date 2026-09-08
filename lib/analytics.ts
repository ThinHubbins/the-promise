import { createClient } from './supabase/client';

// Matches STEPS in app/dashboard/page.tsx:
// ['Order Placed','Processing','Shipped','Out for Delivery','Delivered']
export const DELIVERED_STEP_INDEX = 4;

export interface SaleItemRecord {
  name: string;
  qty: number;
  price: number;
}

export interface CompletedOrder {
  id: string;
  createdAt: Date;
  amount: number;
  items: SaleItemRecord[];
}

function fromRow(row: any): CompletedOrder {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    amount: Number(row.amount),
    items: (row.order_items ?? []).map((it: any) => ({
      name: it.name,
      qty: it.qty,
      price: Number(it.price),
    })),
  };
}

export async function fetchCompletedOrders(): Promise<CompletedOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, amount, created_at, order_items(name, qty, price)')
    .eq('step_index', DELIVERED_STEP_INDEX)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function fetchOrdersByIds(ids: string[]): Promise<CompletedOrder[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, amount, created_at, step_index, order_items(name, qty, price)')
    .in('id', ids);

  if (error) throw error;
  return (data ?? [])
    .filter((row: any) => row.step_index === DELIVERED_STEP_INDEX)
    .map(fromRow);
}

/* ---------- date helpers ---------- */

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  x.setDate(x.getDate() + diff);
  return x;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/* ---------- aggregations ---------- */

export interface PeriodStats {
  total: number;
  count: number;
  averageOrderValue: number;
}

export function computePeriodStats(orders: CompletedOrder[], from: Date, to: Date): PeriodStats {
  const inRange = orders.filter((o) => o.createdAt >= from && o.createdAt <= to);
  const total = inRange.reduce((sum, o) => sum + o.amount, 0);
  const count = inRange.length;
  return { total, count, averageOrderValue: count > 0 ? total / count : 0 };
}

export function salesByHour(orders: CompletedOrder[], from: Date, to: Date): number[] {
  const buckets = new Array(24).fill(0);
  orders
    .filter((o) => o.createdAt >= from && o.createdAt <= to)
    .forEach((o) => (buckets[o.createdAt.getHours()] += o.amount));
  return buckets;
}

export function salesByDayOfWeek(orders: CompletedOrder[], weekStart: Date): number[] {
  const buckets = new Array(7).fill(0); // 0 = Mon ... 6 = Sun
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  orders
    .filter((o) => o.createdAt >= weekStart && o.createdAt < weekEnd)
    .forEach((o) => {
      const day = o.createdAt.getDay();
      buckets[day === 0 ? 6 : day - 1] += o.amount;
    });
  return buckets;
}

export function salesByDayOfMonth(orders: CompletedOrder[], monthStart: Date): number[] {
  const buckets = new Array(daysInMonth(monthStart)).fill(0);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  orders
    .filter((o) => o.createdAt >= monthStart && o.createdAt < monthEnd)
    .forEach((o) => (buckets[o.createdAt.getDate() - 1] += o.amount));
  return buckets;
}

export function salesByMonth(orders: CompletedOrder[], yearStart: Date): number[] {
  const buckets = new Array(12).fill(0);
  const yearEnd = new Date(yearStart.getFullYear() + 1, 0, 1);
  orders
    .filter((o) => o.createdAt >= yearStart && o.createdAt < yearEnd)
    .forEach((o) => (buckets[o.createdAt.getMonth()] += o.amount));
  return buckets;
}

export interface BestSellerRow {
  name: string;
  qty: number;
  revenue: number;
}

export function bestSellingItems(
  orders: CompletedOrder[],
  from?: Date,
  to?: Date,
  limit = 10
): BestSellerRow[] {
  const inRange = orders.filter((o) => (!from || o.createdAt >= from) && (!to || o.createdAt <= to));
  const map = new Map<string, BestSellerRow>();
  inRange.forEach((o) =>
    o.items.forEach((it) => {
      const row = map.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
      row.qty += it.qty;
      row.revenue += it.qty * it.price;
      map.set(it.name, row);
    })
  );
  return Array.from(map.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

export interface PeakHourRow {
  hour: number;
  label: string;
  count: number;
}

function hourLabel(hour: number): string {
  const startH = hour % 12 === 0 ? 12 : hour % 12;
  const startP = hour < 12 ? 'AM' : 'PM';
  const endRaw = (hour + 1) % 24;
  const endH = endRaw % 12 === 0 ? 12 : endRaw % 12;
  const endP = endRaw < 12 ? 'AM' : 'PM';
  return `${startH} ${startP} - ${endH} ${endP}`;
}

export function peakOrderingHours(orders: CompletedOrder[], from?: Date, to?: Date): PeakHourRow[] {
  const counts = new Array(24).fill(0);
  orders
    .filter((o) => (!from || o.createdAt >= from) && (!to || o.createdAt <= to))
    .forEach((o) => counts[o.createdAt.getHours()]++);
  return counts
    .map((count, hour) => ({ hour, label: hourLabel(hour), count }))
    .sort((a, b) => b.count - a.count);
}