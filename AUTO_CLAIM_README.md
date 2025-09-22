# 🤖 Netrum Auto Claim Feature

## 概述

这个增强版本的Netrum Lite Node添加了自动领取奖励功能，让你无需手动操作即可自动领取NPT代币奖励。

## 新功能

### 1. 自动领取命令
```bash
netrum-auto-claim
```

### 2. 自动设置脚本
```bash
./scripts/setup-auto-claim.sh
```

## 功能特点

- ✅ **完全自动化**：无需用户交互
- ✅ **智能检查**：自动检查余额和领取条件
- ✅ **详细日志**：记录所有操作到日志文件
- ✅ **错误处理**：完善的错误处理机制
- ✅ **定时执行**：支持systemd定时器
- ✅ **安全可靠**：保持原有安全性

## 安装和使用

### 1. 安装增强版本
```bash
# 克隆仓库
git clone https://github.com/lionman888/netrum-lite-node.git
cd netrum-lite-node

# 安装依赖
npm install

# 链接CLI
npm link
```

### 2. 设置自动领取
```bash
# 运行自动设置脚本
chmod +x scripts/setup-auto-claim.sh
./scripts/setup-auto-claim.sh
```

### 3. 手动测试
```bash
# 测试自动领取功能
netrum-auto-claim
```

## 管理命令

### 查看定时器状态
```bash
sudo systemctl status netrum-auto-claim.timer
```

### 查看日志
```bash
# 查看服务日志
sudo journalctl -u netrum-auto-claim.service

# 查看详细日志
tail -f src/logs/auto-claim.log
```

### 手动执行
```bash
# 立即执行一次自动领取
sudo systemctl start netrum-auto-claim.service
```

### 禁用自动领取
```bash
sudo systemctl disable netrum-auto-claim.timer
sudo systemctl stop netrum-auto-claim.timer
```

## 配置选项

### 修改执行频率
编辑定时器配置：
```bash
sudo systemctl edit netrum-auto-claim.timer
```

### 自定义执行时间
```bash
# 每天凌晨2点执行
OnCalendar=*-*-* 02:00:00

# 每6小时执行一次
OnCalendar=*-*-* 00,06,12,18:00:00
```

## 日志文件

- **服务日志**：`sudo journalctl -u netrum-auto-claim.service`
- **详细日志**：`src/logs/auto-claim.log`

## 安全说明

- 自动领取功能使用与手动领取相同的安全机制
- 私钥安全存储在本地，不会发送到外部
- 所有交易都需要足够的ETH余额
- 建议定期检查日志确保正常运行

## 故障排除

### 常见问题

1. **权限问题**
   ```bash
   sudo chmod +x scripts/setup-auto-claim.sh
   ```

2. **服务未启动**
   ```bash
   sudo systemctl start netrum-auto-claim.timer
   ```

3. **日志查看**
   ```bash
   sudo journalctl -u netrum-auto-claim.service -f
   ```

## 更新说明

这个版本在原有Netrum Lite Node基础上添加了：
- 自动领取功能
- 定时任务支持
- 详细日志记录
- 错误处理机制

所有原有功能保持不变，可以正常使用。
