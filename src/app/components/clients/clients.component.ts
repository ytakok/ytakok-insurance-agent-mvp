import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Client } from "../../models";
import { DataService } from "../../services/data.service";
import { TranslateService } from "../../services/translate.service";

@Component({
  selector: "app-clients",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="clients-page">
      <!-- Header -->
      <section class="header-section card">
        <div class="header-content">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              class="search-input"
              [(ngModel)]="searchQuery"
              [placeholder]="t('clients.searchPlaceholder')"
            />
          </div>

          <div class="header-stats">
            <div class="stat">
              <span class="stat-value">{{ clients().length }}</span>
              <span class="stat-label">{{ t("clients.totalClients") }}</span>
            </div>
            <div class="stat">
              <span class="stat-value"
                >\${{ totalPremium() | number: "1.0-0" }}</span
              >
              <span class="stat-label">{{ t("clients.totalPremium") }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Clients Table -->
      <section class="table-section card">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t("clients.client") }}</th>
              <th>{{ t("clients.contact") }}</th>
              <th>{{ t("clients.location") }}</th>
              <th>{{ t("clients.policies") }}</th>
              <th>{{ t("policies.premium") }}</th>
              <th>{{ t("clients.riskScore") }}</th>
              <th>{{ t("common.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            @for (client of filteredClients(); track client.id) {
              <tr (click)="openClientDetail(client)">
                <td>
                  <div class="client-info">
                    <div class="client-avatar">
                      {{ client.firstName.charAt(0)
                      }}{{ client.lastName.charAt(0) }}
                    </div>
                    <div class="client-name">
                      <span class="name"
                        >{{ client.firstName }} {{ client.lastName }}</span
                      >
                      <span class="joined"
                        >{{ t("common.since") }}
                        {{ client.createdAt | date: "MMM yyyy" }}</span
                      >
                    </div>
                  </div>
                </td>
                <td>
                  <div class="contact-info">
                    <span class="email">{{ client.email }}</span>
                    <span class="phone">{{ client.phone }}</span>
                  </div>
                </td>
                <td>{{ client.city }}, {{ client.state }}</td>
                <td>
                  <span class="badge badge-info">{{
                    client.totalPolicies
                  }}</span>
                </td>
                <td class="premium">
                  \${{ client.totalPremium | number: "1.0-0" }}
                </td>
                <td>
                  <div
                    class="risk-score"
                    [class]="getRiskClass(client.riskScore)"
                  >
                    <div class="risk-bar">
                      <div
                        class="risk-fill"
                        [style.width.%]="client.riskScore"
                      ></div>
                    </div>
                    <span class="risk-value">{{ client.riskScore }}</span>
                  </div>
                </td>
                <td>
                  <div class="actions">
                    <button
                      class="action-btn"
                      [title]="t('clients.viewDetails')"
                      (click)="
                        openClientDetail(client); $event.stopPropagation()
                      "
                    >
                      👁️
                    </button>
                    <button
                      class="action-btn"
                      [title]="t('clients.sendEmail')"
                      (click)="sendEmail(client); $event.stopPropagation()"
                    >
                      ✉️
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty-row">
                  <div class="empty-state">
                    <span class="empty-icon">👥</span>
                    <p>{{ t("clients.noClients") }}</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <!-- Client Detail Modal -->
      @if (selectedClient()) {
        <div class="modal-overlay" (click)="closeClientDetail()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <div class="modal-title">
                <div class="client-avatar large">
                  {{ selectedClient()!.firstName.charAt(0)
                  }}{{ selectedClient()!.lastName.charAt(0) }}
                </div>
                <div>
                  <h2>
                    {{ selectedClient()!.firstName }}
                    {{ selectedClient()!.lastName }}
                  </h2>
                  <span class="client-since"
                    >{{ t("common.clientSince") }}
                    {{ selectedClient()!.createdAt | date: "MMMM yyyy" }}</span
                  >
                </div>
              </div>
              <button class="close-btn" (click)="closeClientDetail()">✕</button>
            </header>

            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-card">
                  <h4>{{ t("clients.contactInfo") }}</h4>
                  <div class="detail-row">
                    <span class="icon">✉️</span>
                    <span>{{ selectedClient()!.email }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="icon">📱</span>
                    <span>{{ selectedClient()!.phone }}</span>
                  </div>
                </div>

                <div class="detail-card">
                  <h4>{{ t("clients.address") }}</h4>
                  <div class="detail-row">
                    <span class="icon">📍</span>
                    <span
                      >{{ selectedClient()!.address }}<br />{{
                        selectedClient()!.city
                      }}, {{ selectedClient()!.state }}
                      {{ selectedClient()!.zipCode }}</span
                    >
                  </div>
                </div>

                <div class="detail-card">
                  <h4>{{ t("clients.portfolio") }}</h4>
                  <div class="stat-row">
                    <div class="mini-stat">
                      <span class="value">{{
                        selectedClient()!.totalPolicies
                      }}</span>
                      <span class="label">{{ t("clients.policies") }}</span>
                    </div>
                    <div class="mini-stat">
                      <span class="value"
                        >\${{
                          selectedClient()!.totalPremium | number: "1.0-0"
                        }}</span
                      >
                      <span class="label">{{ t("policies.premium") }}</span>
                    </div>
                    <div class="mini-stat">
                      <span
                        class="value"
                        [class]="getRiskClass(selectedClient()!.riskScore)"
                        >{{ selectedClient()!.riskScore }}</span
                      >
                      <span class="label">{{ t("clients.riskScore") }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="policies-section">
                <h4>{{ t("clients.policies") }}</h4>
                <div class="policies-list">
                  @for (
                    policy of getClientPolicies(selectedClient()!.id);
                    track policy.id
                  ) {
                    <div class="policy-item">
                      <span class="policy-type">{{
                        t("policies.types." + policy.type)
                      }}</span>
                      <span class="policy-number">{{
                        policy.policyNumber
                      }}</span>
                      <span
                        class="policy-status badge"
                        [class]="'badge-' + getStatusClass(policy.status)"
                      >
                        {{ t("policies.status." + policy.status) }}
                      </span>
                      <span class="policy-premium"
                        >\${{ policy.premium | number: "1.0-0"
                        }}{{ t("policies.premiumPerYear") }}</span
                      >
                    </div>
                  } @empty {
                    <p class="no-policies">{{ t("policies.noPolicies") }}</p>
                  }
                </div>
              </div>
            </div>

            <footer class="modal-footer">
              <button class="btn btn-secondary" (click)="closeClientDetail()">
                {{ t("common.close") }}
              </button>
              <button
                class="btn btn-primary"
                (click)="sendEmail(selectedClient()!)"
              >
                ✉️ {{ t("clients.sendEmail") }}
              </button>
            </footer>
          </div>
        </div>
      }
    </main>
  `,
  styles: [
    `
      .clients-page {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-6);
      }

      /* Header */
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--spacing-4);
      }

      .search-box {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        padding: var(--spacing-2) var(--spacing-4);
        background: var(--neutral-100);
        border-radius: var(--radius-lg);
        min-width: 300px;
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

      .header-stats {
        display: flex;
        gap: var(--spacing-6);
      }

      .stat {
        text-align: center;
      }

      .stat-value {
        display: block;
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--primary-600);
      }

      .stat-label {
        font-size: var(--font-size-sm);
        color: var(--neutral-500);
      }

      /* Table */
      .table-section {
        overflow-x: auto;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
      }

      .table th {
        text-align: left;
        padding: var(--spacing-4);
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--neutral-600);
        border-bottom: 2px solid var(--neutral-200);
      }

      .table td {
        padding: var(--spacing-4);
        border-bottom: 1px solid var(--neutral-100);
        vertical-align: middle;
      }

      .table tbody tr {
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .table tbody tr:hover {
        background: var(--neutral-50);
      }

      .client-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
      }

      .client-avatar {
        width: 40px;
        height: 40px;
        background: var(--primary-100);
        color: var(--primary-700);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .client-avatar.large {
        width: 60px;
        height: 60px;
        font-size: var(--font-size-xl);
      }

      .client-name {
        display: flex;
        flex-direction: column;
      }

      .client-name .name {
        font-weight: 600;
      }

      .client-name .joined {
        font-size: var(--font-size-xs);
        color: var(--neutral-500);
      }

      .contact-info {
        display: flex;
        flex-direction: column;
        font-size: var(--font-size-sm);
      }

      .contact-info .email {
        color: var(--neutral-700);
      }

      .contact-info .phone {
        color: var(--neutral-500);
      }

      .premium {
        font-weight: 600;
        color: var(--accent-success);
      }

      .risk-score {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
      }

      .risk-bar {
        width: 60px;
        height: 6px;
        background: var(--neutral-200);
        border-radius: var(--radius-full);
        overflow: hidden;
      }

      .risk-fill {
        height: 100%;
        border-radius: var(--radius-full);
      }

      .risk-score.low .risk-fill {
        background: var(--accent-success);
      }
      .risk-score.medium .risk-fill {
        background: var(--accent-warning);
      }
      .risk-score.high .risk-fill {
        background: var(--accent-error);
      }

      .risk-value {
        font-weight: 600;
        font-size: var(--font-size-sm);
      }

      .risk-score.low .risk-value {
        color: var(--accent-success);
      }
      .risk-score.medium .risk-value {
        color: var(--accent-warning);
      }
      .risk-score.high .risk-value {
        color: var(--accent-error);
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
        max-width: 700px;
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

      .modal-title h2 {
        margin: 0;
      }

      .client-since {
        font-size: var(--font-size-sm);
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

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
        color: var(--neutral-600);
        margin: 0 0 var(--spacing-3) 0;
      }

      .detail-row {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-2);
        font-size: var(--font-size-sm);
        margin-bottom: var(--spacing-2);
      }

      .detail-row .icon {
        flex-shrink: 0;
      }

      .stat-row {
        display: flex;
        justify-content: space-around;
      }

      .mini-stat {
        text-align: center;
      }

      .mini-stat .value {
        display: block;
        font-size: var(--font-size-xl);
        font-weight: 700;
      }

      .mini-stat .label {
        font-size: var(--font-size-xs);
        color: var(--neutral-500);
      }

      .policies-section h4 {
        margin: 0 0 var(--spacing-3) 0;
      }

      .policies-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2);
      }

      .policy-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: var(--spacing-3);
        background: var(--neutral-50);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
      }

      .policy-type {
        font-weight: 600;
        min-width: 80px;
      }

      .policy-number {
        color: var(--neutral-500);
        flex: 1;
      }

      .policy-premium {
        font-weight: 600;
        color: var(--accent-success);
      }

      .no-policies {
        color: var(--neutral-500);
        text-align: center;
        padding: var(--spacing-4);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-3);
        padding: var(--spacing-4) var(--spacing-5);
        border-top: 1px solid var(--neutral-200);
      }

      .badge-active {
        background: #dcfce7;
        color: #166534;
      }
      .badge-pending {
        background: #fef3c7;
        color: #92400e;
      }
      .badge-expired {
        background: #fee2e2;
        color: #991b1b;
      }
    `,
  ],
})
export class ClientsComponent {
  private dataService = inject(DataService);
  private translateService = inject(TranslateService);

  t = (key: string, params?: Record<string, string | number>) =>
    this.translateService.get(key, params);

  searchQuery = signal("");
  selectedClient = signal<Client | null>(null);

  clients = this.dataService.clients;
  policies = this.dataService.policies;

  filteredClients = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.clients();

    return this.clients().filter(
      (c) =>
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query),
    );
  });

  totalPremium = computed(() =>
    this.clients().reduce((sum, c) => sum + c.totalPremium, 0),
  );

  getClientPolicies(clientId: string) {
    return this.policies().filter((p) => p.clientId === clientId);
  }

  getRiskClass(score: number): string {
    if (score <= 40) return "low";
    if (score <= 70) return "medium";
    return "high";
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: "success",
      pending: "warning",
      expired: "error",
      "renewal-pending": "warning",
      cancelled: "error",
    };
    return classes[status] || "info";
  }

  openClientDetail(client: Client): void {
    this.selectedClient.set(client);
  }

  closeClientDetail(): void {
    this.selectedClient.set(null);
  }

  sendEmail(client: Client): void {
    // Navigate to email with client pre-selected
    console.log("Send email to:", client.email);
  }
}
