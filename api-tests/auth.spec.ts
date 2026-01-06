/**
 * API Tests - Authentication
 * 
 * Tests session validation and unauthorized access handling
 */
import { test, expect } from '@playwright/test';

test.describe('API - Authentication', () => {
  
  test('@smoke @api Valid session returns user data', async ({ request }) => {
    const response = await request.get('/api/auth/session');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('email');
  });

  test('@negative @api Invalid token returns 401', async ({ playwright }) => {
    // Create a new context without auth cookies
    const newContext = await playwright.request.newContext();
    const response = await newContext.get('https://api.rhombusai.com/api/accounts/users/profile');
    expect([401, 403]).toContain(response.status());
  });

});
