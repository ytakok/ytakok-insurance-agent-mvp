import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Policy, PolicyStatus, PolicyType } from "../../models";
import { DataService } from "../../services/data.service";
import { TranslateService } from "../../services/translate.service";

@Component({
  selector: "app-policies",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="policies-page">
      <!-- Filters -->
      <section class="filters-section card">
        <div class="filters-content">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              class="search-input"
              [(ngModel)]="searchQuery"
              [placeholder]="t('policies.searchPlaceholder')"
            />
          </div>

          <div class="filter-group">
            <label>{{ t("common.type") }}:</label>
            <select
              class="filter-select"
              [(ngModel)]="selectedType"
              (change)="applyFilters()"
            >
              <option value="all">{{ t("policies.allTypes") }}</option>
              @for (type of policyTypes; track type) {
                <option [value]="type">
                  {{ t("policies.types." + type) }}
                </option>
              }
            </select>
          </div>

          <div class="filter-group">
            <label>{{ t("tasks.form.status") }}:</label>
            <select
              class="filter-select"
              [(ngModel)]="selectedStatus"
              (change)="applyFilters()"
            >
              <option value="all">{{ t("policies.allStatus") }}</option>
              @for (status of policyStatuses; track status) {
                <option [value]="status">
                  {{ t("policies.status." + status) }}
                </option>
              }
            </select>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="stats-grid">
        @for (stat of policyStats(); track stat.type) {
          <div class="stat-card" [style.--type-color]="getTypeColor(stat.type)">
            <div class="stat-icon">{{ getTypeIcon(stat.type) }}</div>
            <div class="stat-content">
              <span class="stat-value">{{ stat.count }}</span>
              <span class="stat-label">{{
                t("policies.types." + stat.type)
              }}</span>
            </div>
            <span class="stat-premium"
              >\${{ stat.premium | number: "1.0-0" }}</span
            >
          </div>
        }
      </section>

      <!-- Policies Table -->
      <section class="table-section card">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t("policies.policyNumber") }}</th>
              <th>{{ t("policies.client") }}</th>
              <th>{{ t("common.type") }}</th>
              <th>{{ t("tasks.form.status") }}</th>
              <th>{{ t("policies.premium") }}</th>
              <th>{{ t("policies.coverage") }}</th>
              <th>{{ t("policies.dates") }}</th>
              <th>{{ t("common.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            @for (policy of filteredPolicies(); track policy.id) {
              <tr (click)="openPolicyDetail(policy)">
                <td class="policy-number">{{ policy.policyNumber }}</td>
                <td>
                  <div class="client-info">
                    <span class="client-name">{{ policy.clientName }}</span>
                  </div>
                </td>
                <td>
                  <span
                    class="type-badge"
                    [style.--type-color]="getTypeColor(policy.type)"
                  >
                    {{ getTypeIcon(policy.type) }}
                    {{ t("policies.types." + policy.type) }}
                  </span>
                </td>
                <td>
                  <span
                    class="status-badge"
                    [class]="'status-' + policy.status"
                  >
                    {{ t("policies.status." + policy.status) }}
                  </span>
                </td>
                <td class="premium">
                  \${{ policy.premium | number: "1.0-0"
                  }}{{ t("policies.premiumPerYear") }}
                </td>
                <td>\${{ policy.coverageAmount | number: "1.0-0" }}</td>
                <td>
                  <div class="dates-info">
                    <span class="date-label"
                      >{{ t("policies.startDate") }}:</span
                    >
                    {{ policy.startDate | date: "MMM d, yyyy" }}<br />
                    <span class="date-label">{{ t("policies.endDate") }}:</span>
                    <span [class.expiring-soon]="isExpiringSoon(policy)">
                      {{ policy.endDate | date: "MMM d, yyyy" }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="actions">
                    <button
                      class="action-btn"
                      [title]="t('common.view')"
                      (click)="
                        openPolicyDetail(policy); $event.stopPropagation()
                      "
                    >
                      👁️
                    </button>
                    <button
                      class="action-btn"
                      [title]="t('policies.renew')"
                      (click)="renewPolicy(policy); $event.stopPropagation()"
                    >
                      🔄
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-row">
                  <div class="empty-state">
                    <span class="empty-icon">📄</span>
                    <p>{{ t("policies.noPolicies") }}</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <!-- Policy Detail Modal -->
      @if (selectedPolicy()) {
        <div class="modal-overlay" (click)="closePolicyDetail()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <div class="modal-title">
                <span
                  class="policy-icon"
                  [style.--type-color]="getTypeColor(selectedPolicy()!.type)"
                >
                  {{ getTypeIcon(selectedPolicy()!.type) }}
                </span>
                <div>
                  <h2>{{ selectedPolicy()!.policyNumber }}</h2>
                  <span class="policy-type"
                    >{{ t("policies.types." + selectedPolicy()!.type) }}
                    {{ t("policies.insurance") }}</span
                  >
                </div>
              </div>
              <button class="close-btn" (click)="closePolicyDetail()">✕</button>
            </header>

            <div class="modal-body">
              <div class="status-row">
                <span
                  class="status-badge large"
                  [class]="'status-' + selectedPolicy()!.status"
                >
                  {{ t("policies.status." + selectedPolicy()!.status) }}
                </span>
                <span class="carrier">{{ selectedPolicy()!.carrier }}</span>
              </div>

              <div class="detail-grid">
                <div class="detail-card">
                  <h4>{{ t("policies.client") }}</h4>
                  <p class="detail-value">{{ selectedPolicy()!.clientName }}</p>
                </div>

                <div class="detail-card">
                  <h4>{{ t("policies.premium") }}</h4>
                  <p class="detail-value premium">
                    \${{ selectedPolicy()!.premium | number: "1.0-0" }}/year
                  </p>
                </div>

                <div class="detail-card">
                  <h4>{{ t("policies.coverageAmount") }}</h4>
                  <p class="detail-value">
                    \${{ selectedPolicy()!.coverageAmount | number: "1.0-0" }}
                  </p>
                </div>

                <div class="detail-card">
                  <h4>Deductible</h4>
                  <p class="detail-value">
                    \${{ selectedPolicy()!.deductible | number: "1.0-0" }}
                  </p>
                </div>
              </div>

              <div class="dates-section">
                <h4>Policy Period</h4>
                <div class="dates-timeline">
                  <div class="timeline-point start">
                    <span class="point-label">{{
                      t("policies.startDate")
                    }}</span>
                    <span class="point-date">{{
                      selectedPolicy()!.startDate | date: "MMMM d, yyyy"
                    }}</span>
                  </div>
                  <div class="timeline-line"></div>
                  <div
                    class="timeline-point end"
                    [class.expiring]="isExpiringSoon(selectedPolicy()!)"
                  >
                    <span class="point-label">{{ t("policies.endDate") }}</span>
                    <span class="point-date">{{
                      selectedPolicy()!.endDate | date: "MMMM d, yyyy"
                    }}</span>
                  </div>
                </div>
              </div>

              @if (selectedPolicy()!.notes) {
                <div class="notes-section">
                  <h4>Notes</h4>
                  <p>{{ selectedPolicy()!.notes }}</p>
                </div>
              }
            </div>

            <footer class="modal-footer">
              <button class="btn btn-secondary" (click)="closePolicyDetail()">
                {{ t("common.close") }}
              </button>
              <button
                class="btn btn-primary"
                (click)="renewPolicy(selectedPolicy()!)"
              >
                🔄 {{ t("policies.renew") }}
              </button>
            </footer>
          </div>
        </div>
      }
    </main>
  `,
  styles: [
    `
      .policies-page {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-6);
      }

      /* Filters */
      .filters-content {
        display: flex;
        gap: var(--spacing-4);
        flex-wrap: wrap;
        align-items: center;
      }

      .search-box {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        padding: var(--spacing-2) var(--spacing-4);
        background: var(--neutral-100);
        border-radius: var(--radius-lg);
        flex: 1;
        min-width: 250px;
      }

      .search-icon {
        color: var(--neutral-400);
      }

      .search-input {
        border: none;
        background: transparent;
        font-size: var(--font-size-base);
        outline: none;
        flex: 1;
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
      }

      .filter-group label {
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--neutral-600);
      }

      .filter-select {
        padding: var(--spacing-2) var(--spacing-3);
        border: 1px solid var(--neutral-300);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        background: white;
        cursor: pointer;
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--spacing-4);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        background: white;
        border-radius: var(--radius-lg);
        padding: var(--spacing-4);
        box-shadow: var(--shadow-sm);
        border-left: 4px solid var(--type-color, var(--neutral-400));
      }

      .stat-icon {
        font-size: 1.5rem;
      }

      .stat-content {
        flex: 1;
      }

      .stat-value {
        display: block;
        font-size: var(--font-size-xl);
        font-weight: 700;
      }

      .stat-label {
        font-size: var(--font-size-xs);
        color: var(--neutral-500);
      }

      .stat-premium {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--accent-success);
      }

      /* Table */
      .table-section {
        overflow-x: auto;
      }

      .table tbody tr {
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .table tbody tr:hover {
        background: var(--neutral-50);
      }

      .policy-number {
        font-weight: 600;
        font-family: monospace;
      }

      .client-name {
        font-weight: 500;
      }

      .type-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-1);
        padding: var(--spacing-1) var(--spacing-2);
        background: color-mix(in srgb, var(--type-color) 15%, white);
        color: var(--type-color);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-weight: 500;
      }

      .status-badge {
        display: inline-block;
        padding: var(--spacing-1) var(--spacing-2);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: 600;
      }

      .status-badge.large {
        font-size: var(--font-size-sm);
        padding: var(--spacing-2) var(--spacing-4);
      }

      .status-active {
        background: #dcfce7;
        color: #166534;
      }
      .status-pending {
        background: #fef3c7;
        color: #92400e;
      }
      .status-expired {
        background: #fee2e2;
        color: #991b1b;
      }
      .status-renewal-pending {
        background: #cffafe;
        color: #155e75;
      }
      .status-cancelled {
        background: #f3f4f6;
        color: #4b5563;
      }

      .premium {
        font-weight: 600;
        color: var(--accent-success);
      }

      .dates-info {
        font-size: var(--font-size-sm);
        line-height: 1.6;
      }

      .date-label {
        color: var(--neutral-500);
      }

      .expiring-soon {
        color: var(--accent-error);
        font-weight: 600;
      }

      .actions {
        display: flex;
        gap: var(--spacing-1);
      }

      .action-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: var(--neutral-100);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .action-btn:hover {
        background: var(--neutral-200);
      }

      .empty-row {
        text-align: center;
        padding: var(--spacing-8) !important;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-2);
        color: var(--neutral-500);
      }

      .empty-icon {
        font-size: 2rem;
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
      }

      .modal-content {
        background: white;
        border-radius: var(--radius-xl);
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow: auto;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: var(--spacing-5);
        border-bottom: 1px solid var(--neutral-200);
      }

      .modal-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-4);
      }

      .policy-icon {
        width: 50px;
        height: 50px;
        background: color-mix(in srgb, var(--type-color) 15%, white);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }

      .modal-title h2 {
        margin: 0;
        font-family: monospace;
      }

      .policy-type {
        color: var(--neutral-500);
      }

      .close-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: var(--neutral-100);
        border-radius: var(--radius-md);
        cursor: pointer;
      }

      .modal-body {
        padding: var(--spacing-5);
      }

      .status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-6);
      }

      .carrier {
        color: var(--neutral-600);
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-4);
        margin-bottom: var(--spacing-6);
      }

      .detail-card {
        background: var(--neutral-50);
        border-radius: var(--radius-lg);
        padding: var(--spacing-4);
      }

      .detail-card h4 {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--neutral-500);
        margin: 0 0 var(--spacing-2) 0;
      }

      .detail-value {
        font-size: var(--font-size-lg);
        font-weight: 600;
        margin: 0;
      }

      .detail-value.premium {
        color: var(--accent-success);
      }

      .dates-section {
        margin-bottom: var(--spacing-6);
      }

      .dates-section h4 {
        margin: 0 0 var(--spacing-4) 0;
      }

      .dates-timeline {
        display: flex;
        align-items: center;
        gap: var(--spacing-4);
      }

      .timeline-point {
        text-align: center;
      }

      .point-label {
        display: block;
        font-size: var(--font-size-xs);
        color: var(--neutral-500);
        margin-bottom: var(--spacing-1);
      }

      .point-date {
        font-weight: 600;
      }

      .timeline-point.expiring .point-date {
        color: var(--accent-error);
      }

      .timeline-line {
        flex: 1;
        height: 2px;
        background: var(--neutral-300);
      }

      .notes-section {
        background: var(--neutral-50);
        border-radius: var(--radius-lg);
        padding: var(--spacing-4);
      }

      .notes-section h4 {
        margin: 0 0 var(--spacing-2) 0;
        font-size: var(--font-size-sm);
        color: var(--neutral-600);
      }

      .notes-section p {
        margin: 0;
        color: var(--neutral-700);
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
export class PoliciesComponent {
  private dataService = inject(DataService);
  private translateService = inject(TranslateService);

  t = (key: string, params?: Record<string, string | number>) =>
    this.translateService.get(key, params);

  searchQuery = signal("");
  selectedType = signal("all");
  selectedStatus = signal("all");
  selectedPolicy = signal<Policy | null>(null);

  policyTypes: PolicyType[] = [
    PolicyType.Auto,
    PolicyType.Home,
    PolicyType.Life,
    PolicyType.Health,
    PolicyType.Business,
    PolicyType.Umbrella,
  ];
  policyStatuses: PolicyStatus[] = [
    PolicyStatus.Active,
    PolicyStatus.Pending,
    PolicyStatus.Expired,
    PolicyStatus.Cancelled,
    PolicyStatus.RenewalPending,
  ];

  policies = this.dataService.policies;

  filteredPolicies = computed(() => {
    let result = this.policies();
    const query = this.searchQuery().toLowerCase();
    const type = this.selectedType();
    const status = this.selectedStatus();

    if (query) {
      result = result.filter(
        (p) =>
          p.policyNumber.toLowerCase().includes(query) ||
          p.clientName.toLowerCase().includes(query),
      );
    }

    if (type !== "all") {
      result = result.filter((p) => p.type === type);
    }

    if (status !== "all") {
      result = result.filter((p) => p.status === status);
    }

    return result;
  });

  policyStats = computed(() => {
    const stats: { type: PolicyType; count: number; premium: number }[] = [];
    this.policyTypes.forEach((type) => {
      const typePolicies = this.policies().filter((p) => p.type === type);
      if (typePolicies.length > 0) {
        stats.push({
          type,
          count: typePolicies.length,
          premium: typePolicies.reduce((sum, p) => sum + p.premium, 0),
        });
      }
    });
    return stats;
  });

  applyFilters(): void {
    // Filters are applied through computed signal
  }

  isExpiringSoon(policy: Policy): boolean {
    const endDate = new Date(policy.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      auto: "🚗",
      home: "🏠",
      life: "❤️",
      health: "🏥",
      business: "🏢",
      umbrella: "☂️",
    };
    return icons[type] || "📄";
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      auto: "#3b82f6",
      home: "#10b981",
      life: "#ec4899",
      health: "#8b5cf6",
      business: "#f59e0b",
      umbrella: "#06b6d4",
    };
    return colors[type] || "#6b7280";
  }

  openPolicyDetail(policy: Policy): void {
    this.selectedPolicy.set(policy);
  }

  closePolicyDetail(): void {
    this.selectedPolicy.set(null);
  }

  renewPolicy(policy: Policy): void {
    console.log("Renew policy:", policy.policyNumber);
    // In a real app, navigate to renewal workflow
  }
}
