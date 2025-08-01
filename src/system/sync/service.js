#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import os from 'os';
import diskusage from 'diskusage';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Updated Configuration with 50-60 second sync interval
const API_BASE_URL = 'https://api.v2.netrumlabs.com';
const SYNC_ENDPOINT = '/api/node/metrics/sync/';
const MIN_SYNC_INTERVAL = 50000; // 50 seconds (minimum)
const MAX_SYNC_INTERVAL = 60000; // 60 seconds (maximum)
const TOKEN_PATH = path.resolve(__dirname, '../mining/miningtoken.txt');

// Minimum system requirements
const NODE_REQUIREMENTS = { 
  RAM: 4,    // in GB
  CORES: 2,  // minimum cores
  STORAGE: 50 // in GB
};

// Configure axios instance with optimized settings
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // Increased timeout to 20 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  maxRedirects: 0
});

// Get random interval between 50-60 seconds
const getNextSyncInterval = () => {
  return MIN_SYNC_INTERVAL + Math.floor(Math.random() * (MAX_SYNC_INTERVAL - MIN_SYNC_INTERVAL));
};

// Enhanced logging with error types
const log = (msg, type = 'info') => {
  const prefix = `[${new Date().toISOString()}] [${type.toUpperCase()}]`;
  console.error(`${prefix} ${msg}`);
};

// Robust metrics collection
const getSystemMetrics = () => {
  try {
    const stats = {
      cpu: os.cpus().length,
      ram: Math.round(os.totalmem() / (1024 ** 2)), // MB
      disk: 0,
      speed: 5, // Default Mbps
      lastSeen: Math.floor(Date.now() / 1000)
    };

    try {
      stats.disk = Math.round(diskusage.checkSync('/').free / (1024 ** 3)); // GB
    } catch (diskErr) {
      log(`Disk check failed: ${diskErr.message}`, 'warn');
      stats.disk = 0;
    }

    return stats;
  } catch (err) {
    log(`Metrics error: ${err.message}`, 'error');
    return null;
  }
};

// Atomic token saving
const saveToken = (token) => {
  try {
    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    const tmpPath = `${TOKEN_PATH}.tmp`;
    fs.writeFileSync(tmpPath, token);
    fs.renameSync(tmpPath, TOKEN_PATH); // Atomic write
    log('Mining token saved successfully');
  } catch (err) {
    log(`Token save failed: ${err.message}`, 'error');
  }
};

// Resilient node ID reading
const readNodeId = () => {
  const idPath = '/root/netrum-lite-node/src/identity/node-id/id.txt';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return fs.readFileSync(idPath, 'utf8').trim();
    } catch (err) {
      if (attempt === 3) throw err;
      log(`Node ID read failed (attempt ${attempt}), retrying...`, 'warn');
      new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Enhanced sync function with retry logic
const syncNode = async () => {
  try {
    // 1. Get node ID
    const nodeId = await readNodeId();
    if (!nodeId) throw new Error('Empty node ID');

    // 2. Get system metrics
    const metrics = getSystemMetrics();
    if (!metrics) throw new Error('Failed to get metrics');

    // 3. Determine node status
    const isActive = (
      metrics.cpu >= NODE_REQUIREMENTS.CORES &&
      metrics.ram >= NODE_REQUIREMENTS.RAM * 1024 &&
      metrics.disk >= NODE_REQUIREMENTS.STORAGE
    );

    // 4. Send to server with retry
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await api.post(SYNC_ENDPOINT, {
          nodeId,
          nodeMetrics: metrics,
          nodeStatus: isActive ? 'Active' : 'InActive'
        });

        if (response.data?.success) {
          const nextSyncIn = Math.round(getNextSyncInterval()/1000);
          log(`Sync successful. Next sync in ${nextSyncIn} seconds`);
          if (response.data.miningToken) {
            saveToken(response.data.miningToken);
          }
          return true;
        } else {
          throw new Error(response.data?.error || 'Unknown server error');
        }
      } catch (err) {
        if (attempt === 3) throw err;
        const delay = 5000 * attempt; // Exponential backoff
        log(`Attempt ${attempt} failed (${err.message}), retrying in ${delay/1000}s...`, 'warn');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      log(`Server error (${status}): ${data?.error || 'No error details'}`, 'error');
    } else {
      log(`Sync failed: ${err.message}`, 'error');
    }
    return false;
  }
};

// Optimized service starter
const startService = () => {
  log('Starting Netrum Node Sync with 50-60 second interval');
  
  let activeSync = false;
  let nextSyncTimer = null;

  const scheduleNextSync = () => {
    const interval = getNextSyncInterval();
    nextSyncTimer = setTimeout(executeSync, interval);
    log(`Next sync scheduled in ${Math.round(interval/1000)} seconds`);
  };

  const executeSync = async () => {
    if (activeSync) {
      log('Sync already in progress', 'warn');
      return;
    }

    activeSync = true;
    try {
      await syncNode();
    } catch (err) {
      log(`Unhandled sync error: ${err.message}`, 'error');
    } finally {
      activeSync = false;
      scheduleNextSync();
    }
  };

  // Initial sync
  executeSync();

  // Cleanup handlers
  process.on('SIGTERM', () => {
    if (nextSyncTimer) clearTimeout(nextSyncTimer);
    log('Service shutting down gracefully');
    process.exit(0);
  });

  process.on('uncaughtException', (err) => {
    log(`Critical error: ${err.message}`, 'fatal');
    process.exit(1);
  });
};

startService();
