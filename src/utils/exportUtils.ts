import type { AnyTransaction } from "../types/models";

// Export transactions to CSV
export function exportToCSV(transactions: AnyTransaction[], filename = "transactions.csv"): void {
  const headers = [
    "Date",
    "Description",
    "Amount",
    "Type",
    "Category",
    "Account",
    "Currency",
    "Projected",
  ];

  const rows = transactions.map((t) => [
    t.date,
    `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
    t.amount.toFixed(2),
    t.type,
    t.category,
    t.accountId,
    t.currencyId,
    t.isProjected ? "Yes" : "No",
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  downloadFile(csvContent, filename, "text/csv");
}

// Export transactions to JSON
export function exportToJSON(transactions: AnyTransaction[], filename = "transactions.json"): void {
  const jsonContent = JSON.stringify(transactions, null, 2);
  downloadFile(jsonContent, filename, "application/json");
}

// Generate PDF report (simple HTML-based)
export function exportToPDF(
  transactions: AnyTransaction[],
  summary: { totalIncome: number; totalExpenses: number; netBalance: number },
  currencySymbol = "₹",
): void {
  const totalIncome = summary.totalIncome.toFixed(2);
  const totalExpenses = summary.totalExpenses.toFixed(2);
  const netBalance = summary.netBalance.toFixed(2);

  const transactionRows = transactions
    .slice(0, 100) // Limit to 100 for PDF
    .map(
      (t) => `
      <tr>
        <td>${t.date}</td>
        <td>${t.description}</td>
        <td class="${t.type}">${currencySymbol}${t.amount.toFixed(2)}</td>
        <td>${t.type}</td>
        <td>${t.category}</td>
      </tr>
    `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Finance Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-card { padding: 15px; border-radius: 8px; min-width: 150px; }
        .income { background: #dcfce7; color: #166534; }
        .expense { background: #fee2e2; color: #991b1b; }
        .balance { background: #dbeafe; color: #1e40af; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f3f4f6; }
        .income { color: #166534; }
        .expense { color: #991b1b; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>📊 Finance Report</h1>
      <p>Generated on ${new Date().toLocaleDateString()}</p>
      
      <div class="summary">
        <div class="summary-card income">
          <h3>Total Income</h3>
          <p style="font-size: 24px; font-weight: bold;">${currencySymbol}${totalIncome}</p>
        </div>
        <div class="summary-card expense">
          <h3>Total Expenses</h3>
          <p style="font-size: 24px; font-weight: bold;">${currencySymbol}${totalExpenses}</p>
        </div>
        <div class="summary-card balance">
          <h3>Net Balance</h3>
          <p style="font-size: 24px; font-weight: bold;">${currencySymbol}${netBalance}</p>
        </div>
      </div>

      <h2>Recent Transactions</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          ${transactionRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

// Helper to download file
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
