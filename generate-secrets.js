// Generate secure secrets for production
const crypto = require('crypto');

console.log('\n🔐 PRODUCTION SECRETS GENERATOR\n');
console.log('Copy these values to your .env.production or hosting environment variables:\n');

console.log('JWT_SECRET (64 bytes hex):');
console.log(crypto.randomBytes(64).toString('hex'));

console.log('\n---');

console.log('\nADMIN_PASSWORD recommendation:');
console.log('Use a password manager to generate a strong password (20+ characters)');
console.log('Example: ' + crypto.randomBytes(16).toString('base64'));

console.log('\n---');

console.log('\n✅ Instructions:');
console.log('1. Copy the JWT_SECRET above');
console.log('2. Set it in your hosting provider environment variables');
console.log('3. Create a strong ADMIN_PASSWORD (different from the one above)');
console.log('4. Never commit these values to Git');
console.log('5. Store securely in password manager\n');
