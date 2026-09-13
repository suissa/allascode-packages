/**
 * Port Scanner
 * Network reconnaissance and service detection
 */

export interface PortScanConfig {
  ports: number[];
  timeout: number;
  concurrency: number;
  service_detection: boolean;
}

export interface PortScanResult {
  port: number;
  status: 'open' | 'closed' | 'filtered';
  service?: string;
  banner?: string;
  protocol: 'tcp' | 'udp';
  confidence: number;
}

export interface HostScanResult {
  host: string;
  ports: PortScanResult[];
  scan_time: number;
  open_ports: number;
  closed_ports: number;
  filtered_ports: number;
}

export class PortScanner {
  private readonly COMMON_PORTS = [
    21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995,
    1433, 1521, 2049, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017
  ];

  private readonly SERVICE_SIGNATURES: Record<number, string> = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    445: 'SMB',
    1433: 'MSSQL',
    1521: 'Oracle',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    6379: 'Redis',
    8080: 'HTTP-Alt',
    8443: 'HTTPS-Alt',
    27017: 'MongoDB'
  };

  async scanHost(
    host: string,
    config: Partial<PortScanConfig> = {}
  ): Promise<HostScanResult> {
    const startTime = Date.now();
    
    const scanConfig: PortScanConfig = {
      ports: config.ports || this.COMMON_PORTS,
      timeout: config.timeout || 1000,
      concurrency: config.concurrency || 100,
      service_detection: config.service_detection || true
    };
    
    const results: PortScanResult[] = [];
    
    // Process ports in batches to control concurrency
    for (let i = 0; i < scanConfig.ports.length; i += scanConfig.concurrency) {
      const batch = scanConfig.ports.slice(i, i + scanConfig.concurrency);
      const batchPromises = batch.map(port => this.scanPort(host, port, scanConfig));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    const endTime = Date.now();
    
    return {
      host,
      ports: results,
      scan_time: endTime - startTime,
      open_ports: results.filter(p => p.status === 'open').length,
      closed_ports: results.filter(p => p.status === 'closed').length,
      filtered_ports: results.filter(p => p.status === 'filtered').length
    };
  }
  
  private async scanPort(
    host: string,
    port: number,
    config: PortScanConfig
  ): Promise<PortScanResult> {
    // Simulate port scanning with realistic timing
    const isReachable = await this.simulatePortConnectivity(host, port, config.timeout);
    
    let status: 'open' | 'closed' | 'filtered' = 'closed';
    let service: string | undefined;
    let banner: string | undefined;
    let confidence = 0.8;
    
    if (isReachable) {
      status = 'open';
      confidence = 0.95;
      
      // Service detection
      if (config.service_detection) {
        const detection = await this.detectService(host, port);
        service = detection.service;
        banner = detection.banner;
        confidence = detection.confidence;
      } else {
        service = this.SERVICE_SIGNATURES[port];
      }
    } else {
      // Simulate filtered ports (firewall drops)
      if (Math.random() > 0.7) {
        status = 'filtered';
        confidence = 0.6;
      }
    }
    
    return {
      port,
      status,
      service,
      banner,
      protocol: port === 53 ? 'udp' : 'tcp', // DNS commonly UDP
      confidence
    };
  }
  
  private async simulatePortConnectivity(
    host: string,
    port: number,
    timeout: number
  ): Promise<boolean> {
    // Simulate network delay and connectivity check
    const baseDelay = Math.random() * 100;
    const portDelayMultiplier = this.getPortDelayMultiplier(port);
    
    await new Promise(resolve => setTimeout(resolve, baseDelay * portDelayMultiplier));
    
    // Simulate realistic port state distribution
    const openProbability = this.getPortOpenProbability(port);
    return Math.random() < openProbability;
  }
  
  private getPortDelayMultiplier(port: number): number {
    // Common services respond faster, obscure ports slower
    const fastPorts = [22, 80, 443, 21, 25];
    const slowPorts = [1433, 3306, 5432, 27017];
    
    if (fastPorts.includes(port)) return 0.5;
    if (slowPorts.includes(port)) return 2.0;
    return 1.0;
  }
  
  private getPortOpenProbability(port: number): number {
    // Realistic probability distribution based on common services
    const commonOpenPorts: Record<number, number> = {
      22: 0.3,    // SSH - common on servers
      80: 0.4,    // HTTP - very common
      443: 0.35,  // HTTPS - increasingly common
      21: 0.1,    // FTP - less common now
      25: 0.15,   // SMTP - mail servers
      3389: 0.2,  // RDP - Windows servers
      3306: 0.25, // MySQL - database servers
      5432: 0.2   // PostgreSQL - database servers
    };
    
    return commonOpenPorts[port] || 0.05; // 5% baseline for uncommon ports
  }
  
  private async detectService(host: string, port: number): Promise<{
    service: string;
    banner: string | undefined;
    confidence: number;
  }> {
    // Simulate service detection/banner grabbing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
    
    const service = this.SERVICE_SIGNATURES[port] || 'Unknown';
    let banner: string | undefined;
    let confidence = 0.8;
    
    // Generate realistic banners for common services
    const banners: Record<number, string[]> = {
      22: [
        'SSH-2.0-OpenSSH_8.4p1 Ubuntu-5ubuntu1',
        'SSH-2.0-OpenSSH_7.9p1 Debian-10+deb10u2',
        'SSH-2.0-Cisco-1.25'
      ],
      80: [
        'Apache/2.4.41 (Ubuntu)',
        'nginx/1.18.0',
        'Microsoft-IIS/10.0',
        'lighttpd/1.4.53'
      ],
      443: [
        'Apache/2.4.41 (Ubuntu)',
        'nginx/1.18.0',
        'Microsoft-IIS/10.0'
      ],
      3306: [
        '5.7.33-0ubuntu0.16.04.1',
        '8.0.23',
        'MariaDB-10.3.27'
      ]
    };
    
    if (banners[port]) {
      banner = banners[port][Math.floor(Math.random() * banners[port].length)];
      confidence = 0.95;
    }
    
    return { service, banner, confidence };
  }
  
  async scanCommonPorts(host: string): Promise<HostScanResult> {
    return await this.scanHost(host, { ports: this.COMMON_PORTS });
  }
  
  async scanPortRange(host: string, start: number, end: number): Promise<HostScanResult> {
    const ports = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    return await this.scanHost(host, { ports });
  }
  
  getStatistics(results: HostScanResult): Record<string, number> {
    return {
      total_scanned: results.ports.length,
      open_ports: results.open_ports,
      closed_ports: results.closed_ports,
      filtered_ports: results.filtered_ports,
      scan_duration_ms: results.scan_time,
      open_port_percentage: (results.open_ports / results.ports.length) * 100
    };
  }
  
  getServiceBreakdown(results: HostScanResult): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    results.ports
      .filter(p => p.status === 'open' && p.service)
      .forEach(p => {
        const service = p.service!;
        breakdown[service] = (breakdown[service] || 0) + 1;
      });
    
    return breakdown;
  }
}