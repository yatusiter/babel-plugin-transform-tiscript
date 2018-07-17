"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (_ref) {
    var t = _ref.types;

    return {
        visitor: {
            // for global processing... like 'use strict'
            Program: function Program(path) {
                var node = path.node;
                /*
                for (var directive of node.directives) {            
                    if (directive.value.value === "use strict") {
                    }
                }            
                */

                buildSciterDefaultEmptyObjVars(t, path);
                buildSciterDefaultNullVars(t, path);
                // add class definition trans & remove orginal statements in FunctionDeclaration traverse
                transClassProtoDef(t, path);
                transClassGlobal(t, path);
            },
            ImportDeclaration: function ImportDeclaration(path) {
                var node = path.node;

                var vars = [];
                vars = parseImpExpNameDeclSource(t, node.specifiers, node.source);
                path.replaceWithMultiple(vars);
            },
            ExportAllDeclaration: function ExportAllDeclaration(path) {
                var param = t.stringLiteral(path.node.source.value + ".tis");
                path.replaceWith(buildIncludeCall(t, [param]));
            },
            ExportNamedDeclaration: function ExportNamedDeclaration(path) {
                var node = path.node;

                if (node.source == null) {
                    if (node.specifiers.length == 0 && node.declaration != null) {
                        removeExpWithDecl(t, path);
                    } else {
                        var vars = [];
                        vars = parseExpNameDeclLocal(t, path.node.specifiers);
                        path.replaceWithMultiple(vars);
                    }
                } else {
                    var _vars = [];
                    _vars = parseImpExpNameDeclSource(t, path.node.specifiers, path.node.source);
                    path.replaceWithMultiple(_vars);
                }
            },
            ExportDefaultDeclaration: function ExportDefaultDeclaration(path) {
                removeExpWithDecl(t, path);
            },
            UnaryExpression: function UnaryExpression(path) {
                if (path && path.node && path.node.operator == "void") transParenthesizedArgument(t, path);
            },
            BinaryExpression: function BinaryExpression(path) {
                replaceTypeCmp(t, path);
                transParentesizedWrapper(t, path);
            },
            DirectiveLiteral: function DirectiveLiteral(path) {
                if (isUseStrict(t, path)) removeDirective(t, path);
            },
            CallExpression: function CallExpression(path, state) {
                transSetTimeout(t, path);
                transElementAttr(t, path);
                transDocumentGetById(t, path);
                transDocumentCreateElem(t, path);
                transDocumentGetByClassName(t, path);
            },
            MemberExpression: function MemberExpression(path, state) {
                transConsole(t, path);
                transDocument(t, path);
                transInnerHTML(t, path);
                transStartswith(t, path);
                transAppendChild(t, path);
            },
            Identifier: function Identifier(path, state) {
                transSciterReservedKeywords(t, path);
            },
            StringLiteral: function StringLiteral(path, options) {
                if (isSingleQuoteString(path)) {
                    replaceQuoteString(path);
                }
            },
            LogicalExpression: function LogicalExpression(path, state) {
                transParentesizedWrapper(t, path);
            },
            SwitchCase: function SwitchCase(path, state) {
                transBlkWrapper(t, path);
            }
        }
    };
};

/*
 *  Coder : chenfeng@xyzq.com.cn 
 *  Desp  : plugin for babel tranformation of javascript to tiscript 
 *  Ver   : 20180511 v1.0 Initial version.
 */
var _ = require('lodash');

function isSingleQuoteString(path) {
    if (path.node.extra === undefined) return;

    var s = path.node.extra.raw;

    if (s.length >= 2 && s[0] == "'" && s[s.length - 1] == "'") {
        return true;
    }
    return false;
}

function replaceEscapeChar(str) {
    return str.replace(/"/g, '\\"');
}

function replaceQuoteString(path) {
    var s = path.node.extra.raw;
    var val = s.substr(1, s.length - 2);

    path.replaceWithSourceString('"' + replaceEscapeChar(val) + '"');
}

function isUseStrict(t, path) {
    var s = path.node.value;

    if (s == "use strict") return true;

    return false;
}

function replaceQuoteDirective(t, path) {
    var s = path.node.extra.raw;
    var d = t.directiveLiteral('"' + s.substr(1, s.length - 2) + '"');

    path.replaceWith(d);
}

function removeDirective(t, path) {
    path.parentPath.remove();
}

function buildIncludeCall(t, params) {
    var id = t.identifier('include');
    var call = t.callExpression(id, params);
    return call;
}

function buildEmptyFuncDef(t, path) {
    var blk = t.blockStatement([t.emptyStatement()]);
    return t.functionExpression(t.identifier(null), [], blk);
}

function buildEmptyFuncDefVar(t, name, path) {
    var declarator = t.variableDeclarator(t.identifier(name), buildEmptyFuncDef(t, path));
    var declaration = t.variableDeclaration('var', [declarator]);
}

function buildNullDefVar(t, name, path) {
    var declarator = t.variableDeclarator(t.identifier(name), t.identifier('undefined'));
    var declaration = t.variableDeclaration('var', [declarator]);
    return declaration;
}

function buildEmptyObjDefVar(t, name, path) {
    var declarator = t.variableDeclarator(t.identifier(name), t.objectExpression([]));
    var declaration = t.variableDeclaration('var', [declarator]);
    return declaration;
}

function buildSciterDefaultNullVars(t, path) {
    var names = ['document', 'Int8Array', 'Uint8Array', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array'];

    for (var i = 0; i < names.length; i++) {
        path.unshiftContainer("body", buildNullDefVar(t, names[i], path));
    }
}

function buildSciterDefaultEmptyObjVars(t, path) {
    var names = ['screen', 'location', 'history', 'wx', 'navigator', 'browser', 'window'];

    for (var i = 0; i < names.length; i++) {
        path.unshiftContainer("body", buildEmptyObjDefVar(t, names[i], path));
    }
}

function parseExpNameDeclLocal(t, specifiers) {
    var vars = [];
    var len = parseInt(specifiers.length);

    for (var i = 0; i < len; i++) {
        var sp = specifiers[i];

        if (sp == null) continue;

        var exp = sp.exported;
        var loc = sp.local;

        var expName = 'sciter_default';
        if (exp.name != 'default') {
            continue;
            expName = exp.name;
        }
        var declarator = t.variableDeclarator(t.identifier(expName), loc);
        var declaration = t.variableDeclaration('var', [declarator]);

        vars.push(declaration);
    }

    return vars;
}

function sourceToInclude(t, namespaceName, source, len) {
    var namespaceDef = '_SCITER_namespace ' + namespaceName + ' { include _SCITERQ_' + source + '.tis_SCITERQ_ }_SCITER_';
    if (len == 0) {
        namespaceDef = '_SCITER_include _SCITERQ_' + source + '.tis_SCITERQ__SCITER_';
    }
    var nsDefStat = t.expressionStatement(t.stringLiteral(namespaceDef));

    return nsDefStat;
}

function parseImpExpNameDeclSource(t, specifiers, source) {
    var vars = [];
    var len = parseInt(specifiers.length);
    var prefix = "sciter_";
    var sourceName = source.value.replace(/\./g, "").replace(/\//g, "_");
    var namespaceName = prefix + sourceName;

    var nsDefStat = sourceToInclude(t, namespaceName, source.value, len);
    vars.push(nsDefStat);

    for (var i = 0; i < len; i++) {
        var sp = specifiers[i];

        if (sp == null) continue;

        var varSrc = sp.exported;
        var varLoc = sp.local;
        var newVarSrc = 'sciter_default';
        var newVarLoc = t.memberExpression(t.identifier("sciter_" + sourceName), t.identifier(varLoc.name));

        if (sp.exported == null) {
            // imp statement
            varSrc = sp.imported;
            if (sp.type == "ImportDefaultSpecifier") {
                newVarSrc = varLoc.name;
                newVarLoc = t.memberExpression(t.identifier("sciter_" + sourceName), t.identifier("sciter_default"));
            } else if (sp.type == "ImportNamespaceSpecifier") {
                newVarSrc = varLoc.name;
                newVarLoc = t.identifier(namespaceName);
            } else if (varSrc.name == 'default') {
                newVarSrc = varLoc.name;
                newVarLoc = t.memberExpression(t.identifier("sciter_" + sourceName), t.identifier("sciter_default"));
            } else {
                newVarSrc = varLoc.name;
                newVarLoc = t.memberExpression(t.identifier("sciter_" + sourceName), t.identifier(varSrc.name));
            }
        } else {
            if (varSrc.name != 'default') {
                newVarSrc = varSrc.name;
            }

            if (varLoc.name == "default") newVarLoc = t.memberExpression(t.identifier("sciter_" + sourceName), t.identifier('sciter_default'));;
        }

        var declarator = t.variableDeclarator(t.identifier(newVarSrc), newVarLoc);
        var declaration = t.variableDeclaration('var', [declarator]);

        vars.push(declaration);
    }

    return vars;
}

function replaceWithFuncDecl(t, path) {
    var declaration = path.node.declaration;;

    var id = path.scope.generateUidIdentifierBasedOnNode(path.node.declaration.id);
    if (path.node.declaration.id == null) {
        id = t.identifier('sciter_default');
    } else {
        id = path.node.declaration.id;
    }

    var d = t.functionDeclaration(id, declaration.params, declaration.body);
    path.replaceWith(d);
}

function replaceWithClassDecl(t, path) {
    var cls = path.node.declaration;
    var id = path.scope.generateUidIdentifierBasedOnNode(path.node.declaration.id);
    if (path.node.declaration.id == null || path.node.declaration.id == undefined) {
        id = t.identifier('sciter_default');
    } else {
        id = path.node.declaration.id;
    }

    var d = t.classDeclaration(id, null, cls.body, []);
    path.replaceWith(d);
}

function replaceWithDecl(t, path) {
    var declarator = null;
    var declaration = null;

    if (path.node.declaration.type == "VariableDeclaration") {
        declaration = path.node.declaration;
    } else {
        declarator = t.variableDeclarator(t.identifier('sciter_default'), path.node.declaration);
        declaration = t.variableDeclaration('var', [declarator]);
    }

    path.replaceWith(declaration);
}

function removeExpWithDecl(t, path) {
    switch (path.node.declaration.type) {
        case 'FunctionDeclaration':
            {
                replaceWithFuncDecl(t, path);
                break;
            }
        case 'ClassDeclaration':
            {
                replaceWithClassDecl(t, path);
                break;
            }
        default:
            {
                replaceWithDecl(t, path);
                break;
            }
    }
}

function replaceTypeCmp(t, path) {
    var node = path.node;
    if (node.operator == "===" || node.operator == "!==") {
        if (node.left.type == "UnaryExpression" && node.left.operator == "typeof") {
            switch (node.right.value) {
                case "string":
                    {
                        node.right = t.identifier("#string");
                        break;
                    }
                case "object":
                    {
                        node.right = t.identifier("#object");
                        break;
                    }
                case "function":
                    {
                        node.right = t.identifier("#function");
                        break;
                    }
                case "undefined":
                    {
                        node.right = t.identifier("undefined");
                        break;
                    }
                case "array":
                    {
                        node.right = t.identifier("#array");
                        break;
                    }
                default:
                    break;
            }
        }
    }
}

function transDocument(t, path) {
    var node = path.node;
    if (node.object && node.object.name == "document") {
        var varName = node.property.name;
        var me = null;
        switch (varName) {
            case "querySelector":
                {
                    me = t.memberExpression(t.identifier("self"), t.identifier("select"));
                    break;
                }
            case "querySelectorAll":
            case "getElementsByTagName":
                {
                    me = t.memberExpression(t.identifier("self"), t.identifier("selectAll"));
                    break;
                }
            default:
                break;
        }

        if (me != null) path.replaceWith(me);
    }
}

function transConsole(t, path) {
    var node = path.node;
    if (node.object && node.object.name == "console") {
        var me = t.memberExpression(t.identifier('stdout'), t.identifier('println'));
        path.replaceWith(me);
    }
}

function transStartswith(t, path) {
    var node = path.node;
    if (node.object && node.property.name == "startsWith") {
        var me = t.memberExpression(node.object, t.identifier('indexOf'));
        path.replaceWith(me);
    }
}

function transInnerHTML(t, path) {
    var node = path.node;
    if (node.object && node.property.name == "innerHTML") {
        var me = t.memberExpression(node.object, t.identifier('html'));
        path.replaceWith(me);
    }
}

function transAppendChild(t, path) {
    var node = path.node;
    if (node.object && node.property.name == "appendChild") {
        var me = t.memberExpression(node.object, t.identifier('append'));
        path.replaceWith(me);
    }
}

function transDocumentGetByClassName(t, path) {
    var node = path.node;
    var callee = path.node.callee;
    if (callee && callee.object && callee.object.name == "document" && callee.property && callee.property.name == "getElementsByClassName") {

        var me = t.memberExpression(t.identifier('self'), t.identifier('selectAll'));
        var newArgument = t.stringLiteral("." + node.arguments[0].value);
        var ce = t.callExpression(me, [newArgument]);
        path.replaceWith(ce);
    }
}

function transDocumentGetById(t, path) {
    var node = path.node;
    var callee = path.node.callee;
    if (callee && callee.object && callee.object.name == "document" && callee.property && callee.property.name == "getElementById") {

        var me = t.memberExpression(t.identifier('self'), t.identifier('select'));
        var newArgument = t.stringLiteral("#" + node.arguments[0].value);
        var ce = t.callExpression(me, [newArgument]);
        path.replaceWith(ce);
    }
}

function transDocumentCreateElem(t, path) {
    var node = path.node;
    var callee = path.node.callee;
    if (callee && callee.object && callee.object.name == "document" && callee.property && callee.property.name == "createElement") {

        var ne = t.newExpression(t.identifier('Element'), node.arguments);
        var pe = t.parenthesizedExpression(ne);

        path.replaceWith(pe);
    }
}

function transSetTimeout(t, path) {
    var node = path.node;
    var callee = path.node.callee;
    if (callee && callee.name && callee.name == "setTimeout") {
        var me = t.memberExpression(t.identifier('self'), t.identifier('timer'));
        var ce = t.callExpression(me, [node.arguments[1], node.arguments[0]]);

        path.replaceWith(ce);
    }
}

function transElementAttr(t, path) {
    var node = path.node;
    var callee = path.node.callee;
    if (callee && callee.property && (callee.property.name == "getAttribute" || callee.property.name == "setAttribute" || callee.property.name == "removeAttribute" || callee.property.name == "hasAttribute")) {

        var prefix = null;
        if (node.arguments && node.arguments.length > 0 && node.arguments[0].type == "StringLiteral") {
            prefix = callee.object.name + '_ASCITERQ_' + node.arguments[0].value + '_SCITERQA_';
            path.replaceWithSourceString(prefix);
        } else {
            prefix = callee.object.name + '_ASCITER_' + node.arguments[0].name + '_SCITERA_';
        }

        switch (callee.property.name) {
            case "getAttribute":
                {
                    path.replaceWithSourceString(prefix);
                    break;
                }
            case "setAttribute":
                {
                    var ae = t.assignmentExpression('=', t.identifier(prefix), node.arguments[1]);
                    path.replaceWith(ae);
                    break;
                }
            case "removeAttribute":
                {
                    var _ae = t.assignmentExpression('=', t.identifier(prefix), t.identifier('undefined'));
                    path.replaceWith(_ae);
                    break;
                }
            case "hasAttribute":
                {
                    var be = t.binaryExpression('!==', t.identifier(prefix), t.identifier('undefined'));
                    path.replaceWith(be);
                    break;
                }
            default:
                {
                    break;
                }
        }
    }
}

function transSciterReservedKeywords(t, path) {
    var keywords = ['assert'];
    var prefix = 'sciter_';

    var name = path.node.name;
    if (keywords.indexOf(name) >= 0) {
        path.replaceWith(t.identifier(prefix + name));
    }
}

function transBlkWrapper(t, path) {
    var node = path.node;

    if (node.consequent && node.consequent.length && node.consequent.length > 0) {
        if (node.consequent.length > 1 || node.consequent.length == 1 && node.consequent[0].type != "BlockStatement") {
            var con = t.BlockStatement(node.consequent, []);
            var sc = t.SwitchCase(node.test, [con]);
            path.replaceWith(sc);
        }
    }
}

function transParentesizedWrapper(t, path) {
    var node = path.node;

    if (path.parentPath && path.parentPath.node && (path.parentPath.node.type == 'ParenthesizedExpression' || path.parentPath.node.type == 'ReturnStatement' || path.parentPath.node.type == 'ExpressionStatement' || path.parentPath.node.type == 'IfStatement')) {
        return;
    }

    var pe = t.parenthesizedExpression(node);
    path.replaceWith(pe);
}

function transParenthesizedArgument(t, path) {
    var node = path.node;

    if (node && node.argument && node.argument.type == "ParenthesizedExpression") return;

    var arg = t.parenthesizedExpression(node.argument);
    var ue = t.unaryExpression(node.operator, arg, node.prefix);
    path.replaceWith(ue);
}

function buildClassBodyItemByObj(t, clsBody, itemDecl) {
    for (var i = 0; i < itemDecl.length; i++) {
        var itemID = itemDecl[i].key.name;
        var itemDef = itemDecl[i].value;

        if (itemID == 'constructor') continue;

        if (itemDef.type == 'FunctionExpression') {
            itemID = t.identifier('_SCITER_FUNC_' + itemID);
            clsBody.push(t.classMethod('method', itemID, itemDef.params, itemDef.body, false, false));
        } else {
            itemID = t.identifier('_SCITER_THIS_VAR_' + itemID);
            clsBody.push(t.classProperty(itemID, itemDef));
        }
    }
}

function buildClassBody(t, path, clsCons, clsMethods) {
    var clsBody = [];
    var superClass = null;
    clsBody.push(t.classMethod('constructor', t.identifier('_SCITER_FUNC_this'), clsCons.params, clsCons.body, false, false));

    for (var i = 0; i < clsMethods.length; i++) {
        var clsMethod = clsMethods[i];
        var exp = clsMethod.expression;
        var itemID = exp.left.property;
        var itemDecl = exp.right;

        if (itemDecl.type == 'NewExpression') {
            superClass = t.identifier(itemDecl.callee.name);
            continue;
        }

        if (itemDecl.type == "ObjectExpression") {
            buildClassBodyItemByObj(t, clsBody, itemDecl.properties);
            continue;
        }

        if (itemID.name == "constructor") continue;

        if (itemDecl.type == 'FunctionExpression') {
            itemID = t.identifier('_SCITER_FUNC_' + itemID.name);
            clsBody.push(t.classMethod('method', itemID, itemDecl.params, itemDecl.body, false, false));
        } else {
            itemID = t.identifier('_SCITER_THIS_VAR_' + itemID.name);
            clsBody.push(t.classProperty(itemID, itemDecl));
        }
    }

    return { 'clsBody': t.classBody(clsBody), 'superClass': superClass };
}

function buildClasses(t, path, objDecls, funcDecls) {
    var classes = [];
    for (var clsID in objDecls) {
        var clsCons = objDecls[clsID];
        var clsMethods = funcDecls[clsID];

        if (clsMethods == null) continue;

        var _buildClassBody = buildClassBody(t, path, clsCons, clsMethods),
            clsBody = _buildClassBody.clsBody,
            superClass = _buildClassBody.superClass;

        var classDef = t.classDeclaration(t.identifier(clsID), superClass, clsBody, []);

        classes.push(classDef);
    }
    return classes;
}

function transClassProtoDef(t, path) {
    var node = path.node;


    var objDecls = {};
    var funcDecls = {};
    var stats = [];

    var protoAlias = {};
    var removeClsIds = {};
    var removeIdxes = [];

    var subPaths = path.get('body');
    for (var i = 0; i < node.body.length; i++) {
        var stat = node.body[i];

        if (stat.start == null) continue;

        if (stat.type == "FunctionDeclaration") {
            objDecls[stat.id.name] = stat;
            removeClsIds[stat.id.name] = i;
        } else if (stat.type == "VariableDeclaration") {
            if (stat.declarations && stat.declarations[0] && stat.declarations[0].type == 'VariableDeclarator') {

                var varDecl = stat.declarations[0];

                if (varDecl.init && varDecl.init.type == 'FunctionExpression') {
                    var clsName = varDecl.id.name;

                    objDecls[clsName] = varDecl.init;
                    removeClsIds[clsName] = i;
                } else if (varDecl.init && varDecl.init.type == 'MemberExpression') {
                    if (varDecl.init.property && varDecl.init.property.name == 'prototype') {
                        var varClsID = varDecl.init.object;
                        if (varClsID && objDecls[varClsID.name] != null) {
                            protoAlias[varDecl.id.name] = varDecl.init.object.name;
                            removeIdxes.push(i);
                        }
                    }
                }
            }
        } else if (stat.type == "ExpressionStatement") {
            checkClassMethodByDef(i, stat, removeIdxes, removeClsIds, objDecls, funcDecls, protoAlias);
        } else {
            stats.push(stat);
        }
    }

    var classDefs = genClassDef(t, subPaths[subPaths.length - 1], objDecls, funcDecls);
    if (classDefs.length > 0) removeOrReplaceOrignalDefs(removeIdxes, subPaths, classDefs);
}

function checkClassMethodByDef(idx, stat, removeIdxes, removeClsIds, objDecls, funcDecls, protoAlias) {
    var exp = stat.expression;
    var left = exp.left;

    if (exp.type == "AssignmentExpression") {
        if (exp.operator == "=") {
            var protoName = null;

            // single level memberexpression
            if (left.type == 'MemberExpression' && left.object.type == 'Identifier') {
                protoName = left.object.name;

                if (protoName && protoAlias[protoName]) {
                    var objName = protoAlias[protoName];

                    if (funcDecls[objName] == null) funcDecls[objName] = [];
                    funcDecls[objName].push(stat);

                    removeIdxes.push(idx);
                    removeIdxes.push(removeClsIds[objName]);
                }
            }

            if (left.type == 'identifier') {
                protoName = left.name;
                if (protoName && protoAlias[protoName]) {
                    var _objName = protoAlias[protoName];
                    if (funcDecls[_objName] == null) funcDecls[_objName] = [];

                    funcDecls[_objName].push(stat);

                    removeIdxes.push(idx);
                    removeIdxes.push(removeClsIds[_objName]);
                }
            }
        }
    }
}

function transClassGlobal(t, path) {
    var node = path.node;


    var objDecls = {};
    var funcDecls = {};
    var stats = [];

    var removeClsIds = {};
    var removeIdxes = [];

    var subPaths = path.get('body');
    for (var i = 0; i < node.body.length; i++) {
        var stat = node.body[i];

        if (stat.start == null) continue;

        if (stat.type == "FunctionDeclaration") {
            objDecls[stat.id.name] = stat;
            removeClsIds[stat.id.name] = i;
        } else if (stat.type == "VariableDeclaration") {
            if (stat.declarations && stat.declarations[0] && stat.declarations[0].type == 'VariableDeclarator') {
                var varDecl = stat.declarations[0];
                if (varDecl.init && varDecl.init.type == 'FunctionExpression') {
                    var clsName = varDecl.id.name;

                    objDecls[clsName] = varDecl.init;
                    removeClsIds[clsName] = i;
                }
            }
        } else if (stat.type == "ExpressionStatement") {
            checkClassMethod(i, stat, removeIdxes, removeClsIds, objDecls, funcDecls);
        } else {
            stats.push(stat);
        }
    }

    var classDefs = genClassDef(t, subPaths[subPaths.length - 1], objDecls, funcDecls);
    if (classDefs.length > 0) removeOrReplaceOrignalDefs(removeIdxes, subPaths, classDefs);
}

function checkClassMethod(idx, stat, removeIdxes, removeClsIds, objDecls, funcDecls) {
    var exp = stat.expression;
    if (exp.type == "AssignmentExpression") {
        var left = exp.left;

        if (exp.operator == "=") {
            if (left.type == 'MemberExpression' && left.object.object && left.object.property && left.object.property.name == "prototype") {
                var objName = left.object.object.name;
                if (funcDecls[objName] == null) funcDecls[objName] = [];
                funcDecls[objName].push(stat);

                removeIdxes.push(idx);
                removeIdxes.push(removeClsIds[objName]);
            }
            if (left.type == 'MemberExpression' && left.object.type == 'Identifier' && left.property.name == "prototype") {
                var _objName2 = left.object.name;

                if (funcDecls[_objName2] == null) funcDecls[_objName2] = [];
                funcDecls[_objName2].push(stat);

                removeIdxes.push(idx);
                removeIdxes.push(removeClsIds[_objName2]);
            }
        }
    }
}

function removeOrReplaceOrignalDefs(removeIdxes, subPaths, classDefs) {

    subPaths[removeIdxes[0]].replaceWithMultiple(classDefs);

    removeIdxes = removeIdxes.splice(1);
    removeIdxes = removeIdxes.filter(onlyUnique);
    for (var i = 0; i < removeIdxes.length; i++) {
        var removeIdx = removeIdxes[i];
        subPaths[removeIdx].remove();
    }
}

function genClassDef(t, path, objDecls, funcDecls) {
    var classes = buildClasses(t, path, objDecls, funcDecls);
    var classDefs = [];
    for (var i = 0; i < classes.length; i++) {
        var classDef = classes[i];
        classDefs.push(classDef);
    }

    return classDefs;
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}