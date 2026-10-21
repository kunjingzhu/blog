# 老朱的赛博工位

个人博客源码仓库（Hugo + PaperMod），线上地址：**https://blog.zjkun.top**

我是老朱，12 年经验的前端为主全栈。这个站记录我在 AI 应用开发、服务器部署和职业转型上的一切实操——写的每篇都有真实代码和实测数据。

## 栏目

| 栏目 | 内容 |
|------|------|
| [AI 应用开发](https://blog.zjkun.top/categories/ai-app/) | RAG 实战（混合检索 / Query 改写 / 分块 / 父页面召回）、Coding Agent 驯服记录 |
| [全栈与部署](https://blog.zjkun.top/categories/fullstack-deploy/) | Nuxt3 + Docker + Nginx 上线全记录、99 元 ECS 生存术、HTTPS 自动化 |
| [3D 打印跨境](https://blog.zjkun.top/categories/3d-printing/) | 3D 打印产品从打样到亚马逊上架的实操笔记 |
| [求职手记](https://blog.zjkun.top/categories/job-notes/) | 33 岁转 AI 方向的求职路与面试复盘 |

## 技术选型

- **引擎**：Hugo + PaperMod（`hasCJKLanguage`，中文排版调优过）
- **搜索**：PaperMod 内置 fuse 站内搜索（Pagefind + 中文预分词为后续升级项）
- **评论**：暂未开启——计划等服务器独立 MySQL 容器就绪后接 Artalk
- **部署**：`hugo --minify` 产出静态文件 → Nginx 站点目录 + certbot（webroot）自动续期 HTTPS
- **服务器**：阿里云 ECS 2核2G，Docker compose 双容器（nginx + node-app）

## 关于本仓库

⚠️ 本仓库只保存**站点骨架**：配置文件、主题、固定页面。

`content/posts/` 下的全部博文为私人写作，**永久不上传**（`.gitignore` 已排除 `content/*`），请勿尝试找回。

## 本地预览

```bash
hugo server -D
```

---

*如果这个项目对你有参考价值，欢迎点个 Star。博客内容以线上为准。*
