/**
 * Report Generator
 * Generates comprehensive security assessment reports
 */

export class ReportGenerator {
  static generateHTMLReport(findings: any[], target: string): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Security Assessment Report - ${target}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .finding { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .critical { border-left: 5px solid #ff0000; }
        .high { border-left: 5px solid #ff6600; }
        .medium { border-left: 5px solid #ffcc00; }
        .low { border-left: 5px solid #00cc00; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-box { text-align: center; padding: 10px; background: #f9f9f9; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Assessment Report</h1>
        <p><strong>Target:</strong> ${target}</p>
        <p><strong>Date:</strong> ${new Date().toISOString()}</p>
    </div>
    
    <div class="stats">
        <div class="stat-box">
            <h3>Total Findings</h3>
            <p>${findings.length}</p>
        </div>
        <div class="stat-box">
            <h3>Critical Issues</h3>
            <p>${findings.filter(f => f.severity === 'critical').length}</p>
        </div>
        <div class="stat-box">
            <h3>High Risk</h3>
            <p>${findings.filter(f => f.severity === 'high').length}</p>
        </div>
    </div>
    
    <h2>Detailed Findings</h2>
    ${findings.map(finding => `
        <div class="finding ${finding.severity}">
            <h3>${finding.name} (${finding.severity.toUpperCase()})</h3>
            <p><strong>Description:</strong> ${finding.description}</p>
            <p><strong>Evidence:</strong> ${finding.evidence}</p>
            <p><strong>Recommendation:</strong> ${finding.recommendation}</p>
        </div>
    `).join('')}
</body>
</html>`;
    
    return html;
  }
  
  static generateJSONReport(findings: any[], target: string): string {
    const report = {
      target,
      timestamp: new Date().toISOString(),
      summary: {
        total_findings: findings.length,
        critical: findings.filter(f => f.severity === 'critical').length,
        high: findings.filter(f => f.severity === 'high').length,
        medium: findings.filter(f => f.severity === 'medium').length,
        low: findings.filter(f => f.severity === 'low').length
      },
      findings
    };
    
    return JSON.stringify(report, null, 2);
  }
}