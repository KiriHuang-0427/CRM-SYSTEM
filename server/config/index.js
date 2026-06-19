const path = require('path');

module.exports = {
  // Server
  PORT: process.env.PORT || 3001,
  HOST: '0.0.0.0',

  // Database
  DB_PATH: path.join(__dirname, '..', '..', 'data', 'crm.db'),

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Production server info (for deployment reference)
  PROD_SERVER_IP: '39.96.40.142',
  PROD_SERVER_PORT: 3001,

  // Uptime tracking start timestamp
  UPTIME_START: Date.now(),
};
