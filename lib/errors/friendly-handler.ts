import chalk from 'chalk';

/**
 * Context information for error handling
 */
export interface ErrorContext {
  action: string; // What the user was trying to do
  path?: string; // File or directory being processed
  userLevel?: 'technical' | 'non-technical';
}

/**
 * Template for friendly error messages
 */
interface ErrorTemplate {
  title: string;
  explanation: (path?: string) => string;
  suggestions: string[];
  examples: string[];
}

/**
 * Friendly Error Handler
 * Converts technical exceptions into helpful, actionable guidance for users.
 *
 * Features:
 * - Plain language error messages
 * - Contextual suggestions based on error type
 * - Usage examples for correct commands
 * - Help resource links
 */
export class FriendlyErrorHandler {
  /**
   * Error message templates for common errors
   */
  private readonly errorMessages: Record<string, ErrorTemplate> = {
    ENOENT: {
      title: "Couldn't find the folder or file you wanted to scan",
      explanation: (path) => `The path '${path || 'specified'}' doesn't exist on your computer.`,
      suggestions: [
        'Check the path for typos',
        'Make sure the folder or file exists',
        "Try using '.' to scan the current folder",
        "Use absolute paths if relative paths aren't working",
      ],
      examples: [
        'vibesec scan .              # Scan current folder',
        'vibesec scan ./myproject    # Scan specific folder',
        'vibesec scan /full/path     # Use absolute path',
      ],
    },

    EACCES: {
      title: "Don't have permission to read this folder",
      explanation: (path) =>
        `Your user account doesn't have access to '${path || 'this location'}'.`,
      suggestions: [
        'Check folder permissions',
        'Make sure you own the folder',
        'Try a folder in your home directory',
        'Ask your system administrator for access',
      ],
      examples: [
        'ls -la                      # Check folder permissions',
        'vibesec scan ~/myproject    # Try your home directory',
      ],
    },

    EISDIR: {
      title: 'Expected a file but got a directory',
      explanation: (path) => `The path '${path || 'specified'}' is a directory, not a file.`,
      suggestions: [
        'Use the scan command without specifying individual files',
        'VibeSec automatically scans all files in a directory',
      ],
      examples: ['vibesec scan ./myproject    # Scan entire directory'],
    },

    EMFILE: {
      title: 'Too many files open at once',
      explanation: () => 'Your system has a limit on how many files can be opened simultaneously.',
      suggestions: [
        'Try scanning a smaller directory',
        'Close other applications that might have files open',
        "Increase your system's file handle limit (advanced)",
      ],
      examples: ['vibesec scan ./src          # Scan smaller directory'],
    },

    MODULE_NOT_FOUND: {
      title: 'Missing required dependency',
      explanation: () => 'VibeSec is missing a required package to run.',
      suggestions: [
        'Run "bun install" to install dependencies',
        "Make sure you're in the VibeSec directory",
        'Check that the installation completed successfully',
      ],
      examples: [
        'bun install                 # Install dependencies',
        'bun run build               # Rebuild the project',
      ],
    },

    INVALID_SEVERITY: {
      title: 'Invalid severity level specified',
      explanation: () => 'The severity level you provided is not recognized.',
      suggestions: [
        'Valid severity levels are: critical, high, medium, low',
        'Severity is case-insensitive',
        'Leave out --severity to see all findings',
      ],
      examples: [
        'vibesec scan --severity critical',
        'vibesec scan --severity high',
        'vibesec scan                # Show all severities',
      ],
    },
  };

  /**
   * Handle an error and display friendly message
   */
  handle(error: Error, context: ErrorContext): void {
    const errorCode = (error as NodeJS.ErrnoException).code;
    const template = this.getTemplate(errorCode, error);

    console.error('');
    console.error(chalk.red.bold(`❌ ${template.title}`));
    console.error('');
    console.error(template.explanation(context.path));
    console.error('');

    // Suggestions
    if (template.suggestions.length > 0) {
      console.error(chalk.yellow.bold('💡 Suggestions:'));
      template.suggestions.forEach((suggestion) => {
        console.error(chalk.yellow(`  • ${suggestion}`));
      });
      console.error('');
    }

    // Examples
    if (template.examples.length > 0) {
      console.error(chalk.cyan.bold('Examples:'));
      template.examples.forEach((example) => {
        console.error(chalk.cyan(`  ${example}`));
      });
      console.error('');
    }

    // Help link
    console.error(chalk.gray('Need help? Check the documentation or ask your development team.'));
    console.error('');

    // Show technical details only for technical users or if very brief
    if (context.userLevel === 'technical') {
      console.error(chalk.gray('Technical details:'));
      console.error(chalk.gray(`  ${error.message}`));
      console.error('');
    }
  }

  /**
   * Get error template based on error code or message
   */
  private getTemplate(errorCode: string | undefined, error: Error): ErrorTemplate {
    // Check for known error codes first
    if (errorCode && this.errorMessages[errorCode]) {
      return this.errorMessages[errorCode];
    }

    // Check for custom error types
    if (error.message.includes('Invalid severity')) {
      return this.errorMessages['INVALID_SEVERITY'];
    }

    if (
      error.message.includes('MODULE_NOT_FOUND') ||
      error.message.includes('Cannot find module')
    ) {
      return this.errorMessages['MODULE_NOT_FOUND'];
    }

    // Generic fallback
    return {
      title: 'Something went wrong',
      explanation: () => error.message,
      suggestions: [
        'Check that all files and folders exist',
        'Make sure you have the necessary permissions',
        'Try running the command again',
        'If the problem persists, ask your development team for help',
      ],
      examples: [
        'vibesec scan .              # Try scanning current directory',
        'vibesec --help              # Show all available commands',
      ],
    };
  }

  /**
   * Check if an error is a known type that can be handled friendly
   */
  isKnownError(error: Error): boolean {
    const errorCode = (error as NodeJS.ErrnoException).code;
    return !!(errorCode && this.errorMessages[errorCode]);
  }

  /**
   * Format error for logging (without suggestions/examples)
   */
  formatShort(error: Error, context: ErrorContext): string {
    const errorCode = (error as NodeJS.ErrnoException).code;
    const template = this.getTemplate(errorCode, error);
    return `${template.title}: ${template.explanation(context.path)}`;
  }
}
