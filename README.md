# CalorieCam

AI-powered nutrition analysis app that helps you track your food intake and maintain a healthy lifestyle.

## Features

- 📸 **Photo Analysis**: Take photos of your meals and get instant nutritional analysis
- 🍎 **AI-Powered**: Advanced AI technology identifies ingredients and calculates nutritional values
- 📊 **Nutrition Tracking**: Track calories, proteins, fats, and carbohydrates
- 📱 **Modern UI**: Clean, intuitive interface inspired by CalZen
- 🔄 **Real-time Analysis**: Get instant results from your food photos

## Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-4 + USDA API
- **Database**: PostgreSQL + pgvector
- **Cache**: Redis
- **Queue**: Bull

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI
- PostgreSQL
- Redis

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MrazzKa/CalorieCam.git
cd CalorieCam
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the backend:
```bash
cd apps/api
pnpm install
pnpm run setup:env
pnpm run dev
```

5. Start the frontend:
```bash
pnpm start
```

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.3.6:3000
```

For the backend, create a `.env` file in `apps/api/`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/caloriecam
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your_openai_api_key
USDA_API_KEY=your_usda_api_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# App Configuration
NUTRITION_PROVIDER=hybrid
NUTRITION_FEATURE_FALLBACK=true
```

## Development

### Backend Development

```bash
cd apps/api
pnpm run dev
```

### Frontend Development

```bash
pnpm start
```

### Testing

```bash
pnpm test
```

## API Endpoints

- `GET /health` - Health check
- `POST /analyze` - Analyze food image
- `POST /analyze-text` - Analyze food description

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@caloriecam.app or join our Discord community.