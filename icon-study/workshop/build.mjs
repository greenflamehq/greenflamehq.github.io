import { readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
// Node 22.13+; no dependencies. Browsers load the committed editor.js, not TypeScript.
const source = await readFile(new URL('editor.ts', import.meta.url), 'utf8');
const javascript = stripTypeScriptTypes(source, { mode: 'strip' });
await writeFile(new URL('editor.js', import.meta.url), '// Generated from editor.ts by build.mjs.\n' + javascript);
console.log('Built browser JavaScript from editor.ts.');
