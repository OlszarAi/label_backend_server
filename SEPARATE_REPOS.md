# 🚀 Deployment Guide - Osobne Repozytoria

## 📋 Architektura z osobnymi repo

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repositories                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📁 label-backend-server/     📁 label-frontend/               │
│  ├── Express.js + TypeScript  ├── Next.js/React               │
│  ├── Prisma ORM              ├── TailwindCSS                  │
│  ├── Supabase config         ├── API Integration              │
│  └── Vercel ready            └── Vercel ready                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Deployment                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 Frontend                  🖥️ Backend                      │
│  your-app.vercel.app         your-api.vercel.app              │
│                                    ↓                           │
│                               🗄️ Database                     │
│                               Supabase PostgreSQL             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **BACKEND REPOSITORY (już masz gotowe)**

### **Co jest już przygotowane:**
- ✅ Express.js + TypeScript + Prisma
- ✅ Supabase integration
- ✅ `vercel.json` configuration
- ✅ Deployment scripts
- ✅ Environment variables setup

### **Deploy backend na Vercel:**

```bash
# W folderze label-backend-server/
cd ~/Documents/work/Label/label_backend_server

# 1. Przełącz na Supabase
npm run supabase:switch

# 2. Deploy jedną komendą
npm run deploy:setup

# 3. Ustaw env vars w Vercel Dashboard:
# DATABASE_URL=postgresql://postgres:haslo@db.xyz.supabase.co:5432/postgres
# NODE_ENV=production
# JWT_SECRET=your_super_secret_key
# FRONTEND_URL=https://your-frontend.vercel.app
```

**Rezultat:** Backend będzie dostępny pod `https://your-backend.vercel.app`

---

## 🌐 **FRONTEND REPOSITORY**

### **Setup nowego repo dla frontend:**

```bash
# 1. Utwórz nowe repo na GitHub
# 2. Clone lokalnie
git clone https://github.com/your-username/label-frontend.git
cd label-frontend

# 3. Jeśli to Next.js:
npx create-next-app@latest . --typescript --tailwind --app

# 4. Skonfiguruj API connection
```

### **Konfiguracja API w frontend:**

#### **Environment Variables (.env.local):**
```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:3001

# Production (ustaw w Vercel)
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

#### **API Client (utils/api.ts):**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  // Auth endpoints
  login: (data: LoginData) => 
    fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Projects endpoints  
  getProjects: () =>
    fetch(`${API_BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    }),
    
  // Health check
  health: () => fetch(`${API_BASE_URL}/health`)
};
```

### **Deploy frontend na Vercel:**

```bash
# W folderze frontend
cd label-frontend

# 1. Build test
npm run build

# 2. Deploy
vercel --prod

# 3. Ustaw env vars w Vercel Dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

---

## 🔄 **Workflow Development z osobnymi repo:**

### **Development Mode:**
```bash
# Terminal 1: Backend (Supabase + local dev)
cd label-backend-server
npm run supabase:switch  # Jeśli jeszcze nie
npm run dev              # localhost:3001

# Terminal 2: Frontend
cd label-frontend  
npm run dev              # localhost:3000
```

### **Production Deployment:**
```bash
# Backend deploy
cd label-backend-server
git push origin main     # Auto-deploy na Vercel

# Frontend deploy  
cd label-frontend
git push origin main     # Auto-deploy na Vercel
```

---

## 🎯 **ZALECANE OPCJE HOSTINGU:**

### **🥇 Opcja 1: Vercel dla obu (Najłatwiejsza)**
```
Frontend: Vercel (darmowy)
Backend: Vercel (darmowy)
Database: Supabase (darmowy)
Koszt: 0 PLN/miesiąc
```

**Setup:**
- Connect GitHub repos do Vercel
- Auto-deploy przy każdym push
- Environment variables w dashboard

### **🚀 Opcja 2: Railway + Vercel**
```
Frontend: Vercel (darmowy)
Backend: Railway ($5/miesiąc)
Database: Supabase (darmowy)
Koszt: ~20 PLN/miesiąc
```

**Kiedy wybrać:**
- Potrzebujesz więcej mocy dla backend
- Long-running processes
- Większy control nad infrastrukturą

### **💡 Opcja 3: Netlify + Railway**
```
Frontend: Netlify (darmowy)
Backend: Railway ($5/miesiąc) 
Database: Supabase (darmowy)
Koszt: ~20 PLN/miesiąc
```

**Kiedy wybrać:**
- Frontend to SPA (nie Next.js SSR)
- Lubisz interface Netlify

---

## 🔧 **KONFIGURACJA CORS dla osobnych domen:**

### **Backend CORS setup:**
```typescript
// src/app.ts - już masz, ale sprawdź:
app.use(cors({
  origin: [
    'http://localhost:3000',                    // Local development
    'https://your-frontend.vercel.app',         // Production frontend
    'https://your-frontend-git-main.vercel.app' // Vercel preview branches
  ],
  credentials: true
}));
```

### **Frontend API calls:**
```typescript
// Include credentials dla cookies/sessions
fetch(`${API_BASE_URL}/api/endpoint`, {
  method: 'POST',
  credentials: 'include',  // Important dla CORS
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📊 **ENVIRONMENT VARIABLES MANAGEMENT:**

### **Backend (.env vs Vercel):**
```bash
# Local development (.env)
DATABASE_URL=postgresql://postgres:haslo@db.xyz.supabase.co:5432/postgres
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Vercel production (Dashboard)
DATABASE_URL=postgresql://postgres:haslo@db.xyz.supabase.co:5432/postgres
NODE_ENV=production  
FRONTEND_URL=https://your-frontend.vercel.app
JWT_SECRET=super_long_production_secret
```

### **Frontend (.env.local vs Vercel):**
```bash
# Local development (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Vercel production (Dashboard)
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

---

## 🚨 **TROUBLESHOOTING:**

### **❌ CORS Errors:**
```bash
# 1. Sprawdź FRONTEND_URL w backend env vars
# 2. Sprawdź NEXT_PUBLIC_API_URL w frontend
# 3. Upewnij się że credentials: 'include'
```

### **❌ API Not Found:**
```bash
# 1. Sprawdź czy backend jest live: your-backend.vercel.app/health
# 2. Sprawdź network tab w browser dev tools
# 3. Sprawdź czy NEXT_PUBLIC_API_URL jest poprawny
```

### **❌ Database Connection:**
```bash
# 1. Test locally: npm run db:push w backend
# 2. Sprawdź DATABASE_URL w Vercel env vars
# 3. Sprawdź Supabase dashboard czy projekt jest aktywny
```

---

## 🎯 **NEXT STEPS:**

### **Dla Backend (już gotowe):**
1. ✅ Deploy na Vercel: `npm run deploy:setup`
2. ✅ Ustaw env variables w Vercel Dashboard
3. ✅ Test health endpoint

### **Dla Frontend (do zrobienia):**
1. 🔧 Utwórz nowe repo na GitHub
2. 🔧 Setup Next.js project
3. 🔧 Configure API integration
4. 🔧 Deploy na Vercel
5. 🔧 Update CORS w backend

---

## 💡 **QUICK START:**

```bash
# Backend (już masz)
cd label-backend-server
npm run supabase:switch
npm run deploy:setup

# Frontend (nowe repo)
npx create-next-app@latest label-frontend --typescript --tailwind
cd label-frontend
# Configure API integration
vercel --prod

# Update environment variables w obu projectach
```

**Po deployment będziesz mieć:**
- 🖥️ Backend: `https://your-backend.vercel.app`
- 🌐 Frontend: `https://your-frontend.vercel.app`  
- 🗄️ Database: Supabase PostgreSQL

Wszystko połączone i działające! 🎉 