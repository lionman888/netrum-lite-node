#!/usr/bin/env node

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import process from "process";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const pkgPath    = path.resolve(__dirname, "..", "package.json");
const pkg        = JSON.parse(readFileSync(pkgPath, "utf8"));

const version = pkg.version ?? "1.0.0";
console.log(`\n${chalk.bold.magenta("Netrum CLI")}  ${chalk.gray("Version")} v${version}`);
console.log(`${chalk.cyan("Light-weight node & wallet toolkit for the Netrum network.")}\n`);

const binCommands = pkg.bin ?? {};
const entries     = Object.entries(binCommands).filter(([cmd]) => cmd !== "netrum");

if (!entries.length) {
  console.error("❌  No CLI commands found in package.json → bin");
  process.exit(1);
}

const pad = Math.max(...entries.map(([cmd]) => cmd.length)) + 2;

const descriptionMap = {
  "netrum-update":        "Cli Update",
  "netrum-system":        "System status & logs",
  "netrum-new-wallet":    "Create / new a wallet",
  "netrum-import-wallet": "Create / import a wallet",
  "netrum-wallet":        "Create / inspect a wallet",
  "netrum-wallet-key":    "Export private key",
  "netrum-wallet-remove": "Delete wallet files",
  "netrum-check-basename":"Check basename conflicts",
  "netrum-node-id":       "Show current Node ID",
  "netrum-node-id-remove":"Clear Node ID",
  "netrum-node-sign":     "Sign a message with node key",
  "netrum-node-register": "Register node on-chain",
  "netrum-sync":          "Sync blockchain data",
  "netrum-sync-log":      "Node sync logs",
  "netrum-mining":        "Start mining",
  "netrum-mining-log":    "Node mining logs",
  "netrum-claim":         "Claim rewards",
};

console.log(chalk.bold("Available Commands:\n"));
for (const [cmd, script] of entries) {
  const desc = descriptionMap[cmd] ?? path.basename(script);
  console.log(`  ${chalk.green(cmd.padEnd(pad))}${desc}`);
}

console.log(`\nRun ${chalk.yellow("netrum <command> --help")} for command-specific options.\n`);
