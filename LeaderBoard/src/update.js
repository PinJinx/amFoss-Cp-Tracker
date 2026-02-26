// ─────────────────────────────────────────────────────────────────────────────
//  update.js  —  Called by GitHub Actions on PR merge.
//
//  What it does:
//    1. Reads PR author + changed files from env vars set by the workflow
//    2. Counts screenshot files inside  member/<username>/
//    3. Fetches the user's existing row from Supabase (if any)
//    4. Upserts:  total questions += new_count,  points += new_count * POINTS_PER_Q
//                 avatar is refreshed from GitHub each time
//
//  Env vars required (set as GitHub Actions secrets / env):
//    SUPABASE_URL        – e.g. https://xyzxyz.supabase.co
//    SUPABASE_KEY        – service_role key  (NOT the anon key)
//    PR_AUTHOR           – GitHub username of the PR author
//    CHANGED_FILES       – newline-separated list of changed files (from workflow)
//    POINTS_PER_QUESTION – (optional) points per question, default 10
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

// ── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_KEY        = process.env.SUPABASE_KEY;          // service_role
const PR_AUTHOR           = process.env.PR_AUTHOR;
const CHANGED_FILES_RAW   = process.env.CHANGED_FILES ?? "";
const POINTS_PER_QUESTION = parseInt(process.env.POINTS_PER_QUESTION ?? "10", 10);

// ── Validate env ─────────────────────────────────────────────────────────────

const missing = ["SUPABASE_URL", "SUPABASE_KEY", "PR_AUTHOR"].filter(
  (k) => !process.env[k]
);

if (missing.length) {
  console.error(`❌  Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Count screenshot files the PR author added inside  member/<username>/
 * A "screenshot file" is anything that is NOT a directory marker (no trailing /).
 * We ignore any files outside the author's own member folder.
 */
function countNewQuestions(changedFiles, username) {
  const prefix = `member/${username}/`;
  const relevant = changedFiles
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.startsWith(prefix) && f !== prefix);

  // Exclude bare folder markers (git sometimes lists them ending with /)
  const files = relevant.filter((f) => !f.endsWith("/"));

  console.log(`📂  Files under ${prefix}:`);
  files.forEach((f) => console.log(`     ${f}`));

  return files.length;
}

/**
 * Fetch the GitHub avatar URL for a username.
 * Falls back to a blank string if the API fails.
 */
async function fetchAvatar(username) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        "User-Agent": "leaderboard-bot",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    return data.avatar_url ?? "";
  } catch (err) {
    console.warn(`⚠️  Could not fetch avatar for ${username}: ${err.message}`);
    return "";
  }
}

/**
 * Today's date as YYYY-MM-DD in UTC.
 */
function todayUTC() {
  return new Date().toISOString().split("T")[0];
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const username     = PR_AUTHOR.toLowerCase();
  const newQuestions = countNewQuestions(CHANGED_FILES_RAW, username);

  if (newQuestions === 0) {
    console.log("ℹ️   No question files detected for this PR. Nothing to update.");
    process.exit(0);
  }

  const newPoints = newQuestions * POINTS_PER_QUESTION;
  console.log(
    `\n👤  User       : ${username}` +
    `\n📝  New Qs     : ${newQuestions}` +
    `\n⭐  New points : ${newPoints}  (${POINTS_PER_QUESTION} pts each)\n`
  );

  // ── Supabase client ────────────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ── Fetch existing row ─────────────────────────────────────────────────────
  const { data: existing, error: fetchError } = await supabase
    .from("leaderboard")
    .select("questions, points")
    .eq("username", username)
    .maybeSingle();

  if (fetchError) {
    console.error("❌  Failed to fetch existing row:", fetchError.message);
    process.exit(1);
  }

  const totalQuestions = (existing?.questions ?? 0) + newQuestions;
  const totalPoints    = (existing?.points    ?? 0) + newPoints;
  const avatar         = await fetchAvatar(username);
  const today          = todayUTC();

  console.log(
    `📊  Running totals:` +
    `\n    questions : ${existing?.questions ?? 0} + ${newQuestions} = ${totalQuestions}` +
    `\n    points    : ${existing?.points    ?? 0} + ${newPoints} = ${totalPoints}`
  );

  // ── Upsert into Supabase ───────────────────────────────────────────────────
  //  We keep one row per user (overall stats).
  //  The `date` column is updated to today so the leaderboard daily filter works:
  //  it reflects the last day they submitted questions.
  const { error: upsertError } = await supabase
    .from("leaderboard")
    .upsert(
      {
        username,
        avatar,
        questions : totalQuestions,
        points    : totalPoints,
        date      : today,
      },
      {
        onConflict         : "username",   // unique constraint on username column
        ignoreDuplicates   : false,        // always update
      }
    );

  if (upsertError) {
    console.error("❌  Supabase upsert failed:", upsertError.message);
    process.exit(1);
  }

  console.log(`\n✅  Leaderboard updated for ${username}!`);
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});