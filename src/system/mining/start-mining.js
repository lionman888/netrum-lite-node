#!/usr/bin/env node
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const API_URL = 'https://api.netrumlabs.com/api/node/mining/setup/';
const RPC_URL = 'https://mainnet.base.org';
const CHAIN_ID = 8453;

async function loadWallet() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const keyFile = path.resolve(__dirname, '../../wallet/key.txt');
  const { address, privateKey } = JSON.parse(await fs.readFile(keyFile, 'utf-8'));
  return { address, privateKey };
}

async function startMining() {
  try {
    const { address, privateKey } = await loadWallet();
    
    // Step 1: Call API to start mining
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nodeAddress: address,
        action: 'start'
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to start mining');
    }

    if (data.isActive) {
      console.log('✅ Mining already active');
      return;
    }

    // Step 2: Send transaction
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    
    const txResponse = await signer.sendTransaction({
      to: data.txData.to,
      data: data.txData.data,
      value: data.txData.value,
      gasLimit: data.txData.gasLimit,
      chainId: CHAIN_ID
    });

    console.log(`📤 Transaction sent: https://basescan.org/tx/${txResponse.hash}`);
    
    const receipt = await txResponse.wait();
    console.log(`✅ Mining started successfully in block ${receipt.blockNumber}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

startMining();
