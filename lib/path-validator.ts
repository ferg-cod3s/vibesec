/**
 * Path Validation Utility
 *
 * Provides secure path validation to prevent path traversal attacks.
 * Ensures all file operations stay within authorized directories.
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { PathValidationError } from './errors/types';

// Re-export for convenience
export { PathValidationError };

/**
 * Options for path validation
 */
export interface PathValidationOptions {
  /** Base directory that paths must stay within (defaults to cwd) */
  baseDir?: string;
  /** Allow paths outside base directory (default: false) */
  allowExternal?: boolean;
  /** Check if path exists (default: false) */
  mustExist?: boolean;
}

/**
 * Validates and sanitizes a file system path to prevent path traversal attacks
 *
 * @param inputPath - The path to validate (can be relative or absolute)
 * @param options - Validation options
 * @returns The validated absolute path
 * @throws PathValidationError if validation fails
 */
export function validatePath(
  inputPath: string,
  options: PathValidationOptions = {}
): string {
  const {
    baseDir = process.cwd(),
    allowExternal = false,
    mustExist = false,
  } = options;

  // Validate input
  if (!inputPath || typeof inputPath !== 'string') {
    throw new PathValidationError(
      'Invalid path: path must be a non-empty string',
      String(inputPath)
    );
  }

  // Check for null bytes (security risk)
  if (inputPath.includes('\0')) {
    throw new PathValidationError(
      'Invalid path: null bytes are not allowed',
      inputPath
    );
  }

  // Normalize base directory (resolve to absolute path)
  const normalizedBase = path.resolve(baseDir);

  // Normalize and resolve input path
  // This resolves '..' and '.' and converts to absolute path
  const normalizedPath = path.resolve(normalizedBase, inputPath);

  // Security check: ensure resolved path is within base directory
  if (!allowExternal) {
    // Use path.relative to check if path escapes base directory
    const relativePath = path.relative(normalizedBase, normalizedPath);

    // If relative path starts with '..' or is absolute, it's outside base
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new PathValidationError(
        `Path traversal detected: path '${inputPath}' resolves outside base directory '${normalizedBase}'`,
        inputPath
      );
    }
  }

  // Additional check: ensure path doesn't contain suspicious patterns
  const suspiciousPatterns = [
    /\.\.[\/\\]/,  // .. followed by slash
    /[\/\\]\.\./,  // .. preceded by slash
    /^\.\./,       // starts with ..
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(inputPath) && !allowExternal) {
      throw new PathValidationError(
        `Suspicious path pattern detected: '${inputPath}'`,
        inputPath
      );
    }
  }

  return normalizedPath;
}

/**
 * Validates a path and checks if it exists on the file system
 *
 * @param inputPath - The path to validate
 * @param options - Validation options
 * @returns The validated absolute path
 * @throws PathValidationError if validation fails or path doesn't exist
 */
export async function validatePathExists(
  inputPath: string,
  options: Omit<PathValidationOptions, 'mustExist'> = {}
): Promise<string> {
  const validatedPath = validatePath(inputPath, options);

  try {
    await fs.access(validatedPath);
    return validatedPath;
  } catch (error) {
    throw new PathValidationError(
      `Path does not exist: ${inputPath}`,
      inputPath
    );
  }
}

/**
 * Validates multiple paths at once
 *
 * @param paths - Array of paths to validate
 * @param options - Validation options
 * @returns Array of validated absolute paths
 * @throws PathValidationError if any validation fails
 */
export function validatePaths(
  paths: string[],
  options: PathValidationOptions = {}
): string[] {
  if (!Array.isArray(paths)) {
    throw new PathValidationError(
      'Invalid input: paths must be an array',
      String(paths)
    );
  }

  return paths.map(p => validatePath(p, options));
}

/**
 * Validates a base directory for scanning operations
 * Ensures it exists and is a directory
 *
 * @param basePath - The base directory path
 * @returns The validated absolute path
 * @throws PathValidationError if validation fails
 */
export async function validateBaseDirectory(basePath: string): Promise<string> {
  const validatedPath = validatePath(basePath, { allowExternal: true });

  try {
    const stat = await fs.stat(validatedPath);
    if (!stat.isDirectory()) {
      throw new PathValidationError(
        `Path is not a directory: ${basePath}`,
        basePath
      );
    }
    return validatedPath;
  } catch (error) {
    if (error instanceof PathValidationError) {
      throw error;
    }
    throw new PathValidationError(
      `Base directory does not exist or is not accessible: ${basePath}`,
      basePath
    );
  }
}
