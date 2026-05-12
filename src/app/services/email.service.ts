import { Injectable, signal } from "@angular/core";
import { Email } from "../models";

export interface EmailSendResult {
  success: boolean;
  emailId: string;
  message: string;
  sentAt?: string;
}

@Injectable({
  providedIn: "root",
})
export class EmailService {
  private sendingSignal = signal(false);
  readonly sending = this.sendingSignal.asReadonly();

  /**
   * Send an email (simulated)
   * In production, this would integrate with an email service like SendGrid
   */
  async sendEmail(email: Email): Promise<EmailSendResult> {
    this.sendingSignal.set(true);

    // Simulate sending delay
    await this.delay(1500);

    this.sendingSignal.set(false);

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    return {
      success,
      emailId: email.id,
      message: success
        ? "Email sent successfully"
        : "Failed to send email. Please try again.",
      sentAt: success ? new Date().toISOString() : undefined,
    };
  }

  /**
   * Schedule an email for later
   */
  async scheduleEmail(
    email: Email,
    scheduledAt: Date,
  ): Promise<EmailSendResult> {
    this.sendingSignal.set(true);
    await this.delay(500);
    this.sendingSignal.set(false);

    return {
      success: true,
      emailId: email.id,
      message: `Email scheduled for ${scheduledAt.toLocaleString()}`,
    };
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: Email[]): Promise<{
    total: number;
    sent: number;
    failed: number;
    results: EmailSendResult[];
  }> {
    this.sendingSignal.set(true);

    const results: EmailSendResult[] = [];
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Small delay between emails
      await this.delay(200);
    }

    this.sendingSignal.set(false);

    return {
      total: emails.length,
      sent,
      failed,
      results,
    };
  }

  /**
   * Generate email preview HTML
   */
  generatePreviewHTML(email: Email): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
          .to { color: #666; font-size: 14px; }
          .subject { font-size: 18px; font-weight: bold; color: #1f2937; margin: 10px 0; }
          .body { white-space: pre-wrap; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="to">To: ${email.toName} &lt;${email.to}&gt;</div>
          <div class="subject">${email.subject}</div>
        </div>
        <div class="body">${email.body}</div>
        <div class="footer">
          <p>This is a preview. The actual email may appear differently in the recipient's email client.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get email templates
   */
  getTemplates(): {
    id: string;
    name: string;
    subject: string;
    body: string;
  }[] {
    return [
      {
        id: "renewal",
        name: "Policy Renewal Reminder",
        subject: "Your Insurance Policy Renewal Reminder",
        body: `Dear [Client Name],

Your insurance policy is due for renewal soon. I wanted to reach out to discuss your options and ensure you continue to have the coverage you need.

Please contact me at your earliest convenience to review your policy and explore any available discounts.

Best regards,
Your Insurance Agent`,
      },
      {
        id: "welcome",
        name: "Welcome New Client",
        subject: "Welcome to Our Insurance Family!",
        body: `Dear [Client Name],

Welcome! I'm thrilled to have you as a client and look forward to serving your insurance needs.

As your dedicated agent, I'm here to help with any questions. Please don't hesitate to reach out.

Best regards,
Your Insurance Agent`,
      },
      {
        id: "payment",
        name: "Payment Reminder",
        subject: "Payment Reminder for Your Insurance Policy",
        body: `Dear [Client Name],

This is a friendly reminder that your insurance payment is due. To maintain continuous coverage, please submit your payment at your earliest convenience.

If you have any questions, please contact me.

Best regards,
Your Insurance Agent`,
      },
      {
        id: "claim-followup",
        name: "Claim Follow-up",
        subject: "Following Up on Your Insurance Claim",
        body: `Dear [Client Name],

I wanted to follow up regarding your recent claim. I understand this can be a stressful time, and I'm here to help make the process as smooth as possible.

Please don't hesitate to reach out if you have any questions or need assistance.

Best regards,
Your Insurance Agent`,
      },
      {
        id: "annual-review",
        name: "Annual Review Invitation",
        subject: "Time for Your Annual Insurance Review",
        body: `Dear [Client Name],

It's time for your annual insurance review! Life changes, and so do your insurance needs. I'd like to schedule a brief meeting to ensure your coverage is still right for you.

Please let me know your availability for a quick call.

Best regards,
Your Insurance Agent`,
      },
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
