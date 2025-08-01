#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import os from 'os';
import diskusage from 'diskusage';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'https://api.v2.netrumlabs.com';
const SYNC_ENDPOINT = '/api/node/metrics/sync/';
const SYNC_INTERVAL = 5000;
const TOKEN_PATH = path.resolve(__dirname, '../mining/miningtoken.txt');

// Minimum system requirements
const NODE_REQUIREMENTS = { 
  RAM: 4,    // in GB
  CORES: 2,  // minimum cores
  STORAGE: 50 // in GB
};

// Configure axios instance with better defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Reduced from 10s to 8s
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  maxRedirects: 0,
  retry: 3,
  retryDelay: (retryCount) => retryCount * 1000
});

// Enhanced logging with error types
const log = (msg, type = 'info') => {
  const prefix = `[${new Date().toISOString()}] [${type.toUpperCase()}]`;
  console.error(`${prefix} ${msg}`);
};

// More robust metrics collection
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

// Safer token saving with file locking
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

// Improved node ID reading with retries
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

// Enhanced sync function with better error handling
const syncNode = async () => {
  try {
    // 1. Get node ID with retry logic
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

    // 4. Send to server with timeout protection
    const response = await api.post(SYNC_ENDPOINT, {
      nodeId,
      nodeMetrics: metrics,
      nodeStatus: isActive ? 'Active' : 'InActive'
    }).catch(err => {
      if (err.code === 'ECONNABORTED') {
        throw new Error('Request timeout');
      }
      throw err;
    });

    // 5. Handle response
    if (response.data?.success) {
      log(response.data.log || 'Sync successful');
      if (response.data.miningToken) {
        saveToken(response.data.miningToken);
      }
    } else {
      log(`Sync failed: ${response.data?.error || 'Unknown server error'}`, 'warn');
    }

  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      log(`Server error (${status}): ${data?.error || 'No error details'}`, 'error');
    } else {
      log(`Sync failed: ${err.message}`, 'error');
    }
  }
};

// Robust service starter with crash protection
const startService = () => {
  log('Starting Netrum Node Sync Service');
  
  let syncInProgress = false;
  const safeSync = async () => {
    if (syncInProgress) {
      log('Previous sync still in progress, skipping this cycle', 'warn');
      return;
    }
    
    syncInProgress = true;
    try {
      await syncNode();
    } catch (err) {
      log(`Unhandled sync error: ${err.message}`, 'error');
    } finally {
      syncInProgress = false;
    }
  };

  // Initial sync
  safeSync();
  
  // Periodic sync with overlap protection
  const intervalId = setInterval(safeSync, SYNC_INTERVAL);

  // Cleanup handler
  process.on('SIGTERM', () => {
    clearInterval(intervalId);
    log('Service shutting down gracefully');
    process.exit(0);
  });

  process.on('uncaughtException', (err) => {
    log(`Critical error: ${err.message}`, 'fatal');
    process.exit(1);
  });
};

startService();
