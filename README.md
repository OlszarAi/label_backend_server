# 🎯 Label Backend Server

> **Enterprise-grade backend server dla aplikacji Label z bezpieczną bazą danych PostgreSQL**

Nowoczesny, skalowalny backend zbudowany z myślą o bezpieczeństwie, wydajności i łatwości wdrożenia. Wykorzystuje najnowsze technologie i najlepsze praktyki branżowe.

## 🏗️ Architektura i Technologie

### 🚀 **Core Stack**
- **Node.js 18+** - Środowisko uruchomieniowe
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **PostgreSQL 15** - Baza danych
- **Prisma ORM** - Type-safe database access
- **Docker & Docker Compose** - Konteneryzacja i orkiestracja

### 🔐 **Security Stack**
- **JWT (JSON Web Tokens)** - Stateless authentication
- **bcrypt** - Password hashing (12 rounds)
- **Helmet** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - DDoS protection
- **Joi** - Input validation
- **Session Management** - Database-stored sessions

### 🛠️ **Development Tools**
- **tsx** - TypeScript execution
- **ESLint** - Code linting
- **Prisma Studio** - Database GUI
- **Morgan** - HTTP request logging
- **dotenv** - Environment configuration

## ⚡ Szybki start i uruchamianie

### 📋 Wymagania
- **Node.js 18+** 
- **Docker** i **Docker Compose**
- **Git**
- **curl** i **jq** (opcjonalne, do testowania)

### 🏗️ **Jak działa architektura**

#### **🐳 Scenariusz 1: Pełny Docker (Produkcja)**
```
┌─────────────────────────────────────────────────────────┐
│                Docker Compose Network                   │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │  Backend        │    │  PostgreSQL                 │ │
│  │  Container      │    │  Container                  │ │
│  │                 │    │                             │ │
│  │  • Node.js API  │◄──►│  • Database Storage         │ │
│  │  • Port: 3001   │    │  • Port: 5432               │ │
│  │  • Built App    │    │  • Persistent Volume        │ │
│  │                 │    │  • Auto Health Checks       │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
        ↓ Exposed Ports ↓
   Host: localhost:3001 ← API Access
```

#### **🔧 Scenariusz 2: Development (Rekomendowany)**
```
┌─────────────────────────────────────────────────────────┐
│  Host System (Twój komputer)                           │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │  Backend        │    │  PostgreSQL                 │ │
│  │  Local Process  │    │  Docker Container           │ │
│  │                 │    │                             │ │
│  │  • tsx watch    │◄──►│  • Database Storage         │ │
│  │  • Hot Reload   │    │  • Port: 5432               │ │
│  │  • TypeScript   │    │  • Persistent Volume        │ │
│  │  • Port: 3001   │    │  • label_postgres           │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
        ↑ Dev Benefits ↑
   • Instant code changes
   • Full debugging support
   • TypeScript error checking
   • Easy log viewing
```

### 🚀 **Komendy uruchamiania - NOWE I ULEPSZONE!**

#### **🎯 Quick Start - Wszystko w jednej komendzie**
```bash
# 🚀 SUPER QUICK START - Development setup
npm run setup
# To robi: npm install + uruchom PostgreSQL + zastosuj schema

# 🚀 SUPER QUICK START - Pełny Docker
npm run setup:full
# To robi: npm install + uruchom wszystko w Docker + build
```

#### **🔧 Development Mode (Rekomendowany)**
```bash
# Wariant 1: Automatyczny (robi wszystko za Ciebie)
npm run dev:local
# To robi: uruchom PostgreSQL w Docker + uruchom backend lokalnie

# Wariant 2: Krok po kroku (jeśli chcesz kontrolować)
npm run docker:postgres    # Tylko baza danych
npm run dev                # Backend lokalnie z hot-reload
```

#### **🐳 Full Docker Mode (Produkcja)**
```bash
# Uruchom wszystko w Docker
npm run dev:docker
# lub klasycznie
npm run docker:up

# Z rebuildem (po zmianach w kodzie)
npm run docker:rebuild
```

#### **🔍 Monitorowanie i diagnostyka**
```bash
# Sprawdź status aplikacji
npm run health

# Logi backendu
npm run logs

# Logi bazy danych
npm run logs:db

# Status kontenerów
docker-compose ps
```

#### **🧹 Zarządzanie i czyszczenie**
```bash
# Zatrzymaj wszystko
npm run docker:down

# Reset bazy danych (usuwa wszystkie dane!)
npm run reset:db

# Pełne czyszczenie (usuwa wszystko łącznie z volumes)
npm run docker:clean
```

### 🎛️ **Dostępne tryby uruchamiania**

| Komenda | PostgreSQL | Backend | Użycie | Hot Reload |
|---------|------------|---------|--------|------------|
| `npm run dev:local` | 🐳 Docker | 💻 Local | **Development** | ✅ Tak |
| `npm run dev:docker` | 🐳 Docker | 🐳 Docker | Production Test | ❌ Nie |
| `npm run setup` | 🐳 Docker | 💻 Manual | Quick Setup | Manual |
| `npm run setup:full` | 🐳 Docker | 🐳 Docker | Full Setup | ❌ Nie |

### ✅ **Weryfikacja instalacji**
Po uruchomieniu sprawdź automatycznie:
```bash
# Comprehensive health check
npm run health
```

Lub ręcznie:
- **Backend Health:** http://localhost:3001/health
- **Quick Ping:** http://localhost:3001/health/ping
- **Database GUI:** `npm run db:studio` → http://localhost:5555

## 📊 API Documentation

### 🏥 **Health & Monitoring**
| Method | Endpoint | Opis | Response |
|--------|----------|------|----------|
| `GET` | `/health` | Pełny status aplikacji i bazy | JSON z metrics |
| `GET` | `/health/ping` | Szybki test połączenia | Simple success message |

**Przykład odpowiedzi `/health`:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-13T19:05:43.123Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "database": "connected",
  "memory": {
    "used": 45.67,
    "total": 128.00
  }
}
```

### 🔐 **Authentication API**

#### **Rejestracja użytkownika**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePass123!",
  "firstName": "Jan",      // opcjonalne
  "lastName": "Kowalski"   // opcjonalne
}
```

#### **Logowanie**
```http
POST /api/auth/login
Content-Type: application/json

{
  "login": "user@example.com",  // email lub username
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clp1x2y3z...",
      "email": "user@example.com",
      "username": "username",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2025-06-14T19:05:43.123Z"
  }
}
```

#### **Profil użytkownika** (wymagana autoryzacja)
```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

#### **Wylogowanie** (wymagana autoryzacja)
```http
POST /api/auth/logout
Authorization: Bearer <jwt-token>
```

### 🛡️ **Autoryzacja**
Wszystkie chronione endpointy wymagają nagłówka:
```http
Authorization: Bearer <jwt-token>
```

### 📝 **Kody odpowiedzi**
- `200` - Sukces
- `201` - Zasób utworzony
- `400` - Błędne dane wejściowe
- `401` - Brak autoryzacji
- `403` - Brak uprawnień
- `404` - Nie znaleziono
- `409` - Konflikt (np. email już istnieje)
- `429` - Zbyt wiele żądań (rate limit)
- `500` - Błąd serwera

## 🛡️ Bezpieczeństwo Enterprise-Grade

### 🔐 **Implementowane zabezpieczenia**

#### **Authentication & Authorization**
- **🔑 JWT Tokens** - Stateless authentication z expiration
- **🔒 bcrypt Hashing** - Password hashing z 12 salt rounds
- **👤 Session Management** - Tokeny przechowywane w bazie danych
- **🎭 Role-based Access** - USER, ADMIN, SUPER_ADMIN roles
- **⏰ Token Expiration** - Automatyczne wygaśniecie sesji (24h)

#### **Input Security**
- **✅ Joi Validation** - Comprehensive input validation
- **🛡️ SQL Injection Protection** - Prisma ORM prepared statements
- **🚫 XSS Protection** - Input sanitization
- **📝 Type Safety** - TypeScript runtime validation

#### **Network Security**
- **🌐 CORS Protection** - Konfigurowany cross-origin access
- **⚡ Rate Limiting** - 100 requests per 15 minutes per IP
- **🔒 HTTP Security Headers** - Helmet middleware protection
- **🛡️ DDoS Protection** - Request throttling i monitoring

#### **Infrastructure Security**
- **🐳 Container Isolation** - Docker network isolation
- **🔐 Environment Variables** - Secure configuration management
- **📊 Health Monitoring** - Real-time application monitoring
- **🚨 Error Handling** - Secure error responses (no data leaks)

### 🗄️ **Database Security**
- **🔒 Connection Encryption** - SSL/TLS connections
- **⚡ Connection Pooling** - Optimized database connections
- **🎯 Prepared Statements** - SQL injection prevention
- **🔐 Database Isolation** - Dedicated database container
- **📊 Query Monitoring** - Prisma query logging

## 🐳 Docker & Deployment

### 🏗️ **Container Architecture**
```
┌─────────────────┐    ┌─────────────────┐
│  label_backend  │    │ label_postgres  │
│                 │    │                 │
│  Node.js API    │────│  PostgreSQL 15  │
│  Port: 3001     │    │  Port: 5432     │
│                 │    │                 │
└─────────────────┘    └─────────────────┘
        │                       │
        └───────────────────────┘
              Docker Network
```

### 🔧 **Docker Commands**
```bash
# Uruchom wszystkie serwisy
docker-compose up -d

# Sprawdź status kontenerów
docker-compose ps

# Wyświetl logi
docker-compose logs -f

# Zatrzymaj wszystkie serwisy
docker-compose down

# Rebuild i restart
docker-compose up -d --build

# Tylko PostgreSQL
docker-compose up -d postgres

# Wyczyść wszystko (usuwa dane!)
docker-compose down -v
```

### 📦 **Volumes & Data Persistence**
- **`postgres_data`** - Persystentne dane bazy PostgreSQL
- **`./uploads`** - Pliki przesłane przez użytkowników
- **`./postgres-init`** - Skrypty inicjalizacyjne bazy

### 🌐 **Production Deployment**

#### **1. Przygotowanie serwera**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Create application user
sudo useradd -m -s /bin/bash labelapp
sudo usermod -aG docker labelapp
```

#### **2. Deploy aplikacji**
```bash
# Skopiuj pliki na serwer
scp -r . labelapp@server:/home/labelapp/label_backend_server

# SSH na serwer
ssh labelapp@server

# Przejdź do katalogu aplikacji
cd label_backend_server

# Edytuj .env dla produkcji
nano .env
# Ustaw:
# NODE_ENV=production
# Bezpieczne hasła i klucze
# Właściwe domeny dla CORS

# Uruchom aplikację
docker-compose up -d

# Sprawdź status
docker-compose ps
curl http://localhost:3001/health
```

#### **3. Reverse Proxy (Nginx)**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

#### **4. SSL Configuration (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📁 Architektura Projektu

### 🏗️ **Struktura katalogów**
```
label_backend_server/
├── 🐳 docker-compose.yml      # Orkiestracja kontenerów
├── 🐳 Dockerfile             # Backend container definition
├── ⚙️ .env                   # Konfiguracja środowiska (nie commituj!)
├── ⚙️ .env.example           # Przykład konfiguracji
├── 📦 package.json           # Dependencies i scripts NPM
├── 🔧 tsconfig.json          # Konfiguracja TypeScript
├── 🧪 test-connection.html   # Standalone test interface
├── 📚 README.md              # Ta dokumentacja
├── 📊 IMPLEMENTATION_SUMMARY.md  # Podsumowanie implementacji
├── 🗄️ prisma/
│   ├── schema.prisma         # Database schema definition
│   └── migrations/           # Database migrations (auto-generated)
├── 📂 src/                   # Kod źródłowy aplikacji
│   ├── 🚀 index.ts           # Entry point aplikacji
│   ├── 🔧 app.ts             # Express app configuration
│   ├── ⚙️ config/
│   │   └── config.ts         # Centralna konfiguracja aplikacji
│   ├── 🎮 controllers/       # Business logic handlers
│   │   └── auth.controller.ts # Authentication logic
│   ├── 🛡️ middleware/        # Express middleware
│   │   ├── auth.middleware.ts     # JWT verification
│   │   ├── errorHandler.ts       # Global error handling
│   │   └── notFoundHandler.ts    # 404 handler
│   ├── 🛣️ routes/            # API route definitions
│   │   ├── auth.routes.ts         # Authentication routes
│   │   └── health.routes.ts       # Health check routes
│   ├── 🔌 services/          # External service integrations
│   │   └── database.service.ts    # Prisma client management
│   └── ✅ validation/        # Input validation schemas
│       └── auth.validation.ts     # Auth input validation
└── 📊 postgres-data/         # PostgreSQL data volume (auto-created)
```

### 🏗️ **Szczegółowa architektura działania**

#### **🔄 Cykl życia żądania HTTP**
```
1. 📥 Klient wysyła żądanie HTTP
        ↓
2. 🛡️ Middleware Security Stack
   • Helmet (security headers)
   • CORS (cross-origin protection)
   • Rate Limiting (DDoS protection)
        ↓
3. 📊 Request Logging (Morgan)
        ↓
4. 🔍 Request Parsing (JSON/URL-encoded)
        ↓
5. 🛣️ Route Matching (Express Router)
        ↓
6. ✅ Input Validation (Joi schemas)
        ↓
7. 🔐 Authentication (JWT verification)
        ↓
8. 🎮 Controller Logic
        ↓
9. 🗄️ Database Operations (Prisma ORM)
        ↓
10. 📤 Response Formation
        ↓
11. 🚨 Error Handling (Global middleware)
        ↓
12. 📤 JSON Response do klienta
```

#### **🐳 Docker Network Architecture**
```
┌─────────────────────────────────────────────────────────┐
│  Docker Compose Network: label_network                  │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │  Backend        │    │  PostgreSQL                 │ │
│  │  label_backend  │    │  label_postgres             │ │
│  │                 │    │                             │ │
│  │  Environment:   │    │  Environment:               │ │
│  │  • NODE_ENV     │    │  • POSTGRES_DB=label_db     │ │
│  │  • JWT_SECRET   │◄──►│  • POSTGRES_USER=label_user │ │
│  │  • DATABASE_URL │    │  • POSTGRES_PASSWORD=***   │ │
│  │                 │    │                             │ │
│  │  Ports:         │    │  Ports:                     │ │
│  │  • 3001:3001    │    │  • 5432:5432                │ │
│  │                 │    │                             │ │
│  │  Volumes:       │    │  Volumes:                   │ │
│  │  • ./uploads    │    │  • postgres_data:/var/lib/  │ │
│  │                 │    │    postgresql/data          │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
          ↑                              ↑
    Host: 3001                    Host: 5432
    (API Access)              (DB Connection)
```

#### **🔧 Development vs Production Setup**

**🛠️ Development Mode:**
```
Host System (localhost)
├── 🖥️ Backend Process
│   ├── tsx watch src/index.ts
│   ├── TypeScript hot-reload
│   ├── Source maps for debugging
│   └── Direct file watching
├── 🐳 PostgreSQL Container
│   ├── docker-compose up -d postgres
│   ├── Development data volume
│   └── Easy reset/cleanup
└── 🔗 Connection: localhost:5432
```

**🏭 Production Mode:**
```
Docker Compose Stack
├── 🐳 Backend Container
│   ├── Built JavaScript (dist/)
│   ├── Production optimizations
│   ├── Health checks enabled
│   └── Automatic restarts
├── 🐳 PostgreSQL Container  
│   ├── Persistent data volume
│   ├── Backup-ready setup
│   └── Production security
└── 🌐 Internal network communication
```

#### **📊 Database Schema & Relations**
```sql
┌─────────────────────────────────────────────────────────┐
│                    Database: label_db                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │     Users       │    │         Sessions            │ │
│  ├─────────────────┤    ├─────────────────────────────┤ │
│  │ id (cuid)       │◄───┤ userId (FK)                 │ │
│  │ email (unique)  │  1 │ token (unique)              │ │
│  │ username(unique)│  : │ refreshToken                │ │
│  │ password (hash) │  n │ expiresAt                   │ │
│  │ firstName       │    │ createdAt                   │ │
│  │ lastName        │    │ updatedAt                   │ │
│  │ role (enum)     │    │ isActive                    │ │
│  │ isActive        │    └─────────────────────────────┘ │
│  │ createdAt       │                                    │
│  │ updatedAt       │                                    │
│  └─────────────────┘                                    │
│                                                         │
│  Indexes:                                               │
│  • users_email_unique                                   │
│  • users_username_unique                                │
│  • sessions_token_unique                                │
│  • sessions_userId_idx                                  │
└─────────────────────────────────────────────────────────┘
```

#### **🔐 Security Flow**
```
Registration Flow:
1. Client POST /api/auth/register
2. Joi validation (email, password strength)
3. Check email/username uniqueness
4. bcrypt password hashing (12 rounds)
5. Create user in database
6. Generate JWT token
7. Create session record
8. Return user data + token

Login Flow:
1. Client POST /api/auth/login  
2. Joi validation
3. Find user (email or username)
4. bcrypt password verification
5. Generate new JWT token
6. Update/create session
7. Return user data + token

Protected Endpoint:
1. Extract JWT from Authorization header
2. Verify JWT signature + expiration
3. Check session in database
4. Attach user to request object
5. Proceed to route handler
```

### 🎯 **Design Patterns**
- **🏗️ MVC Pattern** - Separacja warstw (routes → controllers → services)
- **🔧 Dependency Injection** - Centralne zarządzanie zależnościami
- **🎭 Middleware Pattern** - Modularne przetwarzanie requestów
- **🏪 Repository Pattern** - Abstrakcja dostępu do danych (Prisma)
- **🔐 Strategy Pattern** - Różne strategie autoryzacji
- **📦 Module Pattern** - Enkapsulacja funkcjonalności

## 🗄️ Database Management

### 📊 **Schema Overview**
```sql
┌─────────────────┐    ┌─────────────────┐
│     Users       │    │    Sessions     │
├─────────────────┤    ├─────────────────┤
│ id (cuid)       │◄──┤ userId (FK)     │
│ email (unique)  │    │ token (unique)  │
│ username (unique)│   │ refreshToken    │
│ password (hash) │    │ expiresAt       │
│ firstName       │    │ createdAt       │
│ lastName        │    │ updatedAt       │
│ role (enum)     │    └─────────────────┘
│ isActive        │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
```

### 🔐 **User Roles**
```typescript
enum UserRole {
  USER        // Zwykły użytkownik - podstawowe operacje
  ADMIN       // Administrator - zarządzanie użytkownikami
  SUPER_ADMIN // Super admin - pełne uprawnienia systemu
}
```

### 🛠️ **Database Operations**

#### **Development Commands**
```bash
# Generuj Prisma client po zmianach schema
npm run db:generate

# Zastosuj zmiany schema do bazy (development)
npm run db:push

# Utwórz nową migrację
npm run db:migrate

# Otwórz Prisma Studio (GUI do bazy)
npm run db:studio

# Reset bazy danych (usuwa wszystkie dane!)
npx prisma db push --force-reset
```

#### **Production Commands**
```bash
# Zastosuj migracje na produkcji
npx prisma migrate deploy

# Sprawdź status migracji
npx prisma migrate status

# Generuj client w środowisku produkcyjnym
npx prisma generate
```

### 🔍 **Database Monitoring**
```bash
# Podłącz się do PostgreSQL w kontenerze
docker exec -it label_postgres psql -U label_user -d label_db

# Sprawdź połączenia
SELECT * FROM pg_stat_activity;

# Sprawdź rozmiar bazy
SELECT pg_size_pretty(pg_database_size('label_db'));

# Sprawdź tabele
\dt

# Sprawdź użytkowników
SELECT id, email, username, role, "createdAt" FROM users;
```

### 🚀 **Performance Optimization**
- **Connection Pooling** - Automatyczne zarządzanie połączeniami
- **Query Optimization** - Prisma query optimization
- **Indexing** - Automatic indexes na unique fields
- **Prepared Statements** - SQL injection protection + performance

## 🧪 Testing & Quality Assurance

### 🔍 **Test Interface**

#### **1. Standalone HTML Test**
```bash
# Otwórz w przeglądarce
open test-connection.html
# lub
firefox test-connection.html
```
**Features:**
- 🏥 Health check tests
- 🔐 Complete authentication flow
- 📊 Real-time API responses
- 🎯 Individual endpoint testing
- 📈 All-in-one test suite

#### **2. Frontend Integration Test**
```bash
# Uruchom frontend (jeśli dostępny)
cd ../label_frontend/frontend
npm run dev

# Przejdź do test page
# http://localhost:3000/test-backend
```

#### **3. Command Line Testing**
```bash
# Test podstawowego połączenia
curl http://localhost:3001/health/ping

# Test pełnego health check
curl http://localhost:3001/health | jq

# Test rejestracji
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!",
    "firstName": "Jan",
    "lastName": "Kowalski"
  }' | jq

# Test logowania
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "test@example.com",
    "password": "TestPass123!"
  }' | jq

# Test profilu (z tokenem)
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/profile | jq
```

### 📊 **Monitoring & Logging**

#### **Application Logs**
```bash
# Docker logs
docker-compose logs -f backend

# Live logs
npm run dev  # Shows real-time request logs

# Database logs
docker-compose logs postgres
```

#### **Health Monitoring**
```bash
# Check application health
curl http://localhost:3001/health

# Check database connectivity
docker exec label_postgres pg_isready -U label_user

# Check Docker containers
docker-compose ps
```

### 🔧 **Development Scripts - KOMPLETNA LISTA**

#### **🚀 Uruchamianie**
```bash
# === QUICK START ===
npm run setup           # Szybka konfiguracja: install + PostgreSQL + schema
npm run setup:full      # Pełna konfiguracja: wszystko w Docker
npm run dev:local       # Development: PostgreSQL w Docker + backend lokalnie
npm run dev:docker      # Development: wszystko w Docker

# === PODSTAWOWE ===
npm run dev             # Backend lokalnie z hot-reload (wymaga PostgreSQL)
npm run build           # Zbuduj aplikację do production
npm run start           # Uruchom zbudowaną aplikację

# === DOCKER MANAGEMENT ===
npm run docker:up       # Uruchom wszystkie kontenery
npm run docker:down     # Zatrzymaj wszystkie kontenery
npm run docker:postgres # Uruchom tylko PostgreSQL
npm run docker:backend  # Uruchom tylko backend container
npm run docker:rebuild  # Rebuild i restart wszystkich kontenerów
npm run docker:clean    # Usuń wszystko (containers + volumes + images)

# === DATABASE ===
npm run db:generate     # Regeneruj Prisma client po zmianach schema
npm run db:push         # Zastosuj schema do bazy (development)
npm run db:migrate      # Utwórz i zastosuj migrację (production)
npm run db:studio       # Otwórz Prisma Studio (GUI do bazy)
npm run reset:db        # Reset bazy danych (usuwa wszystkie dane!)

# === MONITORING & DEBUGGING ===
npm run health          # Sprawdź status aplikacji
npm run logs            # Logi backendu
npm run logs:db         # Logi PostgreSQL
npm run docker:logs     # Wszystkie logi Docker

# === CODE QUALITY ===
npm run lint            # Sprawdź kod z ESLint
npm run test            # Uruchom testy
```

#### **🎯 Typowe scenariusze użycia**

**Pierwszy raz uruchamiasz projekt:**
```bash
npm run setup          # Wszystko w jednej komendzie!
```

**Codzienne developement:**
```bash
npm run dev:local      # PostgreSQL w Docker + backend lokalnie
```

**Testowanie produkcji lokalnie:**
```bash
npm run dev:docker     # Wszystko w Docker jak na produkcji
```

**Problem z bazą danych:**
```bash
npm run reset:db       # Reset bazy i restart
npm run db:studio      # Otwórz GUI do debugowania
```

**Deployment na serwer:**
```bash
npm run build          # Zbuduj aplikację
npm run docker:up      # Uruchom na serwerze
```

### ⚙️ **Environment Configuration**

#### **Required Environment Variables**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
POSTGRES_DB=label_db
POSTGRES_USER=label_user
POSTGRES_PASSWORD=your_secure_password

# Application
NODE_ENV=development|production
PORT=3001
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=http://localhost:3000
```

#### **Production Security Checklist**
- ✅ **Zmień wszystkie domyślne hasła**
- ✅ **Ustaw silny JWT_SECRET** (min 32 znaki)
- ✅ **NODE_ENV=production**
- ✅ **Właściwe FRONTEND_URL dla CORS**
- ✅ **Backup database credentials**
- ✅ **Configure SSL/TLS**
- ✅ **Setup monitoring alerts**

## 🚨 Troubleshooting & Diagnostyka

### 🔍 **Automatyczne narzędzia diagnostyczne**

#### **🏥 Quick Health Check**
```bash
# Sprawdź czy wszystko działa jedną komendą
npm run health

# Oczekiwana odpowiedź:
# {
#   "status": "healthy",
#   "timestamp": "2025-06-19T...",
#   "database": "connected",
#   "memory": {...}
# }
```

#### **📊 Status kontenerów**
```bash
# Sprawdź status wszystkich kontenerów
docker-compose ps

# Przykład prawidłowej odpowiedzi:
#      Name                Command              State           Ports         
# ---------------------------------------------------------------------------
# label_backend    docker-entrypoint.sh node   Up      0.0.0.0:3001->3001/tcp
# label_postgres   docker-entrypoint.sh         Up      0.0.0.0:5432->5432/tcp
```

### 🚨 **Częste problemy i rozwiązania**

#### **❌ Problem: "Database connection failed"**
```bash
# Sprawdź czy PostgreSQL działa
docker-compose ps | grep postgres

# Jeśli nie działa, uruchom ponownie
npm run docker:postgres

# Sprawdź logi bazy danych
npm run logs:db

# Sprawdź połączenie z bazą
docker exec -it label_postgres pg_isready -U label_user -d label_db

# W ostateczności - reset bazy
npm run reset:db
```

#### **❌ Problem: "Port 3001 already in use"**
```bash
# Znajdź proces używający portu
sudo lsof -i :3001
# lub
sudo ss -tulpn | grep :3001

# Zabij proces
sudo kill -9 <PID>

# Lub zmień port w .env
echo "PORT=3002" >> .env
```

#### **❌ Problem: "Port 5432 already in use"**
```bash
# Sprawdź co używa portu PostgreSQL
sudo lsof -i :5432

# Jeśli to inny kontener PostgreSQL
docker ps | grep postgres
docker stop <container_name>
docker rm <container_name>

# Uruchom nasz PostgreSQL
npm run docker:postgres
```

#### **❌ Problem: "CORS errors"**
```bash
# Sprawdź FRONTEND_URL w .env
grep FRONTEND_URL .env

# Powinna być:
# FRONTEND_URL=http://localhost:3000

# Jeśli używasz innej domeny, zaktualizuj:
echo "FRONTEND_URL=http://localhost:3000" >> .env
npm run dev:local  # Restart backend
```

#### **❌ Problem: "JWT token invalid"**
```bash
# Sprawdź czy JWT_SECRET jest ustawiony
grep JWT_SECRET .env

# Jeśli brak, wygeneruj nowy
echo "JWT_SECRET=$(node -e 'console.log(require("crypto").randomBytes(64).toString("hex"))')" >> .env

# Restart backend
npm run dev:local
```

#### **❌ Problem: Backend nie odpowiada**
```bash
# Sprawdź czy backend działa
ps aux | grep "tsx watch"

# Sprawdź porty
sudo netstat -tulpn | grep :3001

# Sprawdź logi
npm run logs

# Force restart
npm run docker:down
npm run dev:local
```

### 🔍 **Zaawansowana diagnostyka**

#### **📋 Pełny system check**
```bash
#!/bin/bash
echo "=== LABEL BACKEND DIAGNOSTICS ==="

echo "1. Node.js version:"
node --version

echo "2. Docker status:"
docker --version
docker-compose --version

echo "3. Container status:"
docker-compose ps

echo "4. Port usage:"
sudo lsof -i :3001 -i :5432 2>/dev/null || echo "Ports available"

echo "5. Environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "POSTGRES_DB: $POSTGRES_DB"

echo "6. Health check:"
curl -s http://localhost:3001/health/ping 2>/dev/null || echo "Backend not responding"

echo "7. Database connectivity:"
docker exec -it label_postgres pg_isready -U label_user -d label_db 2>/dev/null || echo "Database not accessible"
```

#### **🗂️ Log analysis**
```bash
# Backend logs z filtrowaniem
npm run logs | grep -i error

# Database logs z timestampami
npm run logs:db | tail -50

# System logs
journalctl -u docker --since "1 hour ago" | grep label
```

#### **🧹 Nuclear option - pełny reset**
```bash
# UWAGA: To usuwa WSZYSTKIE dane!
npm run docker:clean
rm -rf node_modules package-lock.json
npm install
npm run setup
```

### 📞 **Wsparcie i debugging**

#### **📋 Checklist przed zgłoszeniem problemu**
- [ ] Sprawdziłem `npm run health`
- [ ] Sprawdziłem `docker-compose ps`
- [ ] Sprawdziłem logi: `npm run logs`
- [ ] Sprawdziłem plik `.env`
- [ ] Próbowałem restartu: `npm run dev:local`

#### **🔧 Przydatne komendy debug**
```bash
# Sprawdź wszystkie zmienne środowiskowe
printenv | grep -E "(NODE_ENV|POSTGRES|JWT|PORT)"

# Sprawdź schemat bazy danych
npm run db:studio  # Otwórz w przeglądarce

# Test bezpośredniego połączenia z bazą
docker exec -it label_postgres psql -U label_user -d label_db -c "\dt"

# Sprawdź wykorzystanie portów
sudo ss -tulpn | grep -E "(3001|5432)"

# Monitor logów w czasie rzeczywistym
docker-compose logs -f --tail=50
```

## 🎯 Roadmap & Future Features

### 🔄 **Planowane rozszerzenia**
- 📊 **Metrics & Analytics** - Prometheus + Grafana
- 🔄 **Real-time capabilities** - WebSocket support
- 📧 **Email notifications** - SendGrid/Nodemailer integration
- 📁 **File upload** - AWS S3/local storage
- 🔍 **Full-text search** - Elasticsearch integration
- 🧪 **Automated testing** - Jest + Supertest
- 📈 **Rate limiting per user** - Redis-based limiting
- 🔐 **OAuth integration** - Google/GitHub/Facebook login

### 🏗️ **Architecture improvements**
- 🐘 **Microservices split** - Separate auth service
- 📦 **Event-driven architecture** - Message queues
- 🔄 **CQRS pattern** - Command/Query separation
- 📊 **Horizontal scaling** - Load balancer support
- 🏪 **Caching layer** - Redis integration

## 🎯 Przykłady użycia

### 🚀 **Typowe scenariusze developmentu**

#### **Scenario 1: Pierwszy dzień w projekcie**
```bash
# Sklonuj repozytorium
git clone <repo-url>
cd label_backend_server

# Jednorazowa konfiguracja
npm run setup

# Sprawdź czy działa
npm run health

# Otwórz GUI bazy danych
npm run db:studio
```

#### **Scenario 2: Codzienna praca**
```bash
# Rano - uruchom development
npm run dev:local

# Sprawdź w przeglądarce czy działa
# http://localhost:3001/health

# Pracuj nad kodem... (hot-reload automatyczny)

# Wieczorem - zatrzymaj
npm run docker:down
```

#### **Scenario 3: Testowanie produkcji lokalnie**
```bash
# Zbuduj i uruchom jak na produkcji
npm run build
npm run dev:docker

# Testuj API
npm run health
```

#### **Scenario 4: Problemy z bazą danych**
```bash
# Reset bazy
npm run reset:db

# Sprawdź schemat
npm run db:studio

# Zastosuj nowe migracje
npm run db:migrate
```

### 📚 **Gotowe snippety do testowania**

#### **🔧 cURL commands**
```bash
# Health check
curl http://localhost:3001/health | jq

# Rejestracja użytkownika
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!",
    "firstName": "Jan",
    "lastName": "Kowalski"
  }'

# Logowanie
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "test@example.com",
    "password": "TestPass123!"
  }'

# Profil użytkownika (wymaga token)
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/profile
```

#### **🐳 Docker management**
```bash
# Sprawdź co działa
docker-compose ps

# Logi w czasie rzeczywistym
docker-compose logs -f

# Restart jednego serwisu
docker-compose restart backend

# Buduj bez cache
docker-compose build --no-cache backend
```

### 🔄 **Typowe workflow'y**

#### **Development Workflow**
```bash
1. npm run dev:local       # Uruchom dev environment
2. # Kod zmianiona
3. # Auto-reload działa
4. npm run health          # Test czy działa
5. git add . && git commit # Commit zmian
```

#### **Testing Workflow**
```bash
1. npm run dev:docker      # Uruchom jak na produkcji
2. npm run health          # Test podstawowy
3. # Uruchom testy funkcjonalne
4. npm run docker:down     # Zatrzymaj po testach
```

#### **Production Deployment**
```bash
1. npm run build           # Zbuduj aplikację
2. # Skopiuj na serwer
3. npm run setup:full      # Uruchom na serwerze
4. npm run health          # Sprawdź czy działa
5. # Skonfiguruj reverse proxy
```

### 💡 **Pro Tips**

#### **🎯 Przydatne aliasy dla .bashrc**
```bash
# Dodaj do ~/.bashrc
alias label-start='cd ~/path/to/label_backend_server && npm run dev:local'
alias label-stop='cd ~/path/to/label_backend_server && npm run docker:down'
alias label-health='cd ~/path/to/label_backend_server && npm run health'
alias label-logs='cd ~/path/to/label_backend_server && npm run logs'
alias label-db='cd ~/path/to/label_backend_server && npm run db:studio'
```

#### **📊 Monitoring skript**
```bash
#!/bin/bash
# Zapisz jako monitor.sh
while true; do
    clear
    echo "=== LABEL BACKEND STATUS ==="
    echo "Time: $(date)"
    echo ""
    echo "Containers:"
    docker-compose ps
    echo ""
    echo "Health:"
    curl -s http://localhost:3001/health/ping || echo "❌ Backend down"
    echo ""
    echo "Memory usage:"
    docker stats --no-stream label_backend label_postgres
    sleep 5
done
```

---

## 💡 **Podsumowanie**

**Label Backend Server** to kompletne, enterprise-grade rozwiązanie oferujące:**

- 🔒 **Enterprise Security** - JWT, bcrypt, rate limiting, CORS
- 🚀 **Production Ready** - Docker, monitoring, error handling  
- 🛠️ **Developer Friendly** - TypeScript, Prisma, comprehensive docs
- ⚡ **High Performance** - Connection pooling, optimized queries
- 🧪 **Fully Testable** - Multiple testing interfaces
- 🔧 **Easy Deployment** - Docker Compose one-command setup

### 🎯 **Quick Reference**
```bash
# Najprostszy start
npm run setup && npm run dev:local

# Sprawdź status
npm run health

# Logi
npm run logs

# GUI bazy danych
npm run db:studio

# Zatrzymaj
npm run docker:down
```

**Ready for production use! 🎉**

---

*Ostatnia aktualizacja: Czerwiec 2025*
*Wersja: 1.0.0*
