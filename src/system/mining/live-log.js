#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const API_URL = 'https://api.v2.netrumlabs.com/api/node/mining/setup/';
const POLL_INTERVAL = 20000; // 20 seconds

async function loadAddress() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const keyFile = path.resolve(__dirname, '../../wallet/key.txt');
  const { address } = JSON.parse(await fs.readFile(keyFile, 'utf-8'));
  return address;
}

function formatStatus(data) {
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const formatTokens = (wei) => (Number(wei) / 1e18).toFixed(6);

  return [
    `⏱️ ${formatTime(data.timeRemaining)}`,
    `${data.percentComplete.toFixed(2)}%`,
    `Mined: ${formatTokens(data.minedTokens)} NPT`,
    `Speed: ${formatTokens(data.speedPerSec)}/s`,
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

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get mining status');
    }

    process.stdout.write('\x1Bc'); // Clear console
    console.log(formatStatus(data));

    if (!data.isActive && data.timeRemaining === 0) {
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
