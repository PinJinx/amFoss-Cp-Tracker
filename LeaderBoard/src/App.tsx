import { useEffect, useMemo, useState } from "react";
import "./App.css";

type User = {
  id: number;
  username: string;
  avatar: string;
  questions: number;
  points: number;
  date?: string;
};

const mockUsers: User[] = [
  {
    id: 1,
    username: "octocat",
    avatar: "https://avatars.githubusercontent.com/u/583231?v=4",
    questions: 45,
    points: 920,
    date: "2026-02-24",
  },
  {
    id: 2,
    username: "devRohith",
    avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
    questions: 38,
    points: 870,
    date: "2026-02-24",
  },
  {
    id: 3,
    username: "codeMaster",
    avatar: "https://avatars.githubusercontent.com/u/1024025?v=4",
    questions: 30,
    points: 820,
    date: "2026-02-23",
  },
  {
    id: 4,
    username: "bugHunter",
    avatar: "https://avatars.githubusercontent.com/u/69631?v=4",
    questions: 28,
    points: 780,
    date: "2026-02-24",
  },
  {
    id: 5,
    username: "stackNinja",
    avatar: "https://avatars.githubusercontent.com/u/810438?v=4",
    questions: 20,
    points: 700,
    date: "2026-02-23",
  },
];

export default function Leaderboard() {
  const [mode, setMode] = useState<"overall" | "daily">("overall");
  const [theme, setTheme] = useState<"dark" | "light">(
    (localStorage.getItem("theme") as "dark" | "light") || "dark"
  );

  const today = "2026-02-24";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const filteredUsers = useMemo(() => {
    const users =
      mode === "daily"
        ? mockUsers.filter((u) => u.date === today)
        : mockUsers;

    return [...users].sort((a, b) => b.points - a.points);
  }, [mode]);

  return (
    <div className="lb-container">
      <div className="lb-header">
        <h1>Leaderboard</h1>

        <div className="controls">
          <div className="toggle-group">
            <button
              className={mode === "overall" ? "active" : ""}
              onClick={() => setMode("overall")}
            >
              Overall
            </button>
            <button
              className={mode === "daily" ? "active" : ""}
              onClick={() => setMode("daily")}
            >
              Daily
            </button>
          </div>

          <button
            className="theme-toggle"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      <div className="lb-table">
        <div className="lb-row header">
          <span>Rank</span>
          <span>User</span>
          <span>Questions</span>
          <span>Points</span>
        </div>

        {filteredUsers.map((user, index) => (
          <div
            key={user.id}
            className={`lb-row ${index < 3 ? "top" : ""}`}
          >
            <span className="rank">
              {index + 1}
            </span>

            <span className="user">
              <img src={user.avatar} />
              {user.username}
            </span>

            <span>{user.questions}</span>
            <span className="points">{user.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}