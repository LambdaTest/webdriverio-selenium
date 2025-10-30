exports.config = {
  user: process.env.LT_USERNAME || "YOUR LAMBDATEST USERNAME",
  key: process.env.LT_ACCESS_KEY || "YOUR LAMBDATEST ACCESS KEY”,

    updateJob: false,
    specs: ["../tests/specs/single_test.js"],
    exclude: [],

    capabilities: [
      {
        browserName: "chrome",
        browserVersion: "latest",
        platformName: "Windows 10",
        name: "webdriverIO-single_test",
        build: "webdriverIO-lambdatest",
        visual: false,
        video: true,
        console: false,
        network: false,
        accessibility: false,
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