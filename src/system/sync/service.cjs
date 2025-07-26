#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import os from 'os';
import diskusage from 'diskusage';

// Configuration
const API_BASE_URL = 'https://api.netrumlabs.com';
const SYNC_ENDPOINT = '/api/node/metrics/sync';
const SYNC_INTERVAL = 5000;
const TOKEN_PATH = path.resolve(__dirname, '../mining/miningtoken.txt');

// Configure axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Helper functions
const log = (msg) => console.error(`[${new Date().toISOString()}] ${msg}`);

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
    log(`Metrics error: ${err.message}`);
    return null;
  }
};

const saveToken = (token) => {
  try {
    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    fs.writeFileSync(TOKEN_PATH, token);
    log('Mining token saved');
  } catch (err) {
    log(`Token save failed: ${err.message}`);
  }
};

const syncNode = async () => {
  try {
    // 1. Get node ID
    const nodeId = fs.readFileSync(
      '/root/netrum-lite-node/src/identity/node-id/id.txt', 
      'utf8'
    ).trim();

    // 2. Get system metrics
    const metrics = getSystemMetrics();
    if (!metrics) throw new Error('Failed to get metrics');

    // 3. Determine node status
    const isActive = (
      metrics.cpu >= NODE_REQUIREMENTS.CORES &&
      metrics.ram >= NODE_REQUIREMENTS.RAM * 1024 &&
      metrics.disk >= NODE_REQUIREMENTS.STORAGE
    );

    // 4. Send to server
    const response = await api.post(SYNC_ENDPOINT, {
      nodeId,
      nodeMetrics: metrics,
      nodeStatus: isActive ? 'Active' : 'InActive'
    });

    // 5. Handle response
    if (response.data?.success) {
      log(response.data.log || 'Sync successful');
      if (response.data.miningToken) {
        saveToken(response.data.miningToken);
      }
    }

  } catch (err) {
    if (err.response) {
      log(`Server error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
    } else {
      log(`Sync failed: ${err.message}`);
    }
  }
};

// Start service
log('Starting Netrum Node Sync');
syncNode();
setInterval(syncNode, SYNC_INTERVAL);
