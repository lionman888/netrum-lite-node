#!/usr/bin/env node
import { ethers } from 'ethers';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Configuration
const API_URL = 'https://api.v2.netrumlabs.com/api/node/mining/claim/';
const RPC_URL = 'https://mainnet.base.org';
const CHAIN_ID = 8453;

// Get paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyFile = path.resolve(__dirname, '../../wallet/key.txt');
const logFile = path.resolve(__dirname, '../../logs/auto-claim.log');

// Ensure logs directory exists
const logDir = path.dirname(logFile);
try {
  await fs.mkdir(logDir, { recursive: true });
} catch (err) {
  // Directory might already exist
}

async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  await fs.appendFile(logFile, logMessage);
}

async function main() {
  try {
    log('🤖 Starting automatic claim process...');
    
    // Load wallet
    const { address, privateKey } = await loadWallet();
    log(`💰 Wallet Address: ${address}`);

    // Check claim eligibility
    const { canClaim, claimData, message } = await checkClaimEligibility(address);
    
    if (!canClaim) {
      log(`⏳ ${message}`);
      return;
    }

    // Display claim info
    const claimableTokens = ethers.formatUnits(claimData.minedTokens, 18);
    const requiredFee = ethers.formatUnits(claimData.feeWei, 18);
    log(`🎯 Claimable Tokens: ${claimableTokens} NPT`);
    log(`⛽ Required Fee: ${requiredFee} ETH`);

    // Check balance
    const balance = await getBalance(address);
    const balanceEth = ethers.formatUnits(balance, 18);
    log(`💳 Wallet Balance: ${balanceEth} ETH`);

    if (balance < BigInt(claimData.feeWei)) {
      const needed = BigInt(claimData.feeWei) - balance;
      const neededEth = ethers.formatUnits(needed, 18);
      log(`❌ Insufficient funds. Need ${neededEth} more ETH`);
      return;
    }

    // Auto-claim without confirmation
    log('🚀 Proceeding with automatic claim...');
    await sendClaimTransaction(privateKey, claimData);

  } catch (err) {
    log(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

async function loadWallet() {
  const data = JSON.parse(await fs.readFile(keyFile, 'utf-8'));
  const privateKey = data.privateKey?.replace('0x', '');
  const address = data.address?.trim();
  if (!privateKey || !address) throw new Error('Invalid wallet file');
  return { address, privateKey };
}

async function checkClaimEligibility(address) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeAddress: address })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API request failed');
  return data;
}

async function getBalance(address) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return provider.getBalance(address);
}

async function sendClaimTransaction(privateKey, claimData) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);
  
  log('✍️ Signing transaction...');
  const tx = await signer.sendTransaction({
    to: claimData.txData.to,
    data: claimData.txData.data,
    value: claimData.feeWei,
    gasLimit: claimData.txData.gasLimit,
    chainId: CHAIN_ID
  });
  
  log(`✅ Transaction sent: https://basescan.org/tx/${tx.hash}`);
  log('⏳ Waiting for confirmation...');
  
  await tx.wait();
  log('🎉 Tokens successfully claimed!');
}

main();
