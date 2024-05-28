exports.config = {
  user: process.env.LT_USERNAME || "YOUR LAMBDATEST USERNAME",
  key: process.env.LT_ACCESS_KEY || "YOUR LAMBDATEST ACCESS KEY",

  updateJob: false,
  specs: ["../tests/specs/local_test.js"],
  exclude: [],

  capabilities: [
    {
      browserName: "chrome",
      version: "65.0",
      platform: "WIN10",
      name: "webdriverIO-local_test",
      build: "webdriverIO-lambdatest",
      visual: true,
      video: true,
      console: true,
      network: true,
      accessibility : true,                 // Enable accessibility testing
      accessibility.wcagVersion: 'wcag21a', // Specify WCAG version (e.g., WCAG 2.1 Level A)
      accessibility.bestPractice: false,    // Exclude best practice issues from results
      accessibility.needsReview: true       // Include issues that need review

    },
  ],

  logLevel: "info",
  coloredLogs: true,
  screenshotPath: "./errorShots/",
  baseUrl: "",
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  path: "/wd/hub",
  hostname: "hub.lambdatest.com",
  port: 80,

  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: 20000,
  },
};
