# Market Research AI Assistant (Production v1.0)

A high-fidelity, enterprise-grade B2B SaaS platform designed to generate complex market research datasets using Gemini 2.5 Flash and export them as professional PDF reports.

## 🏗️ Architecture Overview

The system follows a **Secure Proxy Architecture**:
- **Frontend**: React.js (v18) with Chart.js visualization. Uses `React.lazy` for efficient code distribution.
- **Backend**: Node.js / Express proxy layer. Obfuscates the custom system prompt and securely manages Google Cloud API credentials.
- **Database**: Supabase for persistent submission logging and report storage.

## 🚀 deployment into Production (Render)

1. **Connect Repository**: Connect your GitHub repository to a new Render **Web Service**.
2. **Set Root Directory**: Set the root directory to `server/`.
3. **Configure Build/Start**:
   - **Build Command**: `cd ../react-app && npm run build`
   - **Start Command**: `node index.js`
4. **Environment Variables**:
   Inject the following keys into the Render secret manager:
   - `GEMINI_API_KEY`: Your private Google AI API Key.
   - `REACT_APP_SUPABASE_URL`: Your Supabase project URL.
   - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous public key.

## 🛠️ Local Development

### 1. Backend Setup
```bash
cd server
npm install
node index.js
```

### 2. Frontend Setup
```bash
cd react-app
npm install
npm start
```

## 🔐 Security Standards
- **Rate Limiting**: Protected against bot attacks via `express-rate-limit` (5 requests/min per IP).
- **Header Protection**: Implements `helmet.js` for industry-standard HTTP security.
- **Credential Safety**: zero API keys are stored in the client-side bundle.

