exports.config = {
  user: process.env.LT_USERNAME || "YOUR LAMBDATEST USERNAME",
  key: process.env.LT_ACCESS_KEY || "YOUR LAMBDATEST ACCESS KEY",

  updateJob: false,
  specs: ["./tests/specs/single_test.js"],
  exclude: [],

  maxInstances: 10,
  commonCapabilities: {
    name: "webdriverIO-parallel_test",
    build: "webdriverIO-lambdatest",
    visual: false,
    video: true,
    console: false,
    network: false,
  },

  capabilities: [
    {
      browserName: "chrome",
      version: "latest",
      platform: "WIN10",
    },
    {
      browser: "firefox",
      version: "latest",
      platform: "WIN7",
    },
    {
      browser: "internet explorer",
      version: "latest",
      platform: "WIN10",
    },
    {
      browser: "MicrosoftEdge",
      version: "latest",
      platform: "WIN10",
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

// Code to support common capabilities
exports.config.capabilities.forEach(function (caps) {
  for (var i in exports.config.commonCapabilities)
    caps[i] = caps[i] || exports.config.commonCapabilities[i];
});
