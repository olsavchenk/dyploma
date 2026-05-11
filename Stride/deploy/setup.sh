#!/bin/bash
# Run this ONCE inside the Proxmox LXC container to set up the server.
# Usage: bash setup.sh

set -e

APP_DIR="/opt/stride"
APP_USER="stride"

echo "=== Stride Server Setup ==="

# --- System packages ---
apt-get update -qq
apt-get install -y -qq curl git rsync nginx openssl ca-certificates

# --- Docker ---
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# --- Node.js 22 (for Angular build) ---
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# --- App user & directory ---
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -m -d "$APP_DIR" -s /bin/bash "$APP_USER"
  usermod -aG docker "$APP_USER"
fi

mkdir -p "$APP_DIR"/{code,dist,certs}
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# --- Self-signed TLS cert (replace with real cert / Cloudflare cert later) ---
if [ ! -f "$APP_DIR/certs/stride.crt" ]; then
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout "$APP_DIR/certs/stride.key" \
    -out "$APP_DIR/certs/stride.crt" \
    -subj "/CN=stride.local" 2>/dev/null
fi

# --- nginx config ---
cp /tmp/nginx.conf /etc/nginx/sites-available/stride
ln -sf /etc/nginx/sites-available/stride /etc/nginx/sites-enabled/stride
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable --now nginx

# --- systemd service for Docker Compose ---
cat > /etc/systemd/system/stride.service <<'EOF'
[Unit]
Description=Stride Backend
After=docker.service network-online.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=stride
WorkingDirectory=/opt/stride/code
EnvironmentFile=/opt/stride/.env
ExecStart=/usr/bin/docker compose up -d --build
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=900

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable stride

echo ""
echo "=== Setup complete ==="
echo "Next: copy your .env file to /opt/stride/.env then run deploy.sh"
