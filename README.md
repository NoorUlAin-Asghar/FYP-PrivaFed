<!-- 
# 🎯 Pitch Writer

Pitch Writer is a sleek, personalized pitch generation tool powered by AI. You can create, edit, and manage tailored pitches for job applications, cold emails, or personal branding — all in one place.

---

## ✨ Features

- ✍️ **Generate personalized pitches** using titlw, description, pitch type, and tone preferences.
- 📝 **Edit and delete** generated pitches.
- 🎨 **Customize pitch tone** (professional, casual, confident, etc.).
- 🔒 **Private storage** via Supabase – your pitches are visible only to you.
- 🔁 **Live updates** – changes reflect instantly.
- 💬 **Toasts** for feedback on user actions.

---

## ⚙️ Tech Stack

- [Next.js](https://nextjs.org/) – React framework for frontend/backend.
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework.
- [Framer Motion](https://www.framer.com/motion/) – For UI animations.
- [Supabase](https://supabase.com/) – Auth + database storage.
- [Hugging Face API](https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct) – For AI pitch generation (Meta-Llama-3-8B-Instruct).

---

## 🖥️ Live Demo

🚀 [View deployed app on Vercel](https://pitch-writer.vercel.app/)

---

## 🧠 How It Works

1. User fills in title, description, type and tone.
2. Data is sent to Hugging Face API using fetch.
3. The response (AI-generated pitch) is shown.
4. Users can edit, save, or delete pitches.
5. All data is stored and retrieved securely via Supabase.

---

## 🔐 Auth & Data

- Email-based authentication via Supabase Magic Link.
- RLS policies ensure only logged-in users access their own content.
- No third-party data sharing.

---

## 📄 Documentation

See full documentation at: [`/docs`](https://pitch-writer.vercel.app/docs)  
Or check out [`DocumentationPage.jsx`](./app/docs/page.tsx) in the codebase.

---

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
https://github.com/NoorUlAin-Asghar/Nexium_NoorUlAinAsghar.git
cd final-project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_ANON_KEY=your_supabase_anon_key
HF_TOKEN=your_huggingface_token
```

### 4. Run the Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure (Simplified)

```
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Main landing page UI.
│   │   ├── api/
│   │   │   └── pitch-writer/
│   │   │       └── route.js          # API route calling Hugging Face model to generate pitches.
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Displays user's saved/generated pitches.
│   │   ├── docs/
│   │   │   └── page.tsx              # Documentation or instructions for the web app.
│   │   ├── generate/
│   │   │   └── page.tsx              # Form interface for input to generate a pitch.
│   │   └── sign-in/
│   │       ├── page.tsx              # Sign-in UI for user authentication.
│   │       └── signInClient.tsx      # Handles Supabase sign-in logic.
│   |
│   ├── components/
│   │   ├── ui/                       # Reusable UI elements like buttons and inputs.
│   │   ├── navbar/                   # Navigation bar component for app-wide use.
│   │   └── protectedRoute/           # Guards pages requiring authentication.
│   |
│   └── lib/
│       ├── pitch-db.js               # Supabase DB functions (save, fetch, update, delete pitch).
│       └── supabaseClient.js         # Initializes Supabase client with environment credentials.
│
├── .env                              # Environment variables (API keys, Supabase config).
└── README.md                         # Project overview, setup guide, and usage instructions.
```
 
---

## 📎 License

MIT License – free to use, modify, and distribute.

---

© 2025 Pitch Writer. All rights reserved. -->
