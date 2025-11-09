/**
 * Core data structures for VibeSec scanner
 */

/**
 * Severity levels for security findings
 */
export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Category of security issue
 */
export enum Category {
  SECRETS = 'secrets',
  INJECTION = 'injection',
  AUTH = 'auth',
  INCOMPLETE = 'incomplete',
  AI_SPECIFIC = 'ai-specific',
  DEPENDENCIES = 'dependencies',
  WEB_SECURITY = 'web-security',
  CRYPTOGRAPHY = 'cryptography',
  CUSTOM = 'custom',
}

/**
 * Location of a finding in source code
 */
export interface Location {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

/**
 * Fix recommendation for a finding
 */
export interface FixRecommendation {
  recommendation: string;
  before: string;
  after: string;
  references: string[];
}

/**
 * Metadata about a finding
 */
export interface FindingMetadata {
  cwe?: string;
  owasp?: string;
  confidence: number; // 0.0 to 1.0
  [key: string]: unknown;
}

/**
 * A security finding detected by a scanner
 */
export interface Finding {
  id: string;
  rule: string;
  severity: Severity;
  category: Category;
  title: string;
  description: string;
  location: Location;
  snippet: string;
  fix: FixRecommendation;
  metadata: FindingMetadata;
}

/**
 * Pattern matching configuration for a rule
 */
export type Pattern = RegexPattern | AstPattern | EqlPattern | LegacyRegexPattern;

export interface RegexPattern {
  // Legacy rules may omit type and use `regex` or `pattern`
  type?: 'regex';
  regex?: string;
  pattern?: string; // Some schemas use `pattern` for regex
  flags?: string;
  multiline?: boolean;
}

export interface AstPattern {
  type: 'ast';
  query: string; // Simplified AST query string
}

export interface EqlPattern {
  type: 'eql';
  query: string; // EQL query string
}

// Internal compatibility to support legacy string patterns normalized by RuleLoader
export interface LegacyRegexPattern {
  // normalized to regex + flags in RuleLoader; keep for typing compatibility
  regex: string;
  flags?: string;
  multiline?: boolean;
}

/**
 * Detection rule definition
 */
export interface Rule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  category: Category;
  patterns: Pattern[];
  languages: string[];
  enabled: boolean;
  confidence?: number; // optional top-level default confidence
  fix?: {
    template: string;
    references: string[];
  };
  metadata?: {
    cwe?: string;
    owasp?: string;
    tags?: string[];
  };
}

/**
 * Scan summary statistics
 */
export interface ScanSummary {
  total: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byCategory: {
    [key in Category]?: number;
  };
}

/**
 * Scan metadata
 */
export interface ScanMetadata {
  path: string;
  filesScanned: number;
  duration: number; // seconds
  timestamp: string; // ISO 8601
  version: string;
}

/**
 * Complete scan result
 */
export interface ScanResult {
  version: string;
  scan: ScanMetadata;
  summary: ScanSummary;
  findings: Finding[];
}

/**
 * Scanner configuration options
 */
export interface ScanOptions {
  path: string;
  exclude?: string[];
  include?: string[];
  severity?: Severity;
  format?: 'text' | 'json' | 'sarif';
  output?: string;
  rulesPath?: string;
  parallel?: boolean;
  maxFileSize?: number; // bytes
  quiet?: boolean; // Suppress progress messages
  // P2.2 additions
  configPath?: string; // explicit config file path
  incremental?: boolean; // only scan changed files
  full?: boolean; // ignore cache and scan all files
  cacheDir?: string; // cache directory path
  onAstParse?: (file: string) => void; // optional progress callback
}
