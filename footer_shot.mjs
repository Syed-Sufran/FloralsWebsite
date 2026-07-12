import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1200);
await page.screenshot({
  path: 'C:/Users/syeds/.gemini/antigravity-ide/brain/39e86c01-6949-47d9-a6d5-909d5cf94a68/footer_mobile_verify.png'
});
const footer = page.locator('#site-footer');
await footer.screenshot({
  path: 'C:/Users/syeds/.gemini/antigravity-ide/brain/39e86c01-6949-47d9-a6d5-909d5cf94a68/footer_element_verify.png'
});
await browser.close();
console.log('done');
