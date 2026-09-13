/**
 * Semantic Nominal Types for Prompt Tester
 */

export type Domain = string & { readonly __brand: "Domain" };
export type PromptText = string & { readonly __brand: "PromptText" };
export type IntentName = string & { readonly __brand: "IntentName" };
export type Language = string & { readonly __brand: "Language" };
export type ControllerPath = string & { readonly __brand: "ControllerPath" };
export type OperationId = string & { readonly __brand: "OperationId" };

export function createDomain(v: string): Domain { return v as Domain; }
export function createPromptText(v: string): PromptText { return v as PromptText; }
export function createIntentName(v: string): IntentName { return v as IntentName; }
export function createLanguage(v: string): Language { return v as Language; }
export function createControllerPath(v: string): ControllerPath { return v as ControllerPath; }
export function createOperationId(v: string): OperationId { return v as OperationId; }

export interface IntentContext {
  domain: Domain;
  language: Language;
}

export interface Intent {
  prompt: PromptText;
  examples: string[];
  behavior: {
    controller: ControllerPath;
    operationId: OperationId;
  };
  context: IntentContext;
  schema: string | null;
}

export interface OpenIntent {
  openintent: string;
  intents: Record<string, Intent>;
}
