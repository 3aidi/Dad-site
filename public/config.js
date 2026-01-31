// Configuration for different environments
const config = {
  // API base URL - change this for production
  API_BASE_URL: window.location.origin,
  
  // For production deployment with separate backend:
  // Uncomment and set your backend URL:
  // API_BASE_URL: 'https://your-backend.onrender.com',
};

// Export for use in other files
window.APP_CONFIG = config;
