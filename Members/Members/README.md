# 🏆 amFoss CP Tracker

## 🛠️ How to Contribute

### 1️⃣ Fork & Clone

```bash
git clone https://github.com/<your-username>/amFoss-Cp-Tracker.git
cd amFoss-Cp-Tracker
```

---

### 2️⃣ Create a Branch

> ⚠️ **Your PR must target the current date branch (`YYYY-MM-DD`), NOT `main`.**

```bash
git fetch origin
git checkout -b submit/your-name origin/YYYY-MM-DD
```

---

### 3️⃣ Create Your Folder

Inside `Members/`, create (or reuse) your folder:

```
Members/
└── Your_Name/
    ├── README.md
    └── screenshots/
```

---

### 4️⃣ Maintain Your Progress (IMPORTANT)

* A file called **`README.md`** is provided in the example folder.
* **Copy its contents into your `README.md`** inside your folder
* Use it to track your progress
👉 Every time you solve a problem:

* Update your README
* Change ⬜ → ✅ for that question

> 📌 Refer to the `example/` folder if you're unsure how it should look

---

### 5️⃣ Add Your Screenshots

* Add **one screenshot per solved question**
* Must show **Accepted (green tick ✅)**
* Store inside `screenshots/` folder
* Name files **only by question number**

**Correct format:**

```
screenshots/
├── 1.png
├── 2.png
├── 15.png
```

> ❌ Do NOT use: `Q1.png`, `solution.png`, etc.
> ✅ Only: `1.png`, `2.png`, `3.png`, ...

---

### 6️⃣ Commit & Push

```bash
git add Members/Your_Name/
git commit -m "add: solved questions 1,2,3 - Your_Name"
git push origin submit/your-name
```

---

### 7️⃣ Raise a Pull Request

* Base branch → **today’s date (`YYYY-MM-DD`)**
* Title format:

  ```
  Your_Name | X questions | YYYY-MM-DD
  ```

---

## ✅ Rules

* Submit **only your own** accepted solutions
* One submission per day
* Maintain your **README progress tracker properly**

---

## ⚠️ Common Mistakes

* PR sent to `main` instead of date branch
* Wrong screenshot naming
* Not updating README
* Files not inside correct folder
