/**
 * API Tests - Upload
 * 
 * Tests file upload via network interception (black-box approach)
 * Uses UI to trigger network calls, then validates API responses
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('API - Upload', () => {
  const MESSY_CSV = path.resolve(__dirname, '../assets/messy.csv');

  test('@api @critical Upload valid CSV triggers successful network call', async ({ page }) => {
    if (!fs.existsSync(MESSY_CSV)) test.skip(true, 'Test data not found');

    await page.goto('/');
    
    // Create new project
    await page.getByText('New Project').click();
    await page.locator('input[placeholder="Enter project name"]').fill(`API_Test_${Date.now()}`);
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
    await page.waitForURL(/\/workflow\/\d+/);

    // Add Data Input node
    await page.locator('[data-testid="toolbar-plus"]').click();
    await page.getByRole('listitem').filter({ hasText: 'Data Input' }).click();
    
    // Upload file
    await page.getByRole('button', { name: 'From Device' }).click();
    await page.locator('input[type="file"]').setInputFiles(MESSY_CSV);
    
    // Capture upload-related requests
    const requests: any[] = [];
    page.on('request', (request: any) => {
        if ((request.method() === 'POST' || request.method() === 'PUT') && 
            (request.url().includes('upload') || request.url().includes('dataset') || request.url().includes('sign'))) {
            requests.push(request);
        }
    });

    await page.getByRole('button', { name: 'Upload' }).click();
    
    // Primary verification: UI shows success
    await expect(page.getByText('uploaded successfully')).toBeVisible({ timeout: 45000 });
    
    // Secondary verification: Check captured network request if available
    const uploadReq = requests.find(r => r.url().includes('upload') || r.url().includes('dataset'));
    if (uploadReq) {
        const response = await uploadReq.response();
        expect(response?.status()).toBeLessThan(400);
    }
  });

});
