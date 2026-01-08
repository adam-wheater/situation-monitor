// Node.js module test script
// Run with: node --experimental-vm-modules test-node.mjs

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('\n=== MODULE SYNTAX VALIDATION ===\n');

const modules = [
    'constants.js',
    'utils.js',
    'data.js',
    'popups.js',
    'map.js',
    'layers.js',
    'panels.js',
    'renderers.js',
    'intelligence.js',
    'monitors.js',
    'main.js'
];

let passed = 0;
let failed = 0;

for (const mod of modules) {
    const path = join(__dirname, 'js', mod);
    try {
        const content = fs.readFileSync(path, 'utf8');

        // Check for proper export statements
        const hasExports = content.includes('export ');
        const hasImports = content.includes('import ');

        // Check for common syntax errors
        const hasBalancedBraces = (content.match(/{/g) || []).length === (content.match(/}/g) || []).length;
        const hasBalancedParens = (content.match(/\(/g) || []).length === (content.match(/\)/g) || []).length;
        const hasBalancedBrackets = (content.match(/\[/g) || []).length === (content.match(/\]/g) || []).length;

        // Count exports
        const exportCount = (content.match(/export (const|function|async function|let|class)/g) || []).length;

        // Count imports
        const importCount = (content.match(/^import /gm) || []).length;

        if (hasBalancedBraces && hasBalancedParens && hasBalancedBrackets) {
            console.log(`✓ ${mod.padEnd(20)} - ${exportCount} exports, ${importCount} imports, syntax OK`);
            passed++;
        } else {
            console.log(`✗ ${mod.padEnd(20)} - Unbalanced brackets/braces`);
            failed++;
        }
    } catch (e) {
        console.log(`✗ ${mod.padEnd(20)} - Error: ${e.message}`);
        failed++;
    }
}

console.log('\n=== FILE SIZE CHECK ===\n');

let totalLines = 0;
for (const mod of modules) {
    const path = join(__dirname, 'js', mod);
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n').length;
    totalLines += lines;
    console.log(`  ${mod.padEnd(20)} ${lines.toString().padStart(5)} lines`);
}

const cssLines = fs.readFileSync(join(__dirname, 'styles.css'), 'utf8').split('\n').length;
const htmlLines = fs.readFileSync(join(__dirname, 'index.html'), 'utf8').split('\n').length;

console.log(`  ${'styles.css'.padEnd(20)} ${cssLines.toString().padStart(5)} lines`);
console.log(`  ${'index.html'.padEnd(20)} ${htmlLines.toString().padStart(5)} lines`);
console.log(`  ${''.padEnd(20)} -----`);
console.log(`  ${'TOTAL'.padEnd(20)} ${(totalLines + cssLines + htmlLines).toString().padStart(5)} lines`);

console.log('\n=== DEPENDENCY CHECK ===\n');

// Check that each module's imports are valid
const moduleExports = {};

for (const mod of modules) {
    const path = join(__dirname, 'js', mod);
    const content = fs.readFileSync(path, 'utf8');

    // Extract exports
    const exports = content.match(/export (const|function|async function) (\w+)/g) || [];
    moduleExports[mod] = exports.map(e => e.split(' ').pop());
}

// Check imports reference valid exports
for (const mod of modules) {
    const path = join(__dirname, 'js', mod);
    const content = fs.readFileSync(path, 'utf8');

    const importLines = content.match(/import \{[^}]+\} from '[^']+'/g) || [];
    let issues = [];

    for (const line of importLines) {
        const match = line.match(/from '\.\/(\w+)\.js'/);
        if (match) {
            const targetMod = match[1] + '.js';
            const imports = line.match(/\{([^}]+)\}/)[1].split(',').map(s => s.trim());

            for (const imp of imports) {
                if (moduleExports[targetMod] && !moduleExports[targetMod].includes(imp)) {
                    issues.push(`'${imp}' not exported from ${targetMod}`);
                }
            }
        }
    }

    if (issues.length === 0) {
        console.log(`✓ ${mod.padEnd(20)} - All imports valid`);
    } else {
        console.log(`? ${mod.padEnd(20)} - Check: ${issues.slice(0,2).join(', ')}`);
    }
}

console.log('\n=== SUMMARY ===\n');
console.log(`Passed: ${passed}/${modules.length}`);
console.log(`Failed: ${failed}/${modules.length}`);
console.log(failed === 0 ? '\n✓ ALL MODULES VALID' : '\n✗ SOME MODULES HAVE ISSUES');
