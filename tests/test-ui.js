const path = require('path');
const expect = require(path.resolve(__dirname, '..', 'vendor', 'chai.js')).expect;
const { createUI } = require('../src/main.user.js');
const createMockDocument = () => {
    const mockElement = {
        children: [],
        classList: new Set(),
        appendChild(child) { this.children.push(child); },
        querySelector(selector) { return this.children.find(child => child.tagName.toLowerCase() === selector) || null; }
    };
    return {
        createElement(tagName) { return { ...mockElement, tagName: tagName.toUpperCase(), children: [] }; },
        body: { ...mockElement, tagName: 'BODY', children: [] }
    };
};
const tests = {
    'should create a UI window with the correct structure and content': () => {
        global.document = createMockDocument();
        const ui = createUI();
        expect(ui.tagName).to.equal('DIV');
        const content = ui.querySelector('div');
        expect(content).to.not.be.null;
        expect(content.textContent).to.equal('Aha!');
        const closeButton = ui.querySelector('button');
        expect(closeButton).to.not.be.null;
        expect(closeButton.textContent).to.equal('Close');
    }
};
module.exports = { tests };
