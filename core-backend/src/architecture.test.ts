import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname);

// Helper to get all ts/tsx files recursively
function getSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.flatMap((entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? getSourceFiles(res) : res;
  });
  return files.filter(
    (f) =>
      (f.endsWith('.ts') || f.endsWith('.tsx')) &&
      !f.includes('node_modules') &&
      !f.includes('dist'),
  );
}

// Strip block and line comments to avoid matching commented-out violations
function stripComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
}

describe('Backend Architecture Constraints', () => {
  const allFiles = getSourceFiles(SRC_DIR);
  const productionFiles = allFiles.filter((f) => !f.endsWith('.test.ts'));

  it('Configuration Boundary: process.env must only be read in modules/core/config/index.ts', () => {
    const configPath = path.resolve(SRC_DIR, 'modules/core/config/index.ts');

    productionFiles.forEach((file) => {
      if (file === configPath) return;

      const content = stripComments(fs.readFileSync(file, 'utf8'));
      // Search for "process.env" usage
      if (content.includes('process.env')) {
        const relativePath = path.relative(SRC_DIR, file);
        throw new Error(
          `Violation in ${relativePath}: direct access to process.env is forbidden. Use modules/core/config instead.`,
        );
      }
    });
  });

  it('Repository Boundary: backend must not import frontend source files', () => {
    productionFiles.forEach((file) => {
      const content = stripComments(fs.readFileSync(file, 'utf8'));
      // Find imports referencing core-frontend or going out of the workspace
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (
          importPath.includes('core-frontend') ||
          importPath.startsWith('../../../')
        ) {
          const relativePath = path.relative(SRC_DIR, file);
          throw new Error(
            `Violation in ${relativePath}: import of frontend source file (${importPath}) is forbidden.`,
          );
        }
      }
    });
  });

  it('Core to Domain Boundary: core modules must not import domain modules', () => {
    const coreModulesDir = path.resolve(SRC_DIR, 'modules/core');
    if (!fs.existsSync(coreModulesDir)) return;

    const coreFiles = getSourceFiles(coreModulesDir).filter(
      (f) => !f.endsWith('.test.ts'),
    );

    coreFiles.forEach((file) => {
      const content = stripComments(fs.readFileSync(file, 'utf8'));
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        // Core modules cannot import anything containing "domain"
        if (importPath.includes('/domain/') || importPath.endsWith('/domain')) {
          const relativePath = path.relative(SRC_DIR, file);
          throw new Error(
            `Violation in ${relativePath}: Core module is forbidden from importing domain modules (${importPath}).`,
          );
        }
      }
    });
  });

  it('Logger Boundary: console.log/warn/error are prohibited in production app code', () => {
    const loggerPath = path.resolve(SRC_DIR, 'modules/core/logger/index.ts');
    const configPath = path.resolve(SRC_DIR, 'modules/core/config/index.ts');

    productionFiles.forEach((file) => {
      // Allow console methods in the logger implementation, configuration startup validation handler, and entry index.ts
      if (file === loggerPath || file === configPath) return;

      const content = stripComments(fs.readFileSync(file, 'utf8'));
      const consoleUsageRegex = /console\.(log|warn|error)\(/g;
      if (consoleUsageRegex.test(content)) {
        const relativePath = path.relative(SRC_DIR, file);
        throw new Error(
          `Violation in ${relativePath}: direct console.log/warn/error usage is prohibited in production. Use logger instead.`,
        );
      }
    });
  });

  it('Module Encapsulation: sibling core imports must import via the module index', () => {
    const coreModulesDir = path.resolve(SRC_DIR, 'modules/core');
    if (!fs.existsSync(coreModulesDir)) return;

    const coreFiles = getSourceFiles(coreModulesDir).filter(
      (f) => !f.endsWith('.test.ts'),
    );

    coreFiles.forEach((file) => {
      const content = stripComments(fs.readFileSync(file, 'utf8'));
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        // Sibling imports start with ../ (and not ../../ which goes out of the core modules folder)
        if (importPath.startsWith('../') && !importPath.startsWith('../../')) {
          // Allowed formats: "../logger", "../logger/index.js", "../logger/index.ts"
          const isValidSiblingImport = /^\.\.\/[^/]+(\/index\.(js|ts))?$/.test(
            importPath,
          );
          if (!isValidSiblingImport) {
            const relativePath = path.relative(SRC_DIR, file);
            throw new Error(
              `Violation in ${relativePath}: deep import from sibling module (${importPath}) is forbidden. Use the module gateway/index.js instead.`,
            );
          }
        }
      }
    });
  });
});
