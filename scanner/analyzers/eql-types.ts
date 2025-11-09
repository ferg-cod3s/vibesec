// Enhanced Query Language (EQL) Types
export interface EQLQuery {
  expression: LogicalExpression | PatternExpression | TaintExpression;
  metadata?: QueryMetadata;
}

export interface QueryMetadata {
  timeout?: number;
  cache?: boolean;
  parallel?: boolean;
  description?: string;
}

export interface LogicalExpression {
  type: 'logical';
  operator: 'AND' | 'OR' | 'NOT';
  operands: EQLQuery[];
}

export interface PatternExpression {
  type: 'pattern';
  pattern: NodePattern;
  constraints?: Constraint[];
  scope?: ScopeSpecifier;
}

export interface TaintExpression {
  type: 'taint';
  source: SourcePattern;
  sink: SinkPattern;
  sanitizers?: SanitizerPattern[];
  flowPath?: FlowPathPattern;
}

export interface NodePattern {
  nodeType: string | string[] | WildcardPattern;
  name?: StringPattern;
  value?: ValuePattern;
  properties?: PropertyPattern[];
  children?: ChildPattern[];
  parent?: ParentPattern;
  operator?: StringPattern; // For BinaryExpr
  arguments?: NodePattern[]; // For CallExpr
}

export interface WildcardPattern {
  type: 'wildcard';
  matches: 'all' | 'any' | 'none';
  filter?: string[];
}

export interface StringPattern {
  type: 'exact' | 'regex' | 'contains' | 'startsWith' | 'endsWith';
  value: string;
  caseSensitive?: boolean;
}

export interface ValuePattern {
  type: 'string' | 'number' | 'boolean' | 'regex';
  value: string | number | boolean | RegExp;
  operator?: '=' | '!=' | '>' | '<' | '>=' | '<=';
}

export interface PropertyPattern {
  name: string | StringPattern;
  value: ValuePattern | StringPattern;
  required?: boolean;
}

export interface ChildPattern {
  pattern: NodePattern;
  minCount?: number;
  maxCount?: number;
  recursive?: boolean;
}

export interface ParentPattern {
  pattern: NodePattern;
  maxDistance?: number;
}

export interface Constraint {
  type: 'position' | 'scope' | 'semantic' | 'custom';
  condition: string;
  parameters?: Record<string, any>;
}

export interface ScopeSpecifier {
  type: 'function' | 'class' | 'module' | 'global';
  name?: string;
  depth?: number;
}

export interface SourcePattern {
  nodeType: string | string[];
  patterns: StringPattern[];
  contexts?: string[];
}

export interface SinkPattern {
  nodeType: string | string[];
  patterns: StringPattern[];
  contexts?: string[];
}

export interface SanitizerPattern {
  nodeType: string | string[];
  patterns: StringPattern[];
  effectiveness?: 'high' | 'medium' | 'low';
}

export interface FlowPathPattern {
  maxSteps?: number;
  allowedOperations?: string[];
  forbiddenOperations?: string[];
}

// Token types for lexer
export type TokenType =
  | 'IDENTIFIER'
  | 'STRING'
  | 'REGEX'
  | 'NUMBER'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'LBRACE'
  | 'RBRACE'
  | 'COMMA'
  | 'DOT'
  | 'COLON'
  | 'SEMICOLON'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'LT'
  | 'GTE'
  | 'LTE'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'MATCHES'
  | 'IN'
  | 'EXISTS'
  | 'TAINT'
  | 'SOURCE'
  | 'SINK'
  | 'SANITIZER'
  | 'WILDCARD'
  | 'PIPE'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
  line: number;
  column: number;
}

// Query execution results
export interface QueryResult {
  type: 'pattern' | 'taint' | 'logical';
  node?: ASTNode;
  source?: ASTNode;
  sink?: ASTNode;
  flow?: DataFlow[];
  confidence: number;
  metadata?: Record<string, any>;
}

export interface MatchResult {
  success: boolean;
  node: ASTNode;
  confidence: number;
  metadata: Record<string, any>;
}

export interface TaintResult {
  source: ASTNode;
  sink: ASTNode;
  flow: DataFlow[];
  confidence: number;
  metadata: Record<string, any>;
}

export interface DataFlow {
  from: ASTNode;
  to: ASTNode;
  operation: string;
  sanitized: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AnalysisContext {
  filePath: string;
  content: string;
  lines: string[];
  rule: any;
  variables?: Map<string, ASTNode[]>;
  scope?: Map<string, string>;
}

// Import ASTNode from enhanced parser
import { ASTNode } from '../../src/ast/enhanced-ast-parser';
