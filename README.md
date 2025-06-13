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

## ⚡ Szybki start

### 📋 Wymagania
- **Node.js 18+** 
- **Docker** i **Docker Compose**
- **Git**

### 🚀 **Instalacja i uruchomienie**

#### **Metoda 1: Docker (zalecane dla produkcji)**
```bash
# Sklonuj repozytorium
git clone <repository-url>
cd label_backend_server

# Skopiuj i edytuj konfigurację
cp .env.example .env
nano .env  # Ustaw bezpieczne hasła!

# Uruchom wszystko jedną komendą
docker-compose up -d

# Sprawdź status
docker-compose ps
docker-compose logs -f
```

#### **Metoda 2: Development (lokalne uruchomienie)**
```bash
# Przejdź do katalogu projektu
cd label_backend_server

# Zainstaluj zależności
npm install

# Skopiuj przykładową konfigurację
cp .env.example .env
# ⚠️ WAŻNE: Edytuj .env i ustaw bezpieczne hasła
nano .env

# Uruchom tylko PostgreSQL w Docker
docker-compose up -d postgres

# Zastosuj schema bazy danych
npm run db:push

# Uruchom backend w trybie deweloperskim
npm run dev
```

#### **Metoda 3: Production Build**
```bash
# Zbuduj aplikację
npm run build

# Uruchom w trybie produkcyjnym
npm start
```

### ✅ **Weryfikacja instalacji**
Po uruchomieniu sprawdź:
- **Backend:** http://localhost:3001/health
- **API Status:** http://localhost:3001/health/ping
- **Database GUI:** `npm run db:studio` (http://localhost:5555)

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

### 🔄 **Request Flow**
```
Client Request
      ↓
[Express Middleware Stack]
      ↓
  Security Layer (Helmet, CORS)
      ↓
  Rate Limiting
      ↓
  Request Logging (Morgan)
      ↓
  JSON Parsing
      ↓
[Route Handler]
      ↓
  Input Validation (Joi)
      ↓
  Authentication (JWT)
      ↓
[Controller Logic]
      ↓
  Database Operations (Prisma)
      ↓
[Response Formation]
      ↓
  Error Handling
      ↓
    JSON Response
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

### 🔧 **Development Scripts**

### 🔧 **Development Scripts**
```bash
# Development
npm run dev          # Uruchom w trybie deweloperskim (auto-reload)
npm run build        # Zbuduj aplikację do folderu dist/
npm run start        # Uruchom zbudowaną aplikację

# Database
npm run db:generate  # Regeneruj Prisma client
npm run db:push      # Zastosuj schema do bazy (development)
npm run db:migrate   # Utwórz i zastosuj migrację
npm run db:studio    # Otwórz Prisma Studio (GUI)

# Docker
npm run docker:up    # docker-compose up -d
npm run docker:down  # docker-compose down
npm run docker:logs  # docker-compose logs -f

# Code Quality
npm run lint         # Sprawdź kod z ESLint
npm run test         # Uruchom testy (jeśli skonfigurowane)
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

## 🚨 Troubleshooting

### 🔍 **Częste problemy**

#### **Problem: Database connection failed**
```bash
# Sprawdź czy PostgreSQL działa
docker-compose ps
docker exec label_postgres pg_isready -U label_user

# Sprawdź logi
docker-compose logs postgres

# Reset database container
docker-compose down
docker volume rm label_backend_server_postgres_data
docker-compose up -d postgres
```

#### **Problem: Port already in use**
```bash
# Znajdź proces używający portu
lsof -i :3001
netstat -tulpn | grep :3001

# Zabij proces
kill -9 <PID>

# Lub zmień port w .env
PORT=3002
```

#### **Problem: CORS errors**
```bash
# Sprawdź FRONTEND_URL w .env
echo $FRONTEND_URL

# Dodaj domenę do CORS config w src/app.ts
origin: ['http://localhost:3000', 'https://yourdomain.com']
```

#### **Problem: JWT token errors**
```bash
# Sprawdź czy JWT_SECRET jest ustawiony
echo $JWT_SECRET

# Regeneruj secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 📞 **Wsparcie**
W przypadku problemów sprawdź:
1. **Application logs:** `docker-compose logs -f backend`
2. **Database logs:** `docker-compose logs postgres`
3. **Container status:** `docker-compose ps`
4. **Database connectivity:** `npm run db:studio`
5. **Health endpoint:** `curl http://localhost:3001/health`

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

---

## 💡 **Podsumowanie**

**Label Backend Server** to kompletne, enterprise-grade rozwiązanie oferujące:**

- 🔒 **Enterprise Security** - JWT, bcrypt, rate limiting, CORS
- 🚀 **Production Ready** - Docker, monitoring, error handling
- 🛠️ **Developer Friendly** - TypeScript, Prisma, comprehensive docs
- ⚡ **High Performance** - Connection pooling, optimized queries
- 🧪 **Fully Testable** - Multiple testing interfaces
- 🔧 **Easy Deployment** - Docker Compose one-command setup

**Ready for production use! 🎉**

---

*Ostatnia aktualizacja: Czerwiec 2025*
*Wersja: 1.0.0*
