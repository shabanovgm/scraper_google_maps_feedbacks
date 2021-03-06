const puppeteer = require('puppeteer');
const fs = require('fs');
const selectors = require('./config/config');

// const url = 'https://www.google.com/maps?cid=16168151796978303235';
const url = 'https://maps.google.com/?cid=886914967876382475';

(async () => {
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  // const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.bringToFront();
  await page.waitForSelector(selectors.TITLE);
  let resultText = {}

  resultText.title = await page.$eval(selectors.TITLE, el => el.innerText);

  resultText.sub_title = await page.$eval(selectors.SUB_TITLE, el => el.innerText);

  resultText.count_feedback = await page.$eval(selectors.FEEDBACK_COUNT, el => el.innerText.split(':')[1].trim());
  // go to feedback
  await page.click(selectors.BUTTON_FEEDBACK);
  await page.waitForSelector(selectors.FEEDBACK_LIST);
  // scroll
  async function scroll(selectors) {
    await page.evaluate((selectors) => {
      let to = window.document.getElementsByClassName(selectors.FEEDBACK_LIST_IN_BROWSER_WINDOW)[0].scrollHeight
      window.document.getElementsByClassName(selectors.FEEDBACK_LIST_IN_BROWSER_WINDOW)[0].scrollTo(0, to);
    }, selectors);
    try {
      let toScroll = await page.$eval(selectors.FEEDBACK_LOAD, (el) => el.innerHTML);
      if (toScroll) await scroll(selectors)
    } catch (error) {
      console.log(`End scroll`);
    }
  }
  await scroll(selectors)

  // Press all buttons "more" 
  await page.$$eval(selectors.MORE_FEDDBACK_CONTENT, els => els.map(el => el.click()));
  // Parse every review and form the object
  const array_feedback = await page.$$eval(`.${selectors.CURRENT_FEEDBACKS}`, (els, selectors) => els.map((el) => {
    let feedback = {};
    let href = el.querySelectorAll(selectors.FEEDBACK_ACCOUNT_HREF)[1];
    feedback.account_href = href.href;
    feedback.account_name = href.querySelector(selectors.FEEDBACK_ACCOUNT_NAME).innerText;

    feedback.stars = el.querySelector(selectors.FEEDBACK_STARS).attributes[0].value;

    feedback.date = el.querySelector(selectors.FEEDBACK_DATE).innerText;

    feedback.cotent = el.querySelector(selectors.FEEDBACK_CONTENT).innerText;

    feedback.owner_response_date = el.querySelector(selectors.FEEDBACK_OWNER_RESPONSE_DATE).innerText;
    feedback.owner_response_content = el.querySelector(selectors.FEEDBACK_OWNER_RESPONSE_CONTENT).innerText;
    return feedback;
  }), selectors);

  resultText.feedbacks = array_feedback;
  fs.writeFile("file.json", JSON.stringify(resultText), function (err) {
    if (err) throw err;
  })
  await browser.close();
  console.log('Success')
})();