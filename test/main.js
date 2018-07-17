/*
 *  Coder : chenfeng@xyzq.com.cn 
 *  Desp  : test for plugin.
 *  Ver   : 20180511 v1.0 Initial version.
 */

"use strict"

var path    = require('path');
var fs      = require('fs');
var assert  = require('assert');
var transformFileSync = require('babel-core').transformFileSync;

var plugin      = require('../dist/index').default;
var transCheat  = require('../dist/util').trans;
var transSciterDefaultVars = require('../dist/util').transSciterDefaultVars;

var tests = [
    {file: 'singleQuote'},
    {file: 'typeof'},
    {file: 'export/export-default'},
    {file: 'export/export-default-10'},
    {file: 'export/export-default-2'},
    {file: 'export/export-default-3'},
    {file: 'export/export-default-4'},
    {file: 'export/export-default-5'},
    {file: 'export/export-default-6'},
    {file: 'export/export-default-7'},
    {file: 'export/export-default-8'},
    {file: 'export/export-default-9'},
    {file: 'export/export-default-10'},
    {file: 'export/export-from'},
    {file: 'export/export-from-2'},
    {file: 'export/export-from-3'},
    {file: 'export/export-from-4'},
    {file: 'export/export-from-5'},
    {file: 'export/export-from-6'},
    {file: 'export/export-named'},
    {file: 'export/export-named-2'},
    {file: 'export/export-named-3'},
    {file: 'export/export-named-4'},
    {file: 'export/export-named-5'},
    {file: 'export/export-specifier-default'},
    {file: 'export/exports-variable'},
    {file: 'export/hoist-function-exports'},
    {file: 'export/noInterop-export-from'},
    {file: 'import/import-order'},
    {file: 'import/imports'},
    {file: 'import/imports-default'},
    {file: 'import/imports-glob'},
    {file: 'import/imports-mixing'},
    {file: 'import/imports-named'},
    {file: 'import/import-up-dir'},
    {file: 'import/noInterop-import-default-only'},
    {file: 'document'},
    {file: 'setTimeout'},
    {file: 'console'},
    {file: 'startsWith'},
    {file: 'elements'},
    {file: 'reservedKeywords'},
    {file: 'logicalExpression'},
    {file: 'switchCase'},
    {file: 'complexStat'},
    {file: 'void'},
    {file: 'class-combine'},
    {file: 'class-combine-2'},
    {file: 'class-export'},
    {file: 'class'},
];


describe('Transform script', function () {
    tests.forEach(function(test){
        it(`No preset ${test.file}`, function(done) {
            var transformedCode = transformFileSync(`test/src/${test.file}.js`, {
                plugins: [[plugin, test.options]],
                presets: [],
                babelrc: false // ignore babelrc
            }).code + "\n";

            var expected = fs.readFileSync(
                    path.join(__dirname, `expected/${test.file}.js`)).toString().replace(/\r/g, "");

            expected = transSciterDefaultVars(expected);
            assert.equal(transCheat(transformedCode), expected);
            done();
        });
    });
});
