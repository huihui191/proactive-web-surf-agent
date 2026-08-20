# Proactive Web Surf Agent v2 (Beta)

让只有模型 API 的用户，也能拥有一个会自己逛公开网页、挑选感兴趣内容并主动回来分享的 AI 伙伴。

> v1 是给开发者嵌入现有 Agent 的小型 TypeScript 库。v2 是独立可运行版本：填好模型 API，执行一条命令即可先跑通；Telegram 是可选项。

## v2 现在能做什么

- 支持 OpenAI-compatible API：OpenAI、DeepSeek、OpenRouter、Moonshot、SiliconFlow、Ollama、LM Studio 等。
- 原生支持 Anthropic Messages API。
- 从 GitHub 和 Hacker News 并行发现公开内容。
- 让模型从候选中自主选择一项，并以自己的口吻分享，而不是机械摘要。
- 默认输出到终端；配置 Telegram 后可主动发到手机。
- 本地记录已分享链接，避免反复发送。
- 只在设定的白天时段随机运行；失败后等待一小时再试。
- 支持 Node.js 直接运行和 Docker Compose。

## 最快开始：先在终端跑通

需要 Node.js 20 或更高版本。

```bash
cd v2
npm install
cp .env.example .env
```

Windows PowerShell 使用：

```powershell
cd v2
npm install
Copy-Item .env.example .env
```

打开 `.env`，最少填写三项：

```env
MODEL_PROVIDER=openai-compatible
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=你的API密钥
OPENAI_MODEL=gpt-4.1-mini
```

然后执行一次真实测试：

```bash
npm run once
```

看到 AI 挑选的内容、分享文字和链接，就表示模型与网页发现都已接通。

## 常见 OpenAI-compatible 配置

不同平台只需要更换 `OPENAI_BASE_URL`、`OPENAI_API_KEY` 和 `OPENAI_MODEL`。Base URL 应包含平台要求的 `/v1` 路径，但不要以 `/chat/completions` 结尾。

例如本机 Ollama：

```env
MODEL_PROVIDER=openai-compatible
OPENAI_BASE_URL=http://host.docker.internal:11434/v1
OPENAI_API_KEY=ollama
OPENAI_MODEL=qwen3:8b
```

如果不使用 Docker，本机地址通常可以写成 `http://127.0.0.1:11434/v1`。

## 使用 Anthropic

```env
MODEL_PROVIDER=anthropic
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_API_KEY=你的API密钥
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

模型名称以你的账户实际可用列表为准。

## 连接 Telegram（可选）

1. 在 Telegram 找 `@BotFather`，使用 `/newbot` 创建机器人并取得 Bot Token。
2. 给新机器人发送任意一条消息。
3. 访问 `https://api.telegram.org/bot<你的Token>/getUpdates`，在返回结果中找到 `message.chat.id`。
4. 修改 `.env`：

```env
DELIVERY_CHANNEL=telegram
TELEGRAM_BOT_TOKEN=你的Bot Token
TELEGRAM_CHAT_ID=你的Chat ID
```

再次执行：

```bash
npm run once
```

确认手机收到消息后，再启动常驻模式：

```bash
npm run build
npm start
```

## 自定义 AI 伙伴

```env
COMPANION_NAME=Rowan
RECIPIENT_NAME=Mia
COMPANION_PROMPT=You are a curious AI companion who loves creative coding, unusual interfaces, and small open-source tools. Share only things you genuinely like.
DISCOVERY_TOPICS=creative coding,AI agents,indie web
```

这里不要填写地址、聊天记录、支付信息或其他私人资料。长期记忆不是必需品；v2 第一阶段只需要一段稳定、简短的偏好描述。

## 调整主动频率

```env
TIMEZONE=Asia/Shanghai
DAY_START_HOUR=9
DAY_END_HOUR=22
MIN_INTERVAL_HOURS=6
MAX_INTERVAL_HOURS=12
RUN_ON_START=false
```

- 常驻进程每分钟检查一次是否到期，并不会每分钟调用模型。
- 每次成功后，会在最小/最大间隔之间随机安排下次运行。
- 下次时间如果落在夜间，会顺延到白天。
- 调用失败后等待一小时，不会高频消耗 API 额度。

## Docker Compose

```bash
cd v2
cp .env.example .env
# 编辑 .env
docker compose up -d --build
docker compose logs -f
```

状态文件保存在 `v2/data/state.json`，容器重启后仍保留去重和下次运行时间。

## 支持范围

v2 第一阶段刻意保持小而安全：

- 只读取公开 HTTP(S) 内容；
- 不登录网站，不读取浏览器 Cookie；
- 不购买、不付款、不执行网页中的指令；
- 不包含私人聊天、浏览器 profile、服务器地址或记忆库；
- Telegram 只是投递渠道，不是必需依赖；
- 官方 ChatGPT / Claude 客户端目前不能直接安装本项目，需使用模型 API。

## 验证与排错

```bash
npm run check
```

常见错误：

- `OPENAI_API_KEY is required`：`.env` 未填写密钥，或 provider 选错。
- `HTTP 401`：API 密钥无效。
- `HTTP 404`：Base URL 或模型名称错误。
- Telegram 没收到消息：先确认机器人收到过你的消息，再检查 Chat ID。
- Docker 访问不到本机模型：将 `127.0.0.1` 改为 `host.docker.internal`。

## 目录

```text
v2/
├─ src/              核心实现与测试
├─ .env.example      完整配置模板
├─ Dockerfile
├─ compose.yaml
└─ README.md
```

v1 仍保留在仓库根目录，原有用户不受影响。
