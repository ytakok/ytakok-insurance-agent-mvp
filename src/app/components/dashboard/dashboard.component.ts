import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { DataService } from "../../services/data.service";
import { TranslateService } from "../../services/translate.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="dashboard">
      <!-- Stats Overview -->
      <section class="stats-grid" aria-label="Dashboard statistics">
        @for (stat of statsCards(); track stat.title) {
          <article class="stat-card" [style.--accent-color]="stat.color">
            <div class="stat-icon">{{ stat.icon }}</div>
            <div class="stat-content">
              <h3 class="stat-value">{{ stat.value }}</h3>
              <p class="stat-title">{{ stat.title }}</p>
            </div>
            <div
              class="stat-trend"
              [class.positive]="stat.trend > 0"
              [class.negative]="stat.trend < 0"
            >
              {{ stat.trend > 0 ? "↑" : stat.trend < 0 ? "↓" : "→" }}
              {{ stat.trend | number: "1.0-0" }}%
            </div>
          </article>
        }
      </section>

      <div class="dashboard-grid">
        <!-- Recent Alerts -->
        <section class="card alerts-section">
          <header class="card-header">
            <h2 class="card-title">🔔 {{ t("dashboard.recentAlerts") }}</h2>
            <a routerLink="/alerts" class="view-all">{{
              t("dashboard.viewAll")
            }}</a>
          </header>
          <div class="alerts-list">
            @for (alert of recentAlerts(); track alert.id) {
              <article
                class="alert-item"
                [class]="'priority-' + alert.priority"
              >
                <div class="alert-indicator"></div>
                <div class="alert-content">
                  <h4 class="alert-title">{{ alert.title }}</h4>
                  <p class="alert-message">{{ alert.message }}</p>
                  <div class="alert-meta">
                    <span
                      class="badge"
                      [class]="'badge-' + getPriorityClass(alert.priority)"
                    >
                      {{ t("alerts.priority." + alert.priority) }}
                    </span>
                    <span class="ai-confidence"
                      >{{ t("dashboard.aiConfidence") }}:
                      {{ alert.aiConfidence }}%</span
                    >
                  </div>
                </div>
              </article>
            } @empty {
              <p class="empty-state">{{ t("dashboard.noAlertsNow") }}</p>
            }
          </div>
        </section>

        <!-- Pending Tasks -->
        <section class="card tasks-section">
          <header class="card-header">
            <h2 class="card-title">📋 {{ t("dashboard.pendingTasks") }}</h2>
            <a routerLink="/tasks" class="view-all">{{
              t("dashboard.viewAll")
            }}</a>
          </header>
          <div class="tasks-list">
            @for (task of pendingTasks(); track task.id) {
              <article class="task-item">
                <div
                  class="task-priority"
                  [class]="'priority-' + task.priority"
                ></div>
                <div class="task-content">
                  <h4 class="task-title">{{ task.title }}</h4>
                  <p class="task-client">
                    {{ task.clientName || t("common.noClient") }}
                  </p>
                  <div class="task-meta">
                    <span
                      class="due-date"
                      [class.overdue]="isOverdue(task.dueDate)"
                    >
                      {{ t("dashboard.due") }}:
                      {{ task.dueDate | date: "MMM d" }}
                    </span>
                    @if (task.aiGenerated) {
                      <span class="ai-badge"
                        >🤖 {{ t("dashboard.aiGenerated") }}</span
                      >
                    }
                  </div>
                </div>
              </article>
            } @empty {
              <p class="empty-state">{{ t("dashboard.allTasksCompleted") }}</p>
            }
          </div>
        </section>

        <!-- Policy Distribution Chart -->
        <section class="card chart-section">
          <header class="card-header">
            <h2 class="card-title">
              📊 {{ t("dashboard.policyDistribution") }}
            </h2>
          </header>
          <div class="chart-container">
            @for (dist of policyDistribution(); track dist.type) {
              <div class="chart-bar">
                <div class="bar-label">
                  {{ t("policies.types." + dist.type) }}
                </div>
                <div class="bar-container">
                  <div
                    class="bar-fill"
                    [style.width.%]="dist.percentage"
                    [style.background]="getTypeColor(dist.type)"
                  ></div>
                </div>
                <div class="bar-value">
                  {{ dist.count }} ({{ dist.percentage | number: "1.0-0" }}%)
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="card actions-section">
          <header class="card-header">
            <h2 class="card-title">⚡ {{ t("dashboard.quickActions") }}</h2>
          </header>
          <div class="actions-grid">
            <a routerLink="/upload" class="action-btn">
              <span class="action-icon">📤</span>
              <span class="action-label">{{ t("dashboard.uploadExcel") }}</span>
            </a>
            <a routerLink="/email" class="action-btn">
              <span class="action-icon">✉️</span>
              <span class="action-label">{{ t("dashboard.sendEmail") }}</span>
            </a>
            <a routerLink="/tasks" class="action-btn">
              <span class="action-icon">➕</span>
              <span class="action-label">{{ t("dashboard.newTask") }}</span>
            </a>
            <a routerLink="/search" class="action-btn">
              <span class="action-icon">🔍</span>
              <span class="action-label">{{ t("dashboard.search") }}</span>
            </a>
          </div>
        </section>

        <!-- Monthly Trends -->
        <section class="card trends-section">
          <header class="card-header">
            <h2 class="card-title">📈 {{ t("dashboard.monthlyTrends") }}</h2>
          </header>
          <div class="trends-chart">
            @for (trend of monthlyTrends(); track trend.month) {
              <div class="trend-column">
                <div class="trend-bars">
                  <div
                    class="trend-bar clients"
                    [style.height.px]="trend.newClients * 4"
                    [title]="
                      t('dashboard.newClients') + ': ' + trend.newClients
                    "
                  ></div>
                  <div
                    class="trend-bar renewals"
                    [style.height.px]="trend.renewals * 3"
                    [title]="t('dashboard.renewals') + ': ' + trend.renewals"
                  ></div>
                </div>
                <span class="trend-label">{{ trend.month }}</span>
              </div>
            }
          </div>
          <div class="trends-legend">
            <span class="legend-item"
              ><span class="legend-dot clients"></span>
              {{ t("dashboard.newClients") }}</span
            >
            <span class="legend-item"
              ><span class="legend-dot renewals"></span>
              {{ t("dashboard.renewals") }}</span
            >
          </div>
        </section>
      </div>
    </main>
  `,
  styles: [
    `
      .dashboard {
        animation: fadeIn var(--transition-normal);
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: var(--spacing-4);
        margin-bottom: var(--spacing-6);
      }

      .stat-card {
        background: white;
        border-radius: var(--radius-xl);
        padding: var(--spacing-5);
        display: flex;
        align-items: center;
        gap: var(--spacing-4);
        box-shadow: var(--shadow-md);
        border-left: 4px solid var(--accent-color, var(--primary-500));
        transition: transform var(--transition-fast);
      }

      .stat-card:hover {
        transform: translateY(-2px);
      }

      .stat-icon {
        font-size: 2rem;
        background: var(--neutral-100);
        padding: var(--spacing-3);
        border-radius: var(--radius-lg);
      }

      .stat-content {
        flex: 1;
      }

      .stat-value {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--neutral-900);
        margin: 0;
      }

      .stat-title {
        font-size: var(--font-size-sm);
        color: var(--neutral-500);
        margin: 0;
      }

      .stat-trend {
        font-size: var(--font-size-sm);
        font-weight: 600;
        padding: var(--spacing-1) var(--spacing-2);
        border-radius: var(--radius-md);
        background: var(--neutral-100);
      }

      .stat-trend.positive {
        color: var(--accent-success);
        background: #dcfce7;
      }

      .stat-trend.negative {
        color: var(--accent-error);
        background: #fee2e2;
      }

      /* Dashboard Grid */
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-6);
      }

      @media (max-width: 1200px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }

      /* Card Styles */
      .card {
        background: white;
        border-radius: var(--radius-xl);
        padding: var(--spacing-5);
        box-shadow: var(--shadow-md);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-4);
        padding-bottom: var(--spacing-3);
        border-bottom: 1px solid var(--neutral-200);
      }

      .card-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
        margin: 0;
      }

      .view-all {
        font-size: var(--font-size-sm);
        color: var(--primary-600);
        text-decoration: none;
      }

      .view-all:hover {
        text-decoration: underline;
      }

      /* Alerts Section */
      .alerts-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-3);
        max-height: 350px;
        overflow-y: auto;
      }

      .alert-item {
        display: flex;
        gap: var(--spacing-3);
        padding: var(--spacing-3);
        background: var(--neutral-50);
        border-radius: var(--radius-lg);
      }

      .alert-indicator {
        width: 4px;
        border-radius: var(--radius-full);
        flex-shrink: 0;
      }

      .alert-item.priority-critical .alert-indicator {
        background: var(--accent-error);
      }
      .alert-item.priority-high .alert-indicator {
        background: var(--accent-warning);
      }
      .alert-item.priority-medium .alert-indicator {
        background: var(--accent-info);
      }
      .alert-item.priority-low .alert-indicator {
        background: var(--accent-success);
      }

      .alert-content {
        flex: 1;
        min-width: 0;
      }

      .alert-title {
        font-size: var(--font-size-sm);
        font-weight: 600;
        margin: 0 0 var(--spacing-1) 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .alert-message {
        font-size: var(--font-size-xs);
        color: var(--neutral-600);
        margin: 0 0 var(--spacing-2) 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .alert-meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        font-size: var(--font-size-xs);
      }

      .ai-confidence {
        color: var(--neutral-500);
      }

      /* Tasks Section */
      .tasks-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-3);
        max-height: 350px;
        overflow-y: auto;
      }

      .task-item {
        display: flex;
        gap: var(--spacing-3);
        padding: var(--spacing-3);
        background: var(--neutral-50);
        border-radius: var(--radius-lg);
      }

      .task-priority {
        width: 4px;
        border-radius: var(--radius-full);
        flex-shrink: 0;
      }

      .task-priority.priority-urgent {
        background: var(--accent-error);
      }
      .task-priority.priority-high {
        background: var(--accent-warning);
      }
      .task-priority.priority-medium {
        background: var(--accent-info);
      }
      .task-priority.priority-low {
        background: var(--accent-success);
      }

      .task-content {
        flex: 1;
        min-width: 0;
      }

      .task-title {
        font-size: var(--font-size-sm);
        font-weight: 600;
        margin: 0 0 var(--spacing-1) 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .task-client {
        font-size: var(--font-size-xs);
        color: var(--neutral-500);
        margin: 0 0 var(--spacing-2) 0;
      }

      .task-meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        font-size: var(--font-size-xs);
      }

      .due-date {
        color: var(--neutral-600);
      }

      .due-date.overdue {
        color: var(--accent-error);
        font-weight: 600;
      }

      .ai-badge {
        color: var(--primary-600);
        font-weight: 500;
      }

      /* Chart Section */
      .chart-container {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-3);
      }

      .chart-bar {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
      }

      .bar-label {
        width: 80px;
        font-size: var(--font-size-sm);
        color: var(--neutral-600);
      }

      .bar-container {
        flex: 1;
        height: 24px;
        background: var(--neutral-100);
        border-radius: var(--radius-md);
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        border-radius: var(--radius-md);
        transition: width var(--transition-slow);
      }

      .bar-value {
        width: 80px;
        font-size: var(--font-size-sm);
        color: var(--neutral-600);
        text-align: right;
      }

      /* Actions Section */
      .actions-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-3);
      }

      .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-2);
        padding: var(--spacing-4);
        background: var(--neutral-50);
        border-radius: var(--radius-lg);
        text-decoration: none;
        color: var(--neutral-700);
        transition: all var(--transition-fast);
      }

      .action-btn:hover {
        background: var(--primary-50);
        color: var(--primary-700);
        transform: translateY(-2px);
      }

      .action-icon {
        font-size: 1.5rem;
      }

      .action-label {
        font-size: var(--font-size-sm);
        font-weight: 500;
      }

      /* Trends Section */
      .trends-chart {
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
        height: 150px;
        padding: var(--spacing-4) 0;
      }

      .trend-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-2);
      }

      .trend-bars {
        display: flex;
        gap: 4px;
        align-items: flex-end;
      }

      .trend-bar {
        width: 16px;
        border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        transition: height var(--transition-normal);
      }

      .trend-bar.clients {
        background: var(--primary-500);
      }

      .trend-bar.renewals {
        background: var(--accent-success);
      }

      .trend-label {
        font-size: var(--font-size-xs);
        color: var(--neutral-500);
      }

      .trends-legend {
        display: flex;
        justify-content: center;
        gap: var(--spacing-4);
        padding-top: var(--spacing-3);
        border-top: 1px solid var(--neutral-200);
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        font-size: var(--font-size-xs);
        color: var(--neutral-600);
      }

      .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: var(--radius-sm);
      }

      .legend-dot.clients {
        background: var(--primary-500);
      }

      .legend-dot.renewals {
        background: var(--accent-success);
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: var(--spacing-6);
        color: var(--neutral-500);
      }
    `,
  ],
})
export class DashboardComponent {
  private dataService = inject(DataService);
  private translateService = inject(TranslateService);

  t = (key: string, params?: Record<string, string | number>) =>
    this.translateService.get(key, params);

  stats = this.dataService.stats;

  statsCards = computed(() => [
    {
      icon: "👥",
      title: this.t("dashboard.totalClients"),
      value: this.stats().totalClients.toLocaleString(),
      trend: 8.5,
      color: "#3b82f6",
    },
    {
      icon: "📄",
      title: this.t("dashboard.activePolicies"),
      value: this.stats().totalPolicies.toLocaleString(),
      trend: 12.3,
      color: "#10b981",
    },
    {
      icon: "💰",
      title: this.t("dashboard.totalPremium"),
      value: "$" + (this.stats().totalPremium / 1000).toFixed(0) + "K",
      trend: 5.2,
      color: "#8b5cf6",
    },
    {
      icon: "🔔",
      title: this.t("dashboard.activeAlerts"),
      value: this.stats().activeAlerts.toString(),
      trend: -15,
      color: "#f59e0b",
    },
  ]);

  recentAlerts = computed(() => this.dataService.activeAlerts().slice(0, 5));

  pendingTasks = computed(() => this.dataService.pendingTasks().slice(0, 5));

  policyDistribution = computed(() => this.stats().policyDistribution);

  monthlyTrends = computed(() => this.stats().monthlyTrends);

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      critical: "error",
      high: "warning",
      medium: "info",
      low: "success",
    };
    return classes[priority] || "info";
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      auto: "#3b82f6",
      home: "#10b981",
      life: "#8b5cf6",
      health: "#ec4899",
      business: "#f59e0b",
      umbrella: "#06b6d4",
    };
    return colors[type] || "#6b7280";
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }
}
