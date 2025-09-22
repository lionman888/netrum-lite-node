#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const autoClaimPath = path.join(__dirname, '../src/system/mining/auto-claim.js');

// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🤖 Netrum Auto Claim CLI
Usage:
  netrum-auto-claim        Automatically claim mined NPT tokens
  netrum-auto-claim --help Show this help

Description:
  Automatically claims your accumulated mining rewards without user confirmation.
  This command is designed for automated scripts and cron jobs.

Features:
  - No user interaction required
  - Automatic balance checking
  - Detailed logging to /src/logs/auto-claim.log
  - Error handling and reporting

Requirements:
  - Your mining session must be complete (24 hours)
  - Wallet must contain ETH for the claim fee
  - Node must be in Active status

Usage in Cron:
  # Run every day at 2 AM
  0 2 * * * /path/to/netrum-auto-claim

  # Run every 6 hours
  0 */6 * * * /path/to/netrum-auto-claim

Logs:
  - Check logs: tail -f /path/to/netrum-lite-node/src/logs/auto-claim.log
  - View recent logs: tail -n 50 /path/to/netrum-lite-node/src/logs/auto-claim.log
`);
  process.exit(0);
}

// Spawn the auto-claim process
const autoClaimProcess = spawn('node', [autoClaimPath], {
  stdio: 'inherit'
});

// Handle exit
autoClaimProcess.on('close', (code) => {
  process.exit(code);
});
