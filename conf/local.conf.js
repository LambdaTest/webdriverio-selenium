exports.config = {
  user: process.env.LT_USERNAME || 'YOUR LAMBDATEST USERNAME',
  key: process.env.LT_ACCESS_KEY || 'YOUR LAMBDATEST ACCESS KEY',

  updateJob: false,
  specs: [
    './tests/specs/local_test.js'
  ],
  exclude: [],

  capabilities: [{
    browserName: 'chrome',
    version: '65.0',
    platform: 'WIN10',
    name: 'webdriverIO-local_test',
    build: 'webdriverIO-lambdatest'
  }],

  logLevel: 'verbose',
  coloredLogs: true,
  screenshotPath: './errorShots/',
  baseUrl: '',
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  host: 'hub.lambdatest.com',
  port:'80',

  framework: 'mocha',
  mochaOpts: {
      ui: 'bdd'
  },

  
}
