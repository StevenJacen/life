# 中式人生模拟器

一个基于 Next.js + Express + SQLite 的中式人生模拟器。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FStevenJacen%2Flife.git)

## 项目结构

- `frontend/` — Next.js 前端（React + Tailwind CSS）
- `backend/` — Express + better-sqlite3 后端
- `api/` — Vercel Serverless Functions 入口

## 本地开发

```bash
# 启动后端
cd backend
npm install
node server.js

# 启动前端
cd frontend
npm install
npm run dev
```

前端地址：http://localhost:3000  
后端地址：http://localhost:3001

## Vercel 一键部署

点击上方 **Deploy with Vercel** 按钮，即可将项目一键部署到 Vercel。部署后：

- 前端页面由 Vercel 自动托管
- 后端 API 以 Serverless Function 形式运行
- SQLite 数据库在 `/tmp` 中自动初始化（每次冷启动会重置为初始 seed 数据）

> 注意：Vercel 的免费 Serverless Function 有 10 秒执行时间限制，SQLite 数据也是临时的（适合演示，不适合长期存档）。如需持久化数据，建议迁移到 PostgreSQL / Turso 等外部数据库。
