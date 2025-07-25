#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/* ---------- Configuration ---------- */
const API_URL = 'https://api.netrumlabs.com/api/node/mining/live-log/';
const POLL_INTERVAL = 30_000; // 30 seconds
const MAX_RETRIES = 3;

/* ---------- Wallet Setup ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyFile = path.resolve(__dirname, '../../wallet/key.txt');

async function loadAddress() {
  try {
    const { address } = JSON.parse(await fs.readFile(keyFile, 'utf-8'));
    if (!address) throw new Error('Wallet file missing address');
    return address.trim();
  } catch (err) {
    throw new Error(`Failed to load wallet: ${err.message}`);
  }
}

/* ---------- Formatting Helpers ---------- */
const fmtTokens = (wei) => (Number(wei) / 1e18).toFixed(6);
const fmtTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}h ${m}m ${sec}s`;
};

/* ---------- Polling Logic ---------- */
async function pollStatus(address, attempt = 1) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeAddress: address })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    const info = data.liveInfo;
    const statusLine = [
      `⏱️ ${fmtTime(info.timeRemaining)}`,
      `${info.percentComplete.toFixed(2)}%`,
      `Mined: ${fmtTokens(info.minedTokens)} NPT`,
      `Speed: ${fmtTokens(info.speedPerSec)}/s`,
      `Status: ${info.isActive ? '✅ ACTIVE' : '❌ INACTIVE'}`
    ].join(' | ');

    process.stdout.write('\x1Bc'); // Clear console
    console.log(statusLine);

    if (!info.isActive && info.timeRemaining === 0) {
      console.log('⏹️ Mining session completed');
      process.exit(0);
    }

    // Schedule next poll
    setTimeout(() => pollStatus(address), POLL_INTERVAL);

  } catch (err) {
    console.error(`Poll attempt ${attempt} failed:`, err.message);
    
    if (attempt >= MAX_RETRIES) {
      console.log('❌ Maximum retries reached');
      process.exit(1);
    }
    
    setTimeout(() => pollStatus(address, attempt + 1), POLL_INTERVAL);
  }
}

/* ---------- Main Execution ---------- */
(async () => {
  try {
    const address = await loadAddress();
    console.log(`📡 Live monitoring for ${address}`);
    console.log('--------------------------------');
    
    await pollStatus(address);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
})();
