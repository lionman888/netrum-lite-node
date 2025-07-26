#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const API_URL = 'https://api.v2.netrumlabs.com/api/node/mining/live-log/';
const POLL_INTERVAL = 60000; // 60 seconds

async function loadAddress() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const keyFile = path.resolve(__dirname, '../../wallet/key.txt');
  const { address } = JSON.parse(await fs.readFile(keyFile, 'utf-8'));
  return address;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function formatTokens(wei) {
  return (Number(wei) / 1e18).toFixed(6);
}

function formatStatus(data) {
  return [
    `⏱️ ${formatTime(data.timeRemaining || 0)}`,
    `${(data.percentComplete || 0).toFixed(2)}%`,
    `Mined: ${formatTokens(data.minedTokens || 0)} NPT`,
    `Speed: ${formatTokens(data.speedPerSec || 0)}/s`,
    `Status: ${data.isActive ? '✅ ACTIVE' : '❌ INACTIVE'}`
  ].join(' | ');
}

async function pollMiningStatus(address) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeAddress: address })
    });

    const json = await response.json();

    if (!json.success || typeof json !== 'object' || !json.percentComplete) {
      throw new Error(json.message || 'Unexpected response structure');
    }

    process.stdout.write('\x1Bc'); // Clear console
    console.log(formatStatus(json));

    if (!json.isActive && json.timeRemaining === 0) {
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
