import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Authentication Setup
 * 
 * Runs before all browser tests to establish an authenticated session.
 * Saves the session to `.auth/user.json` for reuse by other tests.
 */

const authFile = '.auth/user.json';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  const email = process.env.RHOMBUS_EMAIL;
  const password = process.env.RHOMBUS_PASSWORD;
  
  if (!email || !password) {
    throw new Error('RHOMBUS_EMAIL and RHOMBUS_PASSWORD must be set in .env file');
  }
  
  // Complete the login flow
  await loginPage.loginFromHomepage(email, password);
  
  // Verify dashboard is visible
  await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('New Project')).toBeVisible({ timeout: 10000 });
  
  // Save session for other tests
  await page.context().storageState({ path: authFile });
});
