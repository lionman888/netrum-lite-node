#!/usr/bin/env node
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/* ---------- Configuration ---------- */
const API_URL = 'https://api.netrumlabs.com/api/node/mining/start-mining/';
const RPC_URL = 'https://mainnet.base.org';
const CHAIN_ID = 8453;
const RETRY_INTERVAL = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const TX_TIMEOUT = 120000;

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
  const miningInterface = new ethers.Interface([
    "function getLiveMiningInfo(address) view returns (uint256, uint256, uint256, uint256, bool)"
  ]);
  
  try {
    const miningInfoData = miningInterface.encodeFunctionData("getLiveMiningInfo", [address]);
    const result = await provider.call({
      to: '0x9b2C3a94e3cdF56B4d2E7B2863926D573095134d',
      data: miningInfoData
    });
    return miningInterface.decodeFunctionResult("getLiveMiningInfo", result)[4];
  } catch (err) {
    console.error('Mining status check failed:', err);
    return false;
  }
}

/* ---------- Transaction Handling ---------- */
async function sendMiningTransaction(signer, txData) {
  try {
    // Get current gas price
    const feeData = await signer.provider.getFeeData();
    
    const txResponse = await signer.sendTransaction({
      ...txData,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      chainId: CHAIN_ID
    });
    
    console.log(`📤 Transaction sent: ${txResponse.hash}`);
    
    // Wait for confirmation with timeout
    const receipt = await Promise.race([
      txResponse.wait(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout')), TX_TIMEOUT)
      )
    ]);
    
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    return receipt;
  } catch (err) {
    if (err.message === 'Transaction timeout') {
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
  try {
    isMiningActive = await checkMiningStatus(address, provider);
    if (isMiningActive) {
      console.log('✅ Mining already active. No action needed.');
      return;
    }

    // Call API to get transaction data
    console.log('📡 Contacting mining API...');
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeAddress: address })
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    
    if (data.status === 'already_mining') {
      isMiningActive = true;
      console.log('✅ Mining already active');
      return;
    }

    if (data.status === 'ready_to_mine' && data.txData) {
      const signer = new ethers.Wallet(privateKey, provider);
      const receipt = await sendMiningTransaction(signer, data.txData);
      
      console.log('\n--- Mining Started Successfully ---');
      console.log(`🔗 TX: https://basescan.org/tx/${receipt.hash}`);
      console.log(`🖥️ Node: ${shortAddress}`);
      console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
      
      isMiningActive = true;
      return;
    }

    console.log('ℹ️ API response:', data.message || 'No action needed');
  } catch (err) {
    console.error(`Attempt ${attempts} failed:`, err.message);
  }

  // Schedule next attempt if mining not active
  if (!isMiningActive) {
    console.log(`🔄 Retrying in ${RETRY_INTERVAL/60000} minutes...`);
    setTimeout(tryStartMining, RETRY_INTERVAL);
  }
}

/* ---------- Start the Process ---------- */
tryStartMining();
