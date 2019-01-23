var assert = require('assert');

describe('Lambdatest Local Testing', function() {
  it('can check tunnel working', function () {
    browser
      .url('http://lt-local.com:8080/check')
      .click('*[name="li1"]')
      .click('*[name="li2"]')
      .setValue('*[id="sampletodotext"]','Lambdatest\n');
    
    assert(browser.getTitle().match(/Sample page - lambdatest.com/i));
  });
});
