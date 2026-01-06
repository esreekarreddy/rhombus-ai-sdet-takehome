/**
 * API Tests - Pipeline / Projects
 * 
 * Tests project list retrieval via network interception
 */
import { test, expect } from '@playwright/test';

test.describe('API - Pipeline / Projects', () => {
    
  test('@smoke @api Project list returns valid data', async ({ page }) => {
    // Strategy: Intercept the API call made when Dashboard loads
    const projectListResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/dataset/projects/all') && 
        response.request().method() === 'GET' &&
        response.status() === 200
    );

    await page.goto('/');
    
    const response = await projectListResponsePromise;
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    
    if (body.length > 0) {
        expect(body[0]).toHaveProperty('id');
        expect(body[0]).toHaveProperty('name');
    }
  });

});
