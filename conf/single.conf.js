exports.config = {
  user: process.env.LT_USERNAME || 'YOUR LAMBDATEST USERNAME',
  key: process.env.LT_ACCESS_KEY || 'YOUR LAMBDATEST ACCESS KEY',

  updateJob: false,
  specs: [
    './tests/specs/single_test.js'
  ],
  exclude: [],

  capabilities: [{
    browserName: 'chrome',
    version: '70.0',
    platform: 'WIN10',
    name: 'webdriverIO-single_test',
    build: 'webdriverIO-lambdatest',
    visual:true,
    video:true,
    console:true,
    network:true
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
  }



}

