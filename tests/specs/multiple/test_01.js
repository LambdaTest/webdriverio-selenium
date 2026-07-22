var assert = require('assert');

describe('Lambdatest Demo Test', function() {
  it('Lambdatest Demo Testcase', async function () {
    await browser.url('https://www.testmuai.com/selenium-playground/todo-app/')
    const firstElement = await browser.$('*[name="li1"]');
    await firstElement.click();
    const input = await browser.$('*[id="sampletodotext"]');
    await input.setValue('Lambdatest\n');
    const title = await browser.getTitle();
    assert(title.match(/Selenium Grid Online/i));
  });
});
