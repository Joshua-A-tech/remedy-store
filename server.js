// Remedy Store Root Server Entry Point
// Forwards execution to the configured backend server

const app = require('./backend/server');

module.exports = app;