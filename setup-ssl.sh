#!/bin/bash

# SSL Setup Script for hkt-team13.zigexn.vn
# This script sets up Let's Encrypt SSL certificates

set -e

DOMAIN="hkt-team13.zigexn.vn"
EMAIL="admin@zigexn.vn"  # Change this to your email

echo "🔐 Setting up SSL for ${DOMAIN}"
echo "================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    exit 1
fi

# Create SSL directory
mkdir -p nginx/ssl

# Check if certificates already exist
if [ -f "nginx/ssl/fullchain.pem" ]; then
    echo "⚠️  SSL certificates already exist"
    read -p "Do you want to renew them? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping SSL setup"
        exit 0
    fi
fi

echo ""
echo "📝 Step 1: Starting Nginx without SSL..."
echo "------------------------------------------------"

# Temporarily use HTTP-only config
if [ -f "nginx/conf.d/ssl.conf" ]; then
    mv nginx/conf.d/ssl.conf nginx/conf.d/ssl.conf.bak
fi

# Start services
docker-compose up -d

echo ""
echo "⏳ Waiting for Nginx to start..."
sleep 5

echo ""
echo "📝 Step 2: Obtaining SSL certificate..."
echo "------------------------------------------------"

# Get SSL certificate
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN}

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL certificate obtained successfully!"

    # Restore SSL config
    if [ -f "nginx/conf.d/ssl.conf.bak" ]; then
        mv nginx/conf.d/ssl.conf.bak nginx/conf.d/ssl.conf
    fi

    # Copy certificates to nginx/ssl
    docker-compose exec certbot cp -r /etc/letsencrypt/live/${DOMAIN}/* /etc/letsencrypt/

    echo ""
    echo "📝 Step 3: Restarting Nginx with SSL..."
    echo "------------------------------------------------"

    # Restart Nginx with SSL config
    docker-compose restart nginx

    echo ""
    echo "✅ SSL setup completed!"
    echo ""
    echo "🌐 Your site is now available at:"
    echo "   - https://${DOMAIN}"
    echo ""
    echo "📝 Certificate will auto-renew every 12 hours"

else
    echo ""
    echo "❌ Failed to obtain SSL certificate"
    echo ""
    echo "Please check:"
    echo "1. Domain ${DOMAIN} points to this server's IP"
    echo "2. Ports 80 and 443 are open"
    echo "3. No firewall blocking the connection"

    # Restore config
    if [ -f "nginx/conf.d/ssl.conf.bak" ]; then
        mv nginx/conf.d/ssl.conf.bak nginx/conf.d/ssl.conf
    fi

    exit 1
fi

