"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, checkIsAdmin, adminSignOut } from "../../lib/admin";
import { createClient } from "../../lib/supabase/client";
import {
  fetchCompletedOrders,
  fetchOrdersByIds,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  computePeriodStats,
  salesByHour,
  salesByDayOfWeek,
  salesByDayOfMonth,
  salesByMonth,
  bestSellingItems,
  peakOrderingHours,
  type CompletedOrder,
} from "../../lib/analytics";
import SalesBarChart from "../../components/admin/SalesBarChart";
import Link from "next/link";

function formatNaira(n: number): string {
  return "\u20A6" + n.toLocaleString("en-NG");
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function hourLabelShort(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
}

type FilterPreset = "all" | "today" | "week" | "month" | "year" | "custom";

export default function AdminAnalyticsPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filterPreset, setFilterPreset] = useState<FilterPreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return router.replace("/admin/login");
        const ok = await checkIsAdmin(user.id);
        if (!ok) {
          await adminSignOut();
          return router.replace("/admin/login");
        }
        setCheckingAuth(false);
      } catch {
        router.replace("/admin/login");
      }
    })();
  }, [router]);

  async function loadOrders() {
    setLoadingOrders(true);
    setLoadError(null);
    try {
      setOrders(await fetchCompletedOrders());
    } catch (err) {
      console.error("Failed to load sales data", err);
      setLoadError("Could not load sales data. Please try again.");
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    if (!checkingAuth) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth]);

  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (checkingAuth) return;

    const supabase = createClient();
    const pendingIds = new Set<string>();
    const deletedIds = new Set<string>();
    let flushTimer: ReturnType<typeof setTimeout>;

    async function flush() {
      const idsToFetch = Array.from(pendingIds);
      const idsToRemove = Array.from(deletedIds);
      pendingIds.clear();
      deletedIds.clear();

      try {
        const updated =
          idsToFetch.length > 0 ? await fetchOrdersByIds(idsToFetch) : [];
        const updatedMap = new Map(updated.map((o) => [o.id, o]));

        setOrders((prev) => {
          const withoutStale = prev.filter(
            (o) =>
              !idsToRemove.includes(o.id) &&
              !(idsToFetch.includes(o.id) && !updatedMap.has(o.id)),
          );
          const withoutTouched = withoutStale.filter(
            (o) => !updatedMap.has(o.id),
          );
          return [...withoutTouched, ...Array.from(updatedMap.values())].sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
          );
        });
      } catch (err) {
        console.error("Realtime sync failed, will retry on next event", err);
      }
    }

    function scheduleFlush() {
      clearTimeout(flushTimer);
      flushTimer = setTimeout(flush, 1500);
    }

    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as any)?.id;
            if (oldId) deletedIds.add(oldId);
          } else {
            const newId = (payload.new as any)?.id;
            if (newId) pendingIds.add(newId);
          }
          scheduleFlush();
        },
      )
      .subscribe((status) => setIsLive(status === "SUBSCRIBED"));

    return () => {
      clearTimeout(flushTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth]);

  if (checkingAuth) {
    return (
      <main>
        <div className="wrap admin-loading-wrap">
          <p>Checking access…</p>
        </div>
      </main>
    );
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const dayStats = computePeriodStats(orders, todayStart, now);
  const weekStats = computePeriodStats(orders, weekStart, now);
  const monthStats = computePeriodStats(orders, monthStart, now);
  const yearStats = computePeriodStats(orders, yearStart, now);

  const hourlyData = salesByHour(orders, todayStart, now);
  const weeklyData = salesByDayOfWeek(orders, weekStart);
  const monthlyData = salesByDayOfMonth(orders, monthStart);
  const yearlyData = salesByMonth(orders, yearStart);
  const hourlyLabels = hourlyData.map((_, h) => hourLabelShort(h));
  const monthlyLabels = monthlyData.map((_, i) => String(i + 1));

  let filterFrom: Date | undefined;
  let filterTo: Date | undefined;
  if (filterPreset === "today") {
    filterFrom = todayStart;
    filterTo = now;
  } else if (filterPreset === "week") {
    filterFrom = weekStart;
    filterTo = now;
  } else if (filterPreset === "month") {
    filterFrom = monthStart;
    filterTo = now;
  } else if (filterPreset === "year") {
    filterFrom = yearStart;
    filterTo = now;
  } else if (filterPreset === "custom") {
    filterFrom = customFrom ? new Date(customFrom) : undefined;
    filterTo = customTo
      ? new Date(new Date(customTo).setHours(23, 59, 59, 999))
      : undefined;
  }

  const bestSellers = bestSellingItems(orders, filterFrom, filterTo, 10);
  const peakHours = peakOrderingHours(orders, filterFrom, filterTo).slice(0, 6);

  async function handleSignOut() {
    await adminSignOut();
    router.push("/admin/login");
  }

  return (
    <main>
      <div className="wrap admin-wrap">
        <div className="admin-header">
          <div>
            <span className="section-tag">The Promise Admin</span>
            <h2>Sales Analytics</h2>
            <p>A live snapshot of how the business is performing.</p>
          </div>
          <div className="admin-header-actions">
  <Link href="/admin/feedbacks" className="btn btn-outline btn-sm">Customer Reviews</Link>
  <Link href="/admin/careers" className="btn btn-outline btn-sm">Manage Career</Link>
            <span className={`admin-live-badge${isLive ? " live" : ""}`}>
              <span className="admin-live-dot" />
              {isLive ? "Live" : "Connecting…"}
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={loadOrders}
              disabled={loadingOrders}
            >
              {loadingOrders ? "Refreshing…" : "Refresh"}
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>

        {loadError && (
          <div className="admin-error-banner">
            <p>{loadError}</p>
            <button className="btn btn-outline btn-sm" onClick={loadOrders}>
              Retry
            </button>
          </div>
        )}

        {loadingOrders ? (
          <div className="admin-loading-block">
            <span className="reviews-spinner" />
            <p>Loading sales data…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="dash-empty-card">
            <p>
              No completed orders yet. Once orders are marked Delivered, sales
              analytics will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="dash-section-head-row">
              <h3>Sales</h3>
            </div>
            <div className="dash-stats admin-stats-4">
              <div className="dash-stat-card">
                <span className="dash-stat-label">Today</span>
                <span className="dash-stat-value">
                  {formatNaira(dayStats.total)}
                </span>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-label">This Week</span>
                <span className="dash-stat-value">
                  {formatNaira(weekStats.total)}
                </span>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-label">This Month</span>
                <span className="dash-stat-value">
                  {formatNaira(monthStats.total)}
                </span>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-label">This Year</span>
                <span className="dash-stat-value">
                  {formatNaira(yearStats.total)}
                </span>
              </div>
            </div>

            <div className="dash-section-head-row">
              <h3>Number of Orders</h3>
            </div>
            <div className="dash-stats admin-stats-4">
              <div className="dash-stat-card">
                <span className="dash-stat-label">Today</span>
                <span className="dash-stat-value">{dayStats.count}</span>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-label">This Week</span>
                <span className="dash-stat-value">{weekStats.count}</span>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-label">This Month</span>
                <span className="dash-stat-value">{monthStats.count}</span>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-label">This Year</span>
                <span className="dash-stat-value">{yearStats.count}</span>
              </div>
            </div>

            <div className="dash-section-head-row">
              <h3>Average Order Value</h3>
            </div>
            <div className="dash-stats admin-stats-2">
              <div className="dash-stat-card">
                <span className="dash-stat-label">Today</span>
                <span className="dash-stat-value">
                  {formatNaira(dayStats.averageOrderValue)}
                </span>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-label">This Month</span>
                <span className="dash-stat-value">
                  {formatNaira(monthStats.averageOrderValue)}
                </span>
              </div>
            </div>

            <div className="dash-section-head-row">
              <h3>Sales by Hour — Today</h3>
            </div>
            <div className="admin-card">
              <SalesBarChart labels={hourlyLabels} data={hourlyData} />
            </div>

            <div className="dash-section-head-row">
              <h3>Sales by Day — This Week</h3>
            </div>
            <div className="admin-card">
              <SalesBarChart
                labels={DAY_LABELS}
                data={weeklyData}
                color="#3b82f6"
              />
            </div>

            <div className="dash-section-head-row">
              <h3>Sales by Day — This Month</h3>
            </div>
            <div className="admin-card">
              <SalesBarChart
                labels={monthlyLabels}
                data={monthlyData}
                color="#10b981"
              />
            </div>

            <div className="dash-section-head-row">
              <h3>Sales by Month — This Year</h3>
            </div>
            <div className="admin-card">
              <SalesBarChart
                labels={MONTH_LABELS}
                data={yearlyData}
                color="#ef4444"
              />
            </div>

            <div className="dash-section-head-row admin-filter-row">
              <h3>Best-Selling Items &amp; Peak Hours</h3>
              <div className="admin-filter-controls">
                <select
                  value={filterPreset}
                  onChange={(e) =>
                    setFilterPreset(e.target.value as FilterPreset)
                  }
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                  <option value="custom">Custom range</option>
                </select>
                {filterPreset === "custom" && (
                  <>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                    <span>to</span>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="admin-card">
              {bestSellers.length === 0 ? (
                <p className="reviews-empty">No sales in this period.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th>Qty Sold</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bestSellers.map((b, i) => (
                        <tr key={b.name}>
                          <td>{i + 1}</td>
                          <td>{b.name}</td>
                          <td>{b.qty}</td>
                          <td>{formatNaira(b.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="dash-section-head-row">
              <h3>Peak Ordering Hours</h3>
            </div>
            <div className="admin-card">
              {peakHours.every((p) => p.count === 0) ? (
                <p className="reviews-empty">No orders in this period.</p>
              ) : (
                <div className="admin-peak-list">
                  {peakHours.map((p) => (
                    <div className="admin-peak-row" key={p.hour}>
                      <span className="admin-peak-label">{p.label}</span>
                      <div className="admin-peak-track">
                        <div
                          className="admin-peak-fill"
                          style={{
                            width: `${peakHours[0].count > 0 ? (p.count / peakHours[0].count) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="admin-peak-count">{p.count} orders</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
