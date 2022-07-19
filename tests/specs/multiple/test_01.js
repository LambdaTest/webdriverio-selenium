var assert = require('assert');

describe('Lambdatest Demo Test', function() {
  it('Lambdatest Demo Testcase', async function () {
    await browser.url('https://lambdatest.github.io/sample-todo-app/')
    const firstElement = await browser.$('*[name="li1"]');
    await firstElement.click();
    const input = await browser.$('*[id="sampletodotext"]');
    await input.setValue('Lambdatest\n');
    const title = await browser.getTitle();
    assert(title.match(/Sample page - lambdatest.com/i));
  });
});
