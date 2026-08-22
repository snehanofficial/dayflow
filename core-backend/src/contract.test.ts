import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { openApiDocument } from './openapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('OpenAPI Contract Verification', () => {
  it('should be a valid OpenAPI 3 document structure', () => {
    expect(openApiDocument.openapi).toMatch(/^3\./);
    expect(openApiDocument.info).toBeDefined();
    expect(openApiDocument.info.title).toBeDefined();
    expect(openApiDocument.paths).toBeDefined();
    expect(openApiDocument.paths['/api/health']).toBeDefined();
  });

  it('should have docs/openapi.json in sync with openApiDocument definitions', () => {
    const committedSpecPath = path.resolve(
      __dirname,
      '../../docs/openapi.json',
    );
    expect(fs.existsSync(committedSpecPath)).toBe(true);

    const committedSpec = JSON.parse(
      fs.readFileSync(committedSpecPath, 'utf8'),
    );
    expect(committedSpec).toEqual(openApiDocument);
  });

  it('should have core-frontend/src/types/api.ts in sync with docs/openapi.json (no drift)', () => {
    const frontendDir = path.resolve(__dirname, '../../core-frontend');
    const committedTypesPath = path.resolve(frontendDir, 'src/types/api.ts');
    const committedSpecPath = path.resolve(
      __dirname,
      '../../docs/openapi.json',
    );
    const tempTypesPath = path.resolve(frontendDir, 'src/types/api.temp.ts');

    expect(fs.existsSync(committedTypesPath)).toBe(true);
    expect(fs.existsSync(committedSpecPath)).toBe(true);

    try {
      // Generate spec to a temporary file
      execSync(
        `npx openapi-typescript ${committedSpecPath} -o ${tempTypesPath}`,
        {
          cwd: frontendDir,
          stdio: 'pipe',
        },
      );

      const currentTypes = fs.readFileSync(committedTypesPath, 'utf8');
      const generatedTypes = fs.readFileSync(tempTypesPath, 'utf8');

      // Clean up temp file immediately
      if (fs.existsSync(tempTypesPath)) {
        fs.unlinkSync(tempTypesPath);
      }

      // Normalize formatting (line endings and extra whitespace) for comparison
      const normalize = (str: string) => str.replace(/\r\n/g, '\n').trim();
      expect(normalize(currentTypes)).toEqual(normalize(generatedTypes));
    } catch (err) {
      if (fs.existsSync(tempTypesPath)) {
        fs.unlinkSync(tempTypesPath);
      }
      throw err;
    }
  });

  it('should pass frontend compilation checks with the committed types', () => {
    const frontendDir = path.resolve(__dirname, '../../core-frontend');

    // Verify frontend typescript typecheck is successful using the committed types
    expect(() => {
      execSync('pnpm run typecheck', { cwd: frontendDir, stdio: 'pipe' });
    }).not.toThrow();
  }, 30000);
});
