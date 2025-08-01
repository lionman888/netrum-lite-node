#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import os from 'os';
import diskusage from 'diskusage';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Updated Configuration with strict 60-second sync interval
const API_BASE_URL = 'https://api.v2.netrumlabs.com';
const SYNC_ENDPOINT = '/api/node/metrics/sync/';
const SYNC_INTERVAL = 60000; // Strict 60 seconds (1 minute)
const TOKEN_PATH = path.resolve(__dirname, '../mining/miningtoken.txt');

// Minimum system requirements
const NODE_REQUIREMENTS = { 
  RAM: 4,    // in GB
  CORES: 2,  // minimum cores
  STORAGE: 50 // in GB
};

// Configure axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // 20 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Track last sync time to prevent early requests
let lastSyncTime = 0;
const SYNC_COOLDOWN = 60000; // 60 seconds cooldown

// Enhanced logging
const log = (msg, type = 'info') => {
  const prefix = `[${new Date().toISOString()}] [${type.toUpperCase()}]`;
  console.error(`${prefix} ${msg}`);
};

// System metrics collection
const getSystemMetrics = () => {
  try {
    return {
      cpu: os.cpus().length,
      ram: Math.round(os.totalmem() / (1024 ** 2)), // MB
      disk: Math.round(diskusage.checkSync('/').free / (1024 ** 3)), // GB
      speed: 5, // Default Mbps
      lastSeen: Math.floor(Date.now() / 1000)
    };
  } catch (err) {
    log(`Metrics error: ${err.message}`, 'error');
    return null;
  }
};

// Token saving
const saveToken = (token) => {
  try {
    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    fs.writeFileSync(TOKEN_PATH, token);
    log('Mining token saved');
  } catch (err) {
    log(`Token save failed: ${err.message}`, 'error');
  }
};

// Node ID reading
const readNodeId = () => {
  const idPath = '/root/netrum-lite-node/src/identity/node-id/id.txt';
  try {
    return fs.readFileSync(idPath, 'utf8').trim();
  } catch (err) {
    log(`Node ID read failed: ${err.message}`, 'error');
    return null;
  }
};

// Sync function with strict timing enforcement
const syncNode = async () => {
  const now = Date.now();
  const timeSinceLastSync = now - lastSyncTime;

  // Enforce 60-second cooldown
  if (timeSinceLastSync < SYNC_COOLDOWN) {
    const remaining = Math.ceil((SYNC_COOLDOWN - timeSinceLastSync)/1000);
    log(`Sync too soon. Waiting ${remaining} more seconds...`, 'warn');
    return;
  }

  try {
    const nodeId = readNodeId();
    if (!nodeId) throw new Error('Empty node ID');

    const metrics = getSystemMetrics();
    if (!metrics) throw new Error('Failed to get metrics');

    const isActive = (
      metrics.cpu >= NODE_REQUIREMENTS.CORES &&
      metrics.ram >= NODE_REQUIREMENTS.RAM * 1024 &&
      metrics.disk >= NODE_REQUIREMENTS.STORAGE
    );

    const response = await api.post(SYNC_ENDPOINT, {
      nodeId,
      nodeMetrics: metrics,
      nodeStatus: isActive ? 'Active' : 'InActive'
    });

    if (response.data?.success) {
      lastSyncTime = Date.now(); // Update last sync time
      log('Sync successful. Next sync in 60 seconds');
      if (response.data.miningToken) {
        saveToken(response.data.miningToken);
      }
    } else {
      throw new Error(response.data?.error || 'Unknown server error');
    }
  } catch (err) {
    if (err.response) {
      log(`Server error (${err.response.status}): ${err.response.data?.error || 'No details'}`, 'error');
    } else {
      log(`Sync failed: ${err.message}`, 'error');
    }
  }
};

// Service management
const startService = () => {
  log('Starting Netrum Node Sync with strict 60-second interval');
  
  // Initial sync
  syncNode();
  
  // Regular sync every 60 seconds
  const intervalId = setInterval(syncNode, SYNC_INTERVAL);

  // Cleanup handlers
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
