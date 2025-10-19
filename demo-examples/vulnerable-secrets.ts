/**
 * Demo Example: Hardcoded Secrets
 *
 * This file demonstrates hardcoded credentials and API keys
 * commonly found in AI-generated configuration files
 */

// VULNERABLE: Hardcoded API key
export const config = {
  // OpenAI API key exposed
  apiKey: 'sk-1234567890abcdefghijklmnopqrstuvwxyz',

  // Database credentials hardcoded
  database: {
    host: 'localhost',
    user: 'admin',
    password: 'admin123',
    database: 'production',
  },

  // JWT secret key exposed
  jwt: {
    secret: 'my-super-secret-key',
    expiresIn: '1h',
  },

  // AWS credentials
  aws: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1',
  },
};

// VULNERABLE: Private key in code
const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8Cq4YJfW9dHzV8HF4z3eE+
-----END RSA PRIVATE KEY-----`;

// VULNERABLE: Slack webhook URL
const slackWebhook = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX';

// VULNERABLE: Stripe secret key (EXAMPLE - not a real key)
const stripeSecret = 'sk_live_EXAMPLE_NOT_A_REAL_KEY_1234567890';

export { privateKey, slackWebhook, stripeSecret };
