#!/bin/bash
# Run from your dev machine (Git Bash / WSL) to push code and rebuild.
# Usage: bash deploy/deploy.sh <server-ip>
# Example: bash deploy/deploy.sh 192.168.31.30

set -e

SERVER_IP="${1:?Usage: deploy.sh <server-ip>}"
SERVER_USER="root"
APP_DIR="/opt/stride"
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
STRIDE_DIR="$REPO_ROOT/Stride"

# Pick SSH key: $SSH_KEY override > ~/.ssh/stride > ~/.ssh/id_ed25519 > ~/.ssh/id_rsa
if [ -z "${SSH_KEY:-}" ]; then
  if   [ -f "$HOME/.ssh/stride"      ]; then SSH_KEY="$HOME/.ssh/stride"
  elif [ -f "$HOME/.ssh/id_ed25519"  ]; then SSH_KEY="$HOME/.ssh/id_ed25519"
  elif [ -f "$HOME/.ssh/id_rsa"      ]; then SSH_KEY="$HOME/.ssh/id_rsa"
  else SSH_KEY="$HOME/.ssh/stride"
  fi
fi

if [ ! -f "$SSH_KEY" ]; then
  echo "ERROR: SSH key not found at $SSH_KEY" >&2
  echo "Set up key auth:  ssh-copy-id $SERVER_USER@$SERVER_IP" >&2
  exit 1
fi

SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
ssh_run()  { ssh  $SSH_OPTS "$SERVER_USER@$SERVER_IP" "$@"; }
ssh_pipe() { ssh  $SSH_OPTS "$SERVER_USER@$SERVER_IP" "bash -s"; }
scp_run()  { scp  $SSH_OPTS "$@"; }

echo "=== Deploying Stride to $SERVER_IP ==="

# --- 1. Upload nginx config ---
echo "[1/5] Uploading nginx config..."
scp_run "$STRIDE_DIR/deploy/nginx.conf" "$SERVER_USER@$SERVER_IP:/tmp/nginx.conf"

# --- 2. Sync backend source ---
echo "[2/5] Syncing backend source..."
ssh_run "mkdir -p $APP_DIR/code/src"
tar -czf - \
  --exclude='bin' --exclude='obj' --exclude='*.user' \
  -C "$STRIDE_DIR/src" . \
  | ssh_run "tar -xzf - --no-same-owner -C $APP_DIR/code/src"

# --- 3. Sync Dockerfiles + compose + solution ---
echo "[3/5] Syncing docker files..."
scp_run "$STRIDE_DIR/deploy/docker-compose.yml" "$SERVER_USER@$SERVER_IP:$APP_DIR/code/"
scp_run "$STRIDE_DIR/Dockerfile"          "$SERVER_USER@$SERVER_IP:$APP_DIR/code/"
scp_run "$STRIDE_DIR/Dockerfile.adaptive" "$SERVER_USER@$SERVER_IP:$APP_DIR/code/"
scp_run "$STRIDE_DIR/Stride.slnx"         "$SERVER_USER@$SERVER_IP:$APP_DIR/code/"
scp_run "$STRIDE_DIR/.dockerignore"       "$SERVER_USER@$SERVER_IP:$APP_DIR/code/"

# --- 4. Sync frontend source ---
echo "[4/5] Syncing frontend source..."
ssh_run "mkdir -p $APP_DIR/code/ui"
ssh_run "find $APP_DIR/code/ui -mindepth 1 -maxdepth 1 \
  ! -name node_modules ! -name .angular ! -name dist \
  -exec rm -rf {} +"
tar -czf - \
  --exclude='node_modules' --exclude='dist' --exclude='.angular' \
  -C "$STRIDE_DIR/ui" . \
  | ssh_run "tar -xzf - --no-same-owner -C $APP_DIR/code/ui"

# --- 5. Build frontend + backend ---
echo "[5/5] Building on server and restarting services..."
ssh_pipe <<REMOTE
set -e

echo "--- Building Angular frontend ---"
cd $APP_DIR/code/ui
npm install --silent
npx ng build --configuration production --output-path $APP_DIR/dist
chmod -R 755 $APP_DIR/dist
chown -R www-data:www-data $APP_DIR/dist

echo "--- Restarting backend (Docker Compose) ---"
cd $APP_DIR/code
set -a; source $APP_DIR/.env; set +a
export CORS_ALLOWED_ORIGINS="\${CORS_ALLOWED_ORIGINS:-https://$SERVER_IP,http://$SERVER_IP}"
docker compose up -d --build

echo "--- Reloading nginx ---"
nginx -t && nginx -s reload

echo ""
echo "Done! App available at: https://$SERVER_IP"
REMOTE

echo ""
echo "=== Deploy complete ==="
echo "Frontend:    https://$SERVER_IP"
echo "API health:  https://$SERVER_IP/health"
