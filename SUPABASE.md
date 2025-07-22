# 🚀 Supabase Integration Guide

## 📋 Przegląd

Ten projekt obsługuje **Supabase** jako alternatywę dla lokalnej bazy PostgreSQL. Możesz łatwo przełączać się między:
- **🏠 Lokalna baza PostgreSQL** (Docker)
- **☁️ Supabase PostgreSQL** (cloud)

## ✅ Czy można zmienić server?

**TAK!** 🎉 Twój projekt jest w pełni gotowy na przejście na Supabase:

✅ **Prisma ORM** - kompatybilne z Supabase PostgreSQL  
✅ **TypeScript** - pełne wsparcie  
✅ **Express.js backend** - działa z dowolną bazą PostgreSQL  
✅ **Schema.prisma** - gotowy do migracji  
✅ **Environment variables** - skonfigurowane  

## 🎯 Szybka Konfiguracja

### Metoda 1: Automatyczny Script (Zalecana)

```bash
# Przełącz na Supabase
npm run supabase:switch

# Przełącz z powrotem na lokalną bazę
npm run local:switch
```

### Metoda 2: Manualna Konfiguracja

1. **Pobierz dane z Supabase Dashboard:**
   - Idź na https://supabase.com/dashboard
   - Wybierz swój projekt
   - Settings → Database
   - Skopiuj "Connection string"

2. **Edytuj plik `.env`:**
```bash
# Otwórz plik .env
nano .env

# Zastąp DATABASE_URL swoimi danymi Supabase:
DATABASE_URL=postgresql://postgres:[TWOJE_HASŁO]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public
```

3. **Zastosuj schema do Supabase:**
```bash
npm run db:push
```

## 📚 Szczegółowe Instrukcje

### 🔧 Krok 1: Przygotowanie Supabase

1. **Utwórz projekt w Supabase** (jeśli nie masz):
   ```
   https://supabase.com/dashboard/new
   ```

2. **Znajdź dane połączenia:**
   - Dashboard → Settings → Database
   - Sekcja "Connection string"
   - Skopiuj: Host, Database, Port, Username, Password

### 🔧 Krok 2: Konfiguracja .env

**Przykład konfiguracji dla Supabase:**

```env
# ===========================================
# SUPABASE CONFIGURATION
# ===========================================

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:TwojeHaslo123@db.abcdefghijk.supabase.co:5432/postgres?schema=public

# Backend Configuration
NODE_ENV=development
BACKEND_PORT=3001
JWT_SECRET=super_secret_jwt_key_change_in_production_123!@#

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Supabase API Keys (for future use)
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### 🔧 Krok 3: Migracja Schema

```bash
# Wygeneruj Prisma client
npm run db:generate

# Zastosuj schema do Supabase
npm run db:push

# Sprawdź czy działa
npm run health
```

### 🔧 Krok 4: Uruchomienie

```bash
# Uruchom backend z Supabase
npm run dev:supabase

# lub po prostu
npm run dev
```

## 🔄 Przełączanie między bazami

### ☁️ Przełącz na Supabase:
```bash
npm run supabase:switch
```

### 🏠 Przełącz na lokalną bazę:
```bash
npm run local:switch
```

## 🧪 Testowanie Lokalnie z Supabase

**Scenariusz:** Backend lokalnie + Baza Supabase

```bash
# 1. Skonfiguruj .env dla Supabase
npm run supabase:switch

# 2. Uruchom backend lokalnie
npm run dev

# 3. Backend działa na localhost:3001
# 4. Baza danych w chmurze Supabase
```

**Zalety:**
✅ Szybka iteracja kodu  
✅ Dane w chmurze  
✅ Współdzielenie danych z zespołem  
✅ Hot reload podczas development  

## 🏭 Deployment na Produkcję

### Opcja 1: Backend na Vercel/Netlify + Supabase
```bash
# 1. Zbuduj aplikację
npm run build

# 2. Ustaw zmienne środowiskowe na platformie:
DATABASE_URL=postgresql://postgres:...@db.xyz.supabase.co:5432/postgres
NODE_ENV=production
JWT_SECRET=your_super_secret_production_key

# 3. Deploy
```

### Opcja 2: Backend na VPS + Supabase
```bash
# Na serwerze:
git clone your-repo
npm install
npm run build

# Ustaw .env dla produkcji
npm run db:push
npm start
```

## 🔍 Troubleshooting

### ❌ "Connection refused"
```bash
# Sprawdź DATABASE_URL
echo $DATABASE_URL

# Sprawdź czy Supabase działa
curl -I https://your-project.supabase.co

# Test połączenia
npm run db:push
```

### ❌ "SSL connection required"
Upewnij się, że DATABASE_URL zawiera `?sslmode=require`:
```env
DATABASE_URL=postgresql://postgres:haslo@db.xyz.supabase.co:5432/postgres?sslmode=require&schema=public
```

### ❌ "Database does not exist"
Supabase domyślnie używa bazy `postgres`, nie `label_db`:
```env
# Poprawnie:
DATABASE_URL=postgresql://postgres:haslo@db.xyz.supabase.co:5432/postgres?schema=public

# Błędnie:
DATABASE_URL=postgresql://postgres:haslo@db.xyz.supabase.co:5432/label_db?schema=public
```

## 🎯 Najlepsze Praktyki

### 🔐 Bezpieczeństwo
```bash
# Zmień domyślne hasła
JWT_SECRET=$(openssl rand -hex 64)

# Użyj silnego hasła dla Supabase
# Ogranicz dostęp w Supabase Dashboard
```

### 📊 Monitoring
```bash
# Sprawdzaj logi Supabase w Dashboard
# Monitoruj użycie bazy danych
# Ustaw alerty dla błędów
```

### 🔄 Backup
```bash
# Regularne backupy w Supabase Dashboard
# Export schema: npm run db:migrate
# Zapisuj migracje w git
```

## 🚀 Przyszłe Rozszerzenia

### Supabase Auth Integration
W przyszłości możesz dodać Supabase Auth:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
```

### Real-time Features
```typescript
// Real-time subscriptions
supabase
  .channel('labels')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'labels' 
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

### Storage Integration
```typescript
// File uploads do Supabase Storage
const { data, error } = await supabase.storage
  .from('label-uploads')
  .upload('public/label.jpg', file)
```

## ❓ FAQ

**Q: Czy muszę zmienić kod aplikacji?**  
A: NIE! Tylko DATABASE_URL w .env

**Q: Czy migracje działają z Supabase?**  
A: TAK! `npm run db:push` i `npm run db:migrate`

**Q: Czy mogę używać Prisma Studio?**  
A: TAK! `npm run db:studio` działa z Supabase

**Q: Czy dane są bezpieczne?**  
A: TAK! Supabase używa SSL i jest SOC2 compliant

**Q: Czy koszt będzie duży?**  
A: NIE! Supabase ma darmowy tier do 500MB 