import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Email, EmailStatus } from "../../models";
import { AIService } from "../../services/ai.service";
import { DataService } from "../../services/data.service";
import { EmailService } from "../../services/email.service";
import { TranslateService } from "../../services/translate.service";

@Component({
  selector: "app-email",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="email-page">
      <div class="email-layout">
        <!-- Email List Sidebar -->
        <aside class="email-sidebar">
          <header class="sidebar-header">
            <button
              class="btn btn-primary compose-btn"
              (click)="openComposer()"
            >
              ✏️ {{ t("email.compose") }}
            </button>
          </header>

          <div class="email-tabs">
            @for (tab of emailTabs; track tab.value) {
              <button
                class="tab-btn"
                [class.active]="selectedTab() === tab.value"
                (click)="selectedTab.set(tab.value)"
              >
                <span class="tab-icon">{{ tab.icon }}</span>
                <span class="tab-label">{{ t("email." + tab.value) }}</span>
                <span class="tab-count">{{ getTabCount(tab.value) }}</span>
              </button>
            }
          </div>

          <div class="email-list">
            @for (email of filteredEmails(); track email.id) {
              <article
                class="email-item"
                [class.selected]="selectedEmail()?.id === email.id"
                (click)="selectEmail(email)"
              >
                <div class="email-avatar">
                  {{ email.toName.charAt(0) }}
                </div>
                <div class="email-preview">
                  <div class="email-top">
                    <span class="email-to">{{ email.toName }}</span>
                    <span class="email-time">{{
                      formatTime(email.createdAt)
                    }}</span>
                  </div>
                  <p class="email-subject">{{ email.subject }}</p>
                  <p class="email-snippet">
                    {{ email.body | slice: 0 : 60 }}...
                  </p>
                </div>
                @if (email.aiGenerated) {
                  <span
                    class="ai-indicator"
                    [title]="t('dashboard.aiGenerated')"
                    >🤖</span
                  >
                }
              </article>
            } @empty {
              <div class="empty-list">
                <p>{{ t("email.noEmails") }}</p>
              </div>
            }
          </div>
        </aside>

        <!-- Email Content / Composer -->
        <section class="email-content">
          @if (showComposer()) {
            <!-- Email Composer -->
            <div class="composer">
              <header class="composer-header">
                <h2>
                  {{
                    editingEmail() ? t("email.editEmail") : t("email.newEmail")
                  }}
                </h2>
                <button class="close-btn" (click)="closeComposer()">✕</button>
              </header>

              <form class="composer-form" (ngSubmit)="sendEmail()">
                <div class="composer-field">
                  <label>{{ t("email.form.to") }}:</label>
                  <div class="recipient-input">
                    <select
                      class="form-input"
                      [(ngModel)]="emailForm.clientId"
                      name="clientId"
                      (change)="onClientSelect()"
                    >
                      <option value="">
                        {{ t("email.form.selectClient") }}
                      </option>
                      @for (client of clients(); track client.id) {
                        <option [value]="client.id">
                          {{ client.firstName }} {{ client.lastName }} ({{
                            client.email
                          }})
                        </option>
                      }
                    </select>
                  </div>
                </div>

                <div class="composer-field">
                  <label>{{ t("email.form.subject") }}:</label>
                  <input
                    type="text"
                    class="form-input"
                    [(ngModel)]="emailForm.subject"
                    name="subject"
                    [placeholder]="t('email.form.subjectPlaceholder')"
                    required
                  />
                </div>

                <div class="ai-templates">
                  <span class="templates-label"
                    >🤖 {{ t("email.aiTemplates") }}:</span
                  >
                  @for (template of templates; track template.id) {
                    <button
                      type="button"
                      class="template-btn"
                      (click)="useTemplate(template)"
                    >
                      {{ template.name }}
                    </button>
                  }
                </div>

                <div class="composer-body">
                  <textarea
                    class="form-input body-textarea"
                    [(ngModel)]="emailForm.body"
                    name="body"
                    [placeholder]="t('email.form.bodyPlaceholder')"
                    required
                  ></textarea>
                </div>

                <footer class="composer-footer">
                  <div class="footer-left">
                    <button
                      type="button"
                      class="btn btn-secondary"
                      (click)="generateWithAI()"
                      [disabled]="aiProcessing()"
                    >
                      @if (aiProcessing()) {
                        ⏳ {{ t("email.generating") }}
                      } @else {
                        🤖 {{ t("email.generateWithAI") }}
                      }
                    </button>
                  </div>
                  <div class="footer-right">
                    <button
                      type="button"
                      class="btn btn-secondary"
                      (click)="saveDraft()"
                    >
                      💾 {{ t("email.saveDraft") }}
                    </button>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      [disabled]="sending() || !isValidEmail()"
                    >
                      @if (sending()) {
                        ⏳ {{ t("email.sending") }}
                      } @else {
                        ✉️ {{ t("email.send") }}
                      }
                    </button>
                  </div>
                </footer>
              </form>
            </div>
          } @else if (selectedEmail()) {
            <!-- Email Detail View -->
            <div class="email-detail">
              <header class="detail-header">
                <div class="header-top">
                  <h2>{{ selectedEmail()!.subject }}</h2>
                  <div class="header-actions">
                    <button
                      class="action-btn"
                      (click)="editEmail(selectedEmail()!)"
                      [title]="t('common.edit')"
                    >
                      ✏️
                    </button>
                    <button
                      class="action-btn"
                      (click)="deleteEmail(selectedEmail()!)"
                      [title]="t('common.delete')"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div class="email-meta">
                  <div class="recipient-info">
                    <div class="recipient-avatar">
                      {{ selectedEmail()!.toName.charAt(0) }}
                    </div>
                    <div class="recipient-details">
                      <span class="recipient-name">{{
                        selectedEmail()!.toName
                      }}</span>
                      <span class="recipient-email"
                        >&lt;{{ selectedEmail()!.to }}&gt;</span
                      >
                    </div>
                  </div>
                  <div class="email-status">
                    <span
                      class="status-badge"
                      [class]="'status-' + selectedEmail()!.status"
                    >
                      {{ t("email.status." + selectedEmail()!.status) }}
                    </span>
                    <span class="email-date">{{
                      selectedEmail()!.createdAt | date: "MMM d, yyyy h:mm a"
                    }}</span>
                  </div>
                </div>
              </header>

              <div class="detail-body">
                <pre class="email-body">{{ selectedEmail()!.body }}</pre>
              </div>

              @if (
                selectedEmail()!.aiGenerated && selectedEmail()!.aiSuggestion
              ) {
                <div class="ai-note">
                  <span class="ai-icon">🤖</span>
                  <span class="ai-text">{{
                    selectedEmail()!.aiSuggestion
                  }}</span>
                </div>
              }

              <footer class="detail-footer">
                @if (selectedEmail()!.status === EmailStatus.Draft) {
                  <button class="btn btn-primary" (click)="sendSelectedEmail()">
                    ✉️ {{ t("email.sendEmail") }}
                  </button>
                }
              </footer>
            </div>
          } @else {
            <!-- Empty State -->
            <div class="empty-content">
              <span class="empty-icon">✉️</span>
              <h3>{{ t("email.noEmailSelected") }}</h3>
              <p>{{ t("email.selectOrCompose") }}</p>
              <button class="btn btn-primary" (click)="openComposer()">
                ✏️ {{ t("email.composeEmail") }}
              </button>
            </div>
          }
        </section>
      </div>
    </main>
  `,
  styles: [
    `
      .email-page {
        height: calc(100vh - 180px);
      }

      .email-layout {
        display: flex;
        height: 100%;
        background: white;
        border-radius: var(--radius-xl);
        overflow: hidden;
        box-shadow: var(--shadow-lg);
      }

      /* Sidebar */
      .email-sidebar {
        width: 350px;
        border-right: 1px solid var(--neutral-200);
        display: flex;
        flex-direction: column;
      }

      .sidebar-header {
        padding: var(--spacing-4);
        border-bottom: 1px solid var(--neutral-200);
      }

      .compose-btn {
        width: 100%;
      }

      .email-tabs {
        display: flex;
        flex-direction: column;
        padding: var(--spacing-2);
        border-bottom: 1px solid var(--neutral-200);
      }

      .tab-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: var(--spacing-3) var(--spacing-4);
        border: none;
        background: transparent;
        border-radius: var(--radius-lg);
        cursor: pointer;
        text-align: left;
        transition: all var(--transition-fast);
      }

      .tab-btn:hover {
        background: var(--neutral-100);
      }

      .tab-btn.active {
        background: var(--primary-100);
        color: var(--primary-700);
      }

      .tab-icon {
        font-size: 1.25rem;
      }

      .tab-label {
        flex: 1;
        font-weight: 500;
      }

      .tab-count {
        font-size: var(--font-size-xs);
        padding: 2px 8px;
        background: var(--neutral-200);
        border-radius: var(--radius-full);
      }

      .tab-btn.active .tab-count {
        background: var(--primary-200);
      }

      /* Email List */
      .email-list {
        flex: 1;
        overflow-y: auto;
      }

      .email-item {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-3);
        padding: var(--spacing-4);
        border-bottom: 1px solid var(--neutral-100);
        cursor: pointer;
        transition: background var(--transition-fast);
        position: relative;
      }

      .email-item:hover {
        background: var(--neutral-50);
      }

      .email-item.selected {
        background: var(--primary-50);
        border-left: 3px solid var(--primary-500);
      }

      .email-avatar {
        width: 40px;
        height: 40px;
        background: var(--primary-100);
        color: var(--primary-700);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
      }

      .email-preview {
        flex: 1;
        min-width: 0;
      }

      .email-top {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-1);
      }

      .email-to {
        font-weight: 600;
        font-size: var(--font-size-sm);
      }

      .email-time {
        font-size: var(--font-size-xs);
        color: var(--neutral-400);
      }

      .email-subject {
        font-size: var(--font-size-sm);
        margin: 0 0 var(--spacing-1) 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .email-snippet {
        font-size: var(--font-size-xs);
        color: var(--neutral-500);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ai-indicator {
        position: absolute;
        top: var(--spacing-2);
        right: var(--spacing-2);
        font-size: 0.875rem;
      }

      .empty-list {
        padding: var(--spacing-6);
        text-align: center;
        color: var(--neutral-500);
      }

      /* Email Content */
      .email-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Composer */
      .composer {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .composer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-4) var(--spacing-5);
        border-bottom: 1px solid var(--neutral-200);
      }

      .composer-header h2 {
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
      }

      .composer-form {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
      }

      .composer-field {
        display: flex;
        align-items: center;
        padding: var(--spacing-3) var(--spacing-5);
        border-bottom: 1px solid var(--neutral-100);
      }

      .composer-field label {
        width: 60px;
        font-weight: 500;
        color: var(--neutral-600);
      }

      .composer-field .form-input {
        flex: 1;
        border: none;
        padding: var(--spacing-2);
      }

      .composer-field .form-input:focus {
        box-shadow: none;
      }

      .ai-templates {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        padding: var(--spacing-3) var(--spacing-5);
        background: var(--neutral-50);
        overflow-x: auto;
      }

      .templates-label {
        font-size: var(--font-size-sm);
        color: var(--neutral-500);
        white-space: nowrap;
      }

      .template-btn {
        padding: var(--spacing-1) var(--spacing-3);
        background: white;
        border: 1px solid var(--neutral-300);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        cursor: pointer;
        white-space: nowrap;
        transition: all var(--transition-fast);
      }

      .template-btn:hover {
        background: var(--primary-50);
        border-color: var(--primary-300);
      }

      .composer-body {
        flex: 1;
        padding: var(--spacing-4) var(--spacing-5);
        overflow: hidden;
      }

      .body-textarea {
        width: 100%;
        height: 100%;
        border: none;
        resize: none;
        font-family: inherit;
        font-size: var(--font-size-base);
        line-height: 1.6;
      }

      .body-textarea:focus {
        box-shadow: none;
      }

      .composer-footer {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-4) var(--spacing-5);
        border-top: 1px solid var(--neutral-200);
        background: var(--neutral-50);
      }

      .footer-right {
        display: flex;
        gap: var(--spacing-2);
      }

      /* Email Detail */
      .email-detail {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .detail-header {
        padding: var(--spacing-5);
        border-bottom: 1px solid var(--neutral-200);
      }

      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-4);
      }

      .header-top h2 {
        margin: 0;
        font-size: var(--font-size-xl);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-2);
      }

      .action-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: var(--neutral-100);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .action-btn:hover {
        background: var(--neutral-200);
      }

      .email-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .recipient-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
      }

      .recipient-avatar {
        width: 48px;
        height: 48px;
        background: var(--primary-100);
        color: var(--primary-700);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-xl);
        font-weight: 600;
      }

      .recipient-details {
        display: flex;
        flex-direction: column;
      }

      .recipient-name {
        font-weight: 600;
      }

      .recipient-email {
        font-size: var(--font-size-sm);
        color: var(--neutral-500);
      }

      .email-status {
        text-align: right;
      }

      .status-badge {
        display: inline-block;
        padding: var(--spacing-1) var(--spacing-3);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: 600;
        margin-bottom: var(--spacing-1);
      }

      .status-draft {
        background: #fef3c7;
        color: #92400e;
      }
      .status-sent {
        background: #dcfce7;
        color: #166534;
      }
      .status-scheduled {
        background: #cffafe;
        color: #155e75;
      }
      .status-failed {
        background: #fee2e2;
        color: #991b1b;
      }

      .email-date {
        display: block;
        font-size: var(--font-size-sm);
        color: var(--neutral-500);
      }

      .detail-body {
        flex: 1;
        padding: var(--spacing-5);
        overflow-y: auto;
      }

      .email-body {
        font-family: inherit;
        font-size: var(--font-size-base);
        line-height: 1.8;
        white-space: pre-wrap;
        margin: 0;
      }

      .ai-note {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-2);
        margin: 0 var(--spacing-5);
        padding: var(--spacing-3);
        background: var(--primary-50);
        border-radius: var(--radius-lg);
      }

      .ai-icon {
        flex-shrink: 0;
      }

      .ai-text {
        font-size: var(--font-size-sm);
        color: var(--primary-700);
      }

      .detail-footer {
        padding: var(--spacing-4) var(--spacing-5);
        border-top: 1px solid var(--neutral-200);
      }

      /* Empty State */
      .empty-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--neutral-500);
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-4);
      }

      .empty-content h3 {
        margin: 0 0 var(--spacing-2) 0;
        color: var(--neutral-700);
      }

      .empty-content p {
        margin: 0 0 var(--spacing-4) 0;
      }

      @media (max-width: 900px) {
        .email-sidebar {
          width: 100%;
          max-width: 300px;
        }
      }
    `,
  ],
})
export class EmailComponent {
  private dataService = inject(DataService);
  private emailService = inject(EmailService);
  private aiService = inject(AIService);
  private translateService = inject(TranslateService);

  t = (key: string, params?: Record<string, string | number>) =>
    this.translateService.get(key, params);

  // Expose enum to template
  readonly EmailStatus = EmailStatus;

  emailTabs = [
    { label: "Drafts", value: "drafts", icon: "📝" },
    { label: "Sent", value: "sent", icon: "✅" },
    { label: "Scheduled", value: "scheduled", icon: "🕐" },
  ];

  selectedTab = signal<string>("drafts");
  selectedEmail = signal<Email | null>(null);
  showComposer = signal(false);
  editingEmail = signal<Email | null>(null);

  emailForm = {
    clientId: "",
    to: "",
    toName: "",
    subject: "",
    body: "",
  };

  emails = this.dataService.emails;
  clients = this.dataService.clients;
  sending = this.emailService.sending;
  aiProcessing = this.aiService.processing;
  templates = this.emailService.getTemplates();

  filteredEmails = computed(() => {
    return this.emails().filter((e) => e.status === this.selectedTab());
  });

  getTabCount(tab: string): number {
    return this.emails().filter((e) => e.status === tab).length;
  }

  selectEmail(email: Email): void {
    this.selectedEmail.set(email);
    this.showComposer.set(false);
  }

  openComposer(): void {
    this.showComposer.set(true);
    this.selectedEmail.set(null);
    this.editingEmail.set(null);
    this.resetForm();
  }

  closeComposer(): void {
    this.showComposer.set(false);
  }

  resetForm(): void {
    this.emailForm = {
      clientId: "",
      to: "",
      toName: "",
      subject: "",
      body: "",
    };
  }

  onClientSelect(): void {
    const client = this.clients().find((c) => c.id === this.emailForm.clientId);
    if (client) {
      this.emailForm.to = client.email;
      this.emailForm.toName = `${client.firstName} ${client.lastName}`;
    }
  }

  useTemplate(template: {
    id: string;
    name: string;
    subject: string;
    body: string;
  }): void {
    this.emailForm.subject = template.subject;
    const clientName = this.emailForm.toName || "[Client Name]";
    this.emailForm.body = template.body.replace("[Client Name]", clientName);
  }

  async generateWithAI(): Promise<void> {
    const clientName = this.emailForm.toName || "Client";
    const content = await this.aiService.generateEmailContent(
      "general",
      clientName,
      {},
    );
    this.emailForm.body = content;
  }

  isValidEmail(): boolean {
    return (
      !!this.emailForm.to && !!this.emailForm.subject && !!this.emailForm.body
    );
  }

  saveDraft(): void {
    const email: Email = {
      id: this.editingEmail()?.id || `e-${Date.now()}`,
      to: this.emailForm.to,
      toName: this.emailForm.toName,
      subject: this.emailForm.subject,
      body: this.emailForm.body,
      status: EmailStatus.Draft,
      clientId: this.emailForm.clientId || undefined,
      aiGenerated: false,
      createdAt: new Date().toISOString(),
    };

    if (this.editingEmail()) {
      this.dataService.updateEmail(email.id, email);
    } else {
      this.dataService.addEmail(email);
    }

    this.closeComposer();
    this.selectedTab.set("draft");
  }

  async sendEmail(): Promise<void> {
    const email: Email = {
      id: this.editingEmail()?.id || `e-${Date.now()}`,
      to: this.emailForm.to,
      toName: this.emailForm.toName,
      subject: this.emailForm.subject,
      body: this.emailForm.body,
      status: EmailStatus.Draft,
      clientId: this.emailForm.clientId || undefined,
      aiGenerated: false,
      createdAt: new Date().toISOString(),
    };

    // First save/update the email
    if (this.editingEmail()) {
      this.dataService.updateEmail(email.id, email);
    } else {
      this.dataService.addEmail(email);
    }

    // Then send it
    const result = await this.emailService.sendEmail(email);
    if (result.success) {
      this.dataService.sendEmail(email.id);
    }

    this.closeComposer();
    this.selectedTab.set("sent");
  }

  editEmail(email: Email): void {
    this.editingEmail.set(email);
    this.emailForm = {
      clientId: email.clientId || "",
      to: email.to,
      toName: email.toName,
      subject: email.subject,
      body: email.body,
    };
    this.showComposer.set(true);
    this.selectedEmail.set(null);
  }

  deleteEmail(email: Email): void {
    // In a real app, implement proper deletion
    this.dataService.updateEmail(email.id, { status: EmailStatus.Draft });
    this.selectedEmail.set(null);
  }

  async sendSelectedEmail(): Promise<void> {
    const email = this.selectedEmail();
    if (email) {
      const result = await this.emailService.sendEmail(email);
      if (result.success) {
        this.dataService.sendEmail(email.id);
        this.selectedTab.set("sent");
        this.selectedEmail.set(null);
      }
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}
