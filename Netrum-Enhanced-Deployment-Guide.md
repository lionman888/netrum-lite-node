# 🚀 Netrum Lite Node Enhanced - VPS部署完整指南

## 📋 概述

这是增强版Netrum Lite Node的完整VPS部署指南，包含自动领取奖励功能。

## 🎯 功能特点

- ✅ **原始功能**：完整的Netrum Lite Node功能
- ✅ **自动领取**：24小时自动领取NPT奖励
- ✅ **定时任务**：systemd定时器支持
- ✅ **详细日志**：完整的操作日志记录
- ✅ **一键设置**：自动化安装脚本

## 📦 系统要求

### 最低配置
- **CPU**: 2核心
- **RAM**: 4GB
- **存储**: 50GB SSD
- **网络**: 10 Mbps上传/下载

### 推荐配置
- **CPU**: 3核心
- **RAM**: 8GB
- **存储**: 150GB SSD
- **网络**: 20+ Mbps上传/下载

## 🛠️ 部署流程

### 第一步：VPS准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础依赖
sudo apt install -y curl bc jq speedtest-cli nodejs npm git

# 检查Node.js版本
node -v
```

### 第二步：安装Node.js v20

```bash
# 如果Node.js版本低于18，升级到v20
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

#### 选项A：创建新钱包
```bash
netrum-new-wallet
```

#### 选项B：导入现有钱包
```bash
netrum-import-wallet
```

### 第六步：检查Base域名

```bash
# 检查你的钱包是否有Base域名
netrum-check-basename
```

### 第七步：获取Base测试网ETH

1. **连接钱包到Base Sepolia测试网**：
   - 网络名称：Base Sepolia
   - RPC URL：`https://sepolia.base.org`
   - 链ID：84532

2. **获取测试网ETH**：
   - 访问 [Base Sepolia Faucet](https://bridge.base.org/deposit)
   - 或使用 [Alchemy Faucet](https://sepoliafaucet.com/)

### 第八步：注册节点

```bash
# 注册节点到链上（需要少量Base Sepolia ETH作为gas费）
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

### 第十一步：设置自动领取（新功能）

```bash
# 运行自动设置脚本
chmod +x scripts/setup-auto-claim.sh
./scripts/setup-auto-claim.sh
```

### 第十二步：验证自动领取设置

```bash
# 检查定时器状态
sudo systemctl status netrum-auto-claim.timer

# 查看服务日志
sudo journalctl -u netrum-auto-claim.service

# 手动测试自动领取
netrum-auto-claim
```

## 📊 监控和管理

### 常用监控命令

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

### 服务管理命令

```bash
# 查看所有服务状态
sudo systemctl status netrum-node
sudo systemctl status netrum-auto-claim.timer

# 重启服务
sudo systemctl restart netrum-node

# 手动执行自动领取
sudo systemctl start netrum-auto-claim.service

# 查看服务日志
sudo journalctl -u netrum-auto-claim.service -f
```

## 🔧 故障排除

### 常见问题解决

#### 1. Node.js版本问题
```bash
# 检查版本
node -v

# 如果版本低于18，重新安装
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
sudo systemctl enable netrum-auto-claim.timer
sudo systemctl start netrum-auto-claim.timer
```

#### 4. 日志查看
```bash
# 查看详细日志
tail -f src/logs/auto-claim.log

# 查看系统日志
sudo journalctl -u netrum-auto-claim.service -f
```

## 📈 性能优化

### 系统优化建议

```bash
# 设置时区
sudo timedatectl set-timezone Asia/Shanghai

# 优化系统参数
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'net.core.rmem_max=16777216' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 监控资源使用

```bash
# 安装监控工具
sudo apt install -y htop iotop

# 查看资源使用
htop
iotop
```

## 🔒 安全建议

### 1. 备份重要数据
```bash
# 备份钱包文件
cp -r src/wallet/ ~/netrum-backup/

# 备份私钥
netrum-wallet-key > ~/netrum-backup/private-key.txt
```

### 2. 设置防火墙
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

### 每日检查清单

- [ ] 检查节点同步状态：`netrum-sync-log`
- [ ] 检查挖矿状态：`netrum-mining-log`
- [ ] 检查自动领取日志：`tail -f src/logs/auto-claim.log`
- [ ] 检查钱包余额：`netrum-wallet`
- [ ] 检查系统资源：`htop`

### 每周维护

- [ ] 更新系统：`sudo apt update && sudo apt upgrade`
- [ ] 清理日志：`sudo journalctl --vacuum-time=7d`
- [ ] 检查磁盘空间：`df -h`
- [ ] 备份重要数据

## 🎉 完成部署

部署完成后，你的Netrum Lite Node将：

- ✅ **自动同步**：每60秒同步一次
- ✅ **自动挖矿**：持续挖取NPT代币
- ✅ **自动领取**：每24小时自动领取奖励
- ✅ **详细日志**：记录所有操作
- ✅ **稳定运行**：systemd服务管理

## 📞 技术支持

如果遇到问题：

1. **查看日志**：`sudo journalctl -u netrum-auto-claim.service`
2. **检查状态**：`sudo systemctl status netrum-auto-claim.timer`
3. **重新设置**：`./scripts/setup-auto-claim.sh`
4. **联系支持**：[Netrum Discord](https://discord.gg/Mv6uKBKCZM)

---

**🎯 恭喜！你的增强版Netrum Lite Node已经部署完成，开始自动挖矿和领取奖励吧！**
