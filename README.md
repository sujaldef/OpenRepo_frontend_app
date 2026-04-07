# 🖥️ OpenRepo Frontend App (Electron Desktop)

**GitHub About:**
Native desktop application for analyzing repositories, detecting issues, and providing AI-powered insights. Built with Electron + React with IDE-like code explorer, real-time analysis, and comprehensive metrics dashboard.

---

## 📋 Overview

OpenRepo Frontend App is a powerful **Electron-based desktop application** that brings enterprise-grade code analysis to developers' desktops. Seamlessly inspect repositories, identify issues, get ML predictions, and receive actionable recommendations in a polished, native IDE experience.

### ✨ Key Features
- 🔍 **Code Explorer**: Native IDE with file tree, syntax highlighting, and issue markers
- 📊 **Dashboard**: Repository analytics, KPIs, and health metrics
- ⚠️ **Issue Detection**: Identifies code defects, security issues, and code smells
- 🤖 **AI Predictions**: Machine learning-powered vulnerability predictions
- 💡 **Recommendations**: Data-driven improvement suggestions
- 🌓 **Dark Theme**: Professional dark UI matching modern dev tools

---

## 🏗️ Project Structure

```
frontend-app/
├── electron.cjs              # ⚡ Electron main process
├── preload.cjs               # 🔐 IPC bridge & security
├── vite.config.js            # ⚙️ Build config
├── package.json              # 📦 Dependencies
│
├── public/                   # 🎨 Static assets
├── index.html                # 📄 Entry HTML
│
└── src/
    ├── main.jsx              # React entry point
    ├── App.jsx               # Router & layout
    ├── index.css             # Global styles (Tailwind)
    │
    ├── api/                  # 🌐 API clients
    │   ├── axios.js          # HTTP config
    │   ├── auth.js           # Auth endpoints
    │   ├── repos.js          # Repo CRUD
    │   ├── predictions.js    # ML endpoints
    │   ├── recommendations.js
    │   └── errors.js         # Issues/errors
    │
    └── pages/
        ├── Auth/             # Login/Register
        ├── Dashboard/        # Main workspace
        └── components/       # Reusable components
            ├── CodeExplorer/ # IDE code viewer
            ├── Issues.jsx    # Issues panel
            ├── Predictions.jsx
            ├── Recommendations.jsx
            ├── Overview.jsx  # Repo overview
            └── Code.jsx      # Code browser
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Electron 26+
- Backend running: `uvicorn app:app --reload`

### Setup
```bash
cd frontend-app
npm install
```

### Development
```bash
npm run dev          # Vite dev server
npm run electron     # Launch Electron app (open Dev Tools)
```

### Production
```bash
npm run build        # Build React
npm run preview      # Test build
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop** | Electron 26+ |
| **UI** | React 19, React Router DOM 7 |
| **Styling** | Tailwind CSS, Framer Motion |
| **HTTP** | Axios + custom interceptors |
| **Icons** | Lucide React |
| **Build** | Vite |

---

## 🔐 IPC Bridge

**Available APIs (from renderer):**
```javascript
window.electronAPI.openCodeExplorer(repoId)  // Open new Code Explorer window
```

See `preload.cjs` for full API surface.

---

## 🎯 Main Components

### CodeExplorer (`src/pages/components/CodeExplorer/`)
- File tree navigation with search
- Syntax-highlighted code viewer
- Gutter markers for issues (🔴 critical, ⚠️ warning)
- Accordion: Issues, Predictions, Recommendations
- Resizable panels (left/center/right)
- Line-by-line problem highlighting

### Dashboard (`src/pages/Dashboard/`)
- Repo list with filtering
- KPI cards (total repos, analyzed, avg score)
- Tabbed workspace (Overview, Issues, Predictions, Recommendations, Code)
- Quick actions (Add repo, Edit profile, Logout)

### Auth (`src/pages/Auth/`)
- JWT-based login/register
- Token persistence in localStorage
- Auto-redirect on 401 errors
- ProtectedRoute HOC

---

## 🌐 API Integration

**Base URL:** `http://localhost:8000`

**Key Endpoints:**
- `POST /api/auth/login` - User authentication
- `GET /api/repos` - List repositories
- `POST /api/repos` - Create repository
- `GET /api/repos/{id}/errors` - Fetch issues
- `GET /api/repos/{id}/predictions` - ML predictions
- `GET /api/repos/{id}/recommendations` - Recommendations

---

## 📝 Environment Setup

Create `.env.local`:
```
VITE_API_URL=http://localhost:8000
```

---

## 🎨 Design System

- **Colors**: Dark theme (#050505, #0a0a0a, accent purples/reds)
- **Typography**: System fonts with monospace for code
- **Spacing**: Rem-based with Tailwind scale
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React 24px

---

## 🐛 Debugging

1. **DevTools**: Uncomment in `electron.cjs`
2. **Logs**: Check Electron console
3. **REPL**: `window.electronAPI` to test IPC

---

## 🚢 Deployment

### Windows
```bash
npm run build
npm run electron-build:win
```

### macOS
```bash
npm run build
npm run electron-build:mac
```

---

## 📦 Dependencies

```json
{
  "react": "^19.2.3",
  "react-router-dom": "^7.13.0",
  "axios": "^1.x",
  "tailwindcss": "^3.x",
  "framer-motion": "^11.x",
  "lucide-react": "^0.x",
  "electron": "^26.x"
}
```

---

## 🤝 Contributing

```bash
# Feature branch workflow
git checkout -b feature/your-feature
# Make changes...
git commit -m "feat: add new feature"
git push origin feature/your-feature
# Create PR
```

---

## 📜 License

Private project - OpenRepo Platform

---

## 📞 Support

Contact development team for issues or questions.
