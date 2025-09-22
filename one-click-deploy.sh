#!/bin/bash

# 🚀 Netrum Lite Node Enhanced - 一键部署脚本
# 完全自动化部署，包含所有步骤

echo "🚀 开始一键部署Netrum Lite Node Enhanced..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root用户运行此脚本${NC}"
    echo "使用: sudo bash one-click-deploy.sh"
    exit 1
fi

# 函数：打印步骤
print_step() {
    echo -e "${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 步骤1: 系统更新
print_step "步骤1: 更新系统..."
apt update && apt upgrade -y
print_success "系统更新完成"

# 步骤2: 安装基础依赖
print_step "步骤2: 安装基础依赖..."
apt install -y curl bc jq speedtest-cli nodejs npm git htop iotop
print_success "基础依赖安装完成"

# 步骤3: 升级Node.js到v20
print_step "步骤3: 升级Node.js到v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
print_success "Node.js v20安装完成"

# 步骤4: 克隆仓库
print_step "步骤4: 克隆增强版仓库..."
if [ -d "netrum-lite-node-enhanced" ]; then
    print_warning "目录已存在，正在更新..."
    cd netrum-lite-node-enhanced
    git pull
else
    git clone https://github.com/lionman888/netrum-lite-node-enhanced.git
    cd netrum-lite-node-enhanced
fi
print_success "仓库克隆完成"

# 步骤5: 安装依赖
print_step "步骤5: 安装项目依赖..."
npm install
npm link
print_success "项目依赖安装完成"

# 步骤6: 系统检查
print_step "步骤6: 运行系统检查..."
netrum-system
print_success "系统检查完成"

# 步骤7: 设置自动领取
print_step "步骤7: 设置自动领取功能..."
chmod +x scripts/setup-auto-claim.sh
./scripts/setup-auto-claim.sh
print_success "自动领取设置完成"

# 步骤8: 创建管理脚本
print_step "步骤8: 创建管理脚本..."
cat > /usr/local/bin/netrum-manage << 'EOF'
#!/bin/bash
# Netrum管理脚本

case "$1" in
    "status")
        echo "📊 Netrum节点状态:"
        sudo systemctl status netrum-node --no-pager
        echo ""
        echo "🤖 自动领取状态:"
        sudo systemctl status netrum-auto-claim.timer --no-pager
        ;;
    "logs")
        echo "📋 查看日志:"
        echo "1. 同步日志: netrum-sync-log"
        echo "2. 挖矿日志: netrum-mining-log"
        echo "3. 自动领取日志: tail -f src/logs/auto-claim.log"
        echo "4. 系统日志: sudo journalctl -u netrum-auto-claim.service -f"
        ;;
    "restart")
        echo "🔄 重启服务..."
        sudo systemctl restart netrum-node
        sudo systemctl restart netrum-auto-claim.timer
        echo "✅ 服务重启完成"
        ;;
    "claim")
        echo "💰 手动领取奖励..."
        netrum-auto-claim
        ;;
    "wallet")
        echo "💳 钱包信息:"
        netrum-wallet
        ;;
    *)
        echo "📋 Netrum管理命令:"
        echo "  netrum-manage status   - 查看服务状态"
        echo "  netrum-manage logs     - 查看日志信息"
        echo "  netrum-manage restart  - 重启服务"
        echo "  netrum-manage claim    - 手动领取奖励"
        echo "  netrum-manage wallet   - 查看钱包信息"
        ;;
esac
EOF

chmod +x /usr/local/bin/netrum-manage
print_success "管理脚本创建完成"

# 步骤9: 创建监控脚本
print_step "步骤9: 创建监控脚本..."
cat > /usr/local/bin/netrum-monitor << 'EOF'
#!/bin/bash
# Netrum监控脚本

echo "🔍 Netrum节点监控面板"
echo "================================"

# 系统资源
echo "💻 系统资源:"
echo "CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "内存使用: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "磁盘使用: $(df -h / | awk 'NR==2{print $5}')"

echo ""

# 网络状态
echo "🌐 网络状态:"
if ping -c 1 8.8.8.8 &> /dev/null; then
    echo "网络连接: ✅ 正常"
else
    echo "网络连接: ❌ 异常"
fi

echo ""

# 服务状态
echo "🔧 服务状态:"
if systemctl is-active --quiet netrum-node; then
    echo "节点服务: ✅ 运行中"
else
    echo "节点服务: ❌ 未运行"
fi

if systemctl is-active --quiet netrum-auto-claim.timer; then
    echo "自动领取: ✅ 已启用"
else
    echo "自动领取: ❌ 未启用"
fi

echo ""

# 钱包信息
echo "💳 钱包信息:"
netrum-wallet

echo ""
echo "📋 快速命令:"
echo "  查看状态: netrum-manage status"
echo "  查看日志: netrum-manage logs"
echo "  重启服务: netrum-manage restart"
EOF

chmod +x /usr/local/bin/netrum-monitor
print_success "监控脚本创建完成"

# 完成部署
echo ""
echo -e "${PURPLE}🎉 一键部署完成！${NC}"
echo ""
echo -e "${YELLOW}📋 接下来需要手动完成的步骤：${NC}"
echo "1. 设置钱包: netrum-new-wallet 或 netrum-import-wallet"
echo "2. 检查Base域名: netrum-check-basename"
echo "3. 获取Base测试网ETH"
echo "4. 注册节点: netrum-node-register"
echo "5. 开始同步: netrum-sync"
echo "6. 开始挖矿: netrum-mining"
echo ""
echo -e "${GREEN}🛠️  管理命令:${NC}"
echo "  监控面板: netrum-monitor"
echo "  管理工具: netrum-manage"
echo "  查看状态: netrum-manage status"
echo "  查看日志: netrum-manage logs"
echo ""
echo -e "${GREEN}🎯 部署完成！开始设置你的Netrum节点吧！${NC}"
