import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { AIInsight, ExcelUploadResult } from "../../models";
import { AIService } from "../../services/ai.service";
import { DataService } from "../../services/data.service";
import { ExcelService } from "../../services/excel.service";
import { TranslateService } from "../../services/translate.service";

@Component({
  selector: "app-excel-upload",
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="excel-upload">
      <!-- Upload Section -->
      <section class="upload-section card">
        <header class="card-header">
          <h2 class="card-title">📤 {{ t("upload.title") }}</h2>
          <button class="btn btn-secondary" (click)="downloadSample()">
            📥 {{ t("upload.downloadSample") }}
          </button>
        </header>

        <div
          class="upload-zone"
          [class.drag-over]="isDragOver()"
          [class.uploading]="isProcessing()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
          role="button"
          tabindex="0"
          [attr.aria-label]="t('upload.title')"
          (keydown.enter)="fileInput.click()"
          (keydown.space)="fileInput.click()"
        >
          <input
            #fileInput
            type="file"
            accept=".xlsx,.xls,.csv"
            (change)="onFileSelected($event)"
            hidden
          />

          @if (isProcessing()) {
            <div class="processing-state">
              <div class="spinner"></div>
              <p class="processing-text">{{ t("upload.processing") }}</p>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="progress()"></div>
              </div>
              <p class="progress-text">
                {{ progress() }}% {{ t("upload.complete") }}
              </p>
            </div>
          } @else if (selectedFile()) {
            <div class="file-selected">
              <span class="file-icon">📄</span>
              <p class="file-name">{{ selectedFile()?.name }}</p>
              <p class="file-size">
                {{ formatFileSize(selectedFile()?.size || 0) }}
              </p>
              <button class="btn btn-primary" (click)="processFile($event)">
                🚀 {{ t("upload.processFile") }}
              </button>
            </div>
          } @else {
            <div class="upload-prompt">
              <span class="upload-icon">📁</span>
              <p class="upload-title">{{ t("upload.dropzone") }}</p>
              <p class="upload-subtitle">{{ t("upload.dropzoneOr") }}</p>
              <p class="upload-formats">{{ t("upload.supportedFormats") }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Results Section -->
      @if (uploadResult()) {
        <section class="results-section card animate-slideInUp">
          <header class="card-header">
            <h2 class="card-title">
              @if (uploadResult()!.success) {
                ✅ {{ t("upload.success") }}
              } @else {
                ⚠️ {{ t("upload.successWithErrors") }}
              }
            </h2>
          </header>

          <div class="results-grid">
            <div class="result-stat">
              <span class="stat-value">{{
                uploadResult()!.rowsProcessed
              }}</span>
              <span class="stat-label">{{ t("upload.rowsProcessed") }}</span>
            </div>
            <div class="result-stat">
              <span class="stat-value">{{
                uploadResult()!.clientsImported
              }}</span>
              <span class="stat-label">{{ t("upload.clientsImported") }}</span>
            </div>
            <div class="result-stat">
              <span class="stat-value">{{
                uploadResult()!.policiesImported
              }}</span>
              <span class="stat-label">{{ t("upload.policiesImported") }}</span>
            </div>
            <div
              class="result-stat"
              [class.has-errors]="uploadResult()!.errors.length > 0"
            >
              <span class="stat-value">{{
                uploadResult()!.errors.length
              }}</span>
              <span class="stat-label">{{ t("upload.errors") }}</span>
            </div>
          </div>

          <!-- Errors -->
          @if (uploadResult()!.errors.length > 0) {
            <div class="errors-section">
              <h3 class="section-title">⚠️ {{ t("upload.errorsFound") }}</h3>
              <div class="errors-list">
                @for (error of uploadResult()!.errors; track error.row) {
                  <div class="error-item">
                    <span class="error-row"
                      >{{ t("common.row") }} {{ error.row }}</span
                    >
                    <span class="error-column">{{ error.column }}</span>
                    <span class="error-message">{{ error.message }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </section>
      }

      <!-- AI Insights Section -->
      @if (aiInsights().length > 0) {
        <section class="insights-section card animate-slideInUp">
          <header class="card-header">
            <h2 class="card-title">🤖 {{ t("upload.aiInsights") }}</h2>
            <span class="badge badge-info"
              >{{ aiInsights().length }} {{ t("upload.insights") }}</span
            >
          </header>

          <div class="insights-grid">
            @for (insight of aiInsights(); track insight.title) {
              <article class="insight-card" [class]="'type-' + insight.type">
                <div class="insight-header">
                  <span class="insight-icon">{{
                    getInsightIcon(insight.type)
                  }}</span>
                  <span class="insight-type">{{
                    t("upload.insightTypes." + insight.type)
                  }}</span>
                  <span class="insight-confidence"
                    >{{ insight.confidence }}%
                    {{ t("common.confidence") }}</span
                  >
                </div>
                <h4 class="insight-title">{{ insight.title }}</h4>
                <p class="insight-description">{{ insight.description }}</p>
                <div class="insight-footer">
                  <span class="affected"
                    >{{ insight.affectedClients }}
                    {{ t("upload.clientsAffected") }}</span
                  >
                  @if (insight.potentialValue) {
                    <span class="value"
                      >\${{ insight.potentialValue | number }}
                      {{ t("upload.potentialValue") }}</span
                    >
                  }
                </div>
              </article>
            }
          </div>
        </section>
      }

      <!-- Instructions -->
      <section class="instructions-section card">
        <header class="card-header">
          <h2 class="card-title">📋 {{ t("upload.fileFormatGuide") }}</h2>
        </header>

        <div class="format-table">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t("common.column") }}</th>
                <th>{{ t("common.required") }}</th>
                <th>{{ t("common.format") }}</th>
                <th>{{ t("common.example") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ t("upload.columns.clientName") }}</td>
                <td>
                  <span class="badge badge-success">{{ t("common.yes") }}</span>
                </td>
                <td>{{ t("upload.formats.fullName") }}</td>
                <td>{{ t("upload.examples.clientName") }}</td>
              </tr>
              <tr>
                <td>{{ t("upload.columns.email") }}</td>
                <td>
                  <span class="badge badge-success">{{ t("common.yes") }}</span>
                </td>
                <td>{{ t("upload.formats.validEmail") }}</td>
                <td>{{ t("upload.examples.email") }}</td>
              </tr>
              <tr>
                <td>{{ t("upload.columns.phone") }}</td>
                <td>
                  <span class="badge badge-warning">{{ t("common.no") }}</span>
                </td>
                <td>{{ t("upload.formats.phoneNumber") }}</td>
                <td>{{ t("upload.examples.phone") }}</td>
              </tr>
              <tr>
                <td>{{ t("upload.columns.policyType") }}</td>
                <td>
                  <span class="badge badge-success">{{ t("common.yes") }}</span>
                </td>
                <td>{{ t("upload.formats.policyTypes") }}</td>
                <td>{{ t("upload.examples.policyType") }}</td>
              </tr>
              <tr>
                <td>{{ t("upload.columns.premium") }}</td>
                <td>
                  <span class="badge badge-success">{{ t("common.yes") }}</span>
                </td>
                <td>{{ t("upload.formats.dollarAmount") }}</td>
                <td>{{ t("upload.examples.premium") }}</td>
              </tr>
              <tr>
                <td>{{ t("upload.columns.startDate") }}</td>
                <td>
                  <span class="badge badge-success">{{ t("common.yes") }}</span>
                </td>
                <td>{{ t("upload.formats.dateFormat") }}</td>
                <td>{{ t("upload.examples.date") }}</td>
              </tr>
              <tr>
                <td>{{ t("upload.columns.endDate") }}</td>
                <td>
                  <span class="badge badge-success">{{ t("common.yes") }}</span>
                </td>
                <td>{{ t("upload.formats.dateFormat") }}</td>
                <td>{{ t("upload.examples.date") }}</td>
              </tr>
              <tr>
                <td>{{ t("upload.columns.carrier") }}</td>
                <td>
                  <span class="badge badge-warning">{{ t("common.no") }}</span>
                </td>
                <td>{{ t("upload.formats.insuranceCompany") }}</td>
                <td>{{ t("upload.examples.carrier") }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .excel-upload {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-6);
      }

      /* Upload Zone */
      .upload-zone {
        border: 2px dashed var(--neutral-300);
        border-radius: var(--radius-xl);
        padding: var(--spacing-10);
        text-align: center;
        cursor: pointer;
        transition: all var(--transition-fast);
        background: var(--neutral-50);
      }

      .upload-zone:hover {
        border-color: var(--primary-400);
        background: var(--primary-50);
      }

      .upload-zone.drag-over {
        border-color: var(--primary-500);
        background: var(--primary-100);
        transform: scale(1.02);
      }

      .upload-zone.uploading {
        cursor: default;
        pointer-events: none;
      }

      .upload-icon {
        font-size: 4rem;
        display: block;
        margin-bottom: var(--spacing-4);
      }

      .upload-title {
        font-size: var(--font-size-xl);
        font-weight: 600;
        color: var(--neutral-700);
        margin: 0 0 var(--spacing-2) 0;
      }

      .upload-subtitle {
        color: var(--neutral-500);
        margin: 0 0 var(--spacing-3) 0;
      }

      .upload-formats {
        font-size: var(--font-size-sm);
        color: var(--neutral-400);
        margin: 0;
      }

      /* File Selected */
      .file-selected {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-3);
      }

      .file-icon {
        font-size: 3rem;
      }

      .file-name {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--neutral-800);
        margin: 0;
      }

      .file-size {
        color: var(--neutral-500);
        margin: 0;
      }

      /* Processing State */
      .processing-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-3);
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid var(--neutral-200);
        border-top-color: var(--primary-500);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .processing-text {
        font-size: var(--font-size-lg);
        color: var(--neutral-700);
        margin: 0;
      }

      .progress-bar {
        width: 200px;
        height: 8px;
        background: var(--neutral-200);
        border-radius: var(--radius-full);
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--primary-500);
        transition: width var(--transition-fast);
      }

      .progress-text {
        font-size: var(--font-size-sm);
        color: var(--neutral-500);
        margin: 0;
      }

      /* Results */
      .results-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--spacing-4);
        margin-bottom: var(--spacing-6);
      }

      @media (max-width: 768px) {
        .results-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .result-stat {
        text-align: center;
        padding: var(--spacing-4);
        background: var(--neutral-50);
        border-radius: var(--radius-lg);
      }

      .result-stat .stat-value {
        display: block;
        font-size: var(--font-size-3xl);
        font-weight: 700;
        color: var(--primary-600);
      }

      .result-stat .stat-label {
        display: block;
        font-size: var(--font-size-sm);
        color: var(--neutral-500);
      }

      .result-stat.has-errors .stat-value {
        color: var(--accent-error);
      }

      /* Errors */
      .errors-section {
        margin-top: var(--spacing-4);
      }

      .section-title {
        font-size: var(--font-size-base);
        font-weight: 600;
        margin: 0 0 var(--spacing-3) 0;
      }

      .errors-list {
        background: #fef2f2;
        border-radius: var(--radius-lg);
        padding: var(--spacing-3);
        max-height: 200px;
        overflow-y: auto;
      }

      .error-item {
        display: flex;
        gap: var(--spacing-3);
        padding: var(--spacing-2);
        font-size: var(--font-size-sm);
      }

      .error-row {
        font-weight: 600;
        color: var(--accent-error);
        min-width: 60px;
      }

      .error-column {
        color: var(--neutral-600);
        min-width: 80px;
      }

      .error-message {
        color: var(--neutral-700);
      }

      /* AI Insights */
      .insights-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-4);
      }

      .insight-card {
        background: var(--neutral-50);
        border-radius: var(--radius-lg);
        padding: var(--spacing-4);
        border-left: 4px solid var(--neutral-400);
      }

      .insight-card.type-opportunity {
        border-left-color: var(--accent-success);
      }
      .insight-card.type-risk {
        border-left-color: var(--accent-error);
      }
      .insight-card.type-action {
        border-left-color: var(--accent-warning);
      }
      .insight-card.type-trend {
        border-left-color: var(--primary-500);
      }

      .insight-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        margin-bottom: var(--spacing-2);
      }

      .insight-icon {
        font-size: 1.25rem;
      }

      .insight-type {
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        color: var(--neutral-500);
      }

      .insight-confidence {
        margin-left: auto;
        font-size: var(--font-size-xs);
        color: var(--neutral-400);
      }

      .insight-title {
        font-size: var(--font-size-base);
        font-weight: 600;
        margin: 0 0 var(--spacing-2) 0;
      }

      .insight-description {
        font-size: var(--font-size-sm);
        color: var(--neutral-600);
        margin: 0 0 var(--spacing-3) 0;
      }

      .insight-footer {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-size-xs);
        color: var(--neutral-500);
      }

      .insight-footer .value {
        color: var(--accent-success);
        font-weight: 600;
      }

      /* Instructions Table */
      .format-table {
        overflow-x: auto;
      }
    `,
  ],
})
export class ExcelUploadComponent {
  private excelService = inject(ExcelService);
  private aiService = inject(AIService);
  private dataService = inject(DataService);
  private translateService = inject(TranslateService);

  t = (key: string, params?: Record<string, string | number>) =>
    this.translateService.get(key, params);

  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);
  uploadResult = signal<ExcelUploadResult | null>(null);
  aiInsights = signal<AIInsight[]>([]);

  isProcessing = this.excelService.processing;
  progress = this.excelService.progress;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile.set(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  async processFile(event: Event): Promise<void> {
    event.stopPropagation();

    const file = this.selectedFile();
    if (!file) return;

    // Process Excel file
    const result = await this.excelService.parseExcelFile(file);
    this.uploadResult.set(result);
    this.aiInsights.set(result.aiInsights);

    // Clear selected file
    this.selectedFile.set(null);
  }

  downloadSample(): void {
    const blob = this.excelService.generateSampleExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "insurance-data-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  getInsightIcon(type: string): string {
    const icons: Record<string, string> = {
      opportunity: "💡",
      risk: "⚠️",
      action: "🎯",
      trend: "📈",
    };
    return icons[type] || "💡";
  }
}
