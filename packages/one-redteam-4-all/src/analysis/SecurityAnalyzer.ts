/**
 * Security Analyzer
 * Analyzes security findings and provides risk assessments
 */

export interface RiskAssessment {
  overall_risk: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  recommendations: string[];
  priority_issues: string[];
}

export class SecurityAnalyzer {
  static analyzeFindings(findings: any[]): RiskAssessment {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const mediumCount = findings.filter(f => f.severity === 'medium').length;
    
    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let riskScore = 0;
    
    if (criticalCount > 0) {
      overallRisk = 'critical';
      riskScore = 90 + criticalCount;
    } else if (highCount > 2) {
      overallRisk = 'high';
      riskScore = 70 + highCount * 5;
    } else if (mediumCount > 5) {
      overallRisk = 'medium';
      riskScore = 40 + mediumCount * 2;
    } else {
      riskScore = Math.min(30 + mediumCount * 5, 60);
    }
    
    return {
      overall_risk: overallRisk,
      risk_score: Math.min(riskScore, 100),
      recommendations: this.generateRecommendations(findings),
      priority_issues: this.getPriorityIssues(findings)
    };
  }
  
  private static generateRecommendations(findings: any[]): string[] {
    const recommendations: string[] = [];
    
    const vulnTypes = new Set(findings.map(f => f.type));
    
    if (vulnTypes.has('sql_injection')) {
      recommendations.push('Implement parameterized queries and input validation');
    }
    
    if (vulnTypes.has('xss')) {
      recommendations.push('Add Content Security Policy and output encoding');
    }
    
    if (vulnTypes.has('weak_auth')) {
      recommendations.push('Enforce strong password policies and multi-factor authentication');
    }
    
    return recommendations;
  }
  
  private static getPriorityIssues(findings: any[]): string[] {
    return findings
      .filter(f => f.severity === 'critical' || f.severity === 'high')
      .slice(0, 5)
      .map(f => `${f.name}: ${f.description}`);
  }
}