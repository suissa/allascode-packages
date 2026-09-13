import { PromptTester } from './tester.ts';
import fs from 'fs';
import path from 'path';

/**
 * Main execution script for the prompt test system.
 */
async function main() {
  const tester = new PromptTester();
  
  const rootDir = process.cwd();
  const filePath = path.join(rootDir, 'Coggate', 'openintent.json');
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Critical: openintent.json not found at ${filePath}`);
  }

  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const results = tester.execute(rawData);

  const reportContent = generateMarkdownReport(results);
  const reportFile = saveReport(rootDir, reportContent);

  console.log('--- Prompt Test Results ---');
  console.log(reportContent);
  console.log(`\n✅ Report successfully saved to: ${reportFile}`);
}

function generateMarkdownReport(results: any[]): string {
  let md = `# Prompt Test Report\n\n`;
  md += `This report details the analyzed and generated prompts grouped by domain.\n\n`;

  for (const res of results) {
    md += `## Domain: ${res.domain}\n\n`;
    md += `| Intent | Status | Final Prompt |\n`;
    md += `|--------|--------|--------------|\n`;
    
    for (const s of res.summaries) {
      const status = s.hadOriginalPrompt ? '✅ Original' : '✨ Generated';
      md += `| ${s.name} | ${status} | ${s.finalPrompt} |\n`;
    }
    md += `\n`;
  }

  return md;
}

function saveReport(rootDir: string, content: string): string {
  const reportsDir = path.join(rootDir, 'reports');
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const fileName = `${day}-${month}-${year}_${hours}-${minutes}.md`;
  const filePath = path.join(reportsDir, fileName);

  fs.writeFileSync(filePath, content);
  return filePath;
}

main().catch((err) => {
  console.error(`❌ Execution failed: ${err.message}`);
  process.exit(1);
});
