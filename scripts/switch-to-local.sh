#!/bin/bash
# ===========================================
# SWITCH TO LOCAL DOCKER CONFIGURATION
# ===========================================

echo "🏠 Switching to local Docker configuration..."

# Backup current .env
if [ -f .env ]; then
    cp .env .env.supabase.backup
    echo "✅ Backed up current .env to .env.supabase.backup"
fi

# Create local .env
cat > .env << EOF
# ===========================================
# LOCAL DOCKER CONFIGURATION
# ===========================================

# Database Configuration
POSTGRES_DB=label_db
POSTGRES_USER=label_user
POSTGRES_PASSWORD=SuperSecurePassword123!
POSTGRES_PORT=5432

# Backend Configuration
NODE_ENV=development
BACKEND_PORT=3001
JWT_SECRET=super_secret_jwt_key_change_in_production_123!@#

# Database URL for Prisma (Local Docker)
DATABASE_URL=postgresql://label_user:SuperSecurePassword123!@localhost:5432/label_db?schema=public

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo "✅ Switched to local configuration!"
echo "🐳 Starting local PostgreSQL..."

# Start local PostgreSQL
npm run docker:postgres

echo "🔧 Testing database connection..."
sleep 5  # Wait for PostgreSQL to start

# Test the connection
if npm run db:push; then
    echo "✅ Successfully connected to local PostgreSQL!"
    echo "🎉 Your backend is now using local Docker database!"
else
    echo "❌ Failed to connect to local PostgreSQL."
    echo "💡 Try: npm run docker:postgres"
fi 