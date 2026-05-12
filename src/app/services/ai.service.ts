import { Injectable, signal } from "@angular/core";
import {
  AIAlert,
  AIInsight,
  AlertPriority,
  AlertType,
  Client,
  Email,
  Policy,
  Task,
  TaskPriority,
} from "../models";

interface AIAnalysisResult {
  alerts: AIAlert[];
  insights: AIInsight[];
  suggestedTasks: Partial<Task>[];
  suggestedEmails: Partial<Email>[];
}

@Injectable({
  providedIn: "root",
})
export class AIService {
  private processingSignal = signal(false);
  readonly processing = this.processingSignal.asReadonly();

  /**
   * Simulates AI analysis of uploaded Excel data
   * In production, this would call an actual AI service
   */
  async analyzeExcelData(
    clients: Client[],
    policies: Policy[],
  ): Promise<AIAnalysisResult> {
    this.processingSignal.set(true);

    // Simulate AI processing delay
    await this.delay(2000);

    const alerts: AIAlert[] = [];
    const insights: AIInsight[] = [];
    const suggestedTasks: Partial<Task>[] = [];
    const suggestedEmails: Partial<Email>[] = [];

    // Analyze policies for renewal alerts
    const today = new Date();
    policies.forEach((policy) => {
      const endDate = new Date(policy.endDate);
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry < 0) {
        // Expired policy
        alerts.push(
          this.generateAlert(
            AlertType.Renewal,
            AlertPriority.Critical,
            `Expired Policy: ${policy.policyNumber}`,
            `Policy for ${policy.clientName} expired ${Math.abs(daysUntilExpiry)} days ago.`,
            policy,
            98,
          ),
        );

        suggestedTasks.push({
          title: `Urgent: Renew ${policy.type} policy for ${policy.clientName}`,
          description: `Policy ${policy.policyNumber} has expired. Contact client immediately.`,
          priority: TaskPriority.Urgent,
          clientId: policy.clientId,
          clientName: policy.clientName,
          policyId: policy.id,
          aiGenerated: true,
          aiSuggestion:
            "Expired policies are high priority. Consider offering loyalty discount for renewal.",
        });
      } else if (daysUntilExpiry <= 30) {
        // Expiring soon
        alerts.push(
          this.generateAlert(
            AlertType.Renewal,
            AlertPriority.High,
            `Policy Expiring Soon: ${policy.policyNumber}`,
            `Policy for ${policy.clientName} expires in ${daysUntilExpiry} days.`,
            policy,
            95,
          ),
        );

        suggestedEmails.push({
          to: "",
          toName: policy.clientName,
          subject: `Your ${policy.type} Insurance Renewal Reminder`,
          body: this.generateRenewalEmailBody(policy, daysUntilExpiry),
          clientId: policy.clientId,
          policyId: policy.id,
          aiGenerated: true,
          aiSuggestion:
            "Send renewal reminder 30 days before expiry for best conversion rates.",
        });
      }
    });

    // Analyze clients for risk patterns
    clients.forEach((client) => {
      if (client.riskScore > 70) {
        alerts.push({
          id: `ai-${Date.now()}-${client.id}`,
          type: AlertType.Coverage,
          priority: AlertPriority.High,
          title: `High Risk Client: ${client.firstName} ${client.lastName}`,
          message: `Client has a risk score of ${client.riskScore}. Review coverage adequacy.`,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          actionRequired:
            "Review coverage levels and recommend additional protection",
          aiConfidence: 85,
          aiInsight:
            "High risk clients may benefit from umbrella coverage or higher limits.",
          createdAt: new Date().toISOString(),
          isRead: false,
          isDismissed: false,
        });
      }
    });

    // Generate portfolio insights
    const totalPremium = policies.reduce((sum, p) => sum + p.premium, 0);
    const avgPremium = totalPremium / policies.length;

    insights.push({
      type: "trend",
      title: "Portfolio Overview",
      description: `Analyzed ${policies.length} policies with total annual premium of $${totalPremium.toLocaleString()}. Average premium: $${avgPremium.toFixed(0)}.`,
      confidence: 100,
      affectedClients: clients.length,
      potentialValue: totalPremium,
    });

    // Cross-sell opportunities
    const clientsWithoutUmbrella = clients.filter(
      (c) =>
        !policies.some((p) => p.clientId === c.id && p.type === "umbrella"),
    );

    if (clientsWithoutUmbrella.length > 0) {
      insights.push({
        type: "opportunity",
        title: "Umbrella Policy Opportunities",
        description: `${clientsWithoutUmbrella.length} clients don't have umbrella coverage. Potential upsell opportunity.`,
        confidence: 78,
        affectedClients: clientsWithoutUmbrella.length,
        potentialValue: clientsWithoutUmbrella.length * 1500,
      });
    }

    // High-value client retention
    const highValueClients = clients.filter((c) => c.totalPremium > 5000);
    if (highValueClients.length > 0) {
      insights.push({
        type: "action",
        title: "High-Value Client Review",
        description: `${highValueClients.length} high-value clients identified. Schedule annual reviews to ensure retention.`,
        confidence: 88,
        affectedClients: highValueClients.length,
        potentialValue: highValueClients.reduce(
          (sum, c) => sum + c.totalPremium,
          0,
        ),
      });
    }

    this.processingSignal.set(false);

    return {
      alerts,
      insights,
      suggestedTasks,
      suggestedEmails,
    };
  }

  /**
   * Generate AI-powered email content
   */
  async generateEmailContent(
    type: "renewal" | "payment" | "welcome" | "followup" | "general",
    clientName: string,
    context: Record<string, string>,
  ): Promise<string> {
    this.processingSignal.set(true);
    await this.delay(1000);
    this.processingSignal.set(false);

    switch (type) {
      case "renewal":
        return `Dear ${clientName},

I hope this message finds you well. I'm reaching out regarding your upcoming policy renewal.

As your dedicated insurance agent, I want to ensure you have the best coverage at the most competitive rates. I've reviewed your current policy and have some recommendations that may interest you.

Would you be available for a brief call this week to discuss your options? I'm confident we can find a solution that meets your needs.

Please let me know your availability, or feel free to call me directly.

Best regards,
Your Insurance Agent`;

      case "payment":
        return `Dear ${clientName},

I hope you're doing well. This is a friendly reminder about your insurance payment.

Your payment of ${context["amount"] || "the outstanding balance"} for policy ${context["policyNumber"] || "your policy"} is currently due.

To maintain continuous coverage, please submit your payment at your earliest convenience. You can pay online, by phone, or by mail.

If you have any questions or need to discuss payment arrangements, please don't hesitate to contact me.

Best regards,
Your Insurance Agent`;

      case "welcome":
        return `Dear ${clientName},

Welcome to our insurance family! I'm thrilled to have you as a client and look forward to serving your insurance needs.

As your dedicated agent, I'm here to help you with any questions or concerns. Here's what you can expect from me:
• Personalized coverage recommendations
• Annual policy reviews
• Quick response to claims and inquiries
• Regular updates on new products and discounts

Please don't hesitate to reach out anytime. Your peace of mind is my priority.

Best regards,
Your Insurance Agent`;

      case "followup":
        return `Dear ${clientName},

I wanted to follow up on our recent conversation. Thank you for taking the time to discuss your insurance needs with me.

Based on our discussion, I've prepared some options for you to review. Please let me know if you have any questions or if you'd like to schedule another call.

I'm committed to finding the best solution for you and your family.

Best regards,
Your Insurance Agent`;

      default:
        return `Dear ${clientName},

I hope this message finds you well. I wanted to reach out to check in and see how everything is going.

As your insurance agent, I'm always here to help with any questions or concerns you may have. Whether you need to update your coverage, file a claim, or just have a question, please don't hesitate to contact me.

Best regards,
Your Insurance Agent`;
    }
  }

  /**
   * Generate task suggestions based on alert
   */
  async generateTaskFromAlert(alert: AIAlert): Promise<Partial<Task>> {
    this.processingSignal.set(true);
    await this.delay(500);
    this.processingSignal.set(false);

    const priorityMap: Record<AlertPriority, TaskPriority> = {
      [AlertPriority.Low]: TaskPriority.Low,
      [AlertPriority.Medium]: TaskPriority.Medium,
      [AlertPriority.High]: TaskPriority.High,
      [AlertPriority.Critical]: TaskPriority.Urgent,
    };

    return {
      title: `Action Required: ${alert.title}`,
      description: alert.actionRequired,
      priority: priorityMap[alert.priority] || TaskPriority.Medium,
      clientId: alert.clientId,
      clientName: alert.clientName,
      policyId: alert.policyId,
      alertId: alert.id,
      aiGenerated: true,
      aiSuggestion: alert.aiInsight,
      dueDate: this.calculateDueDate(alert.priority),
    };
  }

  /**
   * Analyze text for sentiment and key points
   */
  async analyzeText(text: string): Promise<{
    sentiment: "positive" | "neutral" | "negative";
    keyPoints: string[];
    suggestedActions: string[];
  }> {
    this.processingSignal.set(true);
    await this.delay(800);
    this.processingSignal.set(false);

    // Simulated analysis
    const lowerText = text.toLowerCase();
    let sentiment: "positive" | "neutral" | "negative" = "neutral";

    if (
      lowerText.includes("thank") ||
      lowerText.includes("great") ||
      lowerText.includes("excellent")
    ) {
      sentiment = "positive";
    } else if (
      lowerText.includes("urgent") ||
      lowerText.includes("problem") ||
      lowerText.includes("issue")
    ) {
      sentiment = "negative";
    }

    return {
      sentiment,
      keyPoints: [
        "Client communication analyzed",
        "Key topics identified",
        "Action items extracted",
      ],
      suggestedActions: [
        "Schedule follow-up call",
        "Update client notes",
        "Review related policies",
      ],
    };
  }

  private generateAlert(
    type: AIAlert["type"],
    priority: AIAlert["priority"],
    title: string,
    message: string,
    policy: Policy,
    confidence: number,
  ): AIAlert {
    return {
      id: `ai-${Date.now()}-${policy.id}`,
      type,
      priority,
      title,
      message,
      clientId: policy.clientId,
      clientName: policy.clientName,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      actionRequired: `Review and take action on ${policy.policyNumber}`,
      aiConfidence: confidence,
      aiInsight: `AI analysis suggests immediate attention for ${type} issue.`,
      createdAt: new Date().toISOString(),
      isRead: false,
      isDismissed: false,
    };
  }

  private generateRenewalEmailBody(
    policy: Policy,
    daysUntilExpiry: number,
  ): string {
    return `Dear ${policy.clientName},

Your ${policy.type} insurance policy (${policy.policyNumber}) will expire in ${daysUntilExpiry} days.

Current coverage: $${policy.coverageAmount.toLocaleString()}
Current premium: $${policy.premium.toLocaleString()}/year

I'd love to discuss your renewal options and ensure you have the best coverage for your needs. We may also have new discounts available.

Please contact me to schedule a quick review.

Best regards,
Your Insurance Agent`;
  }

  private calculateDueDate(priority: string): string {
    const today = new Date();
    let daysToAdd = 7;

    switch (priority) {
      case "critical":
        daysToAdd = 1;
        break;
      case "high":
        daysToAdd = 3;
        break;
      case "medium":
        daysToAdd = 7;
        break;
      case "low":
        daysToAdd = 14;
        break;
    }

    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split("T")[0];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
