const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Create .env.example if it doesn't exist
if (!fs.existsSync(envExamplePath)) {
  const envExampleContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/caloriecam"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# AI Services
OPENAI_API_KEY=your-openai-api-key
USDA_API_KEY=your-usda-api-key

# App Configuration
NUTRITION_PROVIDER=hybrid
NUTRITION_FEATURE_FALLBACK=true
CORS_ORIGIN=*

# Server
PORT=3000
NODE_ENV=development
`;

  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log('✅ Created .env.example file');
}

// Create .env if it doesn't exist
if (!fs.existsSync(envPath)) {
  const envContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/caloriecam"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# AI Services
OPENAI_API_KEY=your-openai-api-key
USDA_API_KEY=your-usda-api-key

# App Configuration
NUTRITION_PROVIDER=hybrid
NUTRITION_FEATURE_FALLBACK=true
CORS_ORIGIN=*

# Server
PORT=3000
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
} else {
  console.log('ℹ️  .env file already exists');
}

console.log('🔧 Environment setup completed!');
console.log('📝 Please update the .env file with your actual configuration values.');
