const path = require('path');
const expect = require(path.resolve(__dirname, '..', 'vendor', 'chai.js')).expect;
const tests = {
    'should have a valid @name': (meta) => { expect(meta.name).to.be.a('string').and.not.be.empty; },
    'should have a valid @namespace': (meta) => { expect(meta.namespace).to.be.a('string').and.not.be.empty; },
    'should have a valid @version': (meta) => { expect(meta.version).to.be.a('string').and.not.be.empty; },
    'should have a valid @description': (meta) => { expect(meta.description).to.be.a('string').and.not.be.empty; },
    'should have a valid @author': (meta) => { expect(meta.author).to.be.a('string').and.not.be.empty; },
    'should have a valid @match': (meta) => { expect(meta.match).to.be.a('string').and.not.be.empty; },
    'should have a valid @grant for unsafeWindow': (meta) => { expect(meta.grant).to.include('unsafeWindow'); },
};
module.exports = { tests };
