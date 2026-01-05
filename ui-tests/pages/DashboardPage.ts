/**
 * DashboardPage - Handles main dashboard after login
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  private readonly selectors = {
    dashboardButton: 'text=Dashboard',
    newProjectButton: 'button:has-text("New Project")',
    searchInput: 'input[placeholder*="Search"]',
    projectNameInput: 'input[placeholder="Enter project name"]',
    createButton: 'button[type="submit"]:has-text("Create")',
    cancelButton: 'button:has-text("Cancel")',
    canvasTab: '[role="tab"]:has-text("Canvas"), button:has-text("Canvas")',
    aiBuilderTab: '[role="tab"]:has-text("AI Builder"), button:has-text("AI Builder")',
    scheduleTab: '[role="tab"]:has-text("Schedule"), button:has-text("Schedule")',
    addNodeButton: 'button:has-text("Add Node")',
    profileButton: 'button:has-text("Profile"), [aria-label*="profile"]',
    logoutLink: 'text=Logout'
  };

  /** Verify dashboard is loaded after login */
  async assertOnDashboard() {
    await expect(this.page.getByText('Dashboard').first()).toBeVisible({ timeout: 10000 });
    await expect(this.page.locator(this.selectors.newProjectButton)).toBeVisible({ timeout: 10000 });
  }

  /** Create a new project */
  async createNewProject(projectName: string) {
    await this.click(this.selectors.newProjectButton);
    await this.page.waitForSelector(this.selectors.projectNameInput, { state: 'visible' });
    await this.page.fill(this.selectors.projectNameInput, projectName);
    await this.click(this.selectors.createButton);
    await this.page.waitForURL(/\/workflow\/\d+/, { timeout: 15000 });
  }

  /** Select an existing project from sidebar */
  async selectProject(projectName: string) {
    await this.page.locator(`text=${projectName}`).first().click();
    await this.page.waitForURL(/\/workflow\/\d+/, { timeout: 15000 });
  }

  /** Switch to Canvas tab */
  async switchToCanvasTab() {
    await this.click(this.selectors.canvasTab);
  }

  /** Switch to AI Builder tab */
  async switchToAIBuilderTab() {
    await this.click(this.selectors.aiBuilderTab);
  }

  /** Open the Add Node menu */
  async openAddNodeMenu() {
    await this.click(this.selectors.addNodeButton);
  }

  /** Logout from the application */
  async logout() {
    await this.click(this.selectors.profileButton);
    await this.click(this.selectors.logoutLink);
    await this.page.waitForURL(/rhombusai\.com/);
  }
}
