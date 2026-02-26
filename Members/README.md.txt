# 🏆 amFoss CP Tracker

Track your competitive programming progress and compete with fellow members on the leaderboard!

---

## 📋 How It Works

When you raise a PR with your question screenshots, our GitHub Actions bot will automatically:
- Count the number of questions you solved
- Update your score on the leaderboard
- Merge your PR into the daily branch

---

## 🛠️ How to Contribute

### 1️⃣ Fork the Repository

Click the **Fork** button at the top right of this page, then clone your fork:

```bash
git clone https://github.com/<your-username>/amFoss-Cp-Tracker.git
cd amFoss-Cp-Tracker
```

---

### 2️⃣ Create a Branch

> ⚠️ **Your PR must target the current date branch (e.g. `2026-02-26`), NOT `main`.**
> PRs raised against `main` will be automatically rejected.

Create and switch to a new branch off the date branch:

```bash
git fetch origin
git checkout -b submit/your-name origin/2026-02-26
```

Replace `2026-02-26` with today's date in `YYYY-MM-DD` format.

---

### 3️⃣ Create Your Folder

Inside `Members/`, create a folder with **your name** (use the same name every time):

```
Members/
└── Your_Name/
    ├── Q1.png
    ├── Q2.png
    └── Q3.png
```

> ✅ If your folder already exists from a previous submission, just add new screenshots into it.

---

### 4️⃣ Add Your Screenshots

- Add **one screenshot per question solved**
- The screenshot **must show an accepted submission** (green ✅ verdict visible)
- Name each file by question number

**Example:**
```
Q1.png   ← screenshot of question 1 acceptance
Q2.png   ← screenshot of question 2 acceptance
Q3.png   ← screenshot of question 3 acceptance
```

---

### 5️⃣ Commit and Push

```bash
git add Members/Your_Name/
git commit -m "add: Q1, Q2, Q3 solutions - Your_Name"
git push origin submit/your-name
```

---

### 6️⃣ Raise a Pull Request

1. Go to your fork on GitHub
2. Click **"Compare & pull request"**
3. **Make sure the base branch is set to today's date branch** (e.g. `2026-02-26`) — **not** `main`
4. Add a short title like `Your_Name | 3 questions | 2026-02-26`
5. Click **"Create pull request"**

Once the PR is open, the bot will:
1. Count your question files
2. Update your points on the leaderboard (+10 pts per question)
3. Post a summary comment on your PR
4. Auto-merge the PR

---

## ✅ Checklist Before Submitting

| | Rule |
|---|---|
| ☑️ | PR is targeting a **date branch** (`YYYY-MM-DD`), not `main` |
| ☑️ | Screenshots show **accepted** verdicts only |
| ☑️ | Files are inside `Members/Your_Name/` |
| ☑️ | One file per question, named `Q1.png`, `Q2.png`, etc. |
| ☑️ | You have only modified **your own folder** |
| ☑️ | Commit message is clean and descriptive |

---

## ⚠️ Common Mistakes

**PR rejected immediately?**
→ You raised your PR against `main`. Change the base branch to today's date branch.

**Bot shows 0 questions?**
→ Your files are not inside `Members/Your_Name/` or don't have at least 2 path segments.

**Points not updating?**
→ Make sure your screenshots are actual files (`.png`, `.jpg`) and not folders.

