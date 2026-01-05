/**
 * CanvasPage - Handles the workflow canvas and transformation nodes
 * 
 * Supports: Data Input, Text Case, Impute, Remove Duplicates, Sort Data, Download
 */
import { Page, Download } from '@playwright/test';
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
    downloadCsv: 'text=Download as CSV'
  };

  /** Add Data Input node from the Add Node panel */
  async addDataInputNode(): Promise<void> {
    await this.page.locator(this.selectors.addNodeButton).click();
    await this.page.waitForTimeout(500);
    await this.page.getByText('Data Input', { exact: true }).first().click();
    await this.page.waitForTimeout(1000);
  }

  /** Upload a file via "From Device" option */
  async uploadFile(filePath: string): Promise<void> {
    await this.page.locator(this.selectors.fromDevice).click();
    await this.page.waitForTimeout(500);
    await this.page.locator(this.selectors.fileInput).setInputFiles(filePath);
    await this.page.waitForTimeout(500);
    await this.page.locator(this.selectors.uploadButton).click();
    await this.page.waitForSelector(this.selectors.uploadSuccess, { timeout: 30000 });
    await this.page.waitForTimeout(1000);
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
    await this.page.waitForTimeout(500);
    await this.page.locator(this.selectors.searchInput).fill(nodeName);
    await this.page.waitForTimeout(500);
    await this.page.getByText(nodeName, { exact: true }).first().click();
    await this.page.waitForTimeout(1000);
  }

  /** Text Case: Convert column to specified case */
  async addTextCase(column: string, caseOption: 'lower' | 'UPPER' = 'lower'): Promise<void> {
    await this.addTransformationNode('Text Case');
    
    await this.page.locator('text=Select columns').first().click();
    await this.page.waitForTimeout(300);
    await this.page.getByText(column, { exact: true }).click();
    await this.page.keyboard.press('Escape');
    
    await this.page.locator('select').last().selectOption({ label: caseOption });
    await this.page.waitForTimeout(300);
    
    await this.takeScreenshot('text_case_config');
    await this.clickApply();
  }

  /** Impute: Fill missing values. Unselects specified columns from pre-selection. */
  async addImpute(columns: string[], unselectColumns: string[] = ['id']): Promise<void> {
    await this.addTransformationNode('Impute');
    
    const dropdownTrigger = this.page.locator('[class*="combobox-trigger"], [role="combobox"], svg[class*="chevron"]').first();
    if (await dropdownTrigger.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dropdownTrigger.click();
    } else {
      await this.page.locator('text=id').first().click();
    }
    await this.page.waitForTimeout(500);
    
    for (const col of unselectColumns) {
      const dropdownItem = this.page.getByRole('option', { name: col });
      if (await dropdownItem.isVisible({ timeout: 500 }).catch(() => false)) {
        await dropdownItem.click();
      } else {
        await this.page.getByText(col, { exact: true }).first().click();
      }
      await this.page.waitForTimeout(200);
    }
    
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
    
    await this.takeScreenshot('impute_config');
    await this.clickApply();
  }

  /** Remove Duplicates: Remove duplicate rows based on selected columns */
  async addRemoveDuplicates(columns: string[]): Promise<void> {
    await this.addTransformationNode('Remove Duplicates');
    
    await this.page.locator('text=Select columns').first().click();
    await this.page.waitForTimeout(300);
    
    for (const col of columns) {
      const option = this.page.getByText(col, { exact: true });
      if (await option.isVisible({ timeout: 500 }).catch(() => false)) {
        await option.click();
        await this.page.waitForTimeout(100);
      }
    }
    
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(200);
    
    await this.takeScreenshot('remove_duplicates_config');
    await this.clickApply();
  }

  /** Sort Data: Sort rows by specified column */
  async addSortData(column: string, order: 'Ascending' | 'Descending' = 'Ascending'): Promise<void> {
    await this.addTransformationNode('Sort Data');
    await this.page.locator('select').first().selectOption({ label: column });
    await this.page.waitForTimeout(300);
    await this.takeScreenshot('sort_data_config');
    await this.clickApply();
  }

  /** Click Apply button and wait for pipeline success */
  async clickApply(): Promise<void> {
    await this.page.locator(this.selectors.applyButton).first().click();
    await this.waitForPipelineSuccess();
  }

  /** Wait for pipeline execution to complete */
  async waitForPipelineSuccess(): Promise<void> {
    await this.page.waitForSelector(this.selectors.pipelineSuccess, { timeout: 60000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  /** Download results from Preview tab */
  async downloadFromPreview(): Promise<Download> {
    await this.page.locator(this.selectors.previewTab).click();
    await this.page.waitForTimeout(2000);
    await this.takeScreenshot('preview_before_download');
    
    await this.page.locator(this.selectors.downloadDropdown).click();
    await this.page.waitForTimeout(300);
    
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 30000 }),
      this.page.locator(this.selectors.downloadCsv).click()
    ]);
    
    return download;
  }
}
