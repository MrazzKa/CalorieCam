const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

const baseContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/caloriecam"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=

# Server
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000
APP_BASE_URL=http://localhost:19006
CORS_ORIGIN=*
CORS_ORIGINS=

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# Authentication / Limits
FREE_DAILY_ANALYSES=3
PRO_DAILY_ANALYSES=25
DISABLE_LIMITS=false
ADMIN_BYPASS_LIMITS=false
ASSISTANT_FLOWS_ENABLED=true

# AI Services
OPENAI_API_KEY=your-openai-api-key
FDC_API_KEY=your-usda-api-key
FDC_API_BASE=https://api.nal.usda.gov/fdc
USDA_CACHE_TTL_SEC=259200

# Cache TTLs
CACHE_DEFAULT_TTL_SEC=900
USDA_CACHE_TTL_SEC=259200
ANALYSIS_CACHE_TTL_SEC=86400
ARTICLES_FEED_CACHE_TTL_SEC=900
ARTICLES_DETAIL_CACHE_TTL_SEC=86400
ASSISTANT_SESSION_TTL_SEC=1800

# Health Score
HEALTH_SCORE_WEIGHTS='{"protein":0.25,"fiber":0.2,"satFat":-0.2,"sugar":-0.2,"energyDensity":-0.15}'

# Notifications
EXPO_ACCESS_TOKEN=
NOTIFICATIONS_DAILY_DEFAULT_HOUR=8

# Mail / SendGrid
SENDGRID_API_KEY=
MAIL_FROM="CalorieCam <noreply@yourdomain>"
MAIL_DISABLE=false
AUTH_DEV_IGNORE_MAIL_ERRORS=false

# Object Storage (MinIO / S3)
S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_BUCKET=caloriecam-media
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=true

# Feature Flags
NUTRITION_PROVIDER=hybrid
NUTRITION_FEATURE_FALLBACK=true
NUTRITION_FEATURE_ENABLED=true
`;

if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, baseContent);
  console.log('✅ Created .env.example file');
}

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, baseContent);
  console.log('✅ Created .env file');
} else {
  console.log('ℹ️  .env file already exists');
}

console.log('🔧 Environment setup completed!');
console.log('📝 Please update the .env file with your actual configuration values.');
