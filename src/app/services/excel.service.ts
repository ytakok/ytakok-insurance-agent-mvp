import { Injectable, signal } from "@angular/core";
import {
  AIInsight,
  Client,
  ExcelParseError,
  ExcelUploadResult,
  Policy,
  PolicyStatus,
  PolicyType,
} from "../models";

@Injectable({
  providedIn: "root",
})
export class ExcelService {
  private processingSignal = signal(false);
  private progressSignal = signal(0);

  readonly processing = this.processingSignal.asReadonly();
  readonly progress = this.progressSignal.asReadonly();

  /**
   * Parse Excel file and extract data
   * In production, this would use a library like xlsx
   */
  async parseExcelFile(file: File): Promise<ExcelUploadResult> {
    this.processingSignal.set(true);
    this.progressSignal.set(0);

    const result: ExcelUploadResult = {
      success: false,
      fileName: file.name,
      rowsProcessed: 0,
      clientsImported: 0,
      policiesImported: 0,
      errors: [],
      aiInsights: [],
    };

    try {
      // Simulate file reading
      await this.delay(500);
      this.progressSignal.set(20);

      // Read file content (simulated)
      const content = await this.readFileContent(file);
      this.progressSignal.set(40);

      // Parse data (simulated)
      const { clients, policies, errors } = this.parseContent(content);
      this.progressSignal.set(60);

      // Validate data
      const validationErrors = this.validateData(clients, policies);
      errors.push(...validationErrors);
      this.progressSignal.set(80);

      // Generate AI insights
      const insights = this.generateInsights(clients, policies);
      this.progressSignal.set(100);

      result.success = errors.length === 0;
      result.rowsProcessed = clients.length + policies.length;
      result.clientsImported = clients.length;
      result.policiesImported = policies.length;
      result.errors = errors;
      result.aiInsights = insights;
    } catch (error) {
      result.errors.push({
        row: 0,
        column: "file",
        message: `Failed to parse file: ${error}`,
        value: file.name,
      });
    }

    this.processingSignal.set(false);
    return result;
  }

  /**
   * Generate sample Excel file for download
   */
  generateSampleExcel(): Blob {
    const csvContent = `Client Name,Email,Phone,Policy Type,Premium,Start Date,End Date,Carrier,Coverage Amount,Deductible
John Smith,john.smith@email.com,(555) 123-4567,Auto,1200,2023-01-15,2024-01-15,SafeGuard Insurance,100000,500
Sarah Johnson,sarah.johnson@email.com,(555) 234-5678,Life,3600,2022-06-10,2042-06-10,LifeSecure Corp,500000,0
Michael Williams,michael.w@email.com,(555) 345-6789,Auto,1800,2023-03-20,2024-03-20,AutoShield Inc,75000,750
Emily Brown,emily.brown@email.com,(555) 456-7890,Business,4500,2021-09-05,2024-09-05,BusinessPro Insurance,1000000,2500
David Garcia,david.garcia@email.com,(555) 567-8901,Umbrella,2000,2020-12-01,2024-12-01,UmbrellaCover Ltd,2000000,0
Jessica Martinez,jessica.m@email.com,(555) 678-9012,Health,4800,2022-02-14,2023-02-14,HealthFirst Insurance,0,1500`;

    return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(data: (Client | Policy)[], type: "clients" | "policies"): Blob {
    let csvContent = "";

    if (type === "clients") {
      csvContent =
        "ID,First Name,Last Name,Email,Phone,Address,City,State,Zip,Total Policies,Total Premium,Risk Score\n";
      (data as Client[]).forEach((client) => {
        csvContent += `${client.id},${client.firstName},${client.lastName},${client.email},${client.phone},${client.address},${client.city},${client.state},${client.zipCode},${client.totalPolicies},${client.totalPremium},${client.riskScore}\n`;
      });
    } else {
      csvContent =
        "ID,Policy Number,Client,Type,Status,Premium,Start Date,End Date,Carrier,Coverage\n";
      (data as Policy[]).forEach((policy) => {
        csvContent += `${policy.id},${policy.policyNumber},${policy.clientName},${policy.type},${policy.status},${policy.premium},${policy.startDate},${policy.endDate},${policy.carrier},${policy.coverageAmount}\n`;
      });
    }

    return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  }

  private async readFileContent(file: File): Promise<string[][]> {
    // Simulated Excel parsing - in production use xlsx library
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const rows = text
          .split("\n")
          .map((row) => row.split(",").map((cell) => cell.trim()));
        resolve(rows);
      };
      reader.onerror = () => {
        // Return sample data if file can't be read
        resolve(this.getSampleData());
      };
      reader.readAsText(file);
    });
  }

  private parseContent(content: string[][]): {
    clients: Partial<Client>[];
    policies: Partial<Policy>[];
    errors: ExcelParseError[];
  } {
    const clients: Partial<Client>[] = [];
    const policies: Partial<Policy>[] = [];
    const errors: ExcelParseError[] = [];

    // Skip header row
    const dataRows = content.slice(1);

    dataRows.forEach((row, index) => {
      if (row.length < 8) {
        if (row.some((cell) => cell.trim() !== "")) {
          errors.push({
            row: index + 2,
            column: "all",
            message: "Incomplete row - missing required columns",
            value: row.join(", "),
          });
        }
        return;
      }

      const [
        name,
        email,
        phone,
        policyType,
        premium,
        startDate,
        endDate,
        carrier,
        coverage,
        deductible,
      ] = row;

      // Parse client name
      const nameParts = name?.split(" ") || ["Unknown"];
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "Unknown";

      // Create client if not exists
      const clientId = `imported-${index}`;
      clients.push({
        id: clientId,
        firstName,
        lastName,
        email: email || "",
        phone: phone || "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        dateOfBirth: "",
        createdAt: new Date().toISOString(),
        totalPolicies: 1,
        totalPremium: this.parsePremium(premium),
        riskScore: Math.floor(Math.random() * 50) + 20,
      });

      // Create policy
      policies.push({
        id: `policy-imported-${index}`,
        clientId,
        clientName: name,
        policyNumber: `POL-IMP-${Date.now()}-${index}`,
        type: this.parsePolcyType(policyType),
        status: PolicyStatus.Active,
        premium: this.parsePremium(premium),
        deductible: this.parsePremium(deductible || "0"),
        coverageAmount: this.parsePremium(coverage || "0"),
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate: endDate || "",
        renewalDate: "",
        carrier: carrier || "Unknown",
        notes: "Imported from Excel",
      });
    });

    return { clients, policies, errors };
  }

  private validateData(
    clients: Partial<Client>[],
    policies: Partial<Policy>[],
  ): ExcelParseError[] {
    const errors: ExcelParseError[] = [];

    clients.forEach((client, index) => {
      if (!client.email || !this.isValidEmail(client.email)) {
        errors.push({
          row: index + 2,
          column: "Email",
          message: "Invalid email format",
          value: client.email || "",
        });
      }
    });

    policies.forEach((policy, index) => {
      if (policy.premium && policy.premium < 0) {
        errors.push({
          row: index + 2,
          column: "Premium",
          message: "Premium cannot be negative",
          value: String(policy.premium),
        });
      }
    });

    return errors;
  }

  private generateInsights(
    clients: Partial<Client>[],
    policies: Partial<Policy>[],
  ): AIInsight[] {
    const insights: AIInsight[] = [];

    // Portfolio summary
    const totalPremium = policies.reduce((sum, p) => sum + (p.premium || 0), 0);
    insights.push({
      type: "trend",
      title: "Import Summary",
      description: `Successfully processed ${clients.length} clients and ${policies.length} policies with total premium of $${totalPremium.toLocaleString()}.`,
      confidence: 100,
      affectedClients: clients.length,
      potentialValue: totalPremium,
    });

    // Policy type distribution
    const typeCount: Record<string, number> = {};
    policies.forEach((p) => {
      const type = p.type || "unknown";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const mostCommonType = Object.entries(typeCount).sort(
      (a, b) => b[1] - a[1],
    )[0];

    if (mostCommonType) {
      insights.push({
        type: "trend",
        title: "Policy Distribution",
        description: `${mostCommonType[0]} policies are most common (${mostCommonType[1]} total). Consider cross-sell opportunities for other policy types.`,
        confidence: 90,
        affectedClients: mostCommonType[1],
      });
    }

    // High-risk clients
    const highRiskClients = clients.filter((c) => (c.riskScore || 0) > 60);
    if (highRiskClients.length > 0) {
      insights.push({
        type: "risk",
        title: "High-Risk Clients Detected",
        description: `${highRiskClients.length} clients have elevated risk scores. Review their coverage levels.`,
        confidence: 85,
        affectedClients: highRiskClients.length,
      });
    }

    return insights;
  }

  private parsePremium(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[$,]/g, "")) || 0;
  }

  private parsePolcyType(type: string): PolicyType {
    const normalizedType = (type || "").toLowerCase().trim();
    const typeMap: Record<string, PolicyType> = {
      auto: PolicyType.Auto,
      automobile: PolicyType.Auto,
      car: PolicyType.Auto,
      home: PolicyType.Home,
      homeowners: PolicyType.Home,
      house: PolicyType.Home,
      life: PolicyType.Life,
      "term life": PolicyType.Life,
      "whole life": PolicyType.Life,
      health: PolicyType.Health,
      medical: PolicyType.Health,
      business: PolicyType.Business,
      commercial: PolicyType.Business,
      umbrella: PolicyType.Umbrella,
      liability: PolicyType.Umbrella,
    };
    return typeMap[normalizedType] || PolicyType.Auto;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getSampleData(): string[][] {
    return [
      [
        "Client Name",
        "Email",
        "Phone",
        "Policy Type",
        "Premium",
        "Start Date",
        "End Date",
        "Carrier",
        "Coverage",
        "Deductible",
      ],
      [
        "John Smith",
        "john.smith@email.com",
        "(555) 123-4567",
        "Auto",
        "1200",
        "2023-01-15",
        "2024-01-15",
        "SafeGuard Insurance",
        "100000",
        "500",
      ],
      [
        "Sarah Johnson",
        "sarah.johnson@email.com",
        "(555) 234-5678",
        "Life",
        "3600",
        "2022-06-10",
        "2042-06-10",
        "LifeSecure Corp",
        "500000",
        "0",
      ],
      [
        "Michael Williams",
        "michael.w@email.com",
        "(555) 345-6789",
        "Auto",
        "1800",
        "2023-03-20",
        "2024-03-20",
        "AutoShield Inc",
        "75000",
        "750",
      ],
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
