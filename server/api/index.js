// Vercel serverless entry point. Vercel calls the exported function once per request.
// `npm run build` (TypeScript -> dist/) runs first, so we load the compiled app.
// An Express app is itself a (req, res) function, so it can be exported as the handler directly.
const { createApp } = require('../dist/app');

module.exports = createApp();
