# One RedTeam 4 All

Comprehensive penetration testing toolkit with 20+ security tests covering all major attack vectors.

## 🎯 Overview

This package provides a complete arsenal of security testing capabilities designed for red team operations and vulnerability assessments. All tests are implemented with realistic simulation engines that demonstrate various attack techniques without causing actual harm.

## 🔧 Installation

```bash
cd packages/one-redteam-4-all
npm install
npm run build
```

## 🚀 Quick Start

```typescript
import { RedTeamOrchestrator } from '@omnichannelbridge/one-redteam-4-all';

// Run comprehensive security assessment
const orchestrator = new RedTeamOrchestrator(['http://target-app.com']);
const results = await orchestrator.runFullAssessment();
console.log(results);
```

## 🛡️ Security Testing Modules

### 1. Vulnerability Scanner (`VulnerabilityScanner`)
**20+ vulnerability tests including:**
- SQL Injection detection
- XSS vulnerability identification  
- Command Injection testing
- Directory Traversal checks
- CSRF Protection analysis
- Security Header validation
- SSL/TLS Configuration review
- Open Port/Service enumeration

### 2. SQL Injection Tester (`SQLInjectionTester`)
**20 injection payloads across 5 techniques:**
- **Union-based**: `UNION SELECT`, information schema enumeration
- **Error-based**: Database error exploitation for data extraction
- **Blind injection**: Boolean and conditional response testing
- **Time-based**: `SLEEP()`, `WAITFOR DELAY` time delays
- **Stacked queries**: Multiple statement execution

### 3. XSS Tester (`XSSTester`)  
**24 payloads across 6 contexts:**
- **HTML Context**: `<script>`, `<img onerror>`
- **Attribute Context**: Event handlers, style injection
- **JavaScript Context**: String breakout, template literals
- **URL Context**: `javascript:` protocol, data URLs
- **CSS Context**: CSS expressions, URL injection
- **Event Context**: Onload, onmouseover handlers

### 4. Session Hijacker (`SessionHijacker`)
**20 session attack techniques:**
- Cookie theft via XSS
- Session fixation attacks
- CSRF protection bypass
- Token predictability analysis
- MITM session capture
- JWT token weakness testing
- Session timeout evaluation

### 5. Phishing Simulator (`PhishingSimulator`)
**20 realistic phishing templates:**
- **Credential Harvesting**: Banking, payroll, invoice scams
- **Malware Delivery**: Remote access tools, malicious attachments
- **Social Engineering**: LinkedIn, Netflix, lottery schemes
- **Business Email Compromise**: Executive impersonation, vendor fraud
- **Psychological Manipulation**: Urgency, authority, scarcity tactics

### 6. Brute Force Attacker (`BruteForceAttacker`)
**22 authentication attack methods:**
- Dictionary password attacks
- Username enumeration
- PIN brute forcing
- Default credential testing
- Rate limit evasion
- CAPTCHA bypass techniques
- Multi-factor authentication attacks
- Session replay attacks
- API key brute forcing
- Certificate authentication testing

## 📊 Test Coverage Matrix

| Category | Tests | Techniques | Contexts |
|----------|-------|------------|----------|
| Injection | 20+ | 5 types | Multiple |
| Client-side | 24 | 6 contexts | Various |
| Session | 20 | 5 methods | Authentication |
| Social Engineering | 20 | 5 categories | Human factors |
| Authentication | 22 | 8 approaches | Login systems |
| Reconnaissance | 15 | 4 methods | Information gathering |
| **TOTAL** | **121+** | **33+** | **20+** |

## 🧪 Usage Examples

### Vulnerability Scanning
```typescript
import { VulnerabilityScanner } from '@omnichannelbridge/one-redteam-4-all';

const scanner = new VulnerabilityScanner();
const results = await scanner.scan('http://target.com');
console.log(`Found ${results.vulnerabilities.length} vulnerabilities`);
```

### SQL Injection Testing
```typescript
import { SQLInjectionTester } from '@omnichannelbridge/one-redteam-4-all';

const sqlTester = new SQLInjectionTester();
const results = await sqlTester.testAllPayloads('http://target.com');
const stats = sqlTester.getStatistics(results);
console.log(`SQL Injection success rate: ${stats.success_rate}%`);
```

### Phishing Campaign Simulation
```typescript
import { PhishingSimulator } from '@omnichannelbridge/one-redteam-4-all';

const phishingSim = new PhishingSimulator();
const campaign = await phishingSim.createCampaign(
  'Bank Account Verification',
  ['employee1@company.com', 'employee2@company.com']
);
const results = await phishingSim.simulateCampaign(campaign);
const stats = phishingSim.getCampaignStatistics(results);
console.log(`Phishing click rate: ${stats.click_rate}%`);
```

## ⚠️ Important Security Notice

This toolkit is designed for **authorized security testing only**. All modules include:
- Safe simulation engines that don't cause actual damage
- Configurable safety controls
- Educational purposes documentation
- Ethical hacking guidelines

**Always obtain proper written authorization before testing any system.**

## 📈 Reporting Features

Each module provides comprehensive reporting capabilities:
- Detailed vulnerability descriptions
- Risk severity classifications
- Remediation recommendations
- Statistical analysis
- Exportable report formats

## 🔧 Configuration Options

```typescript
const options = {
  delay: 100,           // Request delay in ms
  timeout: 5000,        // Request timeout
  proxy: 'http://proxy:8080', // Proxy server
  userAgent: 'RedTeam-Scanner/1.0', // Custom user agent
  followRedirects: false,   // Follow redirects
  maxDepth: 3           // Scan depth limit
};
```

## 🛡️ Safety Features

- **Simulation Mode**: All attacks are simulated, not executed
- **Rate Limiting**: Built-in request throttling
- **Scope Control**: Target domain restrictions
- **Logging**: Comprehensive audit trails
- **Emergency Stop**: Immediate termination capability

## 📚 Learning Resources

The toolkit includes educational materials for:
- Understanding each attack vector
- Recognizing vulnerability patterns
- Implementing proper defenses
- Security best practices
- Incident response procedures

## 🤝 Contributing

Contributions welcome for:
- New attack techniques
- Additional vulnerability checks
- Improved simulation accuracy
- Enhanced reporting features
- Documentation improvements

## 📄 License

MIT License - See LICENSE file for details

## ⚖️ Legal Disclaimer

This software is provided for educational and authorized security testing purposes only. The authors and contributors are not responsible for any misuse or damage caused by this toolkit. Always ensure you have explicit permission before testing any system.