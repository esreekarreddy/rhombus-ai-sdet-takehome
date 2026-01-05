import { test, expect } from '@playwright/test';

test.describe('API - Pipeline / Projects', () => {
    
  test('GET (Intercepted) /api/dataset/projects/all - Returns project list', async ({ page }) => {
    // Strategy: Network Spy
    // Navigate to Dashboard and intercept the natural API call made by the frontend.
    // This bypasses strict cross-domain cookie/header issues.
    
    // Setup listener before navigation
    const projectListResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/dataset/projects/all') && 
        response.request().method() === 'GET' &&
        response.status() === 200
    );

    await page.goto('/');
    
    const response = await projectListResponsePromise;
    console.log('Intercepted Project List:', response.url());
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    
    if (body.length > 0) {
        expect(body[0]).toHaveProperty('id');
        expect(body[0]).toHaveProperty('name');
        console.log(`Found ${body.length} projects.`);
    }
  });

});
