import { useEffect, useState, useCallback } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type User = {
  id: number;
  username: string;
  avatar: string;
  questions: number;
  points: number;
  date?: string;
};

const UNCLAIMED: User = {
  id: -1,
  username: "Unclaimed",
  avatar: "",          
  questions: 0,
  points: 0,
};

type Mode = "overall" | "neetcode-150";

async function fetchUsers(mode: Mode): Promise<User[]> {
  let query = supabase
    .from("leaderboard")
    .select("*")
    .order("points", { ascending: false });

  if (mode === "neetcode-150") {
    query = query.eq("date", "neetcode-150");
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// Always return exactly `count` entries; pad with UNCLAIMED ghosts
function pad(users: User[], count: number): User[] {
  const out = [...users];
  while (out.length < count) out.push({ ...UNCLAIMED, id: -(out.length + 1) });
  return out;
}

const PODIUM_CONFIG = [
  { label: "1st", icon: "♛", glowColor: "#f5b800", ringColor: "#f5b800", height: 130, delay: "0ms" },
  { label: "2nd", icon: "✦", glowColor: "#c0c0c0", ringColor: "#c0c0c0", height: 100, delay: "80ms" },
  { label: "3rd", icon: "✧", glowColor: "#cd7f32", ringColor: "#cd7f32", height: 80,  delay: "160ms" },
];

// Podium visual order: 2nd | 1st | 3rd
const PODIUM_ORDER = [1, 0, 2];

// How many rows to show below the podium (padded with ghosts if needed)
const TABLE_ROWS = 7;

export default function Leaderboard() {
  const [mode, setMode]       = useState<Mode>("overall");
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme]     = useState<"dark" | "light">(
    () => (localStorage.getItem("lb-theme") as "dark" | "light") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("lb-theme", theme);
  }, [theme]);

  const load = useCallback(async () => {
    setMounted(false);
    setUsers([]);
    setLoading(true);
    const data = await fetchUsers(mode);
    setUsers(data);
    setLoading(false);
    setTimeout(() => setMounted(true), 50);
  }, [mode]);

  useEffect(() => { load(); }, [load]);

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    setUsers([]);
    setMounted(false);
    setMode(next);
  };

  // Pad to at least 3 for podium, rest fills TABLE_ROWS below
  const padded      = pad(users, 3);
  const podiumSlots = PODIUM_ORDER.map((i) => ({ user: padded[i], rank: i }));
  const restReal    = users.slice(3);
  const restPadded  = pad(restReal, TABLE_ROWS);   // always TABLE_ROWS rows

  const isGhost = (u: User) => u.id < 0;

  return (
    <div className="lb-root">
      {/* HEADER */}
      <header className="lb-head">
        <div className="lb-brand">
          {theme == "dark" ?(<img src="./amFOSS-l.png" width={50} height={60}></img>):
          (<img src="./amFOSS-d.png" width={50} height={60}></img>)}
          <h1 className="lb-title">CP Rankings</h1>
        </div>

        <div className="lb-controls">
          <div className="lb-tabs">
            <button
              className={`lb-tab ${mode === "overall" ? "lb-tab--on" : ""}`}
              onClick={() => handleModeChange("overall")}
            >
              Overall
            </button>
            <button
              className={`lb-tab ${mode === "neetcode-150" ? "lb-tab--on" : ""}`}
              onClick={() => handleModeChange("neetcode-150")}
            >
              NeetCode 150
            </button>
          </div>

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
      ) : (
        <div className={`lb-body ${mounted ? "lb-body--in" : ""}`}>

          {/* PODIUM — always 3 slots */}
          <div className="lb-podium">
            {podiumSlots.map(({ user, rank }, podiumIndex) => {
              const cfg   = PODIUM_CONFIG[rank];
              const ghost = isGhost(user);
              return (
                <div
                  key={podiumIndex}
                  className={`lb-podium-card lb-podium-card--${rank + 1} ${ghost ? "lb-podium-card--ghost" : ""}`}
                  style={{
                    "--glow": ghost ? "transparent" : cfg.glowColor,
                    "--ring": ghost ? "#444"        : cfg.ringColor,
                    "--delay": cfg.delay,
                  } as React.CSSProperties}
                >
                  <div className="podium-rank-icon">{cfg.icon}</div>
                  <div className="podium-avatar-wrap">
                    {ghost ? (
                      <div className="podium-avatar podium-avatar--ghost"></div>
                    ) : (
                      <img className="podium-avatar" src={user.avatar} alt={user.username} />
                    )}
                    <div className="podium-avatar-ring" />
                  </div>
                  <div className={`podium-name ${ghost ? "podium-name--ghost" : ""}`}>
                    {user.username}
                  </div>
                  <div className="podium-pts">
                    {ghost ? (
                      <span className="podium-pts-label podium-pts--ghost">—</span>
                    ) : (
                      <>
                        <span className="podium-pts-num">{user.points.toLocaleString()}</span>
                        <span className="podium-pts-label">pts</span>
                      </>
                    )}
                  </div>
                  <div className="podium-q">{ghost ? "" : `${user.questions} Qs`}</div>
                  <div className="podium-base" style={{ height: cfg.height }} />
                  <div className="podium-rank-label">{cfg.label}</div>
                </div>
              );
            })}
          </div>

          {/* TABLE — always TABLE_ROWS rows */}
          <div className="lb-table">
            <div className="lb-table-head">
              <span className="col-rank">#</span>
              <span className="col-user">Player</span>
              <span className="col-q">Questions</span>
              <span className="col-pts">Points</span>
            </div>
            <div className="lb-table-body">
              {restPadded.map((user, i) => {
                const ghost = isGhost(user);
                return (
                  <div
                    key={user.id}
                    className={`lb-table-row ${ghost ? "lb-table-row--ghost" : ""}`}
                    style={{ "--row-delay": `${(i + 3) * 60}ms` } as React.CSSProperties}
                  >
                    <span className="col-rank row-rank-num">{i + 4}</span>
                    <span className="col-user row-user">
                      {ghost ? (
                        <span className="row-avatar row-avatar--ghost">?</span>
                      ) : (
                        <img className="row-avatar" src={user.avatar} alt={user.username} />
                      )}
                      <span className={`row-username ${ghost ? "row-username--ghost" : ""}`}>
                        {user.username}
                      </span>
                    </span>
                    <span className="col-q row-q">{ghost ? "—" : user.questions}</span>
                    <span className="col-pts row-pts">{ghost ? "—" : user.points.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}