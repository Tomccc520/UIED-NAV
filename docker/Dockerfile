# UIED 导航网站 - Docker 部署
# 使用 Node 20 Alpine 镜像（轻量）
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache openssl

# 复制 package 文件
COPY backend/package*.json ./

# 安装依赖
RUN npm install --production

# 复制后端代码
COPY backend/src ./src
COPY backend/prisma ./prisma

# 生成 Prisma 客户端
RUN npx prisma generate

# 创建必要的目录
RUN mkdir -p uploads exports public

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "src/index.js"]
