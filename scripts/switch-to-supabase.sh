#!/bin/bash
# ===========================================
# SWITCH TO SUPABASE CONFIGURATION
# ===========================================

echo "🚀 Switching to Supabase configuration..."

# Backup current .env
if [ -f .env ]; then
    cp .env .env.local.backup
    echo "✅ Backed up current .env to .env.local.backup"
fi

# Check if user has configured Supabase settings
echo ""
echo "📋 INSTRUKCJE KONFIGURACJI SUPABASE:"
echo "1. Idź do https://supabase.com/dashboard"
echo "2. Wybierz swój projekt"
echo "3. Settings > Database"
echo "4. Skopiuj dane połączenia i wklej poniżej"
echo ""

read -p "Podaj PROJECT_REF (np. abcdefghijk): " PROJECT_REF
read -s -p "Podaj hasło bazy danych: " DB_PASSWORD
echo ""

# Create Supabase .env
cat > .env << EOF
# ===========================================
# SUPABASE CONFIGURATION
# ===========================================

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres?schema=public

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

# Supabase Details
SUPABASE_URL=https://${PROJECT_REF}.supabase.co
EOF

echo "✅ Created Supabase configuration!"
echo "🔧 Testing database connection..."

# Test the connection
npm run db:generate
if npm run db:push; then
    echo "✅ Successfully connected to Supabase!"
    echo "🎉 Your backend is now using Supabase database!"
else
    echo "❌ Failed to connect to Supabase. Check your credentials."
    echo "🔄 Restoring local configuration..."
    if [ -f .env.local.backup ]; then
        cp .env.local.backup .env
    fi
fi 