var assert = require('assert');

describe('Lambdatest Demo Test', function() {
  it('Lambdatest Demo TestCase', function () {
    browser
      .url('https://lambdatest.github.io/sample-todo-app/')
      .click('*[name="li1"]')
      .click('*[name="li2"]')
      .setValue('*[id="sampletodotext"]','Lambdatest\n');
    
    assert(browser.getTitle().match(/Sample page - lambdatest.com/i));
  });
});
