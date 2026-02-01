#!/bin/bash
# 数据库自动备份脚本

BACKUP_DIR="./prisma/backups"
DB_FILE="./prisma/dev.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dev.db.backup_$TIMESTAMP"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp $DB_FILE $BACKUP_FILE

echo "✅ 数据库已备份到: $BACKUP_FILE"

# 保留最近 10 个备份
ls -t $BACKUP_DIR/dev.db.backup_* | tail -n +11 | xargs -r rm

echo "✅ 清理完成，保留最近 10 个备份"
