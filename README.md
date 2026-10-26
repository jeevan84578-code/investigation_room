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

## Deploy on Render

This repository includes `render.yaml` for a single Render web service. In Render, choose **New → Blueprint**, connect `jeevan84578-code/investigation_room`, and apply the blueprint. The service builds the Vite client and serves it from Express, so the deployed site and API share one URL.

Optional environment variables:

- `GEMINI_API_KEY`: Gemini API key. If omitted, the app uses its built-in demo mystery generator.
- `GEMINI_MODEL`: Gemini model name, defaulting to `gemini-2.0-flash`.
- `MONGODB_URI`: Reserved for the MongoDB persistence implementation.
