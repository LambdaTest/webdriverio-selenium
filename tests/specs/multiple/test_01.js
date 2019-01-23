var assert = require('assert');

describe('Lambdatest Demo Test', function() {
  it('Lambdatest Demo Testcase', function () {
    browser
      .url('https://lambdatest.github.io/sample-todo-app/')
      .click('*[name="li1"]')
      .setValue('*[id="sampletodotext"]','Lambdatest\n');
    
    assert(browser.getTitle().match(/Sample page - lambdatest.com/i));
  });
});
