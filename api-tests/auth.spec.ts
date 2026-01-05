import { test, expect } from '@playwright/test';

test.describe('API - Authentication', () => {
  
  test('GET /api/auth/session - Returns valid user session', async ({ request }) => {
    const response = await request.get('/api/auth/session');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('email');
    console.log('User Email:', body.user.email); // Debugging aid
  });

  test('GET /api/accounts/users/profile - Returns 401 with invalid token', async ({ playwright }) => {
    // Create a new context without auth cookies
    const newContext = await playwright.request.newContext();
    const response = await newContext.get('https://api.rhombusai.com/api/accounts/users/profile');
    // Expect 401 or 403
    expect([401, 403]).toContain(response.status());
  });

});
