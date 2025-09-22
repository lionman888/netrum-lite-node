# 📋 Netrum Lite Node Enhanced - 命令参考手册

## 🚀 快速部署命令

### 一键部署（推荐）
```bash
# 下载并运行一键部署脚本
wget https://raw.githubusercontent.com/lionman888/netrum-lite-node-enhanced/main/one-click-deploy.sh
chmod +x one-click-deploy.sh
sudo ./one-click-deploy.sh
```

### 手动部署
```bash
# 快速部署脚本
wget https://raw.githubusercontent.com/lionman888/netrum-lite-node-enhanced/main/quick-deploy.sh
chmod +x quick-deploy.sh
sudo ./quick-deploy.sh
```

## 🔧 基础命令

### 系统检查
```bash
# 检查系统状态
netrum-system

# 查看系统资源
htop
```

### 钱包管理
```bash
# 创建新钱包
netrum-new-wallet

# 导入现有钱包
netrum-import-wallet

# 查看钱包信息
netrum-wallet

# 查看私钥
netrum-wallet-key

# 删除钱包
netrum-wallet-remove
```

### 节点管理
```bash
# 检查Base域名
netrum-check-basename

# 查看节点ID
netrum-node-id

# 生成节点签名
netrum-node-sign

# 注册节点
netrum-node-register

# 删除节点ID
netrum-node-id-remove
```

### 同步和挖矿
```bash
# 开始同步
netrum-sync

# 查看同步日志
netrum-sync-log

# 开始挖矿
netrum-mining

# 查看挖矿日志
netrum-mining-log
```

### 奖励管理
```bash
# 手动领取奖励
netrum-claim

# 自动领取奖励
netrum-auto-claim
```

## 🤖 增强功能命令

### 自动领取设置
```bash
# 设置自动领取
./scripts/setup-auto-claim.sh

# 手动测试自动领取
netrum-auto-claim

# 查看自动领取日志
tail -f src/logs/auto-claim.log
```

### 服务管理
```bash
# 查看所有服务状态
sudo systemctl status netrum-node
sudo systemctl status netrum-auto-claim.timer

# 重启服务
sudo systemctl restart netrum-node
sudo systemctl restart netrum-auto-claim.timer

# 启用/禁用自动领取
sudo systemctl enable netrum-auto-claim.timer
sudo systemctl disable netrum-auto-claim.timer
```

## 📊 监控命令

### 系统监控
```bash
# 监控面板
netrum-monitor

# 管理工具
netrum-manage status
netrum-manage logs
netrum-manage restart
netrum-manage claim
netrum-manage wallet
```

### 日志查看
```bash
# 查看同步日志
netrum-sync-log

# 查看挖矿日志
netrum-mining-log

# 查看自动领取日志
tail -f src/logs/auto-claim.log

# 查看系统日志
sudo journalctl -u netrum-auto-claim.service -f
```

## 🔍 故障排除命令

### 权限修复
```bash
# 修复脚本权限
chmod +x scripts/setup-auto-claim.sh
chmod +x cli/auto-claim-cli.js
chmod +x src/system/mining/auto-claim.js
```

### 服务重启
```bash
# 重启所有服务
sudo systemctl restart netrum-node
sudo systemctl restart netrum-auto-claim.timer

# 重新设置自动领取
./scripts/setup-auto-claim.sh
```

### 日志清理
```bash
# 清理系统日志
sudo journalctl --vacuum-time=7d

# 清理自动领取日志
truncate -s 0 src/logs/auto-claim.log
```

## 📈 性能优化命令

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
# 实时监控
htop
iotop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

## 🔒 安全命令

### 备份数据
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

## 📋 日常维护命令

### 每日检查
```bash
# 检查节点状态
netrum-manage status

# 检查钱包余额
netrum-wallet

# 检查挖矿状态
netrum-mining-log

# 检查自动领取
tail -f src/logs/auto-claim.log
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
netrum-manage restart
```

## 🎯 快速参考

### 常用组合命令
```bash
# 完整状态检查
netrum-manage status && netrum-wallet && netrum-monitor

# 重启所有服务
sudo systemctl restart netrum-node netrum-auto-claim.timer

# 查看所有日志
netrum-sync-log & netrum-mining-log & tail -f src/logs/auto-claim.log
```

### 紧急恢复
```bash
# 如果服务停止
sudo systemctl start netrum-node
sudo systemctl start netrum-auto-claim.timer

# 如果自动领取失败
netrum-auto-claim

# 如果需要重新设置
./scripts/setup-auto-claim.sh
```

## 📞 技术支持

### 获取帮助
```bash
# 查看命令帮助
netrum --help
netrum-auto-claim --help

# 查看服务状态
sudo systemctl status netrum-node
sudo systemctl status netrum-auto-claim.timer
```

### 联系支持
- **Discord**: [Netrum Discord](https://discord.gg/Mv6uKBKCZM)
- **GitHub**: [项目仓库](https://github.com/lionman888/netrum-lite-node-enhanced)

---

**🎯 记住：定期检查节点状态，确保自动领取正常工作！**
