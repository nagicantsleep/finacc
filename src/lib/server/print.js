import { chromium } from 'playwright';

function originFromEnv() {
  const port = process.env.PORT || '3010';
  const base = process.env.ORIGIN || `http://localhost:${port}`;
  return base.endsWith('/') ? base : `${base}/`;
}

export async function htmlToPdf(fullHTML) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(fullHTML, {
      waitUntil: 'load',
      timeout: 30000
    });
    await page.setViewportSize({
      width: Math.round(210 / 0.264583),
      height: Math.round(297 / 0.264583)
    });
    return await page.pdf({
      width: '210mm',
      height: '297mm',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      scale: 1.0
    });
  } finally {
    await browser.close();
  }
}

export { originFromEnv };
