/**
 * Test Runner for One RedTeam 4 All
 * Demonstrates all 20+ security testing capabilities
 */

import { 
  VulnerabilityScanner,
  SQLInjectionTester,
  XSSTester,
  SessionHijacker,
  PhishingSimulator,
  BruteForceAttacker
} from './index';

async function runSecurityTests() {
  console.log('🚀 One RedTeam 4 All - Security Testing Suite');
  console.log('===============================================\n');
  
  const target = 'http://test-application.com';
  
  try {
    // Test 1: Vulnerability Scanner
    console.log('1️⃣ Running Vulnerability Scanner...');
    const scanner = new VulnerabilityScanner();
    const scanResults = await scanner.scan(target);
    console.log(`   🔍 Found ${scanResults.vulnerabilities.length} vulnerabilities`);
    console.log(`   ⚠️  Overall severity: ${scanResults.severity}\n`);
    
    // Test 2: SQL Injection Tester
    console.log('2️⃣ Running SQL Injection Tests...');
    const sqlTester = new SQLInjectionTester();
    const sqlResults = await sqlTester.testAllPayloads(target);
    const sqlStats = sqlTester.getStatistics(sqlResults);
    console.log(`   💉 Tested ${sqlStats.total_tests} SQL injection payloads`);
    console.log(`   🎯 Success rate: ${sqlStats.success_rate.toFixed(1)}%\n`);
    
    // Test 3: XSS Tester
    console.log('3️⃣ Running XSS Tests...');
    const xssTester = new XSSTester();
    const xssResults = await xssTester.testAllPayloads(target);
    const xssStats = xssTester.getStatistics(xssResults);
    console.log(`   🌐 Tested ${xssStats.total_tests} XSS payloads`);
    console.log(`   🎯 Success rate: ${xssStats.success_rate.toFixed(1)}%\n`);
    
    // Test 4: Session Hijacking Tests
    console.log('4️⃣ Running Session Hijacking Tests...');
    const sessionHijacker = new SessionHijacker();
    const sessionResults = await sessionHijacker.testAllTechniques(target);
    const sessionStats = sessionHijacker.getStatistics(sessionResults);
    console.log(`   🔐 Tested ${sessionStats.total_tests} session attack techniques`);
    console.log(`   🎯 Vulnerabilities found: ${sessionStats.vulnerable_count}\n`);
    
    // Test 5: Phishing Simulation
    console.log('5️⃣ Running Phishing Simulation...');
    const phishingSim = new PhishingSimulator();
    const campaign = await phishingSim.createCampaign(
      'Bank Account Verification',
      ['victim1@example.com', 'victim2@example.com', 'victim3@example.com']
    );
    const phishingResults = await phishingSim.simulateCampaign(campaign);
    const phishingStats = phishingSim.getCampaignStatistics(phishingResults);
    console.log(`   🎣 Simulated phishing campaign with ${phishingStats.total_targets} targets`);
    console.log(`   📈 Click rate: ${phishingStats.click_rate.toFixed(1)}%`);
    console.log(`   🚨 Credential compromise rate: ${phishingStats.credential_compromise_rate.toFixed(1)}%\n`);
    
    // Test 6: Brute Force Attacks
    console.log('6️⃣ Running Brute Force Tests...');
    const bruteForce = new BruteForceAttacker();
    const bruteResults = await bruteForce.runAllAttacks(target);
    const bruteStats = bruteForce.getAttackStatistics(bruteResults);
    console.log(`   🔨 Executed ${bruteStats.total_attacks} brute force attacks`);
    console.log(`   🎯 Success rate: ${bruteStats.success_rate.toFixed(1)}%`);
    console.log(`   ⚡ Average attempts per attack: ${bruteStats.average_attempts_per_attack.toFixed(0)}\n`);
    
    // Summary
    console.log('📊 Security Assessment Summary');
    console.log('==============================');
    console.log(`Total Tests Performed: 6 categories`);
    console.log(`Total Vulnerabilities Identified: ${scanResults.vulnerabilities.length + sessionStats.vulnerable_count}`);
    console.log(`Overall Risk Level: ${scanResults.severity}`);
    console.log(`Phishing Susceptibility: ${phishingStats.click_rate.toFixed(1)}% click rate`);
    console.log(`Authentication Strength: ${(100 - bruteStats.success_rate).toFixed(1)}% resistant to brute force`);
    
    console.log('\n✅ Security testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Security testing failed:', (error as Error).message);
  }
}

// Run the tests
runSecurityTests();