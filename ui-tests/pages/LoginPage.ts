/**
 * LoginPage - Handles Rhombus AI authentication via Auth0
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly selectors = {
    loginButtonSidebar: 'button:has-text("Log In"), a:has-text("Log In")',
    emailInput: 'input#username',
    passwordInput: 'input#password',
    loginSubmitButton: 'button[type="submit"]:has-text("Log In")',
    errorMessage: '.ulp-input-error-message, [class*="error"]',
    signupLink: 'a:has-text("Sign up")',
    forgotPasswordLink: 'a:has-text("Forgot password")'
  };

  /** Navigate to Rhombus AI homepage */
  async navigate() {
    await this.page.goto('https://rhombusai.com/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Click login button to navigate to Auth0 */
  async goToLoginPage() {
    await this.safeClick(this.selectors.loginButtonSidebar);
    await this.page.waitForURL('**/auth.rhombusai.com/**', { timeout: 15000 });
    await this.page.waitForSelector(this.selectors.emailInput, { state: 'visible', timeout: 15000 });
  }

  /** Enter credentials and submit login form */
  async login(email: string, password: string) {
    await this.page.fill(this.selectors.emailInput, email);
    await this.page.fill(this.selectors.passwordInput, password);
    await this.page.click(this.selectors.loginSubmitButton);
    await this.page.waitForURL('**/rhombusai.com/**', { timeout: 30000 });
    await this.page.getByText('Dashboard').first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Complete login flow from homepage */
  async loginFromHomepage(email: string, password: string) {
    await this.navigate();
    await this.goToLoginPage();
    await this.login(email, password);
  }

  /** Check if currently on Auth0 login page */
  async isOnLoginPage(): Promise<boolean> {
    return this.page.url().includes('auth.rhombusai.com');
  }

  /** Check if login error message is displayed */
  async hasLoginError(): Promise<boolean> {
    return await this.page.locator(this.selectors.errorMessage).isVisible();
  }

  /** Get login error message text */
  async getErrorMessage(): Promise<string> {
    return await this.getText(this.selectors.errorMessage);
  }
}
