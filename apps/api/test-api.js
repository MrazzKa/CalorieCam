// Простой тестовый API сервер для разработки
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Тестовые данные
let userProfile = {
  firstName: 'Demo',
  lastName: 'User',
  email: 'demo@eatsense.ch',
  height: 170,
  weight: 70,
  age: 25,
  gender: 'male',
  activityLevel: 'moderately_active',
  goal: 'maintain_weight',
  targetWeight: 70,
  dailyCalories: 2000,
  isOnboardingCompleted: false
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// User profile endpoints
app.get('/user-profiles', (req, res) => {
  res.json(userProfile);
});

app.post('/user-profiles', (req, res) => {
  userProfile = { ...userProfile, ...req.body };
  res.json(userProfile);
});

app.put('/user-profiles', (req, res) => {
  userProfile = { ...userProfile, ...req.body };
  res.json(userProfile);
});

app.post('/user-profiles/complete-onboarding', (req, res) => {
  userProfile.isOnboardingCompleted = true;
  res.json(userProfile);
});

// AI Assistant endpoints
app.post('/ai-assistant/nutrition-advice', (req, res) => {
  res.json({ 
    answer: "Based on your profile, I recommend focusing on balanced meals with lean proteins, whole grains, and plenty of vegetables. Try to eat 3-5 servings of fruits and vegetables daily." 
  });
});

app.post('/ai-assistant/health-check', (req, res) => {
  res.json({ 
    answer: "Your current BMI is within a healthy range. Continue maintaining a balanced diet and regular exercise routine." 
  });
});

app.post('/ai-assistant/general-question', (req, res) => {
  res.json({ 
    answer: "I'm here to help with any nutrition and health questions you might have!" 
  });
});

app.get('/ai-assistant/conversation-history', (req, res) => {
  res.json([]);
});

// Food analysis endpoints
app.post('/food/analyze', (req, res) => {
  res.json({
    analysisId: 'test-123',
    status: 'COMPLETED',
    results: {
      items: [
        {
          label: 'Grilled Chicken Breast',
          kcal: 165,
          protein: 31,
          fat: 3.6,
          carbs: 0,
          gramsMean: 150
        }
      ]
    }
  });
});

app.post('/food/analyze-text', (req, res) => {
  res.json({
    analysisId: 'test-456',
    status: 'COMPLETED',
    results: {
      items: [
        {
          label: req.body.description || 'Food Item',
          kcal: 200,
          protein: 15,
          fat: 8,
          carbs: 20,
          gramsMean: 100
        }
      ]
    }
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  res.json({
    totalCalories: 1200,
    totalProtein: 80,
    totalCarbs: 150,
    totalFat: 45,
    goal: 2000
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test API server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
});
