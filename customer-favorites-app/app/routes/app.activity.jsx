import { data } from "react-router";
import { useLoaderData } from "react-router";
import { useState, useMemo } from "react";
import { authenticate } from "../shopify.server.js";
import { db } from "../db/index.js";
import { activityLog, customers, products } from "../db/schema.server.js";
import { eq, desc } from "drizzle-orm";

export async function loader({ request }) {
  await authenticate.admin(request);

  const logs = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      createdAt: activityLog.createdAt,
      customerName: customers.name,
      productTitle: products.title,
    })
    .from(activityLog)
    .leftJoin(customers, eq(activityLog.customerId, customers.id))
    .leftJoin(products, eq(activityLog.productId, products.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(200);

  return data({ logs });
}

export default function ActivityPage() {
  const { logs } = useLoaderData();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const PER_PAGE = 10;

  function formatDate(val) {
    if (!val) return "—";
    const [datePart, timePart] = String(val).split(" ");
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
    const d = new Date(year, month - 1, day, hour, minute);
    return d.toLocaleString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  }

  const totalAdded   = useMemo(() => logs.filter(l => l.action === "added").length,   [logs]);
  const totalRemoved = useMemo(() => logs.filter(l => l.action === "removed").length, [logs]);

  const filtered = filter === "all" ? logs : logs.filter(l => l.action === filter);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function goTo(page) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  function handleFilter(val) {
    setFilter(val);
    setCurrentPage(1);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        .act-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          max-width: 1120px;
          margin: 0 auto;
          padding: 36px 28px 0;
          background: #f9fafb;
          min-height: 100vh;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .act-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; flex-wrap: wrap;
          gap: 12px; margin-bottom: 32px;
          padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;
        }
        .act-header-left { display: flex; align-items: center; gap: 14px; }
        .act-logo {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #ff4d6d 0%, #ff8fa3 100%);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          box-shadow: 0 4px 14px rgba(255,77,109,.32);
          flex-shrink: 0;
        }
        .act-header-title { font-size: 21px; font-weight: 700; color: #111827; letter-spacing: -0.4px; margin: 0 0 3px; }
        .act-header-sub { font-size: 13px; color: #9ca3af; margin: 0; }
        .act-live-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff0f3; color: #d63655;
          font-size: 12px; font-weight: 600;
          padding: 7px 14px; border-radius: 999px;
          border: 1px solid #fecdd3; align-self: center;
        }
        .act-live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #ff4d6d;
          animation: actPulse 1.8s ease infinite; flex-shrink: 0;
        }
        @keyframes actPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .5; transform: scale(.7); }
        }

        /* Stat cards */
        .act-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .act-stat-card {
          background: #fff;
          border-radius: 14px;
          padding: 22px 22px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04);
          border: 1px solid #e5e7eb;
          transition: box-shadow .22s ease, transform .22s ease;
          cursor: default;
        }
        .act-stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.09); transform: translateY(-3px); }
        .act-stat-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 16px;
        }
        .act-stat-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .act-stat-icon.pink  { background: #fff0f3; }
        .act-stat-icon.blue  { background: #eff6ff; }
        .act-stat-icon.green { background: #f0fdf4; }
        .act-stat-trend {
          font-size: 11px; font-weight: 600;
          padding: 3px 9px; border-radius: 999px;
          display: inline-flex; align-items: center; gap: 3px;
        }
        .act-stat-trend.up   { background: #f0fdf4; color: #16a34a; }
        .act-stat-trend.flat { background: #f3f4f6; color: #9ca3af; }
        .act-stat-value {
          font-size: 34px; font-weight: 700; color: #111827;
          line-height: 1; margin: 0 0 5px;
        }
        .act-stat-label { font-size: 13px; color: #9ca3af; margin: 0; font-weight: 500; }

        /* Toolbar */
        .act-toolbar {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
        }
        .act-filters { display: flex; gap: 8px; }
        .act-filter-btn {
          padding: 7px 16px; border-radius: 999px;
          font-size: 13px; font-weight: 600;
          border: 1.5px solid #e5e7eb;
          background: #fff; color: #6b7280;
          cursor: pointer; transition: all .18s;
          font-family: 'DM Sans', sans-serif;
        }
        .act-filter-btn:hover { border-color: #ff4d6d; color: #ff4d6d; }
        .act-filter-btn.active { background: #ff4d6d; border-color: #ff4d6d; color: #fff; }
        .act-count {
          font-size: 13px; color: #9ca3af;
          background: #fff; border: 1px solid #e5e7eb;
          padding: 7px 13px; border-radius: 8px;
          font-weight: 500; white-space: nowrap;
        }

        /* Table */
        .act-table-wrap {
          background: #fff; border-radius: 16px;
          overflow: hidden; border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,.07);
        }
        .act-table { width: 100%; border-collapse: collapse; }
        .act-table th {
          background: #f9fafb; padding: 12px 18px;
          text-align: left; font-size: 11px;
          font-weight: 700; color: #6b7280;
          text-transform: uppercase; letter-spacing: .06em;
          border-bottom: 1px solid #e5e7eb;
        }
        .act-table td {
          padding: 14px 18px; font-size: 13px;
          color: #374151; border-bottom: 1px solid #f3f4f6;
        }
        .act-table tr:last-child td { border-bottom: none; }
        .act-table tr:hover td { background: #fff8f9; }
        .badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 11px; border-radius: 999px;
          font-size: 12px; font-weight: 600;
        }
        .badge-added   { background: #fff0f3; color: #d63655; border: 1px solid #fecdd3; }
        .badge-removed { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }

        .act-empty {
          text-align: center; padding: 60px 24px;
          color: #9ca3af; font-size: 14px;
          background: #fff; border-radius: 16px;
          border: 1px solid #e5e7eb;
        }

        /* Pagination */
        .act-pagination {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-top: 20px; flex-wrap: wrap; gap: 12px;
        }
        .act-page-info { font-size: 13px; color: #9ca3af; font-weight: 500; }
        .act-page-btns { display: flex; gap: 6px; align-items: center; }
        .act-page-btn {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1.5px solid #e5e7eb;
          background: #fff; color: #374151;
          font-size: 13px; font-weight: 600;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: all .18s; font-family: 'DM Sans', sans-serif;
        }
        .act-page-btn:hover:not(:disabled) { border-color: #ff4d6d; color: #ff4d6d; }
        .act-page-btn.active { background: #ff4d6d; border-color: #ff4d6d; color: #fff; }
        .act-page-btn:disabled { opacity: .35; cursor: not-allowed; }
        .act-page-arrow {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1.5px solid #e5e7eb;
          background: #fff; color: #374151;
          font-size: 16px; font-weight: 700;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: all .18s; font-family: 'DM Sans', sans-serif;
        }
        .act-page-arrow:hover:not(:disabled) { border-color: #ff4d6d; color: #ff4d6d; }
        .act-page-arrow:disabled { opacity: .35; cursor: not-allowed; }

        /* Footer */
        .act-footer {
          padding: 28px 0 24px;
          text-align: center;
          font-size: 12px;
          color: #c4c9d4;
          border-top: 1px solid #e5e7eb;
          margin-top: 48px;
        }

        @media (max-width: 700px) {
          .act-stats { grid-template-columns: 1fr 1fr; }
          .act-root { padding: 20px 14px 0; }
          .act-header { flex-direction: column; gap: 12px; align-items: flex-start; }
          .act-table td, .act-table th { padding: 10px 12px; }
        }
        @media (max-width: 440px) {
          .act-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="act-root">

        {/* Header */}
        <div className="act-header">
          <div className="act-header-left">
            <div className="act-logo">📋</div>
            <div>
              <h1 className="act-header-title">Activity Log</h1>
              <p className="act-header-sub">Track all customer favorite actions in real-time</p>
            </div>
          </div>
          <span className="act-live-badge">
            <span className="act-live-dot" />
            Live
          </span>
        </div>

        {/* Stat cards */}
        <div className="act-stats">
          <div className="act-stat-card">
            <div className="act-stat-card-top">
              <div className="act-stat-icon pink">📋</div>
              <span className="act-stat-trend flat">→ All time</span>
            </div>
            <p className="act-stat-value">{logs.length.toLocaleString()}</p>
            <p className="act-stat-label">Total actions</p>
          </div>
          <div className="act-stat-card">
            <div className="act-stat-card-top">
              <div className="act-stat-icon blue">❤️</div>
              <span className="act-stat-trend up">↑ Favorites</span>
            </div>
            <p className="act-stat-value">{totalAdded.toLocaleString()}</p>
            <p className="act-stat-label">Products added</p>
          </div>
          <div className="act-stat-card">
            <div className="act-stat-card-top">
              <div className="act-stat-icon green">🗑️</div>
              <span className="act-stat-trend flat">→ Removals</span>
            </div>
            <p className="act-stat-value">{totalRemoved.toLocaleString()}</p>
            <p className="act-stat-label">Products removed</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="act-toolbar">
          <div className="act-filters">
            {["all", "added", "removed"].map(f => (
              <button
                key={f}
                className={`act-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => handleFilter(f)}
              >
                {f === "all" ? "All" : f === "added" ? "❤️ Added" : "🗑️ Removed"}
              </button>
            ))}
          </div>
          <span className="act-count">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="act-empty">No activity yet.</div>
        ) : (
          <>
            <div className="act-table-wrap">
              <table className="act-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Action</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((log) => (
                    <tr key={log.id}>
                      <td>{log.customerName || "Guest"}</td>
                      <td>{log.productTitle || "Unknown"}</td>
                      <td>
                        <span className={`badge badge-${log.action}`}>
                          {log.action === "added" ? "❤️" : "🗑️"} {log.action}
                        </span>
                      </td>
                      <td>{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="act-pagination">
              <span className="act-page-info">
                Showing {((currentPage - 1) * PER_PAGE) + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="act-page-btns">
                <button className="act-page-arrow" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`dot-${i}`} style={{ color: "#9ca3af", padding: "0 4px" }}>…</span>
                    ) : (
                      <button
                        key={p}
                        className={`act-page-btn${currentPage === p ? " active" : ""}`}
                        onClick={() => goTo(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button className="act-page-arrow" onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="act-footer">
          Customer Favorites App &nbsp;•&nbsp; Built with Shopify + React + Drizzle ORM
        </div>

      </div>
    </>
  );
}