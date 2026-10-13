const express = require('express');
const path = require('node:path');
const { initDatabase } = require('./db/schema');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Initialize database schema
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON payloads
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// API 404 handler for unmatched /api routes
app.use('/api', notFoundHandler);

// Serve static frontend assets (HTML, CSS, JS) from project root
const PUBLIC_DIR = path.resolve(__dirname, '..');
app.use(express.static(PUBLIC_DIR));

// Fallback to index.html for SPA page navigation (client-side routing)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  }
  next();
});

// Global Error Handler
app.use(errorHandler);

const { getDbPath } = require('./db/connection');

let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`  PocketPilot Server is running!`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  API: http://localhost:${PORT}/api/dashboard`);
    console.log(`  DB:  ${getDbPath()}`);
    console.log(`=============================================`);
  });
}

module.exports = { app, server };
