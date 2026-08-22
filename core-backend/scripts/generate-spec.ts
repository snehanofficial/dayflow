import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openApiDocument } from '../src/openapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target is root docs folder
const outputPath = path.resolve(__dirname, '../../docs/openapi.json');

// Ensure parent docs directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

fs.writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2), 'utf-8');
console.log(`OpenAPI specification generated successfully at: ${outputPath}`);
