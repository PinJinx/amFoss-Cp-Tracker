
import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_KEY        = process.env.SUPABASE_KEY;
const PR_AUTHOR           = process.env.PR_AUTHOR;
const CHANGED_FILES_RAW   = process.env.CHANGED_FILES ?? "";
const DATE_BRANCH         = process.env.DATE_BRANCH ?? "";
const POINTS_PER_QUESTION = parseInt(process.env.POINTS_PER_QUESTION ?? "10", 10);

// ── Validate env ──────────────────────────────────────────────────────────────

  //temp for neetcode 
  const easy = [
    1,2,3,10,15,21,28,35,36,41,46,47,48,49,50,64,65,71,80,81,82,85,99,100,101,102,111,122,123,139,140,144,145,146,147,148,149
  ];
  const hard = [
  7,14,19,20,27,34,44,45,59,60,63,70,79,91,92,97,108,
  117,118,119,120,121,
  135,141,142,150
  ];
  const all = Array.from({ length: 150 }, (_, i) => i + 1);

  const medium = all.filter(
    n => !easy.includes(n) && !hard.includes(n)
  );
  // just for neet code 150


const missing = ["SUPABASE_URL", "SUPABASE_KEY", "PR_AUTHOR", "DATE_BRANCH"].filter(
  (k) => !process.env[k]
);

if (missing.length) {
  console.error(`❌  Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

//if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE_BRANCH)) {
//  console.error(`❌  DATE_BRANCH "${DATE_BRANCH}" is not a valid YYYY-MM-DD date.`);
//  process.exit(1);
//}


  function calculatePoints(changedFiles) {
    let totalPoints = 0;
    let totalQuestions = 0;

    const files = changedFiles
      .split("\n")
      .map(f => f.trim())
      .filter(f => {
        if (!f) return false;
        if (f.endsWith("/")) return false;
        const parts = f.split("/");
        return parts[0] === "Members" && parts.length >= 3;
      });

    console.log(`📂 Processing files:`);
    const seen = new Set();
    files.forEach((file) => {
      console.log(`   ${file}`);
      const match = file.match(/(\d+)\.(png|jpg|jpeg)$/i);
      if (!match) return;
      const qno = parseInt(match[1], 10);
      if (seen.has(qno)) return;
      seen.add(qno); 
      totalQuestions++;
      if (DATE_BRANCH != "neetcode-150") {totalPoints += POINTS_PER_QUESTION;}
      if (easy.includes(qno)) {
        totalPoints += 10;
        console.log(`     → Q${qno} (Easy) +10`);
      } 
      else if (medium.includes(qno)) {
        totalPoints += 20;
        console.log(`     → Q${qno} (Medium) +20`);
      } 
      else if (hard.includes(qno)) {
        totalPoints += 30;
        console.log(`     → Q${qno} (Hard) +30`);
      } 
      else {
        console.log(`     ⚠️ Q${qno} not found in any difficulty`);
      }
    });

    return { totalQuestions, totalPoints };
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
  const { totalQuestions: newQuestions, totalPoints: newPoints } = calculatePoints(CHANGED_FILES_RAW);
  if (newQuestions === 0) {
    console.log("ℹ️ No question files detected under Members/. Nothing to update.");
    process.exit(0);
  }
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
