#!/bin/bash

# 🚀 VPS一键部署Netrum Lite Node Enhanced
# 在VPS上运行此脚本

echo "🚀 开始VPS部署Netrum Lite Node Enhanced..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root用户运行此脚本${NC}"
    echo "使用: sudo bash vps-deploy.sh"
    exit 1
fi

# 步骤1: 系统更新
echo -e "${BLUE}📦 步骤1: 更新系统...${NC}"
apt update && apt upgrade -y
apt install -y curl bc jq speedtest-cli nodejs npm git htop

# 步骤2: 升级Node.js到v20
echo -e "${BLUE}📦 步骤2: 升级Node.js到v20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 步骤3: 克隆仓库
echo -e "${BLUE}📦 步骤3: 克隆增强版仓库...${NC}"
git clone https://github.com/lionman888/netrum-lite-node-enhanced.git
cd netrum-lite-node-enhanced

# 步骤4: 安装依赖
echo -e "${BLUE}📦 步骤4: 安装项目依赖...${NC}"
npm install
npm link

# 步骤5: 系统检查
echo -e "${BLUE}📦 步骤5: 运行系统检查...${NC}"
netrum-system

# 步骤6: 设置自动领取
echo -e "${BLUE}📦 步骤6: 设置自动领取功能...${NC}"
chmod +x scripts/setup-auto-claim.sh
./scripts/setup-auto-claim.sh

echo -e "${GREEN}✅ VPS部署完成！${NC}"
echo ""
echo -e "${YELLOW}📋 接下来需要手动完成的步骤：${NC}"
echo "1. 设置钱包: netrum-new-wallet 或 netrum-import-wallet"
echo "2. 检查Base域名: netrum-check-basename"
echo "3. 获取Base测试网ETH"
echo "4. 注册节点: netrum-node-register"
echo "5. 开始同步: netrum-sync"
echo "6. 开始挖矿: netrum-mining"
echo ""
echo -e "${GREEN}🎉 VPS部署完成！开始设置你的Netrum节点吧！${NC}"
