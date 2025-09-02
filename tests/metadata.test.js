import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to parse the userscript header
const getMetadata = () => {
    const scriptPath = path.resolve(__dirname, '../src/main.user.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const header = scriptContent.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
    if (!header) return {};
    const meta = {};
    const lines = header[1].match(/@\S+\s+.*/g) || [];
    lines.forEach(line => {
        const [, key, value] = line.match(/@(\S+)\s+(.*)/);
        const trimmedValue = value.trim();
        if (key === 'grant' && meta[key]) {
            if (Array.isArray(meta[key])) {
                meta[key].push(trimmedValue);
            } else {
                meta[key] = [meta[key], trimmedValue];
            }
        } else {
            meta[key] = trimmedValue;
        }
    });
    return meta;
};

describe('Userscript Metadata', () => {
    let metadata;

    beforeAll(() => {
        metadata = getMetadata();
    });

    test('should have a valid @name', () => {
        expect(metadata.name).toBeDefined();
        expect(typeof metadata.name).toBe('string');
        expect(metadata.name.length).toBeGreaterThan(0);
    });

    test('should have a valid @namespace', () => {
        expect(metadata.namespace).toBeDefined();
        expect(typeof metadata.namespace).toBe('string');
        expect(metadata.namespace.length).toBeGreaterThan(0);
    });

    test('should have a valid @version', () => {
        expect(metadata.version).toBeDefined();
        expect(typeof metadata.version).toBe('string');
        expect(metadata.version.length).toBeGreaterThan(0);
    });

    test('should have a valid @description', () => {
        expect(metadata.description).toBeDefined();
        expect(typeof metadata.description).toBe('string');
        expect(metadata.description.length).toBeGreaterThan(0);
    });

    test('should have a valid @author', () => {
        expect(metadata.author).toBeDefined();
        expect(typeof metadata.author).toBe('string');
        expect(metadata.author.length).toBeGreaterThan(0);
    });

    test('should have a valid @match', () => {
        expect(metadata.match).toBeDefined();
        expect(typeof metadata.match).toBe('string');
        expect(metadata.match.length).toBeGreaterThan(0);
    });

    test('should have a valid @grant for unsafeWindow', () => {
        expect(metadata.grant).toBeDefined();
        expect(Array.isArray(metadata.grant)).toBe(true);
        expect(metadata.grant).toContain('unsafeWindow');
    });
});
