# 🚀 VPS部署Netrum Lite Node Enhanced - 完整命令集

## 📋 VPS部署流程

### 第一步：连接VPS并更新系统

```bash
# 连接VPS
ssh root@your-vps-ip

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础依赖
sudo apt install -y curl bc jq speedtest-cli nodejs npm git htop
```

### 第二步：安装Node.js v20

```bash
# 检查当前Node.js版本
node -v

# 如果版本低于18，升级到v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v  # 应该显示 v20.x.x
npm -v
```

### 第三步：克隆增强版仓库

```bash
# 克隆你的增强版仓库
git clone https://github.com/lionman888/netrum-lite-node-enhanced.git
cd netrum-lite-node-enhanced

# 安装依赖
npm install

# 全局链接CLI工具
npm link
```

### 第四步：系统检查

```bash
# 检查系统是否满足要求
netrum-system
```

### 第五步：钱包设置

```bash
# 创建新钱包
netrum-new-wallet

# 或者导入现有钱包
netrum-import-wallet
```

### 第六步：检查Base域名

```bash
# 检查你的钱包是否有Base域名
netrum-check-basename
```

### 第七步：获取Base测试网ETH

**在本地钱包中操作：**
1. 连接钱包到Base Sepolia测试网
2. 访问 [Base Sepolia Faucet](https://bridge.base.org/deposit)
3. 领取测试网ETH

### 第八步：注册节点

```bash
# 注册节点到链上
netrum-node-register
```

### 第九步：开始同步

```bash
# 开始与Netrum网络同步
netrum-sync

# 在另一个终端查看同步日志
netrum-sync-log
```

### 第十步：开始挖矿

```bash
# 开始挖取NPT代币
netrum-mining

# 在另一个终端查看挖矿日志
netrum-mining-log
```

### 第十一步：设置自动领取

```bash
# 运行自动设置脚本
chmod +x scripts/setup-auto-claim.sh
./scripts/setup-auto-claim.sh
```

### 第十二步：验证设置

```bash
# 检查定时器状态
sudo systemctl status netrum-auto-claim.timer

# 查看服务日志
sudo journalctl -u netrum-auto-claim.service

# 手动测试自动领取
netrum-auto-claim
```

## 🔧 一键部署脚本（在VPS上运行）

### 创建一键部署脚本

```bash
# 在VPS上创建部署脚本
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 开始部署Netrum Lite Node Enhanced..."

# 更新系统
apt update && apt upgrade -y

# 安装依赖
apt install -y curl bc jq speedtest-cli nodejs npm git htop

# 升级Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 克隆仓库
git clone https://github.com/lionman888/netrum-lite-node-enhanced.git
cd netrum-lite-node-enhanced

# 安装依赖
npm install
npm link

# 系统检查
netrum-system

echo "✅ 基础部署完成！"
echo "接下来需要手动完成钱包设置和节点注册"
EOF

# 设置执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

## 📊 监控和管理命令

### 查看状态
```bash
# 查看钱包信息
netrum-wallet

# 查看节点ID
netrum-node-id

# 查看同步状态
netrum-sync-log

# 查看挖矿状态
netrum-mining-log

# 查看自动领取日志
tail -f src/logs/auto-claim.log
```

### 服务管理
```bash
# 查看服务状态
sudo systemctl status netrum-node
sudo systemctl status netrum-auto-claim.timer

# 重启服务
sudo systemctl restart netrum-node
sudo systemctl restart netrum-auto-claim.timer

# 手动执行自动领取
sudo systemctl start netrum-auto-claim.service
```

## 🔍 故障排除

### 常见问题
```bash
# 权限问题
chmod +x scripts/setup-auto-claim.sh
chmod +x cli/auto-claim-cli.js
chmod +x src/system/mining/auto-claim.js

# 服务未启动
sudo systemctl enable netrum-auto-claim.timer
sudo systemctl start netrum-auto-claim.timer

# 查看日志
sudo journalctl -u netrum-auto-claim.service -f
```

### 重新设置
```bash
# 重新设置自动领取
./scripts/setup-auto-claim.sh

# 重启所有服务
sudo systemctl restart netrum-node
sudo systemctl restart netrum-auto-claim.timer
```

## 📋 日常维护

### 每日检查
```bash
# 检查节点状态
netrum-sync-log
netrum-mining-log
tail -f src/logs/auto-claim.log
netrum-wallet
```

### 每周维护
```bash
# 更新系统
sudo apt update && sudo apt upgrade

# 清理日志
sudo journalctl --vacuum-time=7d

# 检查磁盘空间
df -h
```

## 🎯 快速参考

### 完整部署命令序列
```bash
# 1. 连接VPS
ssh root@your-vps-ip

# 2. 更新系统
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl bc jq speedtest-cli nodejs npm git htop

# 3. 升级Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. 克隆仓库
git clone https://github.com/lionman888/netrum-lite-node-enhanced.git
cd netrum-lite-node-enhanced

# 5. 安装依赖
npm install
npm link

# 6. 系统检查
netrum-system

# 7. 设置钱包
netrum-new-wallet  # 或 netrum-import-wallet

# 8. 检查Base域名
netrum-check-basename

# 9. 注册节点
netrum-node-register

# 10. 开始同步
netrum-sync

# 11. 开始挖矿
netrum-mining

# 12. 设置自动领取
chmod +x scripts/setup-auto-claim.sh
./scripts/setup-auto-claim.sh
```

---

**🎯 记住：在VPS上运行这些命令，不是本地！**
