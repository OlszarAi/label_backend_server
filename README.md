# 🎯 Label Backend Server

> **System zarządzania projektami z etykietami - Backend API**

## 🏗️ Architektura Systemu

Backend oparty jest na **nowoczesnej architekturze hybrydowej** która łączy:
- **PostgreSQL** jako główną bazę danych (przez Prisma ORM)
- **Supabase Storage** do przechowywania plików (miniatury, eksporty)
- **Cache Redis/Memory** do optymalizacji wydajności
- **Express.js + TypeScript** jako framework webowy

### 📊 Stack Technologiczny

#### **Baza Danych**
- **PostgreSQL 15** - główna baza relacyjna
- **Prisma ORM** - type-safe access do bazy danych
- **Supabase Admin Client** - do operacji storage i zaawansowanych funkcji

#### **Cache & Storage**
- **Redis** (produkcja) / **Memory Cache** (development) - cache danych
- **Supabase Storage** - buckets dla plików (thumbnails, assets, exports)
- **Automatyczne TTL** - cache wygasa po określonym czasie

#### **Security & Middleware**
- **JWT Tokens** - autoryzacja użytkowników 
- **bcryptjs** - hashowanie haseł
- **Helmet** - security headers
- **CORS** - cross-origin protection
- **Rate Limiting** - ochrona przed DDoS

## 🗂️ Struktura Projektu

```
src/
├── controllers/           # Główne kontrolery API
│   ├── auth.controller.ts     # Autoryzacja i uwierzytelnianie
│   └── project.controller.ts  # Projekty i etykiety
├── core/                  # Systemy infrastrukturalne
│   ├── cache/             # Redis + Memory cache
│   ├── database/          # Supabase client (nieużywany aktualnie)
│   ├── storage/           # Supabase Storage buckets
│   └── errors/            # Centralne zarządzanie błędami
├── services/              # Usługi biznesowe
│   ├── database.service.ts    # Prisma connection
│   └── subscription.service.ts # Subskrypcje użytkowników
├── middleware/            # Express middleware
├── routes/                # Definicje endpointów
├── validation/            # Walidacja Joi
├── utils/                 # Narzędzia pomocnicze
└── config/                # Konfiguracja aplikacji
```

## 💾 System Baz Danych

### **PostgreSQL (Prisma ORM) - GŁÓWNA BAZA**

#### **Tabele:**
```sql
users            # Użytkownicy systemu
├── sessions     # Sesje użytkowników (JWT)
├── subscriptions # Plany subskrypcji  
└── projects     # Projekty użytkowników
    └── labels   # Etykiety w projektach
```

#### **Główne Operacje:**
- **CRUD projects** - tworzenie, edycja, usuwanie projektów
- **CRUD labels** - zarządzanie etykietami w projektach  
- **Auth sessions** - autoryzacja i sesje użytkowników
- **User management** - rejestracja, profile, subskrypcje

### **Supabase Storage - PLIKI**

#### **Buckets:**
```
thumbnails/      # Miniatury etykiet (.webp, .png)
├── {labelId}/
│   ├── thumbnail_v1.webp
│   └── thumbnail_v2.png
assets/          # Zasoby użytkowników
exports/         # Eksportowane pliki
```

#### **Operacje:**
- **Upload thumbnails** - automatyczny upload przy tworzeniu etykiet
- **Delete old files** - czyszczenie starych wersji przy aktualizacji
- **Public URLs** - bezpośrednie linki do plików przez CDN

### **Cache System - WYDAJNOŚĆ**

#### **Strategie Cache:**
```typescript
// Klucze cache z TTL:
projects:user:{userId}    # Lista projektów (10 min)
project:{projectId}       # Szczegóły projektu (10 min)
label:{labelId}          # Dane etykiety (5 min)
user:{userId}            # Profil użytkownika (5 min)
```

#### **Invalidacja:**
- **Pattern-based** - `projects:user:123:*` przy zmianie projektów
- **Automatic TTL** - automatyczne wygasanie po czasie
- **Manual clear** - przy CREATE/UPDATE/DELETE operacjach

## 🔄 API Endpoints

### 🔐 **Autoryzacja**
```
POST /api/auth/register    # Rejestracja nowego użytkownika
POST /api/auth/login       # Logowanie (zwraca JWT token)
POST /api/auth/logout      # Wylogowanie (usuwa sesję)
GET  /api/auth/session     # Sprawdza ważność sesji
GET  /api/auth/profile     # Pobiera profil użytkownika
```

### 📁 **Projekty**
```
GET    /api/projects              # Lista projektów użytkownika
POST   /api/projects              # Tworzy nowy projekt
GET    /api/projects/{id}         # Szczegóły projektu
PUT    /api/projects/{id}         # Aktualizuje projekt
DELETE /api/projects/{id}         # Usuwa projekt
GET    /api/projects/{id}/export  # Eksportuje projekt
```

### 🏷️ **Etykiety**
```
GET    /api/projects/{id}/labels           # Lista etykiet projektu
POST   /api/projects/{id}/labels           # Tworzy nową etykietę
GET    /api/projects/labels/{labelId}      # Szczegóły etykiety
PUT    /api/projects/labels/{labelId}      # Aktualizuje etykietę
DELETE /api/projects/labels/{labelId}      # Usuwa etykietę
POST   /api/projects/labels/{labelId}/duplicate # Duplikuje etykietę
```

### 🏥 **System Health**
```
GET /api/health            # Status systemu (database, cache, storage)
```

## ⚡ Jak Działa System

### **1. Autoryzacja Flow**
```
1. POST /api/auth/login → JWT token
2. Frontend przechowuje token w localStorage
3. Każde API request zawiera: Authorization: Bearer {token}
4. Middleware weryfikuje token + odświeża sesję w bazie
5. Request przekazywany do kontrolera z user context
```

### **2. Cache Flow**
```
1. GET /api/projects → sprawdź cache
2. Cache hit? → zwróć z cache (fast)
3. Cache miss? → pobierz z PostgreSQL
4. Zapisz do cache z TTL → zwróć dane
5. UPDATE/DELETE → invaliduj cache pattern
```

### **3. Storage Flow**
```
1. POST /api/projects/{id}/labels + thumbnail
2. Zapisz dane etykiety do PostgreSQL
3. Upload thumbnail → Supabase Storage
4. Usuń starą miniaturę (jeśli aktualizacja)
5. Zwróć URL do nowej miniatury
6. Invaliduj cache projektu
```

### **4. Error Handling**
```
1. Walidacja Joi → 400 Bad Request
2. Auth middleware → 401 Unauthorized  
3. Storage error → fallback do data URL
4. Cache error → fallback do database
5. Database error → 500 Internal Server Error
```

## 🚀 Uruchamianie

### **Development Mode**
```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Ustaw: DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# 3. Start PostgreSQL + Backend
npm run dev:local     # PostgreSQL w Docker + backend lokalnie
```

### **Production Mode**
```bash
# Wszystko w kontenerach
npm run docker:up
```

### **Wymagane zmienne .env**
```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/label_db"

# Supabase Storage
SUPABASE_URL="your-supabase-project-url"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Cache (opcjonalne)
REDIS_URL="redis://localhost:6379"
```

## 🔧 Konfiguracja Supabase

### **1. Storage Buckets**
W Supabase Dashboard → Storage:
```sql
-- Utwórz buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('thumbnails', 'thumbnails', true),
('assets', 'assets', false),
('exports', 'exports', false);
```

### **2. Storage Policies**
```sql
-- Public read dla thumbnails
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
```

## 📈 Monitoring

### **Health Checks**
```bash
# Quick check
curl http://localhost:3001/api/health

# Detailed status
curl http://localhost:3001/api/health | jq
```

### **Logs**
```bash
npm run logs     # Backend logs
npm run logs:db  # Database logs
```

---