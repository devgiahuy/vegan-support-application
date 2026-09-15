import { writeFile } from 'node:fs/promises';
import { openApiDocument } from './document.js';

const destination = new URL('../../openapi.json', import.meta.url);
await writeFile(destination, `${JSON.stringify(openApiDocument, null, 2)}\n`, 'utf8');
console.info(`OpenAPI document written to ${destination.pathname}`);
