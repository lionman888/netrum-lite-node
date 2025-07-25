#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/* ---------- config ---------- */
const API_URL = 'https://api.netrumlabs.com/api/node/mining/live-log/';
const MIN_DELAY = 30_000; // 30 seconds minimum
const MAX_DELAY = 600_000; // 10 minutes maximum

/* ---------- logging ---------- */
process.stdout._handle.setBlocking(true);
process.stderr._handle.setBlocking(true);
const log = (m) => process.stderr.write(`[${new Date().toISOString()}] ${m}\n`);

/* ---------- wallet ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyFile = path.resolve(__dirname, '../../wallet/key.txt');

async function loadAddress() {
  try {
    const { address } = JSON.parse(await fs.readFile(keyFile, 'utf-8'));
    if (!address) throw new Error('wallet/key.txt missing address');
    return address.trim();
  } catch (err) {
    throw new Error(`Failed to load wallet: ${err.message}`);
  }
}

/* ---------- formatting helpers ---------- */
const fmtTokens = (wei) => (Number(wei) / 1e18).toFixed(6);
const fmtTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}h ${m}m ${sec}s`;
};

/* ---------- polling logic ---------- */
async function poll(address, attempt = 1) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeAddress: address })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const res = await response.json();
    
    if (!res.success) {
      throw new Error(res.error || 'API returned unsuccessful response');
    }

    const info = res.liveInfo;
    const line = `⏱️ ${fmtTime(info.timeRemaining)} | ${info.percentComplete.toFixed(2)}% | ` +
               `Mined: ${fmtTokens(info.minedTokens)} NPT | ` +
               `Speed: ${fmtTokens(info.speedPerSec)}/s | ` +
               `Status: ${info.isActive ? '✅ ACTIVE' : '❌ INACTIVE'}`;

    // Clear terminal and print status
    process.stdout.write('\x1Bc');
    console.log(line);

    if (!info.isActive && info.timeRemaining === 0) {
      log('⏹️ Mining session completed');
      process.exit(0);
    }

    // Reset attempt counter on success
    attempt = 1;

  } catch (err) {
    console.error(`Attempt ${attempt} failed:`, err.message);
    
    if (attempt >= 3) {
      log('❌ Too many consecutive failures, exiting');
      process.exit(1);
    }
  }

  // Calculate next poll time with exponential backoff
  const delay = Math.min(
    MIN_DELAY * Math.pow(2, attempt - 1) + Math.random() * 10_000,
    MAX_DELAY
  );
  
  log(`⏳ Next poll in ${Math.floor(delay/1000)} seconds`);
  setTimeout(() => poll(address, attempt), delay);
}

/* ---------- main ---------- */
(async () => {
  try {
    const address = await loadAddress();
    log(`📡 Live log started for ${address}`);
    console.log('⏱️ Live Mining Status\n--------------------------------');

    await poll(address);
  } catch (err) {
    log(`❌ ${err.message}`);
    process.exit(1);
  }
})();
