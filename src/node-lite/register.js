#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import gradient from 'gradient-string';
import figlet from 'figlet';

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to the CLI script location
function resolvePath(relativePath) {
  return path.resolve(__dirname, relativePath);
}

// Orange theme configuration
const orange = chalk.hex('#FFA500');
const darkOrange = chalk.hex('#FF8C00');
const orangeGradient = gradient('orange', 'darkorange');
const successGreen = chalk.green.bold;
const errorRed = chalk.red.bold;

// Custom orange spinner
const orangeSpinner = {
  interval: 80,
  frames: ["🟠 ", "🟡 ", "🟠 ", "🟡 "]
};

function showHeader() {
  console.clear();
  console.log(
    orangeGradient(
      figlet.textSync('Netrum Node', { horizontalLayout: 'full' })
    )
  );
  console.log(
    boxen(orange.bold('🔶 Node Registration Portal'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow'
    })
  );
}

async function executeStep(stepName, command, args = [], cwd = __dirname) {
  const spinner = ora({
    text: orange(`Running ${stepName}...`),
    spinner: orangeSpinner
  }).start();

  try {
    const child = spawn(command, args, { 
      shell: true,
      cwd: path.dirname(resolvePath(cwd))
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    const exitCode = await new Promise((resolve) => {
      child.on('close', (code) => resolve(code));
    });

    if (exitCode === 0) {
      spinner.succeed(successGreen(`${stepName} completed successfully`));
      console.log(boxen(output.trim(), { padding: 1, borderColor: 'green' }));
      return true;
    } else {
      spinner.fail(errorRed(`${stepName} failed`));
      console.log(boxen(errorOutput.trim() || output.trim(), {
        padding: 1,
        borderColor: 'red',
        backgroundColor: '#300'
      }));
      return false;
    }
  } catch (error) {
    spinner.fail(errorRed(`${stepName} error`));
    console.log(boxen(error.message, {
      padding: 1,
      borderColor: 'red',
      backgroundColor: '#300'
    }));
    return false;
  }
}

async function registerNode() {
  showHeader();
  let NODE_WALLET, NODE_ID;

  try {
    // Step 1: Wallet initialization
    console.log(orange.bold('\n🔶 Step 1: Wallet Initialization'));
    const walletSpinner = ora(orange('Reading wallet information...')).start();
    
    try {
      const WALLET_FILE = resolvePath('../wallet/key.txt');
      if (fs.existsSync(WALLET_FILE)) {
        const content = fs.readFileSync(WALLET_FILE, 'utf8');
        NODE_WALLET = content.includes('address')
          ? JSON.parse(content).address
          : (await import('ethers')).Wallet.createRandom().address;
        
        const NODE_ID_FILE = resolvePath('../identity/node-id/id.txt');
        NODE_ID = fs.readFileSync(NODE_ID_FILE, 'utf8');
        walletSpinner.succeed(darkOrange.bold(`Wallet: ${orange.bold(NODE_WALLET)}`));
      } else {
        throw new Error('Wallet file not found at ' + WALLET_FILE);
      }
    } catch (error) {
      walletSpinner.fail(errorRed('Wallet read failed'));
      console.log(boxen(error.message, { padding: 1, borderColor: 'red' }));
      process.exit(1);
    }

    // Step 2: Network connection
    console.log(orange.bold('\n🔶 Step 2: Network Connection'));
    if (!await executeStep('Network Connect', 'node', [resolvePath('../system/animation/connecting.js')])) {
      process.exit(1);
    }

    // Step 3: Contract registration
    console.log(orange.bold('\n🔶 Step 3: Contract Registration'));
    if (!await executeStep('Contract Register', 'node', [resolvePath('../contracts/lite-register.js')])) {
      process.exit(1);
    }

    // Step 4: Network connection
    console.log(orange.bold('\n🔶 Step 4: Server Connection'));
    if (!await executeStep('Server Connect', 'node', [resolvePath('../system/animation/connecting.js')])) {
      process.exit(1);
    }

    // Step 5: Server registration
    console.log(orange.bold('\n🔶 Step 5: Server Registration'));
    if (!await executeStep('Server Register', 'node', [resolvePath('../server/api-register.js')])) {
      process.exit(1);
    }
    
    // Final success message
    console.log(
      boxen(
        orangeGradient('✅ Node Registration Complete!'),
        { padding: 1, borderColor: 'yellow' }
      )
    );
    console.log(orange.bold('\nNode Registration Details:'));
    console.log(orange(`🔹 Wallet: ${darkOrange.bold(NODE_WALLET)}`));
    console.log(orange(`🔹 Node ID: ${darkOrange.bold(NODE_ID)}\n`));

    // Step 6: Server Response
    console.log(orange.bold('\n🔶 Step 6: Server Response'));
    if (!await executeStep('Server Response', 'node', [resolvePath('../system/animation/connecting.js')])) {
      process.exit(1);
    }

    // Step 7: Display registration data
    console.log(orange.bold('\n🔶 Registration Response Data:'));
    try {
      const REGISTER_DATA_FILE = resolvePath('./data.txt');
      if (fs.existsSync(REGISTER_DATA_FILE)) {
        const rawData = fs.readFileSync(REGISTER_DATA_FILE, 'utf8');
        const data = JSON.parse(rawData);
        
        // Format and display the data beautifully
        console.log(boxen(
          `🔹 Node ID: ${darkOrange(data.data.nodeId)}\n` +
          `🔹 Wallet: ${darkOrange(data.data.wallet)}\n` +
          `🔹 Signature: ${darkOrange(data.data.signature)}\n` +
          `🔹 TX Hash: ${darkOrange(data.data.txHash)}`,
          {
            padding: 1,
            borderColor: 'yellow',
            margin: 1
          }
        ));
      } else {
        console.log(boxen(
          '⚠️ Registration data file not found',
          { padding: 1, borderColor: 'yellow' }
        ));
      }
    } catch (error) {
      console.log(boxen(
        `⚠️ Error loading registration data: ${error.message}`,
        { padding: 1, borderColor: 'red' }
      ));
    }

  } catch (error) {
    console.error(errorRed('\n❌ Critical Registration Error:'));
    console.log(boxen(error.message, { padding: 1, borderColor: 'red' }));
    process.exit(1);
  }
}

registerNode();