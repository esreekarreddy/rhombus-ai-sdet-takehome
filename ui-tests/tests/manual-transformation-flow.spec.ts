/**
 * Manual Transformation Flow - End-to-End Test
 * 
 * Tests the complete manual transformation workflow:
 * Upload → Text Case → Impute → Remove Duplicates → Sort → Download
 * 
 * Input: 25 rows with NULLs, mixed case, 1 duplicate
 * Output: 24 rows, cleaned and sorted
 */
import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { CanvasPage } from '../pages/CanvasPage';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG = {
  inputFile: 'messy.csv',
  outputFile: 'cleaned_data.csv',
  expectedInputRows: 25,
  expectedOutputRows: 24, // 25 - 1 duplicate
  textCase: { column: 'status', option: 'lower' as const },
  impute: ['age', 'salary'],
  removeDuplicates: ['id', 'name', 'email', 'age', 'salary', 'department', 'status'],
  sortData: { column: 'name', order: 'Ascending' as const }
};

test.describe('Manual Transformation Flow', () => {
  const MESSY_CSV = path.resolve(__dirname, '../../assets/messy.csv');
  const DOWNLOAD_DIR = path.resolve(__dirname, '../../test-results/downloads');
  const SCREENSHOTS_DIR = path.resolve(__dirname, '../../test-results/screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(MESSY_CSV)) throw new Error(`Test data not found: ${MESSY_CSV}`);
    if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('@smoke Complete transformation workflow', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const canvas = new CanvasPage(page);
    canvas.setTestInfo(testInfo);

    // Step 1: Navigate to Dashboard
    await test.step('Navigate to Dashboard', async () => {
      await page.goto('https://rhombusai.com/');
      await dashboard.assertOnDashboard();
      
      await expect(page.getByText('Dashboard')).toBeVisible();
      await expect(page.locator('button:has-text("New Project")')).toBeVisible();
    });

    // Step 2: Create new project
    await test.step('Create new project', async () => {
      const projectName = `Test_${Date.now()}`;
      await dashboard.createNewProject(projectName);
      
      await expect(page.locator('button:has-text("Add Node")')).toBeVisible();
    });

    // Step 3: Add Data Input and upload file
    await test.step('Add Data Input and upload file', async () => {
      await canvas.addDataInputNode();
      
      await expect(page.locator('text=Data Input').first()).toBeVisible();
      
      await canvas.uploadFile(MESSY_CSV);
      await canvas.bindDataset(CONFIG.inputFile);
      
      await expect(page.locator('text=Pipeline execution completed successfully')).toBeVisible({ timeout: 5000 });
    });

    // Step 4: Text Case transformation
    await test.step('Add Text Case (status → lowercase)', async () => {
      await canvas.addTextCase(CONFIG.textCase.column, CONFIG.textCase.option);
      
      await expect(page.locator('text=Text Case').first()).toBeVisible();
    });

    // Step 5: Impute transformation
    await test.step('Add Impute (age, salary)', async () => {
      await canvas.addImpute(CONFIG.impute);
      
      await expect(page.locator('text=Impute').first()).toBeVisible();
    });

    // Step 6: Remove Duplicates transformation
    await test.step('Add Remove Duplicates', async () => {
      await canvas.addRemoveDuplicates(CONFIG.removeDuplicates);
      
      await expect(page.locator('text=Remove Duplicates').first()).toBeVisible();
    });

    // Step 7: Sort Data transformation
    await test.step('Add Sort Data (by name)', async () => {
      await canvas.addSortData(CONFIG.sortData.column, CONFIG.sortData.order);
      
      await expect(page.locator('text=Sort Data').first()).toBeVisible();
    });

    // Step 8: Download and validate
    await test.step('Download cleaned data', async () => {
      const download = await canvas.downloadFromPreview();
      const downloadPath = path.join(DOWNLOAD_DIR, CONFIG.outputFile);
      await download.saveAs(downloadPath);
      
      expect(fs.existsSync(downloadPath), 'Downloaded file should exist').toBeTruthy();
      
      const fileSize = fs.statSync(downloadPath).size;
      expect(fileSize, 'Downloaded file should not be empty').toBeGreaterThan(0);
      
      const fileContent = fs.readFileSync(downloadPath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      const dataRows = lines.length - 1; // Subtract header row
      expect(dataRows, `Expected ${CONFIG.expectedOutputRows} data rows`).toBe(CONFIG.expectedOutputRows);
      
      const header = lines[0];
      expect(header).toContain('id');
      expect(header).toContain('name');
      expect(header).toContain('status');
    });
  });
});
