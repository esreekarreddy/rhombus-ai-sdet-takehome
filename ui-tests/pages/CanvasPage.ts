/**
 * CanvasPage - Handles workflow canvas and transformation nodes
 * 
 * This page object manages the visual workflow builder where users:
 * 1. Add Data Input nodes and upload files
 * 2. Configure transformations (Text Case, Impute, Remove Duplicates, Sort)
 * 3. Preview and download transformed data
 */
import { Page, Download, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CanvasPage extends BasePage {
  private readonly selectors = {
    addNodeButton: '[data-testid="toolbar-plus"]',
    searchInput: '[placeholder="Search transformations..."]',
    applyButton: 'button:has-text("Apply")',
    pipelineSuccess: 'text=Pipeline execution completed',
    previewTab: 'role=tab[name="Preview"]',
    downloadButton: 'role=button[name="Download"]',
    downloadCsv: 'role=menuitem[name="Download as CSV"]'
  };

  /**
   * Adds a Data Input node to the canvas
   */
  async addDataInputNode(): Promise<void> {
    await this.page.locator(this.selectors.addNodeButton).click();
    await this.page.getByRole('listitem').filter({ hasText: 'Data Input' }).click();
  }

  /**
   * Uploads a file via the "From Device" option
   */
  async uploadFile(filePath: string): Promise<void> {
    await this.page.getByRole('button', { name: 'From Device' }).click();
    await this.page.locator('input[type="file"]').setInputFiles(filePath);
    await this.page.getByRole('button', { name: 'Upload' }).click();
  }

  /**
   * Binds the uploaded dataset by clicking its filename
   */
  async bindDataset(fileName: string): Promise<void> {
    await this.page.locator('div').filter({ hasText: new RegExp(`^${fileName}$`) }).nth(1).click();
    await this.waitForPipelineSuccess();
    await this.takeScreenshot('data_input_bound');
  }

  /**
   * Searches and adds a transformation node by name
   */
  private async addTransformationNode(nodeName: string): Promise<void> {
    await this.page.locator(this.selectors.addNodeButton).click();
    await this.page.getByRole('textbox', { name: 'Search transformations...' }).fill(nodeName);
    await this.page.getByRole('listitem').filter({ hasText: nodeName }).click();
  }

  /**
   * Text Case transformation - converts text column to lowercase/uppercase
   */
  async addTextCase(column: string, caseOption: 'lower' | 'UPPER' = 'lower'): Promise<void> {
    await this.addTransformationNode('Text Case');
    await this.page.getByRole('button', { name: 'Select columns', exact: true }).click();
    await this.page.getByRole('button', { name: column }).click();
    await this.page.getByTestId('right-sidebar').getByRole('combobox').click();
    await this.page.getByRole('option', { name: caseOption }).click();
    await this.takeScreenshot('text_case_config');
    await this.clickApply();
  }

  /**
   * Impute transformation - fills missing values in numeric columns
   */
  async addImpute(columns: string[], unselectColumns: string[] = ['id']): Promise<void> {
    await this.addTransformationNode('Impute');
    await this.page.getByRole('button', { name: 'id age salary', exact: true }).click();
    for (const col of unselectColumns) {
      await this.page.getByRole('button', { name: col, exact: true }).click();
    }
    await this.page.keyboard.press('Escape');
    await this.takeScreenshot('impute_config');
    await this.clickApply();
  }

  /**
   * Remove Duplicates transformation - removes duplicate rows
   */
  async addRemoveDuplicates(columns: string[]): Promise<void> {
    await this.addTransformationNode('Remove Duplicates');
    await this.page.getByRole('button', { name: 'Select columns', exact: true }).click();
    for (const col of columns) {
      const option = this.page.getByRole('option', { name: col });
      const button = this.page.getByRole('button', { name: col });
      if (await option.isVisible({ timeout: 300 }).catch(() => false)) {
        await option.click();
      } else if (await button.isVisible({ timeout: 300 }).catch(() => false)) {
        await button.click();
      }
    }
    await this.page.keyboard.press('Escape');
    await this.takeScreenshot('remove_duplicates_config');
    await this.clickApply();
  }

  /**
   * Sort Data transformation - sorts rows by specified column
   */
  async addSortData(column: string, order: 'Ascending' | 'Descending' = 'Ascending'): Promise<void> {
    await this.addTransformationNode('Sort Data');
    await this.page.getByRole('combobox').filter({ hasText: 'id' }).click();
    await this.page.getByRole('option', { name: column }).click();
    await this.takeScreenshot('sort_data_config');
    await this.clickApply();
  }

  /**
   * Clicks Apply and waits for pipeline execution to complete
   */
  async clickApply(): Promise<void> {
    await this.page.getByRole('button', { name: 'Apply' }).click();
    await this.waitForPipelineSuccess();
  }

  /**
   * Waits for pipeline execution success message
   */
  async waitForPipelineSuccess(): Promise<void> {
    await expect(this.page.getByText('Pipeline execution completed')).toBeVisible({ timeout: 60000 });
  }

  /**
   * Switches to Preview tab and downloads results as CSV
   */
  async downloadFromPreview(): Promise<Download> {
    await this.page.getByRole('tab', { name: 'Preview' }).click();
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('preview_before_download');
    
    await this.page.getByRole('button', { name: 'Download' }).click();
    
    const downloadPromise = this.page.waitForEvent('download', { timeout: 30000 });
    await this.page.getByRole('menuitem', { name: 'Download as CSV' }).click();
    
    return downloadPromise;
  }
}
