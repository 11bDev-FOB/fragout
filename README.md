# Y'all Web

A multi-platform social media management tool built with Vite + React frontend and Express backend.

## Architecture

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Express.js + SQLite + JWT authentication
- **Authentication**: Nip-07 (Nostr browser extension)
- **Security**: AES-256-CBC encryption for stored credentials

## Features

- 🔐 Secure authentication via Nostr (Nip-07)
- 🔑 Encrypted credential storage for multiple platforms
- ✅ Connection testing before saving credentials
- 🌐 Support for Mastodon, Bluesky, X/Twitter, and Nostr
- 📱 Responsive design with glassmorphism UI

## Supported Platforms

- **Mastodon**: Instance URL + Access Token
- **Bluesky**: Handle + App Password  
- **X (Twitter)**: API Key + API Secret + Access Token + Access Token Secret
- **Nostr**: Browser extension (Nip-07) integration

## Development

### Prerequisites

- Node.js 18+
- Nostr browser extension (Alby, nos2x, etc.)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Install dependencies for both client and server:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

This will start:
- Frontend (Vite): http://localhost:5173
- Backend (Express): http://localhost:3001

### Manual Setup

To start servers individually:

```bash
# Backend
cd server && npm run dev

# Frontend  
cd client && npm run dev
```

## Environment Variables

Create `.env` files in the server directory:

```env
JWT_SECRET=your_jwt_secret_here
CREDENTIAL_SECRET=your_32_byte_hex_key_here
```

## Security

- All platform credentials are encrypted using AES-256-CBC
- JWT tokens for session management
- Nostr keys managed by browser extension (never stored)
- CORS protection and secure cookie settings

## License

MIT
