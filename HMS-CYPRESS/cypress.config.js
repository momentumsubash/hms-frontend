const { defineConfig } = require("cypress");

module.exports = defineConfig({
  reporter: "mochawesome",
  reporterOptions: {
    reportDir: "mochawesome-report",
    reportFilename: "mochawesome",
    overwrite: true,
    html: true,
    json: true,
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },
  e2e: {
    testIsolation: false,
    viewportWidth: 1200,
    viewportHeight: 800,
    baseUrl: "http://localhost:30006",
    requestTimeout: 15000,
    responseTimeout: 15000,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      apiUrl: "http://localhost:30005",
    },
  },
});
