import { chromium } from '@playwright/test';
import * as path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: false });
  // Use existing auth state to skip login
  const fs = require('fs');
  const authFile = path.resolve(__dirname, '../.auth/user.json');
  let context;
  
  if (fs.existsSync(authFile)) {
      console.log('Using existing auth state from .auth/user.json');
      context = await browser.newContext({ storageState: authFile });
  } else {
      console.log('No auth state found, starting fresh (may fail if login logic is flaky)');
      context = await browser.newContext();
  }

  const page = await context.newPage();

  console.log('--- STARTING NETWORK SNIFFER ---');

  // Log all interesting API requests
  page.on('request', request => {
    if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') {
      const url = request.url();
      console.log(`[${request.method()}] ${request.url()}`);
      if (request.method() === 'POST' && request.url().includes('upload')) {
           console.log('  Headers:', request.headers());
      }
    }
  });

  try {
    // 1. Go to Dashboard (Skipping login UI flow)
    console.log('\n--- NAVIGATING TO DASHBOARD ---');
    await page.goto('https://rhombusai.com/');
    // Wait for network idle or dashboard element
    await page.getByText('Dashboard').first().waitFor({ state: 'visible', timeout: 30000 });

    // 2. Upload Flow
    console.log('\n--- UPLOADING FILE ---');
    // Ensure we are on the canvas or can find the Add Node button
    if (await page.locator('button:has-text("Add Node")').isVisible()) {
        await page.locator('button:has-text("Add Node")').click();
    } else {
        // Create new project if needed
        await page.getByText('New Project').click();
        await page.locator('input[placeholder="Enter project name"]').fill(`Sniff_${Date.now()}`);
        await page.click('button:has-text("Create")');
        await page.waitForURL(/\/workflow\/\d+/);
        await page.locator('button:has-text("Add Node")').click();
    }
    
    await page.getByText('Data Input', { exact: true }).first().click();
    
    const MESSY_CSV = path.resolve(__dirname, '../assets/messy.csv');
    // Wait for the "From Device" option
    await page.locator('text=From Device').first().click();
    
    // Start listening for the specific upload event we care about
    // We already log everything, so just proceed
    
    await page.setInputFiles('input[type="file"]', MESSY_CSV);
    const uploadBtn = page.locator('button:has-text("Upload")');
    await uploadBtn.click();
    
    // CRITICAL: Wait for the success message to ensure the request is fully sent and response received
    await page.waitForSelector('text=uploaded successfully', { timeout: 30000 });
    console.log('--- UPLOAD COMPLETED ---');

    // 3. Pipeline / Preview
    console.log('\n--- CHECKING PIPELINE ---');
    await page.getByText('messy.csv', { exact: true }).click();
    await page.waitForSelector('text=Pipeline execution completed successfully');

  } catch (error) {
    console.error('Error during sniffing:', error);
  } finally {
    console.log('\n--- FINISHED ---');
    // await browser.close(); // Keep open to inspect if needed, or close. 
    // Let's close it to be clean.
    await browser.close();
  }
})();
