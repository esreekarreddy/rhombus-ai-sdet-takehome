import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('API - Upload', () => {
  const MESSY_CSV = path.resolve(__dirname, '../assets/messy.csv');

  test('POST (Intercepted) - Upload valid CSV Network Check', async ({ page }) => {
    // Replaces previous test.skip
    // Note: This test uses UI to trigger network call, verifying the API layer "Black Box" style.
    
    if (!fs.existsSync(MESSY_CSV)) test.skip(true, 'Messy CSV not found');

    // Navigate to dashboard/new project workflow
    await page.goto('/');
    
    // Create new project if needed or use existing flow
    // Simplified flow: Create Project -> Add Node -> Upload
    await page.getByText('New Project').click();
    await page.locator('input[placeholder="Enter project name"]').fill(`API_Test_${Date.now()}`);
    
    // Fix: Target button in dialog to avoid ambiguity
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
    
    await page.waitForURL(/\/workflow\/\d+/);

    await page.click('button:has-text("Add Node")');
    await page.getByText('Data Input', { exact: true }).first().click();
    
    await page.locator('text=From Device').click();
    await page.setInputFiles('input[type="file"]', MESSY_CSV);
    
    // Set up request listener (Passive Spy)
    // We don't await this, we just capture what flies by.
    const requests: any[] = [];
    const requestListener = (request: any) => {
        if ((request.method() === 'POST' || request.method() === 'PUT') && 
            (request.url().includes('upload') || request.url().includes('dataset') || request.url().includes('sign'))) {
            requests.push(request);
        }
    };
    page.on('request', requestListener);

    await page.click('button:has-text("Upload")');
    
    // Wait for UI Success (Primary Verification)
    // This ensures functionality works even if we miss the API call in spy
    await page.waitForSelector('text=uploaded successfully', { timeout: 45000 });
    
    // Log captured requests for debugging
    console.log(`Captured ${requests.length} potential upload requests.`);
    requests.forEach(r => console.log(`- [${r.method()}] ${r.url()}`));

    // Attempt to verify the API call if captured
    const uploadReq = requests.find(r => r.url().includes('upload') || r.url().includes('dataset'));
    if (uploadReq) {
        const response = await uploadReq.response();
        // It might be 200, 201, or 204
        expect(response?.status()).toBeLessThan(400);
    }
    
    // Cleanup
    page.removeListener('request', requestListener);
  });

});
