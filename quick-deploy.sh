#!/bin/bash

# 🚀 Netrum Lite Node Enhanced - 快速部署脚本
# 适用于Ubuntu 22.04 LTS

echo "🚀 开始部署Netrum Lite Node Enhanced..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root用户运行此脚本${NC}"
    echo "使用: sudo bash quick-deploy.sh"
    exit 1
fi

# 步骤1: 系统更新
echo -e "${BLUE}📦 步骤1: 更新系统...${NC}"
apt update && apt upgrade -y

# 步骤2: 安装基础依赖
echo -e "${BLUE}📦 步骤2: 安装基础依赖...${NC}"
apt install -y curl bc jq speedtest-cli nodejs npm git htop

# 步骤3: 检查Node.js版本
echo -e "${BLUE}📦 步骤3: 检查Node.js版本...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js版本过低，正在升级到v20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# 步骤4: 克隆仓库
echo -e "${BLUE}📦 步骤4: 克隆增强版仓库...${NC}"
if [ -d "netrum-lite-node" ]; then
    echo -e "${YELLOW}⚠️  目录已存在，正在更新...${NC}"
    cd netrum-lite-node
    git pull
else
    git clone https://github.com/lionman888/netrum-lite-node-enhanced.git netrum-lite-node
    cd netrum-lite-node
fi

# 步骤5: 安装依赖
echo -e "${BLUE}📦 步骤5: 安装项目依赖...${NC}"
npm install
npm link

# 步骤6: 系统检查
echo -e "${BLUE}📦 步骤6: 运行系统检查...${NC}"
netrum-system

echo -e "${GREEN}✅ 基础部署完成！${NC}"
echo ""
echo -e "${YELLOW}📋 接下来需要手动完成的步骤：${NC}"
echo "1. 设置钱包: netrum-new-wallet 或 netrum-import-wallet"
echo "2. 检查Base域名: netrum-check-basename"
echo "3. 获取Base测试网ETH"
echo "4. 注册节点: netrum-node-register"
echo "5. 开始同步: netrum-sync"
echo "6. 开始挖矿: netrum-mining"
echo "7. 设置自动领取: ./scripts/setup-auto-claim.sh"
echo ""
echo -e "${GREEN}🎉 部署脚本执行完成！${NC}"
