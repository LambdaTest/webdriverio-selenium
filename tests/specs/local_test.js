var assert = require('assert');

describe('Lambdatest Local Testing', function() {
  it('can check tunnel working', async function () {
    await browser.url('http://localhost.lambdatest.com/todo.html')
    const firstElement = await browser.$('*[name="li1"]');
    await firstElement.click();
    const secondElement = await browser.$('*[name="li2"]');
    await secondElement.click();
    const input = await browser.$('*[id="sampletodotext"]');
    await input.setValue('Lambdatest\n');
    const title = await browser.getTitle();
    assert(title.match(/Sample page - lambdatest.com/i));
  });
});
