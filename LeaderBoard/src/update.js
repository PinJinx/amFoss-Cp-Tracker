// ─────────────────────────────────────────────────────────────────────────────
//  update.js  —  Called by GitHub Actions on PR open / sync against a date branch.
//
//  Folder convention:  Members/<any-name>/screenshot1.png
//  The PR author's GitHub username is used for the leaderboard entry.
//  The subfolder name under Members/ does NOT need to match the GitHub username.
//
//  Env vars (all injected by the workflow):
//    SUPABASE_URL        – https://xyzxyz.supabase.co
//    SUPABASE_KEY        – service_role key  (NOT the anon key)
//    PR_AUTHOR           – GitHub username of the PR author
//    CHANGED_FILES       – newline-separated list of added files
//    DATE_BRANCH         – target branch name = YYYY-MM-DD date
//    POINTS_PER_QUESTION – points per question file (default 10)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_KEY        = process.env.SUPABASE_KEY;
const PR_AUTHOR           = process.env.PR_AUTHOR;
const CHANGED_FILES_RAW   = process.env.CHANGED_FILES ?? "";
const DATE_BRANCH         = process.env.DATE_BRANCH ?? "";
const POINTS_PER_QUESTION = parseInt(process.env.POINTS_PER_QUESTION ?? "10", 10);

// ── Validate env ──────────────────────────────────────────────────────────────

const missing = ["SUPABASE_URL", "SUPABASE_KEY", "PR_AUTHOR", "DATE_BRANCH"].filter(
  (k) => !process.env[k]
);

if (missing.length) {
  console.error(`❌  Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE_BRANCH)) {
  console.error(`❌  DATE_BRANCH "${DATE_BRANCH}" is not a valid YYYY-MM-DD date.`);
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Count files added anywhere inside  Members/<any-subfolder>/
 * The subfolder name doesn't have to match the GitHub username —
 * we count ALL files added under Members/ by this PR.
 * Skips bare directory markers (paths ending with /).
 */
function countNewQuestions(changedFiles) {
  const files = changedFiles
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => {
      if (!f) return false;
      if (f.endsWith("/")) return false;                  // directory marker
      const parts = f.split("/");
      return parts[0] === "Members" && parts.length >= 3; // Members/<folder>/<file>
    });

  console.log(`📂  Question files found in this PR:`);
  if (files.length === 0) {
    console.log("     (none under Members/)");
  } else {
    files.forEach((f) => console.log(`     ${f}`));
  }

  return files.length;
}

/**
 * Fetch the GitHub avatar URL for a username.
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const username     = PR_AUTHOR.toLowerCase();
  const newQuestions = countNewQuestions(CHANGED_FILES_RAW);

  if (newQuestions === 0) {
    console.log("ℹ️   No question files detected under Members/. Nothing to update.");
    process.exit(0);
  }

  const newPoints = newQuestions * POINTS_PER_QUESTION;
  console.log(
    `\n👤  User        : ${username}` +
    `\n📅  Date branch : ${DATE_BRANCH}` +
    `\n📝  New Qs      : ${newQuestions}` +
    `\n⭐  New points  : +${newPoints}  (${POINTS_PER_QUESTION} pts each)\n`
  );

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Fetch existing totals
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

  console.log(
    `📊  Running totals:` +
    `\n    questions : ${existing?.questions ?? 0} + ${newQuestions} = ${totalQuestions}` +
    `\n    points    : ${existing?.points    ?? 0} + ${newPoints}    = ${totalPoints}`
  );

  // Upsert — one row per user, date = the branch name
  const { error: upsertError } = await supabase
    .from("leaderboard")
    .upsert(
      {
        username,
        avatar,
        questions : totalQuestions,
        points    : totalPoints,
        date      : DATE_BRANCH,
      },
      {
        onConflict       : "username",
        ignoreDuplicates : false,
      }
    );

  if (upsertError) {
    console.error("❌  Supabase upsert failed:", upsertError.message);
    process.exit(1);
  }

  console.log(`\n✅  Leaderboard updated successfully for ${username}!`);
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});