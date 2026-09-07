'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { dishes } from '../../lib/dishes';
import type { CartLine } from '../../lib/types';
import DishIcon from '../../components/DishIcon';

function formatNaira(n: number): string {
  return '\u20A6' + n.toLocaleString('en-NG');
}

/* ---------------- Types ---------------- */

type OrderStatus = 'Order Placed' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered';
const STEPS: OrderStatus[] = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  amount: number;
  date: string;
  stepIndex: number;
  trackingId: string;
  courier: string;
  location: string;
  eta: string;
}

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  isDefault: boolean;
}

const ORDERS_KEY = 'tp_orders';
const ADDRESSES_KEY = 'tp_addresses';

const NAV_ITEMS = [
  { key: 'overview', label: 'Dashboard' },
  { key: 'menu', label: 'Menu' },
  { key: 'orders', label: 'My Orders' },
  { key: 'track', label: 'Track Order' },
  { key: 'addresses', label: 'Saved Addresses' },
  { key: 'profile', label: 'Profile / Account' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'support', label: 'Support' },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]['key'];

/* ---------------- localStorage helpers ---------------- */

function loadOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function loadAddresses(): Address[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY);
    return raw ? (JSON.parse(raw) as Address[]) : [];
  } catch {
    return [];
  }
}

function saveAddresses(addresses: Address[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
}

function makeOrderId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  return `ORD-${y}${m}${day}-${rand}`;
}

/* ================= PAGE ================= */

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const { items: cartItems, total: cartTotal, addToCart, changeQty, removeItem, clearCart } = useCart();

  const [activeNav, setActiveNav] = useState<NavKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    setOrders(loadOrders());
    setAddresses(loadAddresses());
    setHydrated(true);
  }, []);

  // Simulated progression for whichever order isn't delivered yet
  useEffect(() => {
    if (orders.length === 0) return;
    const interval = setInterval(() => {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o.stepIndex < STEPS.length - 1);
        if (idx === -1) return prev;
        const next = prev.map((o, i) =>
          i === idx ? { ...o, stepIndex: Math.min(o.stepIndex + 1, STEPS.length - 1) } : o
        );
        saveOrders(next);
        return next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [orders.length]);

  const activeOrder = useMemo(
    () => orders.find((o) => o.stepIndex < STEPS.length - 1),
    [orders]
  );

  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => o.stepIndex === STEPS.length - 1).length;
    const active = orders.filter((o) => o.stepIndex > 0 && o.stepIndex < STEPS.length - 1).length;
    const pending = orders.filter((o) => o.stepIndex === 0).length;
    return { total, active, delivered, pending };
  }, [orders]);

  function goToNav(key: NavKey) {
    setActiveNav(key);
    setSidebarOpen(false);
  }

  function scrollToTracking(orderId: string) {
    setActiveNav('track');
    setOrders((prev) => {
      const target = prev.find((o) => o.id === orderId);
      if (!target) return prev;
      return [target, ...prev.filter((o) => o.id !== orderId)];
    });
    requestAnimationFrame(() => {
      document.getElementById('active-tracking')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function handleCheckout() {
    if (cartItems.length === 0) return;
    const newOrder: Order = {
      id: makeOrderId(),
      items: cartItems.map((ci) => ({ name: ci.name, qty: ci.qty, price: ci.price })),
      amount: cartTotal,
      date: new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }),
      stepIndex: 0,
      trackingId: `TRK-${Math.floor(10000 + Math.random() * 89999)}`,
      courier: 'Pending assignment',
      location: 'Kitchen — preparing order',
      eta: 'Awaiting confirmation',
    };
    const next = [newOrder, ...orders];
    setOrders(next);
    saveOrders(next);
    clearCart();
    setActiveNav('track');
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  if (loading || !user || !hydrated) {
    return (
      <main>
        <div className="wrap" style={{ paddingTop: 64 }}>
          <p style={{ color: 'var(--ink-soft)' }}>Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="dash-shell">
        <button className="dash-mobile-toggle" onClick={() => setSidebarOpen((v) => !v)}>
          <svg className="icon" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          Menu
        </button>

        {/* Sidebar */}
        <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="dash-user">
            <div className="dash-avatar">{(user.name ?? user.email ?? 'U').charAt(0).toUpperCase()}</div>
            <div>
              <p className="dash-user-name">{user.name ?? 'Welcome'}</p>
              <p className="dash-user-email">{user.email}</p>
            </div>
          </div>

          <nav className="dash-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                className={`dash-nav-link${activeNav === item.key ? ' active' : ''}`}
                onClick={() => goToNav(item.key)}
              >
                {item.label}
                {item.key === 'menu' && cartItems.length > 0 && (
                  <span className="dash-nav-badge">{cartItems.length}</span>
                )}
              </button>
            ))}
          </nav>

          <button className="dash-nav-link dash-logout" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        {/* Main content */}
        <section className="dash-main">
          {activeNav === 'overview' && (
            <OverviewPanel
              user={user}
              stats={stats}
              activeOrder={activeOrder}
              orders={orders}
              onTrack={scrollToTracking}
              onGoMenu={() => goToNav('menu')}
              onGoOrders={() => goToNav('orders')}
              onGoSupport={() => goToNav('support')}
              onGoProfile={() => goToNav('profile')}
            />
          )}

          {activeNav === 'menu' && (
            <MenuPanel
              cartItems={cartItems}
              cartTotal={cartTotal}
              onAdd={addToCart}
              onChangeQty={changeQty}
              onRemove={removeItem}
              onCheckout={handleCheckout}
            />
          )}

          {activeNav === 'orders' && <OrdersPanel orders={orders} onTrack={scrollToTracking} />}

          {activeNav === 'track' && (
            <TrackPanel activeOrder={activeOrder} orders={orders} onSelect={scrollToTracking} />
          )}

          {activeNav === 'addresses' && (
            <AddressesPanel
              addresses={addresses}
              setAddresses={(a) => {
                setAddresses(a);
                saveAddresses(a);
              }}
            />
          )}

          {activeNav === 'profile' && <ProfilePanel user={user} />}

          {activeNav === 'notifications' && (
            <EmptyPanel title="Notifications" message="You have no notifications yet." />
          )}

          {activeNav === 'support' && (
            <EmptyPanel
              title="Support"
              message="Need help with an order? Reach us on +234 812 912 5100 or email support@thepromise.ng."
            />
          )}
        </section>
      </div>
    </main>
  );
}

/* ================= Sub-panels ================= */

function OverviewPanel({
  user,
  stats,
  activeOrder,
  orders,
  onTrack,
  onGoMenu,
  onGoOrders,
  onGoSupport,
  onGoProfile,
}: {
  user: { name?: string | null };
  stats: { total: number; active: number; delivered: number; pending: number };
  activeOrder: Order | undefined;
  orders: Order[];
  onTrack: (id: string) => void;
  onGoMenu: () => void;
  onGoOrders: () => void;
  onGoSupport: () => void;
  onGoProfile: () => void;
}) {
  const recent = orders.slice(0, 4);

  return (
    <>
      <div className="section-head">
        <div>
          <span className="section-tag">Your account</span>
          <h2>Welcome back{user.name ? `, ${user.name}` : ''}</h2>
          <p>Here&apos;s what&apos;s happening with your orders.</p>
        </div>
      </div>

      <div className="dash-stats">
        <div className="dash-stat-card">
          <span className="dash-stat-label">Total Orders</span>
          <span className="dash-stat-value">{stats.total}</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Active Orders</span>
          <span className="dash-stat-value">{stats.active}</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Delivered</span>
          <span className="dash-stat-value">{stats.delivered}</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Pending</span>
          <span className="dash-stat-value">{stats.pending}</span>
        </div>
      </div>

      {activeOrder ? (
        <TrackingCard order={activeOrder} />
      ) : (
        <div className="dash-empty-card">
          <p>No active orders right now.</p>
          <button className="btn btn-primary btn-sm" onClick={onGoMenu}>
            Browse the menu
          </button>
        </div>
      )}

      <div className="dash-section-head-row">
        <h3>Recent Orders</h3>
      </div>

      {recent.length === 0 ? (
        <div className="dash-empty-card">
          <p>You haven&apos;t placed any orders yet.</p>
          <button className="btn btn-outline btn-sm" onClick={onGoMenu}>
            Order something
          </button>
        </div>
      ) : (
        <div className="dash-orders-list">
          {recent.map((o) => (
            <OrderCard key={o.id} order={o} onTrack={onTrack} />
          ))}
        </div>
      )}

      <div className="dash-section-head-row">
        <h3>Quick Actions</h3>
      </div>
      <div className="dash-quick-actions">
        <button className="btn btn-primary" onClick={onGoMenu}>
          Order Food
        </button>
        <button className="btn btn-outline" onClick={onGoOrders}>
          View All Orders
        </button>
        <button className="btn btn-outline" onClick={onGoSupport}>
          Contact Support
        </button>
        <button className="btn btn-outline" onClick={onGoProfile}>
          Update Profile
        </button>
      </div>
    </>
  );
}

function MenuPanel({
  cartItems,
  cartTotal,
  onAdd,
  onChangeQty,
  onRemove,
  onCheckout,
}: {
  cartItems: CartLine[];
  cartTotal: number;
  onAdd: (id: number) => void;
  onChangeQty: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
}) {
  return (
    <>
      <div className="section-head">
        <div>
          <span className="section-tag">Order again</span>
          <h2>Menu</h2>
          <p>Pick what you want — it&apos;ll show up in your cart below.</p>
        </div>
      </div>

      <div className="dash-menu-grid">
        {dishes.map((d) => (
          <div className="dash-menu-card" key={d.id}>
            <div className={`dish-media tone-${d.tone}`}>
              <DishIcon type={d.icon} />
            </div>
            <div className="dash-menu-body">
              <h4>{d.name}</h4>
              <span className="dash-menu-price">{formatNaira(d.price)}</span>
              <button className="btn btn-outline btn-sm" onClick={() => onAdd(d.id)}>
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-section-head-row">
        <h3>Your Cart</h3>
      </div>

      {cartItems.length === 0 ? (
        <div className="dash-empty-card">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <>
          <div className="dash-cart-list">
            {cartItems.map((item) => (
              <div className="dash-cart-row" key={item.id}>
                <span className="dash-cart-name">{item.name}</span>
                <div className="dash-cart-qty">
                  <button onClick={() => onChangeQty(item.id, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => onChangeQty(item.id, 1)}>+</button>
                </div>
                <span className="dash-cart-price">{formatNaira(item.price * item.qty)}</span>
                <button className="dash-cart-remove" onClick={() => onRemove(item.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="dash-cart-total">
            <span>Total</span>
            <strong>{formatNaira(cartTotal)}</strong>
          </div>

          <button className="btn btn-primary btn-full" onClick={onCheckout}>
            Checkout
          </button>
        </>
      )}
    </>
  );
}

function OrdersPanel({ orders, onTrack }: { orders: Order[]; onTrack: (id: string) => void }) {
  return (
    <>
      <div className="section-head">
        <div>
          <span className="section-tag">History</span>
          <h2>My Orders</h2>
        </div>
      </div>
      {orders.length === 0 ? (
        <div className="dash-empty-card">
          <p>No orders placed yet.</p>
        </div>
      ) : (
        <div className="dash-orders-list">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} onTrack={onTrack} />
          ))}
        </div>
      )}
    </>
  );
}

function TrackPanel({
  activeOrder,
  orders,
  onSelect,
}: {
  activeOrder: Order | undefined;
  orders: Order[];
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className="section-head">
        <div>
          <span className="section-tag">Live tracking</span>
          <h2>Track Order</h2>
        </div>
      </div>

      {activeOrder ? (
        <TrackingCard order={activeOrder} />
      ) : (
        <div className="dash-empty-card">
          <p>No order currently in progress.</p>
        </div>
      )}

      {orders.length > 1 && (
        <>
          <div className="dash-section-head-row">
            <h3>Switch order</h3>
          </div>
          <div className="dash-orders-list">
            {orders
              .filter((o) => o.id !== activeOrder?.id)
              .map((o) => (
                <OrderCard key={o.id} order={o} onTrack={onSelect} />
              ))}
          </div>
        </>
      )}
    </>
  );
}

function TrackingCard({ order }: { order: Order }) {
  return (
    <div className="dash-tracking-card" id="active-tracking">
      <div className="dash-tracking-head">
        <div>
          <span className="section-tag">Live tracking</span>
          <h3>Order #{order.id}</h3>
        </div>
        <span className="dash-eta">Estimated delivery: {order.eta}</span>
      </div>

      <ol className="dash-progress">
        {STEPS.map((step, i) => {
          const state = i < order.stepIndex ? 'done' : i === order.stepIndex ? 'current' : 'upcoming';
          return (
            <li key={step} className={`dash-progress-step ${state}`}>
              <span className="dash-progress-marker">
                {state === 'done' ? '✓' : state === 'current' ? '●' : '○'}
              </span>
              <span className="dash-progress-label">{step}</span>
            </li>
          );
        })}
      </ol>

      <div className="dash-tracking-meta">
        <div>
          <span className="dash-meta-label">Tracking ID</span>
          <span className="dash-meta-value">{order.trackingId}</span>
        </div>
        <div>
          <span className="dash-meta-label">Courier</span>
          <span className="dash-meta-value">{order.courier}</span>
        </div>
        <div>
          <span className="dash-meta-label">Current location</span>
          <span className="dash-meta-value">{order.location}</span>
        </div>
      </div>

      <ul className="dash-timeline">
        {STEPS.slice(0, order.stepIndex + 1).map((step, i) => (
          <li key={step} className="dash-timeline-item">
            <span className="dash-timeline-dot" />
            <span className="dash-timeline-step">{step}</span>
            <span className="dash-timeline-time">{i === order.stepIndex ? 'Just now' : `Step ${i + 1}`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderCard({ order, onTrack }: { order: Order; onTrack: (id: string) => void }) {
  return (
    <div className="dash-order-card">
      <div className="dash-order-main">
        <span className="dash-order-id">{order.id}</span>
        <span className="dash-order-items">{order.items.map((it) => `${it.qty}× ${it.name}`).join(', ')}</span>
        <span className="dash-order-date">{order.date}</span>
      </div>
      <div className="dash-order-side">
        <span className="dash-order-amount">{formatNaira(order.amount)}</span>
        <span className={`dash-order-status status-${STEPS[order.stepIndex].replace(/\s+/g, '-').toLowerCase()}`}>
          {STEPS[order.stepIndex]}
        </span>
        <button className="btn btn-outline btn-sm" onClick={() => onTrack(order.id)}>
          Track Order
        </button>
      </div>
    </div>
  );
}

function AddressesPanel({
  addresses,
  setAddresses,
}: {
  addresses: Address[];
  setAddresses: (a: Address[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Address, 'id'>>({
    label: 'Home',
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    isDefault: false,
  });

  function resetForm() {
    setForm({ label: 'Home', fullName: '', phone: '', addressLine: '', city: '', state: '', isDefault: false });
    setEditingId(null);
  }

  function handleEdit(addr: Address) {
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    setAddresses(addresses.filter((a) => a.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.addressLine || !form.city || !form.state) return;

    let next: Address[];
    if (editingId) {
      next = addresses.map((a) => (a.id === editingId ? { ...form, id: editingId } : a));
    } else {
      const newAddr: Address = { ...form, id: `addr-${Date.now()}` };
      next = [...addresses, newAddr];
    }

    if (form.isDefault) {
      const defaultId = editingId ?? next[next.length - 1].id;
      next = next.map((a) => ({ ...a, isDefault: a.id === defaultId }));
    }

    setAddresses(next);
    setShowForm(false);
    resetForm();
  }

  return (
    <>
      <div className="section-head">
        <div>
          <span className="section-tag">Delivery</span>
          <h2>Saved Addresses</h2>
          <p>Stored on this device so checkout is faster next time.</p>
        </div>
      </div>

      {!showForm && (
        <button className="btn btn-primary btn-sm" style={{ marginBottom: 24 }} onClick={() => setShowForm(true)}>
          + Add new address
        </button>
      )}

      {showForm && (
        <form className="dash-address-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="addr-label">Label</label>
            <select
              id="addr-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            >
              <option>Home</option>
              <option>Work</option>
              <option>Other</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="addr-name">Full name</label>
            <input
              id="addr-name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="addr-phone">Phone number</label>
            <input
              id="addr-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="addr-line">Address</label>
            <input
              id="addr-line"
              value={form.addressLine}
              onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
              placeholder="Street, house number, landmark"
              required
            />
          </div>

          <div className="dash-form-row">
            <div className="field">
              <label htmlFor="addr-city">City</label>
              <input
                id="addr-city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="addr-state">State</label>
              <input
                id="addr-state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
              />
            </div>
          </div>

          <label className="dash-checkbox">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />
            Set as default address
          </label>

          <div className="dash-form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save changes' : 'Save address'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="dash-empty-card">
          <p>No saved addresses yet.</p>
        </div>
      ) : (
        <div className="dash-address-list">
          {addresses.map((a) => (
            <div className="dash-address-card" key={a.id}>
              <div className="dash-address-head">
                <span className="dash-address-label">{a.label}</span>
                {a.isDefault && <span className="dash-address-default">Default</span>}
              </div>
              <p className="dash-address-name">{a.fullName}</p>
              <p className="dash-address-line">{a.addressLine}</p>
              <p className="dash-address-line">
                {a.city}, {a.state}
              </p>
              <p className="dash-address-phone">{a.phone}</p>
              <div className="dash-address-actions">
                <button className="btn btn-outline btn-sm" onClick={() => handleEdit(a)}>
                  Edit
                </button>
                <button className="dash-cart-remove" onClick={() => handleDelete(a.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ProfilePanel({ user }: { user: { name?: string | null; email?: string | null } }) {
  return (
    <>
      <div className="section-head">
        <div>
          <span className="section-tag">Account</span>
          <h2>Profile / Account</h2>
        </div>
      </div>
      <div className="dash-profile-card">
        <div className="field">
          <label>Name</label>
          <input value={user.name ?? ''} disabled />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={user.email ?? ''} disabled />
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>
          Editing account details isn&apos;t wired up yet — this is a read-only view for now.
        </p>
      </div>
    </>
  );
}

function EmptyPanel({ title, message }: { title: string; message: string }) {
  return (
    <>
      <div className="section-head">
        <div>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="dash-empty-card">
        <p>{message}</p>
      </div>
    </>
  );
}