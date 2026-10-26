# Mystery Investigation Room

An AI-assisted mystery game built from `SPEC.md`.

## Run locally

```powershell
npm install
Copy-Item server\.env.example server\.env
npm run dev
```

The client runs on `http://localhost:5173` and the API on `http://localhost:4000`.
Without a Gemini key or MongoDB connection, the server uses a local demo case and in-memory persistence so the interface remains runnable.
