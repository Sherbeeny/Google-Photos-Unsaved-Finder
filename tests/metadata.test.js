const fs = require('fs');
const path = require('path');

// Helper function to parse the userscript header
const getMetadata = () => {
    const scriptPath = path.resolve(__dirname, '../src/google_photos_unsaved_finder.user.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const headerMatch = scriptContent.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
    if (!headerMatch) return {};

    const meta = {};
    const headerContent = headerMatch[1];

    // A more robust parsing method: split by lines and process each one.
    const lines = headerContent.trim().split('\n');

    lines.forEach(line => {
        const trimmedLine = line.trim();
        // Ignore empty lines or lines that aren't part of the metadata.
        if (!trimmedLine.startsWith('// @')) return;

        // Extract the content after '// @'
        const content = trimmedLine.substring(4).trim();

        // Find the first space to separate key from value
        const firstSpaceIndex = content.indexOf(' ');

        let key, value;
        if (firstSpaceIndex === -1) {
            // No space found, so it's a key without a value (e.g., @noframes)
            key = content;
            value = '';
        } else {
            key = content.substring(0, firstSpaceIndex);
            value = content.substring(firstSpaceIndex).trim();
        }

        if (key === 'grant') {
            if (!meta.grant) {
                meta.grant = [];
            }
            meta.grant.push(value);
        } else {
            meta[key] = value;
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
        expect(metadata.name).toBe('Google Photos Unsaved Finder');
    });

    test('should have a valid @namespace', () => {
        expect(metadata.namespace).toBe('http://tampermonkey.net/');
    });

    test('should have a valid @version', () => {
        expect(metadata.version).toBe('2025.09.08-1500');
    });

    test('should have a valid @description', () => {
        expect(metadata.description).toBe('A userscript to find unsaved photos in Google Photos albums.');
    });

    test('should have a valid @author', () => {
        expect(metadata.author).toBe('Sherbeeny (via Jules the AI Agent)');
    });

    test('should have a valid @match', () => {
        expect(metadata.match).toBe('https://photos.google.com/*');
    });

    test('should have the @noframes directive', () => {
        expect(metadata.noframes).toBeDefined();
        expect(metadata.noframes).toBe('');
    });

    test('should have all necessary @grant directives', () => {
        expect(metadata.grant).toBeDefined();
        expect(Array.isArray(metadata.grant)).toBe(true);
        expect(metadata.grant).toHaveLength(4);
        expect(metadata.grant).toEqual(expect.arrayContaining([
            'GM_registerMenuCommand',
            'GM_addStyle',
            'GM_info',
            'unsafeWindow'
        ]));
    });
});
