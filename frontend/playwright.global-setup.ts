import { FullConfig, chromium, firefox, webkit } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🎭 Playwright Global Setup Started');

  // Get base URL from config or environment
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5173';

  const browserName = config.projects[0]?.use?.browserName || 'chromium';

  let browserType;
  if (browserName === 'firefox') browserType = firefox;
  else if (browserName === 'webkit') browserType = webkit;
  else browserType = chromium;

  // Optional: Warm up the application
  const browser = await browserType.launch();
  const page = await browser.newPage();

  try {
    console.log('🔥 Warming up application...');
    await page.goto(baseURL, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    console.log('✅ Application is ready');
  } catch (error) {
    console.log('⚠️ Warning: Could not warm up application:', error);
  }

  await browser.close();
  console.log('🎭 Playwright Global Setup Completed');
}

export default globalSetup;
