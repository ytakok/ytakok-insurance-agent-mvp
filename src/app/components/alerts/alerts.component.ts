import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { AIAlert, AlertPriority, TaskPriority, TaskStatus } from "../../models";
import { AIService } from "../../services/ai.service";
import { DataService } from "../../services/data.service";
import { TranslateService } from "../../services/translate.service";

@Component({
  selector: "app-alerts",
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="alerts-page">
      <!-- Filters -->
      <section class="filters-section card">
        <div class="filters-row">
          <div class="filter-group">
            <label class="filter-label">{{ t("common.priority") }}</label>
            <div class="filter-buttons">
              @for (priority of priorities; track priority) {
                <button
                  class="filter-btn"
                  [class.active]="selectedPriority() === priority"
                  (click)="setFilter('priority', priority)"
                >
                  {{ t("alerts.priority." + priority) }}
                </button>
              }
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t("common.type") }}</label>
            <div class="filter-buttons">
              @for (type of alertTypes; track type) {
                <button
                  class="filter-btn"
                  [class.active]="selectedType() === type"
                  (click)="setFilter('type', type)"
                >
                  {{ t("alerts.types." + type) }}
                </button>
              }
            </div>
          </div>

          <div class="filter-actions">
            <button class="btn btn-secondary" (click)="markAllAsRead()">
              ✓ {{ t("common.markAllRead") }}
            </button>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="stats-section">
        <div class="stat-card critical">
          <span class="stat-value">{{ criticalCount() }}</span>
          <span class="stat-label">{{ t("alerts.priority.critical") }}</span>
        </div>
        <div class="stat-card high">
          <span class="stat-value">{{ highCount() }}</span>
          <span class="stat-label">{{ t("alerts.priority.high") }}</span>
        </div>
        <div class="stat-card medium">
          <span class="stat-value">{{ mediumCount() }}</span>
          <span class="stat-label">{{ t("alerts.priority.medium") }}</span>
        </div>
        <div class="stat-card low">
          <span class="stat-value">{{ lowCount() }}</span>
          <span class="stat-label">{{ t("alerts.priority.low") }}</span>
        </div>
      </section>

      <!-- Alerts List -->
      <section class="alerts-list">
        @for (alert of filteredAlerts(); track alert.id) {
          <article
            class="alert-card"
            [class]="'priority-' + alert.priority"
            [class.unread]="!alert.isRead"
            (click)="openAlert(alert)"
          >
            <div class="alert-indicator"></div>

            <div class="alert-main">
              <div class="alert-header">
                <span class="alert-type-icon">{{
                  getTypeIcon(alert.type)
                }}</span>
                <span class="alert-type">{{
                  t("alerts.types." + alert.type)
                }}</span>
                <span class="alert-time">{{
                  formatTime(alert.createdAt)
                }}</span>
              </div>

              <h3 class="alert-title">{{ alert.title }}</h3>
              <p class="alert-message">{{ alert.message }}</p>

              @if (alert.clientName) {
                <div class="alert-client">
                  <span class="client-icon">👤</span>
                  <span class="client-name">{{ alert.clientName }}</span>
                  @if (alert.policyNumber) {
                    <span class="policy-number">{{ alert.policyNumber }}</span>
                  }
                </div>
              }

              <div class="alert-footer">
                <div class="ai-info">
                  <span class="ai-badge">🤖 {{ t("alerts.ai") }}</span>
                  <span class="ai-confidence"
                    >{{ alert.aiConfidence }}%
                    {{ t("common.confidence") }}</span
                  >
                </div>

                <div class="alert-actions">
                  @if (!alert.isRead) {
                    <button
                      class="action-btn"
                      (click)="markAsRead(alert, $event)"
                      [title]="t('alerts.markAsRead')"
                    >
                      ✓
                    </button>
                  }
                  <button
                    class="action-btn"
                    (click)="createTask(alert, $event)"
                    [title]="t('alerts.createTask')"
                  >
                    📋
                  </button>
                  <button
                    class="action-btn dismiss"
                    (click)="dismissAlert(alert, $event)"
                    [title]="t('alerts.dismiss')"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div class="priority-badge">
              {{ t("alerts.priority." + alert.priority) }}
            </div>
          </article>
        } @empty {
          <div class="empty-state">
            <span class="empty-icon">🎉</span>
            <h3>{{ t("alerts.noAlerts") }}</h3>
            <p>{{ t("alerts.noAlertsMessage") }}</p>
          </div>
        }
      </section>

      <!-- Alert Detail Modal -->
      @if (selectedAlert()) {
        <div class="modal-overlay" (click)="closeAlert()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h2>{{ selectedAlert()!.title }}</h2>
              <button class="close-btn" (click)="closeAlert()">✕</button>
            </header>

            <div class="modal-body">
              <div class="detail-row">
                <span class="detail-label">{{ t("common.priority") }}</span>
                <span
                  class="badge"
                  [class]="
                    'badge-' + getPriorityClass(selectedAlert()!.priority)
                  "
                >
                  {{ t("alerts.priority." + selectedAlert()!.priority) }}
                </span>
              </div>

              <div class="detail-row">
                <span class="detail-label">{{ t("common.type") }}</span>
                <span
                  >{{ getTypeIcon(selectedAlert()!.type) }}
                  {{ t("alerts.types." + selectedAlert()!.type) }}</span
                >
              </div>

              @if (selectedAlert()!.clientName) {
                <div class="detail-row">
                  <span class="detail-label">{{ t("alerts.client") }}</span>
                  <span>{{ selectedAlert()!.clientName }}</span>
                </div>
              }

              @if (selectedAlert()!.policyNumber) {
                <div class="detail-row">
                  <span class="detail-label">{{ t("alerts.policy") }}</span>
                  <span>{{ selectedAlert()!.policyNumber }}</span>
                </div>
              }

              <div class="detail-section">
                <h4>{{ t("alerts.message") }}</h4>
                <p>{{ selectedAlert()!.message }}</p>
              </div>

              <div class="detail-section">
                <h4>{{ t("alerts.actionRequired") }}</h4>
                <p>{{ selectedAlert()!.actionRequired }}</p>
              </div>

              <div class="detail-section ai-insight">
                <h4>🤖 {{ t("alerts.aiInsight") }}</h4>
                <p>{{ selectedAlert()!.aiInsight }}</p>
                <span class="confidence"
                  >{{ t("common.confidence") }}:
                  {{ selectedAlert()!.aiConfidence }}%</span
                >
              </div>
            </div>

            <footer class="modal-footer">
              <button class="btn btn-secondary" (click)="closeAlert()">
                {{ t("common.close") }}
              </button>
              <button class="btn btn-primary" (click)="createTaskFromModal()">
                📋 {{ t("alerts.createTask") }}
              </button>
            </footer>
          </div>
        </div>
      }
    </main>
  `,
  styles: [
    `
      .alerts-page {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-6);
      }

      /* Filters */
      .filters-section {
        padding: var(--spacing-4);
      }

      .filters-row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: var(--spacing-6);
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2);
      }

      .filter-label {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--neutral-600);
      }

      .filter-buttons {
        display: flex;
        gap: var(--spacing-1);
      }

      .filter-btn {
        padding: var(--spacing-2) var(--spacing-3);
        border: 1px solid var(--neutral-300);
        background: white;
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .filter-btn:hover {
        background: var(--neutral-100);
      }

      .filter-btn.active {
        background: var(--primary-600);
        color: white;
        border-color: var(--primary-600);
      }

      .filter-actions {
        margin-left: auto;
      }

      /* Stats */
      .stats-section {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--spacing-4);
      }

      @media (max-width: 768px) {
        .stats-section {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .stat-card {
        background: white;
        border-radius: var(--radius-lg);
        padding: var(--spacing-4);
        text-align: center;
        box-shadow: var(--shadow-sm);
        border-top: 3px solid var(--neutral-400);
      }

      .stat-card.critical {
        border-top-color: var(--accent-error);
      }
      .stat-card.high {
        border-top-color: var(--accent-warning);
      }
      .stat-card.medium {
        border-top-color: var(--accent-info);
      }
      .stat-card.low {
        border-top-color: var(--accent-success);
      }

      .stat-card .stat-value {
        display: block;
        font-size: var(--font-size-3xl);
        font-weight: 700;
        color: var(--neutral-900);
      }

      .stat-card .stat-label {
        font-size: var(--font-size-sm);
        color: var(--neutral-500);
      }

      /* Alerts List */
      .alerts-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-4);
      }

      .alert-card {
        display: flex;
        gap: var(--spacing-4);
        background: white;
        border-radius: var(--radius-xl);
        padding: var(--spacing-5);
        box-shadow: var(--shadow-md);
        cursor: pointer;
        transition: all var(--transition-fast);
        position: relative;
      }

      .alert-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .alert-card.unread {
        background: linear-gradient(to right, var(--primary-50), white);
      }

      .alert-indicator {
        width: 4px;
        border-radius: var(--radius-full);
        flex-shrink: 0;
      }

      .alert-card.priority-critical .alert-indicator {
        background: var(--accent-error);
      }
      .alert-card.priority-high .alert-indicator {
        background: var(--accent-warning);
      }
      .alert-card.priority-medium .alert-indicator {
        background: var(--accent-info);
      }
      .alert-card.priority-low .alert-indicator {
        background: var(--accent-success);
      }

      .alert-main {
        flex: 1;
        min-width: 0;
      }

      .alert-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        margin-bottom: var(--spacing-2);
      }

      .alert-type-icon {
        font-size: 1.25rem;
      }

      .alert-type {
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        color: var(--neutral-500);
      }

      .alert-time {
        margin-left: auto;
        font-size: var(--font-size-xs);
        color: var(--neutral-400);
      }

      .alert-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
        margin: 0 0 var(--spacing-2) 0;
        color: var(--neutral-900);
      }

      .alert-message {
        font-size: var(--font-size-sm);
        color: var(--neutral-600);
        margin: 0 0 var(--spacing-3) 0;
        line-height: 1.5;
      }

      .alert-client {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        margin-bottom: var(--spacing-3);
        padding: var(--spacing-2) var(--spacing-3);
        background: var(--neutral-100);
        border-radius: var(--radius-md);
        width: fit-content;
      }

      .client-icon {
        font-size: 1rem;
      }

      .client-name {
        font-weight: 500;
        color: var(--neutral-700);
      }

      .policy-number {
        font-size: var(--font-size-xs);
        color: var(--neutral-500);
        padding-left: var(--spacing-2);
        border-left: 1px solid var(--neutral-300);
      }

      .alert-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .ai-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
      }

      .ai-badge {
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--primary-600);
      }

      .ai-confidence {
        font-size: var(--font-size-xs);
        color: var(--neutral-400);
      }

      .alert-actions {
        display: flex;
        gap: var(--spacing-2);
      }

      .action-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: var(--neutral-100);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .action-btn:hover {
        background: var(--neutral-200);
      }

      .action-btn.dismiss:hover {
        background: var(--accent-error);
        color: white;
      }

      .priority-badge {
        position: absolute;
        top: var(--spacing-4);
        right: var(--spacing-4);
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        padding: var(--spacing-1) var(--spacing-2);
        border-radius: var(--radius-md);
      }

      .priority-critical .priority-badge {
        background: #fee2e2;
        color: #991b1b;
      }

      .priority-high .priority-badge {
        background: #fef3c7;
        color: #92400e;
      }

      .priority-medium .priority-badge {
        background: #cffafe;
        color: #155e75;
      }

      .priority-low .priority-badge {
        background: #dcfce7;
        color: #166534;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: var(--spacing-12);
        background: white;
        border-radius: var(--radius-xl);
      }

      .empty-icon {
        font-size: 4rem;
        display: block;
        margin-bottom: var(--spacing-4);
      }

      .empty-state h3 {
        margin: 0 0 var(--spacing-2) 0;
      }

      .empty-state p {
        color: var(--neutral-500);
        margin: 0;
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn var(--transition-fast);
      }

      .modal-content {
        background: white;
        border-radius: var(--radius-xl);
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow: auto;
        animation: slideInUp var(--transition-normal);
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-5);
        border-bottom: 1px solid var(--neutral-200);
      }

      .modal-header h2 {
        margin: 0;
        font-size: var(--font-size-xl);
      }

      .close-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: var(--neutral-100);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 1rem;
      }

      .close-btn:hover {
        background: var(--neutral-200);
      }

      .modal-body {
        padding: var(--spacing-5);
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-3) 0;
        border-bottom: 1px solid var(--neutral-100);
      }

      .detail-label {
        font-weight: 600;
        color: var(--neutral-600);
      }

      .detail-section {
        margin-top: var(--spacing-4);
      }

      .detail-section h4 {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--neutral-600);
        margin: 0 0 var(--spacing-2) 0;
      }

      .detail-section p {
        margin: 0;
        color: var(--neutral-800);
        line-height: 1.6;
      }

      .ai-insight {
        background: var(--primary-50);
        padding: var(--spacing-4);
        border-radius: var(--radius-lg);
      }

      .ai-insight .confidence {
        display: block;
        margin-top: var(--spacing-2);
        font-size: var(--font-size-sm);
        color: var(--primary-600);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-3);
        padding: var(--spacing-4) var(--spacing-5);
        border-top: 1px solid var(--neutral-200);
      }
    `,
  ],
})
export class AlertsComponent {
  private dataService = inject(DataService);
  private aiService = inject(AIService);
  private translateService = inject(TranslateService);

  // Translation helper
  t = (key: string, params?: Record<string, string | number>) =>
    this.translateService.get(key, params);

  priorities = ["all", "critical", "high", "medium", "low"] as const;
  alertTypes = [
    "all",
    "renewal",
    "payment",
    "claim",
    "coverage",
    "compliance",
    "opportunity",
  ] as const;

  selectedPriority = signal<string>("all");
  selectedType = signal<string>("all");
  selectedAlert = signal<AIAlert | null>(null);

  alerts = this.dataService.activeAlerts;

  filteredAlerts = computed(() => {
    let result = this.alerts();

    if (this.selectedPriority() !== "all") {
      result = result.filter((a) => a.priority === this.selectedPriority());
    }

    if (this.selectedType() !== "all") {
      result = result.filter((a) => a.type === this.selectedType());
    }

    return result.sort((a, b) => {
      const priorityOrder = {
        [AlertPriority.Critical]: 0,
        [AlertPriority.High]: 1,
        [AlertPriority.Medium]: 2,
        [AlertPriority.Low]: 3,
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  });

  criticalCount = computed(
    () =>
      this.alerts().filter((a) => a.priority === AlertPriority.Critical).length,
  );
  highCount = computed(
    () => this.alerts().filter((a) => a.priority === AlertPriority.High).length,
  );
  mediumCount = computed(
    () =>
      this.alerts().filter((a) => a.priority === AlertPriority.Medium).length,
  );
  lowCount = computed(
    () => this.alerts().filter((a) => a.priority === AlertPriority.Low).length,
  );

  setFilter(type: "priority" | "type", value: string): void {
    if (type === "priority") {
      this.selectedPriority.set(value);
    } else {
      this.selectedType.set(value);
    }
  }

  openAlert(alert: AIAlert): void {
    this.selectedAlert.set(alert);
    if (!alert.isRead) {
      this.dataService.markAlertAsRead(alert.id);
    }
  }

  closeAlert(): void {
    this.selectedAlert.set(null);
  }

  markAsRead(alert: AIAlert, event: Event): void {
    event.stopPropagation();
    this.dataService.markAlertAsRead(alert.id);
  }

  markAllAsRead(): void {
    this.alerts().forEach((alert) => {
      if (!alert.isRead) {
        this.dataService.markAlertAsRead(alert.id);
      }
    });
  }

  dismissAlert(alert: AIAlert, event: Event): void {
    event.stopPropagation();
    this.dataService.dismissAlert(alert.id);
  }

  async createTask(alert: AIAlert, event: Event): Promise<void> {
    event.stopPropagation();
    const taskSuggestion = await this.aiService.generateTaskFromAlert(alert);
    this.dataService.addTask({
      id: `t-${Date.now()}`,
      title: taskSuggestion.title || alert.title,
      description: taskSuggestion.description || alert.actionRequired,
      status: TaskStatus.Pending,
      priority: taskSuggestion.priority || TaskPriority.Medium,
      dueDate: taskSuggestion.dueDate || new Date().toISOString().split("T")[0],
      clientId: alert.clientId,
      clientName: alert.clientName,
      policyId: alert.policyId,
      alertId: alert.id,
      aiGenerated: true,
      aiSuggestion: taskSuggestion.aiSuggestion,
      createdAt: new Date().toISOString(),
    });
  }

  async createTaskFromModal(): Promise<void> {
    const alert = this.selectedAlert();
    if (alert) {
      await this.createTask(alert, new Event("click"));
      this.closeAlert();
    }
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      renewal: "🔄",
      payment: "💳",
      claim: "📝",
      coverage: "🛡️",
      compliance: "📋",
      opportunity: "💡",
    };
    return icons[type] || "🔔";
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      critical: "error",
      high: "warning",
      medium: "info",
      low: "success",
    };
    return classes[priority] || "info";
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}
