const config = require('./app.json').expo;
module.exports = {
  ...config,
  web: { ...config.web, output: 'single', name: 'AutoLog — Combustível e gastos' },
  experiments: { ...config.experiments, baseUrl: process.env.EXPO_PUBLIC_BASE_PATH || '' },
};
