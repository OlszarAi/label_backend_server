# 🚀 Deployment Guide - Backend + Frontend + Supabase

## 🎯 Architektura Docelowa

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │    Database     │
│                 │    │                 │    │                 │
│   React/Next    │───►│   Express.js    │───►│    Supabase     │
│   Vercel/Netlify│    │ Vercel/Railway  │    │   PostgreSQL    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
      Frontend              Backend              Database
    (Static/SSR)         (API Endpoints)        (Cloud)
```

---

## 🥇 **ZALECANA OPCJA: Vercel Full Stack + Supabase**

### ✅ **Dlaczego Vercel?**
- 🆓 **Darmowy** tier wystarczy na start
- ⚡ **Zero konfiguracji** - push do GitHub = automatyczny deploy
- 🌐 **Global CDN** - szybkość na całym świecie
- 🔒 **Automatyczne HTTPS**
- 📊 **Built-in analytics**
- 🎯 **Perfect dla Next.js + Express**

---

## 📋 **Wszystkie Opcje Hostingu:**

### 🖥️ **BACKEND HOSTING:**

#### **1. Vercel (Zalecane)**
```bash
# Cena: Darmowy (Pro $20/miesiąc)
# Limits: 100GB bandwidth, 10 projektów
# Zalety: Zero config, fast, edge functions
# Wady: Ograniczenia na hobby tier
```

#### **2. Railway**
```bash
# Cena: $5/miesiąc
# Zalety: Łatwy setup, Docker support, fair pricing
# Wady: Płatny od razu
```

#### **3. Render**
```bash
# Cena: Darmowy (sleep po 15min) / $7/miesiąc
# Zalety: Darmowy tier, proste setup
# Wady: Sleep mode na darmowym
```

#### **4. Fly.io**
```bash
# Cena: ~$2-5/miesiąc
# Zalety: Świetna performance, edge computing
# Wady: Bardziej techniczny setup
```

#### **5. DigitalOcean App Platform**
```bash
# Cena: $5/miesiąc
# Zalety: Stabilny, dobra dokumentacja
# Wady: Mniej features niż konkurencja
```

### 🌐 **FRONTEND HOSTING:**

#### **1. Vercel (Next.js)**
```bash
# Cena: Darmowy
# Idealny dla: Next.js, React
# Features: SSR, ISR, Edge Functions
```

#### **2. Netlify (SPA/JAMstack)**
```bash
# Cena: Darmowy
# Idealny dla: React SPA, statyczne strony
# Features: Forms, Functions, CDN
```

#### **3. GitHub Pages**
```bash
# Cena: Darmowy
# Idealny dla: Statyczne strony
# Ograniczenia: Tylko statyczny content
```

---

## 🚀 **SETUP GUIDE - Vercel + Supabase**

### **Krok 1: Przygotuj Supabase**

1. **Utwórz projekt w Supabase:**
   ```
   https://supabase.com/dashboard/new
   ```

2. **Skopiuj dane połączenia:**
   - Settings → Database
   - Connection string: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

3. **Zastosuj schema:**
   ```bash
   npm run supabase:switch  # Przełącz na Supabase
   npm run db:push         # Utwórz tabele
   ```

### **Krok 2: Deploy Backend na Vercel**

1. **Zainstaluj Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Build projekt:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Ustaw zmienne środowiskowe:**
   ```bash
   # W Vercel Dashboard → Project → Settings → Environment Variables
   DATABASE_URL=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres
   NODE_ENV=production
   JWT_SECRET=your_super_secret_production_key
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

### **Krok 3: Deploy Frontend**

1. **W folderze frontend:**
   ```bash
   cd ../label_frontend/frontend
   ```

2. **Ustaw API URL:**
   ```bash
   # .env.local
   NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

---

## 🛠️ **ALTERNATYWNE OPCJE:**

### **Opcja 2: Railway + Netlify + Supabase**

#### **Backend na Railway:**
```bash
# 1. Połącz GitHub repo
# 2. Railway automatycznie wykryje Node.js
# 3. Ustaw zmienne środowiskowe
# 4. Deploy = automatyczny
```

#### **Frontend na Netlify:**
```bash
# 1. Połącz GitHub repo
# 2. Build command: npm run build
# 3. Publish directory: dist/
# 4. Ustaw NEXT_PUBLIC_API_URL
```

### **Opcja 3: Render + Vercel + Supabase**

#### **Backend na Render:**
```bash
# 1. Connect GitHub
# 2. Build command: npm run build
# 3. Start command: npm start
# 4. Ustaw env vars
```

---

## 💰 **KOSZTY MIESIĘCZNE:**

### **🆓 Darmowa opcja:**
```
Frontend: Vercel (darmowy)
Backend: Vercel (darmowy)  
Database: Supabase (darmowy do 500MB)
TOTAL: 0 PLN/miesiąc
```

### **💼 Opcja profesjonalna:**
```
Frontend: Vercel Pro ($20)
Backend: Railway ($5)
Database: Supabase Pro ($25)
TOTAL: ~200 PLN/miesiąc
```

### **🎯 Opcja startowa:**
```
Frontend: Vercel (darmowy)
Backend: Railway ($5)
Database: Supabase (darmowy)
TOTAL: ~20 PLN/miesiąc
```

---

## 🔧 **KONFIGURACJA ŚRODOWISK:**

### **Development (.env):**
```env
DATABASE_URL=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres
NODE_ENV=development
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:3000
```

### **Production (Vercel):**
```env
DATABASE_URL=postgresql://postgres:password@db.xyz.supabase.co:5432/postgres
NODE_ENV=production
JWT_SECRET=super_long_production_secret_key_here
FRONTEND_URL=https://your-app.vercel.app
```

---

## 📊 **MONITORING I ANALYTICS:**

### **Vercel Analytics:**
```bash
# Built-in w Vercel Pro
# Real-time metrics
# Core Web Vitals
```

### **Supabase Dashboard:**
```bash
# Database metrics
# Query performance
# Storage usage
```

### **Dodatkowe:**
```bash
# Sentry - error tracking
# LogRocket - session replay
# Google Analytics - user tracking
```

---

## 🚨 **TROUBLESHOOTING:**

### **❌ Vercel Build Error:**
```bash
# Sprawdź czy dist/ folder jest tworzony
npm run build

# Sprawdź vercel.json configuration
# Upewnij się że entry point to dist/index.js
```

### **❌ Database Connection Error:**
```bash
# Sprawdź DATABASE_URL w Vercel env vars
# Upewnij się że zawiera ?schema=public
# Test lokalnie: npm run db:push
```

### **❌ CORS Errors:**
```bash
# Ustaw poprawny FRONTEND_URL w backend env
# Sprawdź czy backend odpowiada na /health
```

---

## 🎯 **NEXT STEPS:**

1. **✅ Wybierz opcję hostingu** (polecam Vercel)
2. **✅ Setup Supabase** (masz już dane)
3. **✅ Deploy backend**
4. **✅ Deploy frontend**
5. **✅ Test integration**
6. **✅ Setup custom domain** (opcjonalne)
7. **✅ Configure monitoring**

---

## ❓ **FAQ:**

**Q: Czy Vercel darmowy wystarczy?**  
A: TAK! Na start w zupełności. Limits: 100GB bandwidth, funkcje do 10s

**Q: Jak długo trwa deploy?**  
A: 1-3 minuty na Vercel, podobnie na Railway

**Q: Czy mogę zmienić hosting później?**  
A: TAK! Kod jest uniwersalny, łatwo przenieść

**Q: Co z custom domain?**  
A: Vercel/Netlify obsługują custom domeny za darmo

**Q: Backup danych?**  
A: Supabase robi automatyczne backupy, możesz też eksportować 