#!/bin/bash
# ===========================================
# DEPLOY TO VERCEL - COMPLETE SETUP
# ===========================================

echo "🚀 Deploying to Vercel with Supabase..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Ensure we're using Supabase configuration
echo "🔧 Ensuring Supabase configuration..."
if grep -q "supabase.co" .env; then
    echo "✅ Supabase configuration detected"
else
    echo "⚠️  Local configuration detected. Switch to Supabase for production?"
    read -p "Run 'npm run supabase:switch' now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run supabase:switch
    fi
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors and try again."
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Set environment variables in Vercel Dashboard:"
echo "   - DATABASE_URL (your Supabase connection string)"
echo "   - NODE_ENV=production"
echo "   - JWT_SECRET (generate a strong secret)"
echo "   - FRONTEND_URL (your frontend domain)"
echo ""
echo "2. Test your deployment:"
echo "   - Visit your backend URL + /health"
echo "   - Check database connection"
echo ""
echo "3. Update frontend API URL to point to your backend"
echo ""
echo "🔗 Useful links:"
echo "📊 Vercel Dashboard: https://vercel.com/dashboard"
echo "🗄️ Supabase Dashboard: https://supabase.com/dashboard" 