#!/bin/bash
# =====================================================
# MarketPro Deployment Script
# =====================================================
# 
# QADAMLAR:
# 1. Frontendni Cloudflare Pages ga deploy qilish
# 2. Backendni Fly.io ga deploy qilish
# 3. PostgreSQL ni Supabase da yaratish
# 4. Domainni Cloudflare ga ulash
# =====================================================

echo "=== MarketPro Deployment ==="
echo ""

# ─── 1. Backend deploy (Fly.io) ─────────────────────
echo "1. Backend (Fly.io) ga deploy:"
echo "   cd apps/api"
echo "   fly launch  (birinchi marta)"
echo "   fly deploy  (keyingi marta)"
echo "   fly secrets set DATABASE_URL=postgresql://..."
echo "   fly secrets set JWT_SECRET=..."
echo "   fly secrets set GOOGLE_CLIENT_ID=..."
echo "   fly secrets set CLIENT_URL=https://market.pro"
echo "   fly secrets set SITE_URL=https://market.pro"
echo ""

# ─── 2. Frontend deploy (Cloudflare Pages) ──────────
echo "2. Frontend (Cloudflare Pages) ga deploy:"
echo "   GitHub repo ni Cloudflare Pages ga ulang:"
echo "   Dashboard → Pages → Connect Git → MarketPro repo"
echo "   Root: apps/web"
echo "   Build command: npm run build"
echo "   Output: dist"
echo "   Environment variables:"
echo "     VITE_API_URL=https://marketpro-api.fly.dev/api"
echo "     VITE_GOOGLE_CLIENT_ID=..."
echo ""

# ─── 3. Supabase (PostgreSQL) ────────────────────────
echo "3. PostgreSQL (Supabase):"
echo "   https://supabase.com → New project"
echo "   Project Settings → Database → Connection string"
echo "   DATABASE_URL=postgresql://... (pastga qarang)"
echo ""

# ─── 4. Domain ──────────────────────────────────────
echo "4. Domain market.pro:"
echo "   Cloudflare → Add site → market.pro"
echo "   DNS → A record -> Cloudflare IP yoki Fly.io IP"
echo "   SSL/TLS → Full (strict)"
echo ""

# ─── 5. Google Search Console ──────────────────────
echo "5. Google Search Console:"
echo "   https://search.google.com/search-console"
echo "   Add property → Domain: market.pro"
echo "   DNS TXT record qo'shing (Cloudflare DNS)"
echo ""

# ─── 6. Yandex Webmaster ──────────────────────────
echo "6. Yandex Webmaster:"
echo "   https://webmaster.yandex.com"
echo "   Add site → market.pro"
echo "   Meta verification kodni index.html ga qo'shing"
echo ""

echo "=== Bajarildi! ==="
