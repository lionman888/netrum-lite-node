#!/bin/bash

# Netrum Auto Claim Setup Script
# This script sets up automatic claiming of NPT tokens

echo "🤖 Setting up Netrum Auto Claim..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Make sure we're in the right directory
cd "$PROJECT_DIR"

echo "📁 Project directory: $PROJECT_DIR"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/src/logs"

# Make the auto-claim script executable
chmod +x "$PROJECT_DIR/cli/auto-claim-cli.js"
chmod +x "$PROJECT_DIR/src/system/mining/auto-claim.js"

echo "✅ Made scripts executable"

# Create systemd service for auto-claim
cat > /tmp/netrum-auto-claim.service << EOF
[Unit]
Description=Netrum Auto Claim Service
After=network.target

[Service]
Type=oneshot
User=root
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node $PROJECT_DIR/src/system/mining/auto-claim.js
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Install the service
sudo cp /tmp/netrum-auto-claim.service /etc/systemd/system/
sudo systemctl daemon-reload

echo "✅ Created systemd service"

# Create timer for daily execution
cat > /tmp/netrum-auto-claim.timer << EOF
[Unit]
Description=Run Netrum Auto Claim daily
Requires=netrum-auto-claim.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Install the timer
sudo cp /tmp/netrum-auto-claim.timer /etc/systemd/system/
sudo systemctl daemon-reload

echo "✅ Created systemd timer"

# Enable and start the timer
sudo systemctl enable netrum-auto-claim.timer
sudo systemctl start netrum-auto-claim.timer

echo "✅ Enabled and started timer"

# Show status
echo ""
echo "📊 Auto Claim Status:"
sudo systemctl status netrum-auto-claim.timer --no-pager

echo ""
echo "📋 Available Commands:"
echo "  Check timer status: sudo systemctl status netrum-auto-claim.timer"
echo "  View logs: sudo journalctl -u netrum-auto-claim.service"
echo "  Manual run: sudo systemctl start netrum-auto-claim.service"
echo "  Disable: sudo systemctl disable netrum-auto-claim.timer"

echo ""
echo "🎉 Auto claim setup complete!"
echo "   The system will automatically attempt to claim rewards daily."
echo "   Check logs with: sudo journalctl -u netrum-auto-claim.service -f"
