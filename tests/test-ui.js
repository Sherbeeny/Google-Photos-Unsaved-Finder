const path = require('path');
const expect = require(path.resolve(__dirname, '..', 'vendor', 'chai.js')).expect;
const { createUI } = require('../src/main.user.js');
const createMockDocument = () => {
    const mockElement = { children: [], classList: new Set(), appendChild(child) { this.children.push(child); }, querySelector(selector) { return this.children.find(child => child.tagName.toLowerCase() === selector) || null; } };
    return { createElement(tagName) { return { ...mockElement, tagName: tagName.toUpperCase(), children: [] }; }, body: { ...mockElement, tagName: 'BODY', children: [] } };
};
const tests = {
    'when GPTK API is NOT available, should show "not available" message': () => {
        global.window = {}; global.unsafeWindow = {}; global.document = createMockDocument();
        const ui = createUI();
        const content = ui.querySelector('div');
        expect(content.textContent).to.equal('GPTK API is not available!');
    },
    'when GPTK API IS available, should show "available" message': () => {
        global.window = {}; global.unsafeWindow = { gptkApi: {} }; global.document = createMockDocument();
        const ui = createUI();
        const content = ui.querySelector('div');
        expect(content.textContent).to.equal('GPTK API is available!');
    }
};
module.exports = { tests };
