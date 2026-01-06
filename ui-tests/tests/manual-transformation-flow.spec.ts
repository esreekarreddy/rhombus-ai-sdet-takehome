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
  expectedOutputRows: 24,
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

  test('@smoke @critical Complete transformation workflow', async ({ page }, testInfo) => {
    const dashboard = new DashboardPage(page);
    const canvas = new CanvasPage(page);
    canvas.setTestInfo(testInfo);

    await test.step('Navigate to Dashboard', async () => {
      await page.goto('https://rhombusai.com/');
      await dashboard.assertOnDashboard();
      await expect(page.getByText('Dashboard')).toBeVisible();
      await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible();
    });

    await test.step('Create new project', async () => {
      const projectName = `Test_${Date.now()}`;
      await dashboard.createNewProject(projectName);
      await expect(page).toHaveURL(/\/workflow\/\d+/);
      await expect(page.locator('[data-testid="toolbar-plus"]')).toBeVisible();
    });

    await test.step('Add Data Input and upload file', async () => {
      await canvas.addDataInputNode();
      await expect(page.getByRole('listitem').filter({ hasText: 'Data Input' })).toBeVisible();
      
      await canvas.uploadFile(MESSY_CSV);
      await canvas.bindDataset(CONFIG.inputFile);
      await expect(page.getByText('Pipeline execution completed')).toBeVisible({ timeout: 10000 });
    });

    await test.step('Add Text Case (status → lowercase)', async () => {
      await canvas.addTextCase(CONFIG.textCase.column, CONFIG.textCase.option);
      await expect(page.getByText('Text Case').first()).toBeVisible();
    });

    await test.step('Add Impute (age, salary)', async () => {
      await canvas.addImpute(CONFIG.impute);
      await expect(page.getByText('Impute').first()).toBeVisible();
    });

    await test.step('Add Remove Duplicates', async () => {
      await canvas.addRemoveDuplicates(CONFIG.removeDuplicates);
      await expect(page.getByText('Remove Duplicates').first()).toBeVisible();
    });

    await test.step('Add Sort Data (by name)', async () => {
      await canvas.addSortData(CONFIG.sortData.column, CONFIG.sortData.order);
      await expect(page.getByText('Sort Data').first()).toBeVisible();
    });

    await test.step('Click Apply to run the pipeline', async () => {
      await canvas.clickApply();
    });
    
    await test.step('Download and validate output', async () => {
      const download = await canvas.downloadFromPreview();
      const downloadPath = path.join(DOWNLOAD_DIR, CONFIG.outputFile);
      await download.saveAs(downloadPath);
      
      // File existence
      expect(fs.existsSync(downloadPath), 'Downloaded file should exist').toBeTruthy();
      
      // File not empty
      const fileSize = fs.statSync(downloadPath).size;
      expect(fileSize, 'File should not be empty').toBeGreaterThan(0);
      
      // Row count validates Remove Duplicates worked
      const fileContent = fs.readFileSync(downloadPath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      const dataRows = lines.length - 1;
      expect(dataRows, `Expected ${CONFIG.expectedOutputRows} rows after deduplication`).toBe(CONFIG.expectedOutputRows);
      
      // Schema validates structure preserved
      const header = lines[0];
      expect(header).toContain('id');
      expect(header).toContain('name');
      expect(header).toContain('status');
    });
  });
});
