#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const API_URL = 'https://api.v2.netrumlabs.com/api/node/mining/live-log/';
const POLL_INTERVAL = 600_000; // 600 seconds

async function loadAddress() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const keyFile = path.resolve(__dirname, '../../wallet/key.txt');
  const { address } = JSON.parse(await fs.readFile(keyFile, 'utf-8'));
  return address;
}

function formatTime(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function formatTokens(wei = '0') {
  return (Number(wei) / 1e18).toFixed(6);
}

function formatStatus(info) {
  return [
    `⏱️ ${formatTime(info.timeRemaining)}`,
    `${(info.percentComplete).toFixed(2)}%`,
    `Mined: ${formatTokens(info.minedTokens)} NPT`,
    `Speed: ${formatTokens(info.speedPerSec)}/s`,
    `Status: ${info.isActive ? '✅ ACTIVE' : '❌ INACTIVE'}`
  ].join(' | ');
}

async function pollMiningStatus(address) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeAddress: address })
    });
    const json = await res.json();

    if (!json.success) {
      // Server returned success: false
      throw new Error(json.error || json.message || 'API returned an error');
    }

    // Extract the liveInfo payload:
    const info = json.liveInfo;
    if (!info || typeof info !== 'object') {
      throw new Error('Invalid response format');
    }

    // Clear and print
    process.stdout.write('\x1Bc');
    console.log(formatStatus(info));

    // Exit if mining is done
    if (!info.isActive && info.timeRemaining === 0) {
      console.log('⏹️ Mining session completed');
      process.exit(0);
    }

  } catch (err) {
    console.error('❌ Error fetching status:', err.message);
  }

  setTimeout(() => pollMiningStatus(address), POLL_INTERVAL);
}

(async () => {
  try {
    const address = await loadAddress();
    console.log(`📡 Monitoring mining status for ${address}`);
    console.log('----------------------------------------');
    await pollMiningStatus(address);
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
})();
