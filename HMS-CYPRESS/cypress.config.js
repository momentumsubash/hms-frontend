const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    testIsolation: false,
    viewportWidth: 1200,
    viewportHeight: 800,
    env: {
      apiUrl: 'http://localhost:3000',
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
