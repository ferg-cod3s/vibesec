/**
 * Database Configuration - Contains Hardcoded Secrets
 * WARNING: This code is intentionally vulnerable for testing purposes
 */

// VULNERABILITY #3: Hardcoded Secret (MEDIUM severity)
// Credentials should NEVER be hardcoded in source code
// Note: These are FAKE credentials for testing purposes only
const password = "MySecretP@ssw0rd123";
const apiKey = "fake_stripe_live_1234567890abcdefghijklmnop";
const dbConnectionString = "mongodb://admin:SuperSecret123@localhost:27017/myapp";

// More subtle variations that should also be detected
const config = {
  database: {
    host: 'localhost',
    port: 5432,
    username: 'dbadmin',
    password: 'Pr0ductionP@ssw0rd!',  // Hardcoded password
    database: 'production_db'
  },
  aws: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',  // Hardcoded AWS key
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'  // Hardcoded AWS secret
  },
  jwt: {
    secret: 'my-super-secret-jwt-key-12345'  // Hardcoded JWT secret
  },
  stripe: {
    apiKey: 'fake_stripe_test_key_1234567890EXAMPLE'  // Hardcoded Stripe key (FAKE FOR TESTING)
  }
};

// SECURE EXAMPLE (for contrast - should not trigger alerts)
const secureConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,  // Correct: from environment variable
    database: process.env.DB_NAME
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  jwt: {
    secret: process.env.JWT_SECRET
  }
};

// Function that might look like it has secrets but doesn't (edge case)
function generateRandomPassword(length = 16) {
  // This is NOT a hardcoded secret, it's a password generator
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  return password;
}

module.exports = {
  config,
  secureConfig,
  generateRandomPassword
};
