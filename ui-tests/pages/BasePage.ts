/**
 * BasePage - Abstract base class for all Page Objects
 * Provides common utilities shared across all page objects.
 */
import { Page, TestInfo } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  protected testInfo?: TestInfo;
  private screenshotCounter = 0;
  
  constructor(page: Page) {
    this.page = page;
  }

  /** Set test info for attaching screenshots to report */
  setTestInfo(info: TestInfo) {
    this.testInfo = info;
  }

  /** Wait for all network requests to complete */
  async waitForNetworkIdle(timeout = 30000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /** Wait for URL to match pattern */
  async waitForUrl(pattern: RegExp | string, timeout = 30000) {
    await this.page.waitForURL(pattern, { timeout });
  }

  /** Click element with auto-scroll */
  async safeClick(selector: string, options?: { timeout?: number }) {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await element.click({ timeout: options?.timeout ?? 10000 });
  }

  /** Wait for element to become visible */
  async waitForVisible(selector: string, timeout = 10000) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  /** Take numbered screenshot and optionally attach to report */
  async takeScreenshot(name: string): Promise<void> {
    this.screenshotCounter++;
    const path = `test-results/screenshots/${this.screenshotCounter}_${name}.png`;
    await this.page.screenshot({ path });
    
    if (this.testInfo) {
      await this.testInfo.attach(`${this.screenshotCounter}_${name}`, {
        path,
        contentType: 'image/png'
      });
    }
  }

  /** Extract text content from element */
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() ?? '';
  }
}
