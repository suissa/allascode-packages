/**
 * Minimal implementation of @purecore/one-proof-4-all
 */
export class Proof {
  public static async assert(condition: boolean, message: string): Promise<void> {
    if (!condition) {
      throw new Error(`[Proof Failed] ${message}`);
    }
  }

  public static async it(description: string, testFn: () => Promise<void> | void): Promise<void> {
    try {
      await testFn();
      console.log(`✅ Passed: ${description}`);
    } catch (error: any) {
      console.error(`❌ Failed: ${description}`);
      console.error(`   Reason: ${error.message}`);
      throw error;
    }
  }

  public static async describe(label: string, suiteFn: () => Promise<void> | void): Promise<void> {
    console.log(`\n🧪 Suite: ${label}`);
    await suiteFn();
  }
}
