import { describe, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(import.meta.dirname || '.');

// Helper to get all ts/tsx files recursively
function getSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.flatMap((entry: fs.Dirent) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? getSourceFiles(res) : res;
  });
  return files.filter(
    (f: string) =>
      (f.endsWith('.ts') || f.endsWith('.tsx')) &&
      !f.includes('node_modules') &&
      !f.includes('dist'),
  );
}

// Strip block and line comments to avoid matching commented-out violations
function stripComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
}

describe('Frontend Architecture Constraints', () => {
  const allFiles = getSourceFiles(SRC_DIR);
  const productionFiles = allFiles.filter(
    (f: string) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'),
  );

  it('Configuration Boundary: import.meta.env must only be read in src/config.ts', () => {
    const configPath = path.resolve(SRC_DIR, 'config.ts');

    productionFiles.forEach((file: string) => {
      if (file === configPath) return;

      const content = stripComments(fs.readFileSync(file, 'utf8'));
      if (content.includes('import.meta.env')) {
        const relativePath = path.relative(SRC_DIR, file);
        throw new Error(
          `Violation in ${relativePath}: direct access to import.meta.env is forbidden. Use src/config.ts instead.`,
        );
      }
    });
  });

  it('Repository Boundary: frontend must not import backend source files', () => {
    productionFiles.forEach((file: string) => {
      const content = stripComments(fs.readFileSync(file, 'utf8'));
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (
          importPath.includes('server') ||
          importPath.startsWith('../../../')
        ) {
          const relativePath = path.relative(SRC_DIR, file);
          throw new Error(
            `Violation in ${relativePath}: import of backend source file (${importPath}) is forbidden.`,
          );
        }
      }
    });
  });

  it('Database Boundary: frontend must not import/reference database or prisma modules', () => {
    productionFiles.forEach((file: string) => {
      const content = stripComments(fs.readFileSync(file, 'utf8'));

      // Check imports
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (
          importPath.includes('prisma') ||
          importPath.includes('@prisma/client') ||
          importPath === 'pg'
        ) {
          const relativePath = path.relative(SRC_DIR, file);
          throw new Error(
            `Violation in ${relativePath}: database/prisma dependency (${importPath}) is forbidden in the frontend.`,
          );
        }
      }

      // Check text references
      if (content.includes('PrismaClient')) {
        const relativePath = path.relative(SRC_DIR, file);
        throw new Error(
          `Violation in ${relativePath}: direct reference to PrismaClient is forbidden in the frontend.`,
        );
      }
    });
  });

  it('Logger Boundary: console.log/warn/error are prohibited in production app code', () => {
    const errorBoundaryPath = path.resolve(
      SRC_DIR,
      'components/ErrorBoundary.tsx',
    );

    productionFiles.forEach((file: string) => {
      // Allow console methods inside the main Error Boundary logger handler
      if (file === errorBoundaryPath) return;

      const content = stripComments(fs.readFileSync(file, 'utf8'));
      const consoleUsageRegex = /console\.(log|warn|error)\(/g;
      if (consoleUsageRegex.test(content)) {
        const relativePath = path.relative(SRC_DIR, file);
        throw new Error(
          `Violation in ${relativePath}: direct console.log/warn/error usage is prohibited in production. Use ErrorBoundary or custom client reporting.`,
        );
      }
    });
  });
});
