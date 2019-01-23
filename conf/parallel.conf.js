exports.config = {
  user: process.env.LT_USERNAME || 'YOUR LAMBDATEST USERNAME',
  key: process.env.LT_ACCESS_KEY || 'YOUR LAMBDATEST ACCESS KEY',

  updateJob: false,
  specs: [
    './tests/specs/single_test.js'
  ],
  exclude: [],

  maxInstances: 10,
  commonCapabilities: {
    name: 'webdriverIO-parallel_test',
    build: 'webdriverIO-lambdatest',
    visual:true,
    video:true,
    console:true,
    network:true
  },

  capabilities: [{
    browserName: 'chrome',
    version: '65.0',
    platform: 'WIN10'
  },{
    browser: 'firefox',
    version: '64.0',
    platform: 'WIN7',
  },{
    browser: 'internet explorer'
    version: '10.0',
    platform: 'WIN10',
  },{
    browser: 'MicrosoftEdge'
    version: '18.0',
    platform: 'WIN10',
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

// Code to support common capabilities
exports.config.capabilities.forEach(function(caps){
  for(var i in exports.config.commonCapabilities) caps[i] = caps[i] || exports.config.commonCapabilities[i];
});

