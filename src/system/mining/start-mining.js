#!/usr/bin/env node
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/* ---------- Configuration ---------- */
const API_URL = 'https://api.netrumlabs.com/api/node/mining/start-mining/';
const RPC_URL = 'https://mainnet.base.org';
const CHAIN_ID = 8453; // Base Mainnet
const RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutes between attempts
const MAX_ATTEMPTS = 10; // Maximum 10 attempts
const TX_TIMEOUT = 120000; // 2 minutes for transaction confirmation

/* ---------- State Management ---------- */
let isMiningActive = false;
let attempts = 0;

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

/* ---------- Mining Status Check ---------- */
async function checkMiningStatus(address, provider) {
  const miningContract = new ethers.Contract(
    '0x9b2C3a94e3cdF56B4d2E7B2863926D573095134d',
    [
      "function getLiveMiningInfo(address) view returns (uint256, uint256, uint256, uint256, bool)"
    ],
    provider
  );
  
  try {
    const miningInfo = await miningContract.getLiveMiningInfo(address);
    return miningInfo[4]; // isActive status (5th return value)
  } catch (err) {
    console.error('Mining status check failed:', err);
    return false;
  }
}

/* ---------- Transaction Handling ---------- */
async function sendMiningTransaction(signer, txData) {
  try {
    // Estimate gas with buffer
    const gasEstimate = await signer.estimateGas({
      ...txData,
      from: signer.address
    });
    const gasLimit = Math.floor(gasEstimate * 1.2);

    console.log(`⛽ Gas estimate: ${gasEstimate.toString()} (using ${gasLimit} with buffer)`);
    
    const txResponse = await signer.sendTransaction({
      ...txData,
      gasLimit,
      chainId: CHAIN_ID
    });
    
    console.log(`📤 Transaction sent: ${txResponse.hash}`);
    
    // Wait for confirmation
    const receipt = await txResponse.wait(TX_TIMEOUT);
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    return receipt;
  } catch (err) {
    if (err.code === 'TIMEOUT') {
      console.log('⚠️ Transaction confirmation timeout - check explorer later');
      return { hash: txResponse.hash, status: 'pending' };
    }
    throw err;
  }
}

/* ---------- Main Mining Process ---------- */
async function tryStartMining() {
  attempts++;
  if (attempts > MAX_ATTEMPTS) {
    console.log('❌ Maximum attempts reached. Stopping...');
    return;
  }

  const { address, privateKey } = await loadWallet();
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  console.log(`\nAttempt ${attempts}/${MAX_ATTEMPTS} for ${shortAddress}`);

  // First check current mining status
  isMiningActive = await checkMiningStatus(address, provider);
  if (isMiningActive) {
    console.log('✅ Mining already active. No action needed.');
    return;
  }

  try {
    // Call API to get transaction data
    console.log('📡 Contacting mining API...');
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeAddress: address })
    }).then(r => r.json());

    if (!res.success) {
      throw new Error(res.error || 'API returned unsuccessful response');
    }

    // Handle different API responses
    switch (res.status) {
      case 'already_mining':
        console.log('✅ Mining already active');
        isMiningActive = true;
        return;

      case 'ready_to_mine':
        if (!res.txData) {
          throw new Error('API returned ready_to_mine but no transaction data');
        }
        
        // Send mining transaction
        const signer = new ethers.Wallet(privateKey, provider);
        const receipt = await sendMiningTransaction(signer, res.txData);
        
        console.log('\n--- Mining Started Successfully ---');
        console.log(`🔗 TX: https://basescan.org/tx/${receipt.hash}`);
        console.log(`🖥️ Node: ${shortAddress}`);
        console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
        
        isMiningActive = true;
        return;

      default:
        console.log('ℹ️ API response:', res.message || 'No action needed');
    }

  } catch (err) {
    console.error(`Attempt ${attempts} failed:`, err.message);
    
    // Schedule next attempt if mining not active
    if (!isMiningActive) {
      console.log(`🔄 Retrying in ${RETRY_INTERVAL/60000} minutes...`);
      setTimeout(tryStartMining, RETRY_INTERVAL);
    }
  }
}

/* ---------- Start the Process ---------- */
tryStartMining();
