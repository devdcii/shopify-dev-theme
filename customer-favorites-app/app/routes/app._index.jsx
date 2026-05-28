import { useLoaderData, useFetcher, useRevalidator } from "react-router";
import { useState, useMemo, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { authenticate } from "../shopify.server.js";

/* ─── Loader ─────────────────────────────────────────────────── */
export async function loader({ request }) {
  await authenticate.admin(request);

  const { db } = await import("../db/index.js");
  const { favorites, customers, products } = await import("../db/schema.server.js");
  const { eq, desc } = await import("drizzle-orm");

  try {
    const allFavorites = await db
      .select({
        id: favorites.id,
        customerId: favorites.customerId,
        productId: favorites.productId,
        createdAt: favorites.createdAt,
        productTitle: products.title,
        productImage: products.imageUrl,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(favorites)
      .leftJoin(products, eq(favorites.productId, products.id))
      .leftJoin(customers, eq(favorites.customerId, customers.id))
      .orderBy(desc(favorites.createdAt));

    return { favorites: allFavorites };
  } catch {
    return { favorites: [] };
  }
}

/* ─── Action ─────────────────────────────────────────────────── */
export async function action({ request }) {
  await authenticate.admin(request);

  if (request.method === "DELETE") {
    const { db } = await import("../db/index.js");
    const { favorites, activityLog } = await import("../db/schema.server.js");
    const { eq } = await import("drizzle-orm");

    const body = await request.json();
    const { favoriteId, customerId, productId } = body;

    await db.delete(favorites).where(eq(favorites.id, favoriteId));
    await db.insert(activityLog).values({ customerId, productId, action: "removed" });

    return { success: true };
  }

  return { success: false };
}

/* ─── Styles ─────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

  .fav-root {
    --pink:       #ff4d6d;
    --pink-soft:  #fff0f3;
    --pink-dark:  #d63655;
    --blue-soft:  #eff6ff;
    --blue:       #2563eb;
    --green-soft: #f0fdf4;
    --green:      #16a34a;
    --dark:       #111827;
    --mid:        #374151;
    --muted:      #9ca3af;
    --border:     #e5e7eb;
    --bg:         #f9fafb;
    --card:       #ffffff;
    --shadow-sm:  0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04);
    --shadow-md:  0 4px 16px rgba(0,0,0,.09), 0 2px 4px rgba(0,0,0,.05);
    --shadow-lg:  0 12px 24px rgba(0,0,0,.08), 0 4px 8px rgba(0,0,0,.05);
    --r: 14px;
    font-family: 'DM Sans', system-ui, sans-serif;
    background: var(--bg);
    min-height: 100vh;
    padding: 36px 28px 0;
    max-width: 1120px;
    margin: 0 auto;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  /* Toast */
  .toast-wrap {
    position: fixed; top: 24px; right: 24px; z-index: 9999;
    display: flex; flex-direction: column; gap: 10px;
    pointer-events: none;
  }
  .toast {
    display: flex; align-items: center; gap: 10px;
    background: #111827; color: #fff;
    padding: 12px 18px; border-radius: 12px;
    font-size: 13px; font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,.22);
    animation: toastIn .28s ease both;
    pointer-events: auto;
  }
  .toast.leaving { animation: toastOut .28s ease both; }
  @keyframes toastIn  { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: translateX(0); } }
  @keyframes toastOut { from { opacity:1; transform: translateX(0); } to { opacity:0; transform: translateX(20px); } }
  .toast-icon { font-size: 16px; }
  .toast-close { margin-left: 6px; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; }
  .toast-close:hover { color: #fff; }

  /* Header */
  .fav-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 32px; padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .fav-header-left { display: flex; align-items: center; gap: 14px; }
  .fav-logo {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, #ff4d6d 0%, #ff8fa3 100%);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 14px rgba(255,77,109,.32);
    flex-shrink: 0;
  }
  .fav-header h1 { font-size: 21px; font-weight: 700; color: var(--dark); letter-spacing: -0.4px; margin: 0 0 3px; }
  .fav-header p  { font-size: 13px; color: var(--muted); margin: 0; }
  .fav-live-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--pink-soft); color: var(--pink-dark);
    font-size: 12px; font-weight: 600;
    padding: 7px 14px; border-radius: 999px;
    border: 1px solid #fecdd3;
  }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--pink);
    animation: pulse 1.8s ease infinite; flex-shrink: 0;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: .5; transform: scale(.7); }
  }

  /* Stats */
  .fav-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card {
    background: var(--card); border-radius: var(--r);
    padding: 22px 22px 20px;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border);
    transition: box-shadow .22s ease, transform .22s ease; cursor: default;
  }
  .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }
  .stat-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
  .stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .stat-icon.pink  { background: var(--pink-soft); }
  .stat-icon.blue  { background: var(--blue-soft); }
  .stat-icon.green { background: var(--green-soft); }
  .stat-trend { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; display: inline-flex; align-items: center; gap: 3px; }
  .trend-up   { background: #f0fdf4; color: var(--green); }
  .trend-flat { background: #f3f4f6; color: var(--muted); }
  .stat-value { font-size: 34px; font-weight: 700; color: var(--dark); line-height: 1; margin: 0 0 5px; }
  .stat-label { font-size: 13px; color: var(--muted); margin: 0; font-weight: 500; }

  /* Section header */
  .section-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; }
  .section-header h2 { font-size: 16px; font-weight: 700; color: var(--dark); margin: 0 0 3px; }
  .section-header p  { font-size: 13px; color: var(--muted); margin: 0; }

  /* Toolbar */
  .fav-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .search-wrap { position: relative; flex: 1; max-width: 400px; }
  .search-icon-el {
    position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
    color: var(--muted); font-size: 14px; pointer-events: none; display: flex; align-items: center;
  }
  .search-input {
    width: 100%; padding: 10px 14px 10px 38px;
    border: 1.5px solid var(--border); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    color: var(--dark); background: var(--card); outline: none;
    transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
  }
  .search-input::placeholder { color: var(--muted); }
  .search-input:focus { border-color: var(--pink); box-shadow: 0 0 0 3px rgba(255,77,109,.11); }
  .toolbar-count {
    margin-left: auto; font-size: 13px; color: var(--muted);
    background: var(--card); border: 1px solid var(--border);
    padding: 7px 13px; border-radius: 8px; white-space: nowrap; font-weight: 500;
  }

  /* Grid */
  .fav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 18px; align-items: stretch; }

  /* Product card */
  .prod-card {
    background: var(--card); border-radius: var(--r);
    border: 1px solid var(--border); box-shadow: var(--shadow-sm);
    overflow: hidden; transition: transform .25s ease, box-shadow .25s ease;
    position: relative; display: flex; flex-direction: column;
    animation: fadeUp .3s ease both;
  }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .prod-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
  .prod-card:hover .prod-img img { transform: scale(1.05); }
  .prod-card .delete-btn-wrap { opacity: 0; transition: opacity .2s ease; }
  .prod-card:hover .delete-btn-wrap { opacity: 1; }

  .prod-img { width: 100%; height: 220px; background: #f3f4f6; overflow: hidden; flex-shrink: 0; }
  .prod-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; display: block; }
  .prod-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 44px; color: #d1d5db; }

  .delete-btn-wrap { position: absolute; top: 10px; right: 10px; z-index: 3; }
  .delete-btn {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,.93); border: 1.5px solid rgba(0,0,0,.08);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: #9ca3af;
    box-shadow: 0 2px 6px rgba(0,0,0,.12); backdrop-filter: blur(6px);
    transition: background .18s, border-color .18s, transform .18s, box-shadow .18s, color .18s; outline: none;
  }
  .delete-btn:hover { background: var(--pink); border-color: var(--pink); color: #fff; transform: scale(1.15); box-shadow: 0 4px 12px rgba(255,77,109,.38); }
  .delete-btn:active { transform: scale(.98); }
  .delete-btn:disabled { opacity: .4; pointer-events: none; }
  .delete-tooltip {
    position: absolute; right: 40px; top: 50%; transform: translateY(-50%);
    background: #111827; color: #fff;
    font-size: 11px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    padding: 4px 9px; border-radius: 6px; white-space: nowrap;
    opacity: 0; pointer-events: none; transition: opacity .16s;
  }
  .delete-btn-wrap:hover .delete-tooltip { opacity: 1; }

  .prod-body { padding: 14px 15px 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .prod-title {
    font-size: 14px; font-weight: 600; color: var(--dark); line-height: 1.4; margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 40px;
  }
  .prod-divider { height: 1px; background: var(--border); }
  .prod-meta { display: flex; flex-direction: column; gap: 6px; }
  .meta-pill {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600;
    background: var(--blue-soft); color: var(--blue);
    border-radius: 999px; padding: 3px 10px; width: fit-content;
    max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .meta-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
  .meta-dot { width: 5px; height: 5px; border-radius: 50%; background: #d1d5db; flex-shrink: 0; }

  /* Skeleton */
  @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
  .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 600px 100%; animation: shimmer 1.5s infinite linear; border-radius: 8px; }
  .skel-card { background: var(--card); border-radius: var(--r); border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-sm); }
  .skel-img  { width: 100%; height: 220px; }
  .skel-body { padding: 14px 15px 16px; display: flex; flex-direction: column; gap: 10px; }
  .skel-line { height: 12px; border-radius: 6px; }
  .skel-stat { background: var(--card); border-radius: var(--r); border: 1px solid var(--border); padding: 22px; box-shadow: var(--shadow-sm); }

  /* Empty */
  .fav-empty { background: var(--card); border-radius: var(--r); border: 1px solid var(--border); padding: 80px 24px; text-align: center; box-shadow: var(--shadow-sm); }
  .fav-empty-icon { width: 72px; height: 72px; border-radius: 50%; background: var(--pink-soft); display: flex; align-items: center; justify-content: center; font-size: 30px; margin: 0 auto 18px; }
  .fav-empty h3 { font-size: 18px; font-weight: 700; color: var(--dark); margin: 0 0 8px; }
  .fav-empty p  { font-size: 14px; color: var(--muted); margin: 0; line-height: 1.65; max-width: 300px; margin-inline: auto; }

  .fav-no-results { grid-column: 1/-1; text-align: center; padding: 60px 24px; color: var(--muted); font-size: 14px; }
  .fav-no-results div { font-size: 36px; margin-bottom: 10px; }

  /* Pagination */
  .fav-pagination {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-top: 24px; flex-wrap: wrap; gap: 12px;
  }
  .fav-page-info { font-size: 13px; color: var(--muted); font-weight: 500; }
  .fav-page-btns { display: flex; gap: 6px; align-items: center; }
  .fav-page-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1.5px solid var(--border);
    background: var(--card); color: var(--mid);
    font-size: 13px; font-weight: 600;
    cursor: pointer; display: flex;
    align-items: center; justify-content: center;
    transition: all .18s; font-family: 'DM Sans', sans-serif;
  }
  .fav-page-btn:hover:not(:disabled) { border-color: var(--pink); color: var(--pink); }
  .fav-page-btn.active { background: var(--pink); border-color: var(--pink); color: #fff; }
  .fav-page-btn:disabled { opacity: .35; cursor: not-allowed; }
  .fav-page-arrow {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1.5px solid var(--border);
    background: var(--card); color: var(--mid);
    font-size: 16px; font-weight: 700;
    cursor: pointer; display: flex;
    align-items: center; justify-content: center;
    transition: all .18s; font-family: 'DM Sans', sans-serif;
  }
  .fav-page-arrow:hover:not(:disabled) { border-color: var(--pink); color: var(--pink); }
  .fav-page-arrow:disabled { opacity: .35; cursor: not-allowed; }

  /* Per-page selector */
  .fav-perpage {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: var(--muted);
  }
  .fav-perpage select {
    padding: 6px 10px; border-radius: 8px;
    border: 1.5px solid var(--border);
    background: var(--card); color: var(--dark);
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    font-weight: 500; cursor: pointer; outline: none;
    transition: border-color .18s;
  }
  .fav-perpage select:focus { border-color: var(--pink); }

  /* Footer */
  .fav-footer { padding: 28px 0 24px; text-align: center; font-size: 12px; color: #c4c9d4; border-top: 1px solid var(--border); margin-top: 48px; }
  .fav-footer a { color: var(--muted); text-decoration: none; }
  .fav-footer a:hover { color: var(--dark); }

  @media (max-width: 700px) {
    .fav-stats { grid-template-columns: 1fr 1fr; }
    .fav-grid  { grid-template-columns: 1fr 1fr; }
    .fav-root  { padding: 20px 14px 0; }
    .fav-header { flex-direction: column; gap: 12px; align-items: flex-start; }
    .fav-pagination { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 440px) {
    .fav-stats { grid-template-columns: 1fr; }
    .fav-grid  { grid-template-columns: 1fr; }
  }
`;

/* ─── Toast ──────────────────────────────────────────────────── */
let toastId = 0;

function ToastContainer({ toasts, onClose }) {
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.leaving ? " leaving" : ""}`}>
          <span className="toast-icon">{t.icon}</span>
          {t.message}
          <button className="toast-close" onClick={() => onClose(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
ToastContainer.propTypes = { toasts: PropTypes.array.isRequired, onClose: PropTypes.func.isRequired };

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, icon = "✅") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, icon, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
    }, 2800);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
  }, []);
  return { toasts, addToast, removeToast };
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="skel-card">
      <div className="skel-img skeleton" />
      <div className="skel-body">
        <div className="skel-line skeleton" style={{ width: "88%" }} />
        <div className="skel-line skeleton" style={{ width: "62%" }} />
        <div className="skel-line skeleton" style={{ width: "52%", height: 22, borderRadius: 999 }} />
        <div className="skel-line skeleton" style={{ width: "72%" }} />
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="skel-stat">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
        <div className="skeleton" style={{ width: 64, height: 22, borderRadius: 999 }} />
      </div>
      <div className="skeleton" style={{ width: 56, height: 38, borderRadius: 8, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: 100, height: 13, borderRadius: 6 }} />
    </div>
  );
}

/* ─── StatCard ───────────────────────────────────────────────── */
function StatCard({ icon, iconClass, label, value, trend, trendLabel }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${iconClass}`}>{icon}</div>
        <span className={`stat-trend ${trend === "up" ? "trend-up" : "trend-flat"}`}>
          {trend === "up" ? "↑" : "→"} {trendLabel}
        </span>
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}
StatCard.propTypes = {
  icon: PropTypes.string.isRequired, iconClass: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired, value: PropTypes.number.isRequired,
  trend: PropTypes.oneOf(["up", "flat"]).isRequired, trendLabel: PropTypes.string.isRequired,
};

/* ─── Pagination ─────────────────────────────────────────────── */
function Pagination({ currentPage, totalPages, total, perPage, from, to, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  if (totalPages <= 1) return null;

  return (
    <div className="fav-pagination">
      <span className="fav-page-info">
        Showing {from}–{to} of {total} favorite{total !== 1 ? "s" : ""}
      </span>
      <div className="fav-page-btns">
        <button className="fav-page-arrow" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>‹</button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`} style={{ color: "#9ca3af", padding: "0 4px" }}>…</span>
          ) : (
            <button
              key={p}
              className={`fav-page-btn${currentPage === p ? " active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button className="fav-page-arrow" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
      </div>
    </div>
  );
}
Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  perPage: PropTypes.number.isRequired,
  from: PropTypes.number.isRequired,
  to: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

/* ─── ProductCard ────────────────────────────────────────────── */
function ProductCard({ item, onRemove, loading }) {
  const customerDisplay = item.customerName
    || (item.customerId ? `Customer #${String(item.customerId).replace(/\D/g, "").slice(-6)}` : "Unknown");

  function formatDate(val) {
    if (!val) return "No date";
    const [datePart, timePart] = String(val).split(" ");
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
    const d = new Date(year, month - 1, day, hour, minute);
    return d.toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  }

  return (
    <div className="prod-card">
      <div className="prod-img">
        {item.productImage
          ? <img src={item.productImage} alt={item.productTitle || "Product"} />
          : <div className="prod-img-placeholder">🛍️</div>
        }
      </div>
      <div className="delete-btn-wrap">
        <span className="delete-tooltip">Remove favorite</span>
        <button
          className="delete-btn"
          aria-label="Remove favorite"
          onClick={() => onRemove(item.id, item.customerId, item.productId, item.productTitle)}
          disabled={loading}
        >
          🗑️
        </button>
      </div>
      <div className="prod-body">
        <p className="prod-title">{item.productTitle || "Unknown Product"}</p>
        <div className="prod-divider" />
        <div className="prod-meta">
          <span className="meta-pill" title={customerDisplay}>👤 {customerDisplay}</span>
          <div className="meta-row">
            <span className="meta-dot" />
            <span>{formatDate(item.createdAt)}</span>
          </div>
          <div className="meta-row">
            <span className="meta-dot" />
            <span>ID: {String(item.productId).slice(-10)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
ProductCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    productImage: PropTypes.string,
    productTitle: PropTypes.string,
    productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customerName: PropTypes.string,
    customerEmail: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

/* ─── Main ───────────────────────────────────────────────────── */
const PER_PAGE_OPTIONS = [8, 12, 20, 32];

export default function Index() {
  const { favorites } = useLoaderData();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [search, setSearch] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 650);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      revalidator.revalidate();
    }
  }, [fetcher.state, fetcher.data]);

  // Reset to page 1 when search or perPage changes
  useEffect(() => { setCurrentPage(1); }, [search, perPage]);

  function removeFavorite(favoriteId, customerId, productId, productTitle) {
    fetcher.submit(
      { favoriteId, customerId, productId },
      { method: "DELETE", encType: "application/json" }
    );
    addToast(
      `${productTitle ? `"${productTitle.slice(0, 28)}${productTitle.length > 28 ? "…" : ""}"` : "Favorite"} removed`,
      "✅"
    );
  }

  const uniqueCustomers = useMemo(() => new Set(favorites.map((f) => f.customerId)).size, [favorites]);
  const uniqueProducts  = useMemo(() => new Set(favorites.map((f) => f.productId)).size,  [favorites]);

  const filtered = useMemo(
    () => favorites.filter((f) =>
      !search ||
      (f.productTitle  || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.customerName  || "").toLowerCase().includes(search.toLowerCase()) ||
      String(f.customerId).includes(search) ||
      String(f.productId).includes(search)
    ),
    [favorites, search]
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to   = Math.min(currentPage * perPage, filtered.length);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  function handlePageChange(page) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="fav-root">

        {/* Header */}
        <div className="fav-header">
          <div className="fav-header-left">
            <div className="fav-logo">❤️</div>
            <div>
              <h1>Customer Favorites Dashboard</h1>
              <p>Monitor and manage all products saved by your customers</p>
            </div>
          </div>
          <div className="fav-live-badge">
            <span className="live-dot" /> Live
          </div>
        </div>

        {/* Stats */}
        {!isReady ? (
          <div className="fav-stats"><SkeletonStat /><SkeletonStat /><SkeletonStat /></div>
        ) : (
          <div className="fav-stats">
            <StatCard icon="❤️" iconClass="pink"  label="Total Favorites"  value={favorites.length} trend="up"   trendLabel="+12% week" />
            <StatCard icon="👤" iconClass="blue"  label="Active Customers" value={uniqueCustomers}  trend="up"   trendLabel="+3 new"    />
            <StatCard icon="🛍️" iconClass="green" label="Unique Products"  value={uniqueProducts}   trend="flat" trendLabel="Stable"    />
          </div>
        )}

        {/* Content */}
        {!isReady ? (
          <>
            <div className="fav-toolbar">
              <div className="skeleton" style={{ flex: 1, maxWidth: 400, height: 40, borderRadius: 10 }} />
              <div className="skeleton" style={{ width: 120, height: 38, borderRadius: 8 }} />
            </div>
            <div className="fav-grid">
              {[...Array(perPage > 8 ? 8 : perPage)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        ) : favorites.length === 0 ? (
          <div className="fav-empty">
            <div className="fav-empty-icon">💔</div>
            <h3>No favorites yet</h3>
            <p>Customers haven&apos;t saved any products yet. Favorites will appear here once they start building their wishlists.</p>
          </div>
        ) : (
          <>
            <div className="section-header">
              <div>
                <h2>Recent Favorites</h2>
                <p>Manage saved customer products</p>
              </div>
            </div>

            <div className="fav-toolbar">
              <div className="search-wrap">
                <span className="search-icon-el">🔍</span>
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search products, customers, IDs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="fav-perpage">
                <span>Show</span>
                <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                  {PER_PAGE_OPTIONS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <span className="toolbar-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="fav-grid">
              {paginated.length === 0 ? (
                <div className="fav-no-results">
                  <div>🔎</div>
                  <p>No results for <strong>{search}</strong></p>
                </div>
              ) : (
                paginated.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onRemove={removeFavorite}
                    loading={fetcher.state === "submitting"}
                  />
                ))
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={filtered.length}
              perPage={perPage}
              from={from}
              to={to}
              onPageChange={handlePageChange}
            />
          </>
        )}

        <div className="fav-footer">
          Customer Favorites App &nbsp;•&nbsp; Built with Shopify + React + Drizzle ORM
        </div>

      </div>
    </>
  );
}