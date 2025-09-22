# 🚀 VPS部署Netrum Lite Node Enhanced - 完整指南

## 📋 部署前准备

### VPS要求
- **系统**: Ubuntu 22.04 LTS
- **CPU**: 2核心（推荐3核心）
- **RAM**: 4GB（推荐8GB）
- **存储**: 50GB SSD（推荐150GB）
- **网络**: 10+ Mbps上传/下载

### 本地准备
- 钱包（MetaMask等）
- Base测试网ETH
- VPS的IP地址和root密码

## 🚀 一键部署（推荐）

### 方法1: 直接运行部署脚本

```bash
# 1. 连接VPS
ssh root@your-vps-ip

# 2. 下载并运行部署脚本
wget https://raw.githubusercontent.com/lionman888/netrum-lite-node-enhanced/main/vps-deploy.sh
chmod +x vps-deploy.sh
./vps-deploy.sh
```

### 方法2: 手动部署

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
```

## 🔧 节点设置

### 步骤1: 钱包设置

```bash
# 创建新钱包
netrum-new-wallet

# 或者导入现有钱包
netrum-import-wallet
```

### 步骤2: 检查Base域名

```bash
# 检查你的钱包是否有Base域名
netrum-check-basename
```

### 步骤3: 获取Base测试网ETH

**在本地钱包中操作：**
1. 连接钱包到Base Sepolia测试网
   - 网络名称：Base Sepolia
   - RPC URL：`https://sepolia.base.org`
   - 链ID：84532
2. 访问 [Base Sepolia Faucet](https://bridge.base.org/deposit)
3. 领取测试网ETH（建议1个以上）

### 步骤4: 注册节点

```bash
# 注册节点到链上
netrum-node-register
```

### 步骤5: 开始同步

```bash
# 开始与Netrum网络同步
netrum-sync

# 在另一个终端查看同步日志
netrum-sync-log
```

### 步骤6: 开始挖矿

```bash
# 开始挖取NPT代币
netrum-mining

# 在另一个终端查看挖矿日志
netrum-mining-log
```

### 步骤7: 设置自动领取

```bash
# 设置自动领取功能
chmod +x scripts/setup-auto-claim.sh
./scripts/setup-auto-claim.sh

# 验证设置
sudo systemctl status netrum-auto-claim.timer
```

## 📊 监控和管理

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
netrum-auto-claim
```

## 🔍 故障排除

### 常见问题

#### 1. Node.js版本问题
```bash
# 检查版本
node -v

# 重新安装Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 2. 权限问题
```bash
# 修复脚本权限
chmod +x scripts/setup-auto-claim.sh
chmod +x cli/auto-claim-cli.js
chmod +x src/system/mining/auto-claim.js
```

#### 3. 服务未启动
```bash
# 重新设置自动领取
./scripts/setup-auto-claim.sh

# 重启服务
sudo systemctl restart netrum-node
sudo systemctl restart netrum-auto-claim.timer
```

#### 4. 网络问题
```bash
# 检查网络连接
ping 8.8.8.8

# 检查DNS
nslookup google.com
```

### 日志查看
```bash
# 查看系统日志
sudo journalctl -u netrum-auto-claim.service -f

# 查看自动领取日志
tail -f src/logs/auto-claim.log

# 查看同步日志
netrum-sync-log

# 查看挖矿日志
netrum-mining-log
```

## 📈 性能优化

### 系统优化
```bash
# 设置时区
sudo timedatectl set-timezone Asia/Shanghai

# 优化系统参数
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'net.core.rmem_max=16777216' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 监控资源
```bash
# 安装监控工具
sudo apt install -y htop iotop

# 查看资源使用
htop
iotop
```

## 🔒 安全设置

### 备份重要数据
```bash
# 备份钱包
cp -r src/wallet/ ~/netrum-backup/

# 备份私钥
netrum-wallet-key > ~/netrum-backup/private-key.txt

# 备份配置文件
cp -r src/identity/ ~/netrum-backup/
```

### 防火墙设置
```bash
# 安装UFW
sudo apt install -y ufw

# 配置防火墙
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw enable
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

# 重启服务
sudo systemctl restart netrum-node
sudo systemctl restart netrum-auto-claim.timer
```

## 🎯 快速参考

### 完整部署命令序列
```bash
# 1. 连接VPS
ssh root@your-vps-ip

# 2. 一键部署
wget https://raw.githubusercontent.com/lionman888/netrum-lite-node-enhanced/main/vps-deploy.sh
chmod +x vps-deploy.sh
./vps-deploy.sh

# 3. 设置钱包
netrum-new-wallet  # 或 netrum-import-wallet

# 4. 检查Base域名
netrum-check-basename

# 5. 注册节点
netrum-node-register

# 6. 开始同步
netrum-sync

# 7. 开始挖矿
netrum-mining

# 8. 设置自动领取
chmod +x scripts/setup-auto-claim.sh
./scripts/setup-auto-claim.sh
```

### 常用管理命令
```bash
# 查看状态
netrum-wallet
netrum-sync-log
netrum-mining-log

# 服务管理
sudo systemctl status netrum-node
sudo systemctl status netrum-auto-claim.timer

# 手动操作
netrum-auto-claim
netrum-claim
```

---

**🎯 记住：在VPS上运行这些命令，确保有足够的Base测试网ETH！**
