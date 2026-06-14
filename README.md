# NayePankh Foundation AI Agent Chatbot ("Asha")

Asha is a state-of-the-art, responsive AI chatbot developed for NayePankh Foundation, a youth-led registered NGO in Uttar Pradesh, India, dedicated to uplifting underprivileged communities. Asha serves as the warm, knowledgeable voice of the foundation, helping users learn about volunteering, tax exemptions, donations, and impact metrics.

---

## 📁 Repository Structure

```text
├── backend/
│   ├── .env                       # Backend environment variables (API keys)
│   ├── api.py                     # FastAPI web server, endpoints, rate limiting
│   ├── main.py                    # CLI loop version of the chatbot
│   ├── nayepankh_system_prompt.txt# Official system prompt (instructions, constraints, facts)
│   └── requirments.txt            # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── assets/                # Logo and static graphic assets
│   │   ├── App.jsx                # Main React App interface and logic
│   │   ├── App.css                # Styled layout, themes, animations, & queries
│   │   ├── index.css              # Global styles & brand CSS variables
│   │   └── main.jsx               # React entry point
│   ├── index.html                 # Main HTML shell, SEO meta tags, Google Fonts
│   ├── package.json               # Node dependencies and scripts
│   └── vite.config.js             # Vite configurations
└── tools.py                       # Empty/unused tools placeholder
```

---

## ⚡ Tech Stack

- **Backend**: Python 3, FastAPI, Uvicorn, Groq Cloud API (`llama-3.1-8b-instant` model).
- **Frontend**: React 19, Vite, Axios, Vanilla CSS (with modern CSS variables & Google Font `Outfit`).

---

## 🛠️ Installation & Setup

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Set up a Virtual Environment** (if not already done):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirments.txt
   ```

4. **Environment Variables**:
   Create a `.env` file inside the `backend` folder with your Groq API key:
   ```env
   GROQ_API_KEY="your-groq-api-key-here"
   ```

5. **Start the API Server**:
   ```bash
   python -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend will be live at `http://127.0.0.1:8000`.

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The dev server will run locally (typically at `http://localhost:5173` or `http://localhost:5174`).

4. **Build for Production**:
   To compile a production bundle:
   ```bash
   npm run build
   ```
   Compiles optimized, compressed assets into the `dist/` directory.

---

## ✨ Premium Features

- **Gemini-Style Welcome Cards**: Displays three interactive card widgets (Donate, Volunteer, and Initiatives) when the chat is empty. Clicking a card instantly submits the prompt. The cards transition out smoothly when the chat begins.
- **Copy-to-Clipboard**: Hovering over any AI message reveals a copy icon. Clicking copies the text and animates into a green checkmark for 2 seconds to confirm copying.
- **Dynamic Text Input**: Textarea auto-expands up to a maximum height of 120px to prevent scrollbars and layout breaking as you type long queries.
- **Custom Markdown & Link Parser**: Automatically converts links, phone numbers, and emails into clickable anchors, and parses bold markdown (`**text**`) and lists safely without adding bloated dependencies.
- **Interactive Suggestions**: Prominent suggestions chips let you send standard questions with a single click.
- **Clear Chat**: Clear history dynamically in the header.
- **Rate-Limiting**: The backend enforces rate limits based on client IP addresses (30 requests/minute) to prevent spamming.
- **CORS & Security Headers**: Fully configured with CORS allowance and security headers (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`) for safe hosting.
- **SEO & Accessibility Ready**: Includes clean heading hierarchies, meta descriptors, keywords, and explicit element IDs for testing.
