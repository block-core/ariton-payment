#!/bin/bash

# Variables
DOMAIN="alpha.ariton.app"
EMAIL="post@ariton.app"
LOCAL_ENDPOINT="http://localhost:8080"

# Install Certbot and Nginx if not already installed
sudo apt update
sudo apt install -y certbot python3-certbot-nginx nginx

# Generate Let's Encrypt certificate
sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive

# Configure Nginx to forward HTTP traffic to local endpoint
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
sudo bash -c "cat > $NGINX_CONF" <<EOL
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    location / {
        proxy_pass $LOCAL_ENDPOINT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

# Enable the Nginx configuration
sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "Setup complete. Your site should now be accessible at https://$DOMAIN"
