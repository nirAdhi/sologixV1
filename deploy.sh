#!/bin/bash
# ============================================
# Sologix Solar — Docker Deployment Script
# ============================================
# Run this on your Linux server after cloning the repo
# Usage: chmod +x deploy.sh && ./deploy.sh
# ============================================

set -e

DOMAIN="sologixenergy.com"
EMAIL="admin@sologixenergy.in"

echo "================================================"
echo "  Sologix Solar — Docker Deployment"
echo "================================================"
echo ""

# ---- Step 1: Check prerequisites ----
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. You may need to log out and back in."
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose not found."
    echo "   Install: sudo apt install docker-compose-plugin"
    exit 1
fi

echo "✅ Docker: $(docker --version)"
echo "✅ Docker Compose: $(docker compose version)"
echo ""

# ---- Step 2: Create .env.docker if not exists ----
if [ ! -f .env.docker ]; then
    echo "📝 Creating .env.docker from template..."
    cp .env.docker.example .env.docker
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.docker with your real credentials!"
    echo "   nano .env.docker"
    echo ""
    echo "   Then run this script again."
    exit 1
else
    echo "✅ .env.docker found"
fi

# ---- Step 3: Create required directories ----
echo "📁 Creating directories..."
mkdir -p certbot/conf certbot/www nginx/conf.d
echo "✅ Directories created"

# ---- Step 4: Initial setup (HTTP only, for SSL cert) ----
echo ""
echo "🔧 Step 1 of 2: Starting with HTTP-only config..."

# Use HTTP-only config first (before SSL certs exist)
if [ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "   No SSL certificate found. Setting up HTTP-only first..."
    
    # Swap to HTTP-only config
    cp nginx/conf.d/http-only.conf.template nginx/conf.d/default.conf.bak
    cp nginx/conf.d/http-only.conf.template nginx/conf.d/default.conf
    
    # Start services
    docker compose up -d mysql backend nginx
    
    echo "   Waiting for services to start..."
    sleep 15
    
    echo ""
    echo "🔐 Obtaining SSL certificate..."
    docker compose run --rm certbot certonly \
        --webroot \
        --webroot-path /var/www/certbot \
        -d $DOMAIN \
        -d www.$DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate obtained!"
        
        # Restore HTTPS config
        if [ -f "nginx/conf.d/default.conf.bak" ]; then
            # Get the original HTTPS config from git
            git checkout nginx/conf.d/default.conf
            rm -f nginx/conf.d/default.conf.bak
        fi
        
        # Reload nginx with HTTPS
        docker compose restart nginx
        echo "✅ Nginx restarted with HTTPS"
    else
        echo "❌ SSL certificate failed. Site will run on HTTP only."
        echo "   You can retry later with:"
        echo "   docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos"
    fi
else
    echo "✅ SSL certificate already exists"
    docker compose up -d --build
fi

echo ""
echo "================================================"
echo "  ✅ Deployment Complete!"
echo "================================================"
echo ""
echo "  🌐 Website:  https://$DOMAIN"
echo "  🔧 Admin:    https://$DOMAIN/admin"
echo ""
echo "  📊 Useful commands:"
echo "    docker compose ps          — View running containers"
echo "    docker compose logs -f     — View live logs"
echo "    docker compose logs backend — View backend logs"
echo "    docker compose down        — Stop all services"
echo "    docker compose up -d       — Start all services"
echo "    docker compose up -d --build — Rebuild and start"
echo ""
echo "  🔐 SSL renewal (auto via certbot container):"
echo "    docker compose run --rm certbot renew"
echo ""
echo "  🗄️ Database backup:"
echo "    docker exec sologix-mysql mysqldump -u root -p solar_booking > backup.sql"
echo ""
