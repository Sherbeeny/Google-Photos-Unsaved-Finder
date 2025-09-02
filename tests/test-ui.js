// Manually require our vendored assertion library
const expect = require('../vendor/chai.js').expect;

// This will fail because the file does not exist yet.
const { createUI } = require('../src/main.user.js');

// A hand-crafted mock of the DOM, sufficient for our tests.
// This avoids any need for jsdom or other external dependencies.
const createMockDocument = () => {
    const mockElement = {
        children: [],
        classList: new Set(),
        appendChild(child) {
            this.children.push(child);
        },
        querySelector(selector) {
            // A very simple selector engine for our specific test needs.
            return this.children.find(child => child.tagName.toLowerCase() === selector) || null;
        }
    };
    return {
        createElement(tagName) {
            return { ...mockElement, tagName: tagName.toUpperCase(), children: [] };
        },
        body: {
            ...mockElement,
            tagName: 'BODY',
            children: []
        }
    };
};


// Define our tests as functions within an object.
// The test runner will execute these.
const tests = {
    'should create a UI window with the correct structure and content': () => {
        // Each test gets a fresh mock document.
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
