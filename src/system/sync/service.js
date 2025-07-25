#!/usr/bin/env node

import os from 'os';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import diskusage from 'diskusage';

const API_URL = 'https://api.netrumlabs.com/api/node/metrics/sync/';
const SYNC_INTERVAL = 5000;
const DEFAULT_SPEED_MBPS = 5;
const TOKEN_FILE_PATH = path.resolve(__dirname, '../mining/miningtoken.txt');

function log(msg) {
  process.stderr.write(`[${new Date().toISOString()}] ${msg}\n`);
}

function getSystemInfo() {
  try {
    const cores = os.cpus().length;
    const ram = os.totalmem() / (1024 ** 2); // in MB
    const disk = diskusage.checkSync('/').free / (1024 ** 3); // in GB

    return {
      cpu: cores,
      ram: Math.round(ram),
      disk: Math.round(disk),
      speed: DEFAULT_SPEED_MBPS,
      lastSeen: Math.floor(Date.now() / 1000),
    };
  } catch (err) {
    log('❌ Error reading system info');
    return null;
  }
}

function saveMiningToken(token: string) {
  try {
    // Ensure mining directory exists
    const miningDir = path.dirname(TOKEN_FILE_PATH);
    if (!fs.existsSync(miningDir)) {
      fs.mkdirSync(miningDir, { recursive: true });
    }
    
    // Save token to file
    fs.writeFileSync(TOKEN_FILE_PATH, token, 'utf8');
    log(`🔑 Mining token saved to ${TOKEN_FILE_PATH}`);
  } catch (err) {
    log(`❌ Failed to save mining token: ${err.message}`);
  }
}

async function syncWithServer() {
  log('🔄 Syncing with server...');
  try {
    const idFilePath = path.resolve('/root/netrum-lite-node/src/identity/node-id/id.txt');

    if (!fs.existsSync(idFilePath)) {
      log(`❌ id.txt not found at ${idFilePath}`);
      return;
    }

    const nodeId = fs.readFileSync(idFilePath, 'utf8').trim();
    const metrics = getSystemInfo();

    if (!metrics) {
      log('❌ Failed to get system info');
      return;
    }

    const response = await axios.post(API_URL, {
      nodeId,
      nodeMetrics: metrics,
      nodeStatus: (metrics.cpu >= 2 && metrics.ram >= 4096 && metrics.disk >= 50) ? 'Active' : 'InActive'
    });

    if (response.data.log) {
      log(response.data.log);
    }

    // Save the mining token if received
    if (response.data.miningToken) {
      saveMiningToken(response.data.miningToken);
    }
  } catch (err) {
    log('❌ Sync error: ' + (err.message || 'Unknown error'));
  }
}

log('🚀 Netrum Node Sync Service Started...');
syncWithServer();
setInterval(syncWithServer, SYNC_INTERVAL);
