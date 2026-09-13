/**
 * Network Utilities
 * Helper functions for network operations
 */

export class NetworkUtils {
  static isValidIP(ip: string): boolean {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  }
  
  static isValidDomain(domain: string): boolean {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(domain);
  }
  
  static extractHost(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }
}