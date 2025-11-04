import { API_BASE_URL, DEV_TOKEN, DEV_REFRESH_TOKEN } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = DEV_TOKEN || null;
    this.refreshTokenValue = DEV_REFRESH_TOKEN || null;
    
    // Log configuration on init
    console.log('[ApiService] Initialized with baseURL:', this.baseURL);
    console.log('[ApiService] EXPO_PUBLIC_API_BASE_URL from env:', process.env.EXPO_PUBLIC_API_BASE_URL);
    console.log('[ApiService] API_BASE_URL constant:', API_BASE_URL);
  }

  async setToken(token, refreshToken) {
    this.token = token;
    if (refreshToken) {
      this.refreshTokenValue = refreshToken;
    }
    try {
      if (token) {
        // Access token stays in memory only
        // But we can also store it in AsyncStorage for app restart persistence
        await AsyncStorage.setItem('auth.token', token);
      } else {
        await AsyncStorage.removeItem('auth.token');
      }
      if (refreshToken) {
        // Store refresh token in Secure Storage (Keychain/Keystore)
        await SecureStore.setItemAsync('auth.refreshToken', refreshToken);
      } else {
        await SecureStore.deleteItemAsync('auth.refreshToken');
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  async loadTokens() {
    try {
      // Load access token from AsyncStorage
      const token = await AsyncStorage.getItem('auth.token');
      if (token) {
        this.token = token;
      }

      // Load refresh token from Secure Storage
      try {
        const refreshToken = await SecureStore.getItemAsync('auth.refreshToken');
        if (refreshToken) {
          this.refreshTokenValue = refreshToken;
        }
      } catch (secureStoreError) {
        // SecureStore might not be available in all environments
        console.warn('SecureStore not available, trying AsyncStorage:', secureStoreError);
        const refreshToken = await AsyncStorage.getItem('auth.refreshToken');
        if (refreshToken) {
          this.refreshTokenValue = refreshToken;
        }
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.token || DEV_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`[ApiService] Requesting: ${url}`);
    const config = {
      headers: this.getHeaders(),
      ...options,
      // Increase timeout for slow networks
      signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined, // 30 seconds
    };

    try {
      // If FormData, let fetch set proper multipart boundaries
      // But keep Authorization header
      if (config.body instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
        // Ensure Authorization header is preserved
        if (this.token || DEV_TOKEN) {
          config.headers['Authorization'] = `Bearer ${this.token || DEV_TOKEN}`;
        }
      }
      
      console.log(`[ApiService] Fetch config:`, { 
        method: config.method || 'GET',
        headers: Object.keys(config.headers),
        hasBody: !!config.body,
        hasAuth: !!(config.headers && config.headers['Authorization'])
      });
      
      let response = await fetch(url, config);
      
      console.log(`[ApiService] Response status: ${response.status}`);
      
      if (response.status === 401 && this.refreshTokenValue) {
        // try refresh once
        try {
          const refreshRes = await fetch(`${this.baseURL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: this.refreshTokenValue }),
          });
          if (refreshRes.ok) {
            const tokens = await refreshRes.json();
            if (tokens.accessToken) {
              await this.setToken(tokens.accessToken, tokens.refreshToken || this.refreshTokenValue);
              config.headers = this.getHeaders();
              response = await fetch(url, config);
            }
          }
        } catch {}
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[ApiService] Request failed for ${url}:`, error.message);
      console.error('[ApiService] Error details:', error);
      throw error;
    }
  }

  // Authentication
  async register(email) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async requestOtp(email) {
    return this.request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code: otp }),
    });
  }

  async requestMagicLink(email) {
    return this.request('/auth/magic/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async login(email, otp) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  // Food Analysis
  async analyzeImage(imageUri) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'food-image.jpg',
    });

    // Get headers with token, but remove Content-Type for FormData
    const headers = this.getHeaders();
    delete headers['Content-Type']; // Let fetch set it automatically for FormData

    return this.request('/food/analyze', {
      method: 'POST',
      headers: headers,
      body: formData,
    });
  }

  async getAnalysisStatus(analysisId) {
    return this.request(`/food/analysis/${analysisId}/status`);
  }

  async getAnalysisResult(analysisId) {
    return this.request(`/food/analysis/${analysisId}/result`);
  }

  // Meals
  async getMeals(date) {
    const params = date ? `?date=${date.toISOString().split('T')[0]}` : '';
    return this.request(`/meals${params}`);
  }

  async createMeal(mealData) {
    return this.request('/meals', {
      method: 'POST',
      body: JSON.stringify(mealData),
    });
  }

  async updateMeal(mealId, mealData) {
    return this.request(`/meals/${mealId}`, {
      method: 'PUT',
      body: JSON.stringify(mealData),
    });
  }

  async deleteMeal(mealId) {
    return this.request(`/meals/${mealId}`, {
      method: 'DELETE',
    });
  }

  async updateMealItem(mealId, itemId, itemData) {
    return this.request(`/meals/${mealId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async getTokenUsage(days = 30) {
    return this.request(`/ai-assistant/token-usage?days=${days}`);
  }

  // User Profile
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async deleteAccount() {
    return this.request('/users/me', {
      method: 'DELETE',
    });
  }

  async updateUserProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Statistics
  async getStats(period = 'week') {
    // align with backend routes
    return this.request(`/stats/dashboard`);
  }

  // Media
  async uploadImage(imageUri) {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload-image.jpg',
    });

    return this.request('/media/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // User Profiles
  async createUserProfile(profileData) {
    return this.request('/user-profiles', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getUserProfile() {
    return this.request('/user-profiles');
  }

  async updateUserProfile(profileData) {
    return this.request('/user-profiles', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async completeOnboarding() {
    return this.request('/user-profiles/complete-onboarding', {
      method: 'POST',
    });
  }

  // AI Assistant
  async getNutritionAdvice(question, context) {
    return this.request('/ai-assistant/nutrition-advice', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    });
  }

  async getHealthCheck(question) {
    return this.request('/ai-assistant/health-check', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  async getGeneralQuestion(question) {
    return this.request('/ai-assistant/general-question', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  async getConversationHistory() {
    return this.request('/ai-assistant/conversation-history');
  }

  // Articles
  async getArticlesFeed(page = 1, pageSize = 20) {
    return this.request(`/articles/feed?page=${page}&pageSize=${pageSize}`);
  }

  async getFeaturedArticles() {
    return this.request('/articles/featured');
  }

  async getArticleBySlug(slug) {
    return this.request(`/articles/slug/${slug}`);
  }

  async searchArticles(query, page = 1, pageSize = 20) {
    return this.request(`/articles/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
  }

  async getArticlesByTag(tag, page = 1, pageSize = 20) {
    return this.request(`/articles/tag/${encodeURIComponent(tag)}?page=${page}&pageSize=${pageSize}`);
  }
}

export default new ApiService();
