
# FragOut

**FragOut** is a free, open-source platform for posting to multiple social networks from a single dashboard. It features real-time admin statistics, robust post tracking, system health monitoring, and a snarky legal disclaimer. Built with Next.js, SQLite, and Docker for easy deployment.

- **Multi-platform posting:** Bluesky, Mastodon, Nostr, Twitter, and more
- **Admin dashboard:** Real usage stats, post counts, and system health
- **Privacy-first:** No tracking, no ads, no nonsense
- **Open-source:** MIT licensed, contributions welcome!

---

> 🚀 **Multi-platform social media management tool** - Post to Twitter/X, Mastodon, BlueSky, and Nostr from one interface.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Security Score](https://img.shields.io/badge/Security_Score-8.0%2F10-green)](./SECURITY_REVIEW.md)

## ✨ Features

- 🔐 **Secure Authentication** - Nostr NIP-07 browser extension integration
- 🔑 **Encrypted Storage** - AES-256-GCM encryption for platform credentials
- 🌐 **Multi-Platform Support** - Twitter/X, Mastodon, BlueSky, Nostr
- 🛡️ **Security First** - Comprehensive security headers, rate limiting, admin controls
- 📱 **Modern UI** - Dark mode, responsive design, glassmorphism
- 🐳 **Docker Ready** - Production-ready containerization

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/11b-dev/fragout.git
cd fragout
npm install

# Set up environment (REQUIRED)
cp .env.local.example .env.local
# Edit .env.local with your secure keys (see Security section)

# Start development
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and connect with your Nostr browser extension.

## 🔒 Security

**Security Score: 8.0/10** - All critical vulnerabilities have been resolved.

### Required Environment Setup
```bash
# Generate secure secrets:
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
ENCRYPTION_SECRET=$(openssl rand -hex 32)
```

📋 **[Full Security Review](./SECURITY_REVIEW.md)** - Comprehensive security audit and recommendations

## 🐳 Production Deployment

### Docker (Recommended)
```bash
# Build and run
docker-compose up -d

# Or build manually
docker build -t yall-web .
docker run -p 3000:3000 --env-file .env.local yall-web
```

### Manual Deployment
```bash
npm run build
npm start
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Security Review](./SECURITY_REVIEW.md) | Complete security audit, fixes, and recommendations |
| [Environment Setup](./.env.local.example) | Required environment variables with examples |
| [Docker Setup](./docker-compose.yml) | Container orchestration configuration |

## 🏗️ Architecture

- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + SQLite
- **Authentication**: Nostr NIP-07 browser extensions
- **Security**: AES-256-GCM encryption, JWT sessions, security headers
- **Deployment**: Docker containers with multi-stage builds

## 🔌 Supported Platforms

| Platform | Authentication | Features |
|----------|---------------|----------|
| **Nostr** | NIP-07 Extension | Native posting, relay management |
| **Twitter/X** | OAuth 1.0a | Text posts, image uploads |
| **Mastodon** | Access Token | Text posts, custom instances |
| **BlueSky** | App Password | Text posts via AT Protocol |

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Run production server
npm start
```

### Prerequisites
- Node.js 18+
- Nostr browser extension ([Alby](https://getalby.com/), [nos2x](https://github.com/fiatjaf/nos2x), etc.)

## 📈 Roadmap

- [ ] Advanced scheduling features
- [ ] Analytics dashboard
- [ ] Team collaboration
- [ ] Mobile app
- [ ] Additional platform integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Review the [Security Guidelines](./SECURITY_REVIEW.md)
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ for the decentralized web**
