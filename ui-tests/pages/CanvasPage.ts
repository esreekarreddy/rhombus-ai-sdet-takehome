/**
 * CanvasPage - Handles the workflow canvas and transformation nodes
 * 
 * Supports: Data Input, Text Case, Impute, Remove Duplicates, Sort Data, Download
 */
import { Page, Download, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CanvasPage extends BasePage {
  private readonly selectors = {
    addNodeButton: 'button:has-text("Add Node")',
    previewTab: 'button:has-text("Preview")',
    searchInput: 'input[placeholder*="Search transformations"]',
    applyButton: '#right-sidebar-apply-btn, button:has-text("Apply")',
    fromDevice: 'text=From Device',
    fileInput: 'input[type="file"]',
    uploadButton: 'button:has-text("Upload")',
    pipelineSuccess: 'text=Pipeline execution completed successfully',
    uploadSuccess: 'text=uploaded successfully',
    downloadDropdown: 'button:has-text("Download")',
    downloadCsv: 'text=Download as CSV',
    nodePanel: '[class*="node-panel"], [class*="add-node"]'
  };

  /** Add Data Input node from the Add Node panel */
  async addDataInputNode(): Promise<void> {
    await this.page.locator(this.selectors.addNodeButton).click();
    await this.page.waitForSelector(this.selectors.searchInput, { timeout: 5000 });
    await this.page.getByText('Data Input', { exact: true }).first().click();
    await this.page.waitForSelector('text=Data Input', { timeout: 5000 });
  }

  /** Upload a file via "From Device" option */
  async uploadFile(filePath: string): Promise<void> {
    await this.page.locator(this.selectors.fromDevice).click();
    await this.page.waitForSelector(this.selectors.fileInput, { state: 'attached', timeout: 5000 });
    await this.page.locator(this.selectors.fileInput).setInputFiles(filePath);
    await this.page.locator(this.selectors.uploadButton).click();
    // Wait for upload to complete
    await this.page.waitForSelector(this.selectors.uploadSuccess, { timeout: 30000 });
  }

  /** Bind the uploaded dataset by clicking its filename */
  async bindDataset(fileName: string): Promise<void> {
    await this.page.getByText(fileName, { exact: true }).click();
    await this.waitForPipelineSuccess();
    await this.takeScreenshot('data_input_bound');
  }

  /** Add a transformation node by searching */
  private async addTransformationNode(nodeName: string): Promise<void> {
    await this.page.locator(this.selectors.addNodeButton).click();
    await this.page.waitForSelector(this.selectors.searchInput, { timeout: 5000 });
    await this.page.locator(this.selectors.searchInput).fill(nodeName);
    // Application needs a moment to filter results
    await this.page.getByText(nodeName, { exact: true }).first().click();
    await this.page.waitForSelector(`text=${nodeName}`, { timeout: 5000 });
  }

  /** Text Case: Convert column to specified case */
  async addTextCase(column: string, caseOption: 'lower' | 'UPPER' = 'lower'): Promise<void> {
    await this.addTransformationNode('Text Case');
    
    await this.page.waitForSelector('text=Select columns', { timeout: 5000 });
    await this.page.locator('text=Select columns').first().click();
    await this.page.getByText(column, { exact: true }).click();
    await this.page.keyboard.press('Escape');
    
    // Select case option
    await this.page.locator('select').last().selectOption({ label: caseOption });
    
    await this.takeScreenshot('text_case_config');
    await this.clickApply();
  }

  /** Impute: Fill missing values. Unselects specified columns from pre-selection. */
  async addImpute(columns: string[], unselectColumns: string[] = ['id']): Promise<void> {
    await this.addTransformationNode('Impute');
    
    await this.page.waitForSelector('text=Target Columns', { timeout: 5000 });
    
    const dropdownTrigger = this.page.locator('[class*="combobox-trigger"], [role="combobox"], svg[class*="chevron"]').first();
    if (await dropdownTrigger.isVisible({ timeout: 1000 })) {
      await dropdownTrigger.click();
    } else {
      await this.page.locator('text=id').first().click();
    }
    
    for (const col of unselectColumns) {
      const dropdownItem = this.page.getByRole('option', { name: col });
      if (await dropdownItem.isVisible({ timeout: 500 })) {
        await dropdownItem.click();
      } else {
        await this.page.getByText(col, { exact: true }).first().click();
      }
    }
    
    await this.page.keyboard.press('Escape');
    
    await this.takeScreenshot('impute_config');
    await this.clickApply();
  }

  /** Remove Duplicates: Remove duplicate rows based on selected columns */
  async addRemoveDuplicates(columns: string[]): Promise<void> {
    await this.addTransformationNode('Remove Duplicates');
    
    // Wait for configuration panel
    await this.page.waitForSelector('text=Select columns', { timeout: 5000 });
    await this.page.locator('text=Select columns').first().click();

    
    for (const col of columns) {
      const option = this.page.getByText(col, { exact: true });
      if (await option.isVisible({ timeout: 500 })) {
        await option.click();
      }
    }
    
    await this.page.keyboard.press('Escape');
    
    await this.takeScreenshot('remove_duplicates_config');
    await this.clickApply();
  }

  /** Sort Data: Sort rows by specified column */
  async addSortData(column: string, order: 'Ascending' | 'Descending' = 'Ascending'): Promise<void> {
    await this.addTransformationNode('Sort Data');
    
    // Wait for configuration panel
    await this.page.waitForSelector('select', { timeout: 5000 });
    await this.page.locator('select').first().selectOption({ label: column });
    await this.takeScreenshot('sort_data_config');
    await this.clickApply();
  }

  /** Click Apply button and wait for pipeline success */
  async clickApply(): Promise<void> {
    const applyButton = this.page.locator(this.selectors.applyButton).first();
    // Wait for Apply button to be enabled
    await expect(applyButton).toBeEnabled({ timeout: 5000 });
    await applyButton.click();
    await this.waitForPipelineSuccess();
  }

  /** Wait for pipeline execution to complete */
  async waitForPipelineSuccess(): Promise<void> {
    await this.page.waitForSelector(this.selectors.pipelineSuccess, { timeout: 60000 });
    // Brief stabilization wait after success message appears
    await this.page.waitForTimeout(500);
  }

  /** Download results from Preview tab */
  async downloadFromPreview(): Promise<Download> {
    await this.page.locator(this.selectors.previewTab).click();
    // Wait for preview data to load
    await this.page.waitForSelector('table, [class*="preview"]', { timeout: 10000 });
    
    await this.takeScreenshot('preview_before_download');
    
    await this.page.locator(this.selectors.downloadDropdown).click();
    // Wait for dropdown menu
    await this.page.waitForSelector(this.selectors.downloadCsv, { timeout: 3000 });
    
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 30000 }),
      this.page.locator(this.selectors.downloadCsv).click()
    ]);
    
    return download;
  }
}
