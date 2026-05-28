import { data } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server.js";
import { db } from "../db/index.js";
import { favorites, products } from "../db/schema.server.js";
import { eq, desc, sql } from "drizzle-orm";

export async function loader({ request }) {
    await authenticate.admin(request);

    const rankings = await db
        .select({
            productTitle: products.title,
            productImage: products.imageUrl,
            productPrice: products.price,
            count: sql`count(*)`.as("count"),
        })
        .from(favorites)
        .leftJoin(products, eq(favorites.productId, products.id))
        .groupBy(products.id)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

    return data({ rankings });
}

/* ─── Styles ─────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

  .rk-root {
    --pink:       #ff4d6d;
    --pink-soft:  #fff0f3;
    --pink-dark:  #d63655;
    --gold:       #f59e0b;
    --gold-soft:  #fffbeb;
    --silver:     #94a3b8;
    --silver-soft:#f8fafc;
    --bronze:     #cd7f32;
    --bronze-soft:#fdf4ec;
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

  /* Header */
  .rk-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 32px; padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap; gap: 12px;
  }
  .rk-header-left { display: flex; align-items: center; gap: 14px; }
  .rk-logo {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, #ff4d6d 0%, #ff8fa3 100%);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 14px rgba(255,77,109,.32);
    flex-shrink: 0;
  }
  .rk-header h1 { font-size: 21px; font-weight: 700; color: var(--dark); letter-spacing: -0.4px; margin: 0 0 3px; }
  .rk-header p  { font-size: 13px; color: var(--muted); margin: 0; }
  .rk-live-badge {
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

  /* Stat cards */
  .rk-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  .stat-card {
    background: var(--card); border-radius: var(--r);
    padding: 22px 22px 20px;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border);
    transition: box-shadow .22s ease, transform .22s ease; cursor: default;
  }
  .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }
  .stat-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
  .stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .stat-icon.pink   { background: var(--pink-soft); }
  .stat-icon.gold   { background: var(--gold-soft); }
  .stat-icon.blue   { background: var(--blue-soft); }
  .stat-trend { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; display: inline-flex; align-items: center; gap: 3px; }
  .trend-up   { background: #f0fdf4; color: var(--green); }
  .trend-flat { background: #f3f4f6; color: var(--muted); }
  .stat-value { font-size: 34px; font-weight: 700; color: var(--dark); line-height: 1; margin: 0 0 5px; }
  .stat-label { font-size: 13px; color: var(--muted); margin: 0; font-weight: 500; }

  /* Section label */
  .rk-section-label {
    font-size: 11px; font-weight: 700;
    color: var(--muted); text-transform: uppercase;
    letter-spacing: 0.07em; margin: 0 0 14px;
  }

  /* ── Podium ── */
  .rk-podium {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
    align-items: end;
  }

  .rk-pod {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 24px 16px 20px;
    text-align: center;
    box-shadow: var(--shadow-sm);
    transition: transform .25s ease, box-shadow .25s ease;
    position: relative;
    overflow: hidden;
    animation: fadeUp .35s ease both;
  }
  .rk-pod:nth-child(1) { animation-delay: .05s; }
  .rk-pod:nth-child(2) { animation-delay: 0s; }
  .rk-pod:nth-child(3) { animation-delay: .1s; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  .rk-pod:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }

  /* Gold — 1st place */
  .rk-pod.gold {
    border: 2px solid var(--gold);
    box-shadow: 0 0 0 4px rgba(245,158,11,.09), var(--shadow-sm);
    padding-top: 28px;
  }
  .rk-pod.gold::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
  }

  /* Silver — 2nd */
  .rk-pod.silver {
    border: 2px solid var(--silver);
    box-shadow: 0 0 0 4px rgba(148,163,184,.08), var(--shadow-sm);
  }
  .rk-pod.silver::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #94a3b8, #cbd5e1, #94a3b8);
  }

  /* Bronze — 3rd */
  .rk-pod.bronze {
    border: 2px solid var(--bronze);
    box-shadow: 0 0 0 4px rgba(205,127,50,.07), var(--shadow-sm);
  }
  .rk-pod.bronze::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #cd7f32, #e8a96a, #cd7f32);
  }

  .rk-pod-rank-badge {
    position: absolute; top: 14px; left: 14px;
    width: 26px; height: 26px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; line-height: 1;
  }
  .rk-pod-rank-badge.gold   { background: var(--gold-soft);   color: #b45309; border: 1.5px solid #fde68a; }
  .rk-pod-rank-badge.silver { background: var(--silver-soft); color: #475569; border: 1.5px solid #e2e8f0; }
  .rk-pod-rank-badge.bronze { background: var(--bronze-soft); color: #92400e; border: 1.5px solid #fcd9a0; }

  .rk-pod-medal { font-size: 30px; display: block; margin-bottom: 12px; }

  .rk-pod-img-wrap {
    width: 72px; height: 72px;
    border-radius: 16px; overflow: hidden;
    margin: 0 auto 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,.12);
  }
  .rk-pod-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .rk-pod-placeholder {
    width: 72px; height: 72px; border-radius: 16px;
    background: var(--pink-soft);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; margin: 0 auto 12px;
  }

  .rk-pod-name {
    font-size: 13px; font-weight: 700; color: var(--dark);
    margin: 0 0 4px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
    letter-spacing: -0.2px;
  }
  .rk-pod-price {
    font-size: 12px; color: var(--muted); margin: 0 0 14px; font-weight: 500;
  }
  .rk-pod-divider { height: 1px; background: var(--border); margin-bottom: 14px; }
  .rk-pod-count {
    font-size: 30px; font-weight: 800; color: var(--pink);
    line-height: 1; letter-spacing: -1px;
  }
  .rk-pod.gold .rk-pod-count   { color: #d97706; }
  .rk-pod.silver .rk-pod-count { color: #64748b; }
  .rk-pod.bronze .rk-pod-count { color: #92400e; }
  .rk-pod-count-label {
    font-size: 11px; color: var(--muted);
    display: block; margin-top: 4px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .05em;
  }

  /* ── List rows (rank 4–10) ── */
  .rk-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 40px; }

  .rk-row {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 18px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; box-shadow: var(--shadow-sm);
    transition: background .15s, box-shadow .18s, transform .18s;
    animation: fadeUp .3s ease both;
  }
  .rk-row:hover { background: #fff8f9; box-shadow: var(--shadow-md); transform: translateX(4px); }

  .rk-rank-badge {
    width: 32px; height: 32px; border-radius: 50%;
    background: #f3f4f6; border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: var(--muted);
    flex-shrink: 0;
  }

  .rk-row-img-wrap {
    width: 48px; height: 48px; border-radius: 12px;
    overflow: hidden; flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,.1);
  }
  .rk-row-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .rk-row-placeholder {
    width: 48px; height: 48px; border-radius: 12px;
    background: var(--pink-soft); display: flex;
    align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }

  .rk-row-info { flex: 1; min-width: 0; }
  .rk-row-name {
    font-size: 14px; font-weight: 700; color: var(--dark);
    white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; margin: 0 0 3px;
  }
  .rk-row-price { font-size: 12px; color: var(--muted); margin: 0; font-weight: 500; }

  .rk-bar-wrap { flex: 1; max-width: 180px; flex-shrink: 0; }
  .rk-bar-label { font-size: 10px; color: var(--muted); font-weight: 600; text-align: right; margin-bottom: 4px; }
  .rk-bar-bg {
    height: 7px; background: #f0f0f0;
    border-radius: 999px; overflow: hidden;
  }
  .rk-bar-fill {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, #ff4d6d, #ff8fa3);
    transition: width .7s ease;
  }

  .rk-row-count {
    font-size: 20px; font-weight: 800; color: var(--pink);
    flex-shrink: 0; min-width: 56px; text-align: right;
    line-height: 1; letter-spacing: -0.5px;
  }
  .rk-row-count-label {
    font-size: 10px; color: var(--muted);
    font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
    display: block; text-align: right; margin-top: 3px;
  }

  /* Empty */
  .rk-empty {
    background: var(--card); border-radius: var(--r);
    border: 1px solid var(--border); padding: 80px 24px;
    text-align: center; box-shadow: var(--shadow-sm);
  }
  .rk-empty-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: var(--gold-soft);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; margin: 0 auto 18px;
  }
  .rk-empty h3 { font-size: 18px; font-weight: 700; color: var(--dark); margin: 0 0 8px; }
  .rk-empty p  { font-size: 14px; color: var(--muted); margin: 0; line-height: 1.65; max-width: 300px; margin-inline: auto; }

  /* Footer */
  .rk-footer {
    padding: 28px 0 24px; text-align: center;
    font-size: 12px; color: #c4c9d4;
    border-top: 1px solid var(--border); margin-top: auto;
  }

  @media (max-width: 700px) {
    .rk-stats   { grid-template-columns: 1fr 1fr; }
    .rk-podium  { grid-template-columns: 1fr; }
    .rk-bar-wrap { display: none; }
    .rk-root    { padding: 20px 14px 0; }
    .rk-header  { flex-direction: column; gap: 12px; align-items: flex-start; }
  }
  @media (max-width: 440px) {
    .rk-stats { grid-template-columns: 1fr; }
  }
`;

/* ─── Helpers ────────────────────────────────────────────────── */
const MEDAL_EMOJI  = ["🥇", "🥈", "🥉"];
const POD_CLASS    = ["gold", "silver", "bronze"];
const POD_LABEL    = ["1st", "2nd", "3rd"];

// Podium display order: silver (2nd) | gold (1st) | bronze (3rd)
const PODIUM_ORDER = [1, 0, 2];

export default function RankingsPage() {
    const { rankings } = useLoaderData();

    const top3    = rankings.slice(0, 3);
    const rest    = rankings.slice(3);
    const maxCount = Number(rankings[0]?.count ?? 1);
    const total   = rankings.reduce((s, r) => s + Number(r.count), 0);
    const topProduct = rankings[0]?.productTitle ?? "—";

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />

            <div className="rk-root">

                {/* ── Header ── */}
                <div className="rk-header">
                    <div className="rk-header-left">
                        <div className="rk-logo">🏆</div>
                        <div>
                            <h1>Top Favorited Products</h1>
                            <p>Products ranked by number of customer favorites</p>
                        </div>
                    </div>
                    <span className="rk-live-badge">
                        <span className="live-dot" /> Live
                    </span>
                </div>

                {/* ── Stat Cards ── */}
                <div className="rk-stats">
                    <div className="stat-card">
                        <div className="stat-card-top">
                            <div className="stat-icon pink">🏆</div>
                            <span className="stat-trend trend-flat">→ All time</span>
                        </div>
                        <p className="stat-value">{rankings.length}</p>
                        <p className="stat-label">Ranked products</p>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-top">
                            <div className="stat-icon gold">❤️</div>
                            <span className="stat-trend trend-up">↑ Favorites</span>
                        </div>
                        <p className="stat-value">{total.toLocaleString()}</p>
                        <p className="stat-label">Total favorites cast</p>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-top">
                            <div className="stat-icon blue">🥇</div>
                            <span className="stat-trend trend-up">↑ Leading</span>
                        </div>
                        <p className="stat-value" style={{ fontSize: 18, paddingTop: 8 }} title={topProduct}>
                            {topProduct.length > 22 ? topProduct.slice(0, 22) + "…" : topProduct}
                        </p>
                        <p className="stat-label">Current #1 product</p>
                    </div>
                </div>

                {rankings.length === 0 ? (
                    <div className="rk-empty">
                        <div className="rk-empty-icon">🏆</div>
                        <h3>No rankings yet</h3>
                        <p>Rankings will appear here once customers start saving products to their favorites.</p>
                    </div>
                ) : (
                    <>
                        {/* ── Podium (Top 3) ── */}
                        {top3.length > 0 && (
                            <>
                                <p className="rk-section-label">Top 3 — Podium</p>
                                <div className="rk-podium">
                                    {PODIUM_ORDER.map((realIdx) => {
                                        const item = top3[realIdx];
                                        if (!item) return <div key={realIdx} />;
                                        const cls = POD_CLASS[realIdx];
                                        return (
                                            <div className={`rk-pod ${cls}`} key={realIdx}>
                                                <div className={`rk-pod-rank-badge ${cls}`}>
                                                    {POD_LABEL[realIdx]}
                                                </div>
                                                <span className="rk-pod-medal">{MEDAL_EMOJI[realIdx]}</span>

                                                {item.productImage ? (
                                                    <div className="rk-pod-img-wrap">
                                                        <img className="rk-pod-img" src={item.productImage} alt={item.productTitle} />
                                                    </div>
                                                ) : (
                                                    <div className="rk-pod-placeholder">🛍️</div>
                                                )}

                                                <p className="rk-pod-name" title={item.productTitle}>
                                                    {item.productTitle || "Unknown Product"}
                                                </p>
                                                <p className="rk-pod-price">
                                                    {item.productPrice ? `$${item.productPrice}` : "No price"}
                                                </p>
                                                <div className="rk-pod-divider" />
                                                <div className="rk-pod-count">
                                                    {Number(item.count).toLocaleString()}
                                                    <span className="rk-pod-count-label">favorites</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* ── List (Ranks 4–10) ── */}
                        {rest.length > 0 && (
                            <>
                                <p className="rk-section-label" style={{ marginTop: 4 }}>Honorable Mentions</p>
                                <div className="rk-list">
                                    {rest.map((item, i) => {
                                        const pct = Math.round((Number(item.count) / maxCount) * 100);
                                        return (
                                            <div className="rk-row" key={i} style={{ animationDelay: `${i * 0.04}s` }}>
                                                <div className="rk-rank-badge">#{i + 4}</div>

                                                {item.productImage ? (
                                                    <div className="rk-row-img-wrap">
                                                        <img className="rk-row-img" src={item.productImage} alt={item.productTitle} />
                                                    </div>
                                                ) : (
                                                    <div className="rk-row-placeholder">🛍️</div>
                                                )}

                                                <div className="rk-row-info">
                                                    <p className="rk-row-name">{item.productTitle || "Unknown Product"}</p>
                                                    <p className="rk-row-price">{item.productPrice ? `$${item.productPrice}` : "No price"}</p>
                                                </div>

                                                <div className="rk-bar-wrap">
                                                    <div className="rk-bar-label">{pct}% of #1</div>
                                                    <div className="rk-bar-bg">
                                                        <div className="rk-bar-fill" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="rk-row-count">{Number(item.count).toLocaleString()}</div>
                                                    <span className="rk-row-count-label">favs</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </>
                )}

                <div className="rk-footer">
                    Customer Favorites App &nbsp;•&nbsp; Built with Shopify + React + Drizzle ORM
                </div>
            </div>
        </>
    );
}