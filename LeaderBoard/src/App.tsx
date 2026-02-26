import { useEffect, useState, useCallback } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

async function fetchUsers(mode: Mode, date: string): Promise<User[]> {
  let query = supabase
    .from("leaderboard")
    .select("*")
    .order("points", { ascending: false });
  if (mode === "daily") query = query.eq("date", date);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}


type User = {
  id: number;
  username: string;
  avatar: string;
  questions: number;
  points: number;
  date?: string;
};

type Mode = "overall" | "daily";


const PODIUM_CONFIG = [
  { label: "1st", icon: "♛", glowColor: "#f5b800", ringColor: "#f5b800", height: 130, delay: "0ms" },
  { label: "2nd", icon: "✦", glowColor: "#c0c0c0", ringColor: "#c0c0c0", height: 100, delay: "80ms" },
  { label: "3rd", icon: "✧", glowColor: "#cd7f32", ringColor: "#cd7f32", height: 80,  delay: "160ms" },
];

// Reorder for podium: 2nd | 1st | 3rd
const PODIUM_ORDER = [1, 0, 2];

export default function Leaderboard() {
  const [mode, setMode]     = useState<Mode>("overall");
  const [date, setDate]     = useState("2026-02-24");
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme]   = useState<"dark" | "light">(
    () => (localStorage.getItem("lb-theme") as "dark" | "light") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("lb-theme", theme);
  }, [theme]);

  const load = useCallback(async () => {
    setLoading(true);
    setMounted(false);
    const data = await fetchUsers(mode, date);
    setUsers(data);
    setLoading(false);
    setTimeout(() => setMounted(true), 50);
  }, [mode, date]);

  useEffect(() => { load(); }, [load]);

  const podiumSlots = PODIUM_ORDER.map((i) => users[i] ? { user: users[i], rank: i } : null);
  const rest = users.slice(3);

  return (
    <div className="lb-root">
      {/* HEADER */}
      <header className="lb-head">
        <div className="lb-brand">
          <span className="lb-brand-icon">⚡</span>
          <h1 className="lb-title">Rankings</h1>
        </div>

        <div className="lb-controls">
          <div className="lb-tabs">
            <button className={`lb-tab ${mode === "overall" ? "lb-tab--on" : ""}`} onClick={() => setMode("overall")}>
              Overall
            </button>
            <button className={`lb-tab ${mode === "daily" ? "lb-tab--on" : ""}`} onClick={() => setMode("daily")}>
              Daily
            </button>
          </div>

          {mode === "daily" && (
            <input
              type="date"
              className="lb-datepicker"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}

          <button
            className="lb-theme-btn"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title="Toggle theme"
          >
            {theme === "dark" ? "☀︎" : "☾"}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="lb-loader">
          <div className="lb-spinner">
            <div /><div /><div />
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="lb-empty">
          <span className="lb-empty-icon">🏜</span>
          <p>No entries found for this period.</p>
        </div>
      ) : (
        <div className={`lb-body ${mounted ? "lb-body--in" : ""}`}>

          {/* PODIUM */}
          <div className="lb-podium">
            {podiumSlots.map((slot, podiumIndex) => {
              if (!slot) return <div key={podiumIndex} className="lb-podium-empty" />;
              const { user, rank } = slot;
              const cfg = PODIUM_CONFIG[rank];
              return (
                <div
                  key={user.id}
                  className={`lb-podium-card lb-podium-card--${rank + 1}`}
                  style={{ "--glow": cfg.glowColor, "--ring": cfg.ringColor, "--delay": cfg.delay } as React.CSSProperties}
                >
                  <div className="podium-rank-icon">{cfg.icon}</div>
                  <div className="podium-avatar-wrap">
                    <img className="podium-avatar" src={user.avatar} alt={user.username} />
                    <div className="podium-avatar-ring" />
                  </div>
                  <div className="podium-name">{user.username}</div>
                  <div className="podium-pts">
                    <span className="podium-pts-num">{user.points.toLocaleString()}</span>
                    <span className="podium-pts-label">pts</span>
                  </div>
                  <div className="podium-q">{user.questions} Qs</div>
                  <div className="podium-base" style={{ height: cfg.height }} />
                  <div className="podium-rank-label">{cfg.label}</div>
                </div>
              );
            })}
          </div>

          {/* REST OF TABLE */}
          {rest.length > 0 && (
            <div className="lb-table">
              <div className="lb-table-head">
                <span className="col-rank">#</span>
                <span className="col-user">Player</span>
                <span className="col-q">Questions</span>
                <span className="col-pts">Points</span>
              </div>
              <div className="lb-table-body">
                {rest.map((user, i) => (
                  <div
                    key={user.id}
                    className="lb-table-row"
                    style={{ "--row-delay": `${(i + 3) * 60}ms` } as React.CSSProperties}
                  >
                    <span className="col-rank row-rank-num">{i + 4}</span>
                    <span className="col-user row-user">
                      <img className="row-avatar" src={user.avatar} alt={user.username} />
                      <span className="row-username">{user.username}</span>
                    </span>
                    <span className="col-q row-q">{user.questions}</span>
                    <span className="col-pts row-pts">{user.points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}