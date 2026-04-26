# Document Translator — Nepali → English (Gemini)

A free web app that translates Nepali citizenship certificates to English using Google's Gemini AI (free tier, no credit card required).

---

## 📋 What you need (one-time)

1. A computer (Windows / Mac / Linux)
2. Internet connection
3. About 10 minutes

**You do NOT need:**
- A credit card
- Any payment
- Any coding experience

---

## 🚀 Setup — Follow these steps in order

### Step 1: Install Node.js

Node.js is what runs the app. If you've never installed it, do this:

1. Go to **https://nodejs.org**
2. Click the big green button that says **"LTS"** (Long Term Support) — this downloads the installer
3. Open the downloaded file and click "Next" through every screen (default settings are fine)
4. Once installed, **restart your computer** (trust me, it helps avoid weird issues)

**To check it worked:** Open a terminal (on Windows, search "Command Prompt"; on Mac, open "Terminal") and type:
```
node --version
```
If you see something like `v20.11.0`, you're good.

---

### Step 2: Install VS Code

If you don't have it yet:
1. Go to **https://code.visualstudio.com**
2. Download and install (all default settings)

---

### Step 3: Get your FREE Gemini API key

This is the part that makes the AI work. It's free, no credit card needed.

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with any Google account (your regular Gmail works)
3. Click the blue **"Create API key"** button
4. If it asks to pick a project, just pick "Create API key in new project"
5. A long key will appear (starts with `AIza...`) — **copy it immediately**
6. **Save this key somewhere safe** (a notepad, a password manager — anywhere you can find it again)

> ⚠️ Treat this key like a password. Don't share it, don't post it online.

**Free tier limits** (more than enough for personal use):
- 10 requests per minute
- 250 requests per day

---

### Step 4: Open the project in VS Code

1. **Unzip** this project to a folder you can find (like your Desktop)
2. Open **VS Code**
3. Click **File → Open Folder** (or **File → Open** on Mac)
4. Pick the unzipped folder
5. If it asks "Do you trust the authors?", click **Yes**

---

### Step 5: Open the terminal inside VS Code

In VS Code:
- Press `` Ctrl+` `` (backtick key, usually below the Escape key) on Windows/Linux
- Press `` Cmd+` `` on Mac
- OR click **Terminal → New Terminal** in the top menu

A terminal window appears at the bottom of VS Code.

---

### Step 6: Install the app's dependencies

In that terminal, type this and press Enter:

```
npm install
```

**Wait about 1–2 minutes.** You'll see lots of text scrolling. When it finishes, you'll see your prompt again. That's normal.

---

### Step 7: Create your `.env` file (where your API key goes)

In the VS Code terminal, type ONE of these commands:

**On Windows:**
```
copy .env.example .env
```

**On Mac/Linux:**
```
cp .env.example .env
```

Now in VS Code's left sidebar, you should see a new file called `.env`. Click it to open it.

It will look like this:
```
GEMINI_API_KEY=paste-your-key-here
PORT=3001
```

**Replace `paste-your-key-here` with the API key you copied in Step 3.** Save the file (`Ctrl+S` or `Cmd+S`).

It should now look like:
```
GEMINI_API_KEY=AIzaSyD...your actual key...
PORT=3001
```

---

### Step 8: Start the app!

In the VS Code terminal, type:

```
npm run dev
```

After a few seconds you'll see output like:

```
✅ Server running on http://localhost:3001
   Using Gemini 2.5 Flash (free tier)

  VITE v5.3.1  ready in 382 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.42:5173/
```

🎉 **Open `http://localhost:5173` in your browser** — that's your app!

---

## 📱 Use it on your phone

When the app is running, look at the terminal. You'll see a **Network** URL (like `http://192.168.1.42:5173`).

1. Make sure your **phone is on the same Wi-Fi** as your computer
2. Open your phone's browser (Chrome/Safari)
3. Type that **Network URL** exactly as shown

Boom — app on your phone. You can upload photos directly from your camera.

---

## 🛑 How to stop the app

In the VS Code terminal, press `Ctrl+C` (or `Cmd+C` on Mac). To start again next time, just `npm run dev`.

---

## ❓ Troubleshooting

**"npm: command not found"**
→ Node.js didn't install properly. Restart your computer and try Step 1 again.

**"GEMINI_API_KEY is missing"**
→ You didn't create the `.env` file, or you didn't paste your key. Re-check Step 7.

**"Extraction failed: API key not valid"**
→ Your API key is wrong. Go back to https://aistudio.google.com/apikey and copy it again — make sure there are no extra spaces.

**"Extraction failed: quota exceeded"**
→ You hit the free tier daily limit (250 requests/day). Wait until tomorrow, or upgrade to paid tier.

**Phone can't open the Network URL**
→ Either phone and computer aren't on the same Wi-Fi, OR your Wi-Fi network blocks device-to-device connections (common on public/guest Wi-Fi). Try from your home network.

**"Port 5173 already in use" or "Port 3001 already in use"**
→ Another program is using that port. Close other apps, or change `PORT=3001` in your `.env` to something like `PORT=3002`.

**The terminal shows lots of red text after `npm install`**
→ Warnings (yellow) are fine. Actual errors (red "ERROR") mean something's wrong — copy the error and search it, or ask for help.

---

## 🧠 How it works (for the curious)

1. You upload citizenship photos (front + back)
2. The frontend sends them to your local backend (`http://localhost:3001`)
3. The backend sends them to Google's Gemini 2.5 Flash with a prompt asking it to extract + translate each field
4. Gemini returns structured JSON (name, DOB, addresses — all in English)
5. The frontend renders that JSON into a clean, printable certificate layout
6. You can edit any field before saving as PDF

Your API key stays only on the backend. It's never sent to the browser.

---

## 📦 Project structure

```
├── src/                 Frontend (React)
│   ├── App.jsx          Main UI
│   ├── main.jsx         Entry point
│   └── index.css        Styles
├── server/
│   └── index.js         Backend (Node + Express + Gemini)
├── .env                 Your API key (keep secret!)
├── .env.example         Template
├── package.json         Dependencies
└── README.md            This file
```

---

## 🚢 Want to deploy it online?

For free hosting that anyone can access (not just same Wi-Fi), I recommend:

- **Frontend:** Vercel (vercel.com) — free
- **Backend:** Railway (railway.app) or Render (render.com) — free tier

Or convert the whole thing to Next.js and deploy everything on Vercel in one go. Ask for help when you're ready for this.

---

Have fun! 🇳🇵 → 🇬🇧
