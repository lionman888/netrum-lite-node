#!/usr/bin/env node
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/* ---------- Configuration ---------- */
const API_URL = 'https://api.netrumlabs.com/api/node/mining/start-mining/';
const RPC_URL = 'https://mainnet.base.org';
const CHAIN_ID = 8453;
const RETRY_DELAY = 30_000; // 30 seconds between attempts
const MAX_ATTEMPTS = 5;

/* ---------- Wallet Setup ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyFile = path.resolve(__dirname, '../../wallet/key.txt');

async function loadWallet() {
  try {
    const data = await fs.readFile(keyFile, 'utf-8');
    const { privateKey, address } = JSON.parse(data);
    
    if (!address || !privateKey) {
      throw new Error('Wallet file missing required data');
    }
    
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format in wallet file');
    }
    
    return { 
      address: ethers.getAddress(address),
      privateKey: privateKey.replace(/^0x/, '') 
    };
  } catch (err) {
    throw new Error(`Failed to load wallet: ${err.message}`);
  }
}

/* ---------- Mining Process ---------- */
async function tryStartMining(attempt = 1) {
  try {
    const { address, privateKey } = await loadWallet();
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    console.log(`\nAttempt ${attempt}/${MAX_ATTEMPTS} for ${shortAddress}`);

    // Call API
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

    if (data.status === 'already_mining') {
      console.log('✅ Mining already active');
      return;
    }

    if (data.status === 'ready_to_mine' && data.txData) {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = new ethers.Wallet(privateKey, provider);
      
      // Get current gas prices
      const feeData = await provider.getFeeData();
      
      const txResponse = await signer.sendTransaction({
        ...data.txData,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        chainId: CHAIN_ID
      });
      
      console.log(`📤 Transaction sent: https://basescan.org/tx/${txResponse.hash}`);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await txResponse.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      return;
    }

    console.log('ℹ️ API response:', data.message || 'No action needed');

  } catch (err) {
    console.error(`Attempt ${attempt} failed:`, err.message);
    
    if (attempt >= MAX_ATTEMPTS) {
      console.log('❌ Maximum attempts reached');
      process.exit(1);
    }
    
    console.log(`🔄 Retrying in ${RETRY_DELAY/1000} seconds...`);
    setTimeout(() => tryStartMining(attempt + 1), RETRY_DELAY);
  }
}

// Start the process
tryStartMining();
