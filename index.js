/*
 *  Coder : chenfeng@xyzq.com.cn 
 *  Desp  : plugin for babel tranformation of javascript to tiscript 
 *  Ver   : 20180511 v1.0 Initial version.
 */
var _ = require('lodash')

export default function ({types: t}) {
    return {
        visitor  : {
            // for global processing... like 'use strict'
            Program(path) {  
                const { node } = path;
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
            ImportDeclaration(path) {
                const { node } = path;
                let vars = [];
                vars = parseImpExpNameDeclSource(t, node.specifiers, node.source);
                path.replaceWithMultiple(vars);
            },
            ExportAllDeclaration(path) {
                let param   = t.stringLiteral(path.node.source.value + ".tis");
                path.replaceWith(buildIncludeCall(t, [param]));
            },
            ExportNamedDeclaration(path) {
                const { node } = path;
                if (node.source == null) {
                    if (node.specifiers.length == 0 && node.declaration != null) {
                        removeExpWithDecl(t, path);
                    } else {
                        let vars = [];
                        vars = parseExpNameDeclLocal(t, path.node.specifiers);
                        path.replaceWithMultiple(vars);
                    }
                } else {
                    let vars = [];
                    vars = parseImpExpNameDeclSource(t, path.node.specifiers, path.node.source);
                    path.replaceWithMultiple(vars);
                }
            },
            ExportDefaultDeclaration(path) {
                removeExpWithDecl(t, path);
            },
            UnaryExpression(path){
                if (path && path.node && path.node.operator == "void")
                    transParenthesizedArgument(t, path);
            },
            BinaryExpression(path){
                replaceTypeCmp(t, path);
                transParentesizedWrapper(t, path);
            },
            DirectiveLiteral(path) {
                if (isUseStrict(t, path))
                    removeDirective(t, path);
            },
            CallExpression(path, state) {
                transSetTimeout(t, path);
                transElementAttr(t, path);
                transDocumentGetById(t, path);
                transDocumentCreateElem(t, path);
                transDocumentGetByClassName(t, path);
            },
            MemberExpression(path, state) {
                transConsole(t, path);
                transDocument(t, path);
                transInnerHTML(t, path);
                transStartswith(t, path);
                transAppendChild(t, path);
            },
            Identifier(path, state) {
                transSciterReservedKeywords(t, path);
            },
            StringLiteral(path, options) {
                if (isSingleQuoteString(path)) {
                    replaceQuoteString(path);
                }
            },
            LogicalExpression(path, state) {
                transParentesizedWrapper(t, path);
            },
            SwitchCase(path, state) {
                transBlkWrapper(t, path);
            }
        }
    }

}

function isSingleQuoteString(path) {
    if (path.node.extra === undefined)
        return;

    var s = path.node.extra.raw;

    if ((s.length >= 2) && (s[0] == "'")  && (s[s.length-1] == "'")) {
        return true;
    }
    return false;
}

function replaceEscapeChar(str) {
    return str.replace(/"/g, '\\"');
}

function replaceQuoteString(path) {
    let s    = path.node.extra.raw;
    let val  = s.substr(1, s.length-2);

    path.replaceWithSourceString('"' + replaceEscapeChar(val) + '"');
}

function isUseStrict(t, path) {
    let s = path.node.value;

    if (s == "use strict")
        return true;

    return false;
}

function replaceQuoteDirective(t, path) {
    var s = path.node.extra.raw;
    var d = t.directiveLiteral('"' + s.substr(1, s.length-2) + '"');

    path.replaceWith(d);
}

function removeDirective(t, path) {
    path.parentPath.remove();
}

function buildIncludeCall(t, params) {
    let id  = t.identifier('include');
    let call = t.callExpression(id, params);
    return call;
}

function buildEmptyFuncDef(t, path) {
    let blk = t.blockStatement([t.emptyStatement()]);
    return t.functionExpression(t.identifier(null), [], blk);
}

function buildEmptyFuncDefVar(t, name, path) {
    let declarator = t.variableDeclarator(t.identifier(name), buildEmptyFuncDef(t, path));
    let declaration  = t.variableDeclaration('var', [declarator]);
}

function buildNullDefVar(t, name, path) {
    let declarator = t.variableDeclarator(t.identifier(name), t.identifier('undefined'));
    let declaration  = t.variableDeclaration('var', [declarator]);
    return declaration;
}

function buildEmptyObjDefVar(t, name, path) {
    let declarator = t.variableDeclarator(t.identifier(name), t.objectExpression([]));
    let declaration  = t.variableDeclaration('var', [declarator]);
    return declaration;
}

function buildSciterDefaultNullVars(t, path) {
    let names = ['document', 
                 'Int8Array', 'Uint8Array', 'Int16Array', 'Uint16Array', 
                 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array'];

    for (let i=0; i < names.length; i++) {
        path.unshiftContainer( "body", buildNullDefVar(t, names[i], path));
    }
}

function buildSciterDefaultEmptyObjVars(t, path) {
    let names = ['screen', 'location', 'history', 'wx', 'navigator', 'browser', 'window'];

    for (let i=0; i < names.length; i++) {
        path.unshiftContainer( "body", buildEmptyObjDefVar(t, names[i], path));
    }
}

function parseExpNameDeclLocal(t, specifiers){
    let vars = [];
    let len  = parseInt(specifiers.length);

    for (let i=0; i < len; i++) {
        let sp  = specifiers[i];

        if (sp == null)
            continue;

        let exp = sp.exported;
        let loc = sp.local;

        let expName = 'sciter_default';
        if (exp.name != 'default') {
            continue;
            expName = exp.name;
        }
        let declarator = t.variableDeclarator(t.identifier(expName), loc);
        let declaration  = t.variableDeclaration('var', [declarator]);

        vars.push(declaration);
    }

    return vars;
}

function sourceToInclude(t, namespaceName, source, len){
    let namespaceDef = '_SCITER_namespace ' + namespaceName + 
                       ' { include _SCITERQ_' + source + '.tis_SCITERQ_ }_SCITER_';
    if (len == 0) {
        namespaceDef = '_SCITER_include _SCITERQ_' + source + '.tis_SCITERQ__SCITER_';
    }
    let nsDefStat    = t.expressionStatement(t.stringLiteral(namespaceDef));

    return nsDefStat;
}

function parseImpExpNameDeclSource(t, specifiers, source){
    let vars = [];
    let len  = parseInt(specifiers.length);
    let prefix        ="sciter_";
    let sourceName    = source.value.replace(/\./g, "").replace(/\//g, "_");
    let namespaceName = prefix + sourceName;

    let nsDefStat = sourceToInclude(t, namespaceName, source.value, len);
    vars.push(nsDefStat);

    for (let i=0; i < len; i++) {
        let sp  = specifiers[i];

        if (sp == null)
            continue;

        let varSrc      = sp.exported;
        let varLoc      = sp.local;
        let newVarSrc   = 'sciter_default';
        let newVarLoc   = t.memberExpression(t.identifier("sciter_" + sourceName), t.identifier(varLoc.name));

        if (sp.exported == null) { // imp statement
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

            if (varLoc.name == "default")
                newVarLoc = t.memberExpression(t.identifier("sciter_" + sourceName), t.identifier('sciter_default'));;
        }
        
        let declarator = t.variableDeclarator(t.identifier(newVarSrc), newVarLoc);
        let declaration  = t.variableDeclaration('var', [declarator]);

        vars.push(declaration);
    }

    return vars;
}

function replaceWithFuncDecl(t, path) {
    let declaration  = path.node.declaration;;

    let id = path.scope.generateUidIdentifierBasedOnNode(path.node.declaration.id);
    if (path.node.declaration.id == null) {
        id = t.identifier('sciter_default');
    } else {
        id = path.node.declaration.id;
    }

    let d = t.functionDeclaration(id, declaration.params, declaration.body);
    path.replaceWith(d);
}

function replaceWithClassDecl(t, path) {
    let cls  = path.node.declaration;
    let id = path.scope.generateUidIdentifierBasedOnNode(path.node.declaration.id);
    if (path.node.declaration.id == null || path.node.declaration.id == undefined) {
        id = t.identifier('sciter_default');
    } else {
        id = path.node.declaration.id;
    }

    let d = t.classDeclaration(id, null, cls.body, []);
    path.replaceWith(d);

}

function replaceWithDecl(t, path) {
    let declarator  = null;
    let declaration = null;

    if (path.node.declaration.type == "VariableDeclaration") {
        declaration = path.node.declaration;
    } else {
        declarator  = t.variableDeclarator(t.identifier('sciter_default'), path.node.declaration);
        declaration = t.variableDeclaration('var', [declarator]);
    }

    path.replaceWith(declaration);
}

function removeExpWithDecl(t, path) {
    switch (path.node.declaration.type) {
        case 'FunctionDeclaration': {
            replaceWithFuncDecl(t, path);
            break;
        } 
        case 'ClassDeclaration': {
            replaceWithClassDecl(t, path);
            break;
        } 
        default : {
            replaceWithDecl(t, path);
            break;
        }
    }
}

function replaceTypeCmp(t, path) {
    let node = path.node;
    if ((node.operator == "===") || (node.operator == "!==")) {
        if ((node.left.type == "UnaryExpression") &&  (node.left.operator == "typeof")){
            switch(node.right.value) {
                case "string": {
                    node.right = t.identifier("#string"); 
                    break;
                }
                case "object": {
                    node.right = t.identifier("#object"); 
                    break;
                }
                case "function": {
                    node.right = t.identifier("#function"); 
                    break;
                }
                case "undefined": {
                    node.right = t.identifier("undefined"); 
                    break;
                }
                case "array": {
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
    let node = path.node;
    if (node.object && node.object.name == "document") {
        let varName = node.property.name;
        let me = null;
        switch(varName) {
            case "querySelector" :  {
                me = t.memberExpression(t.identifier("self"), t.identifier("select"));
                break;
            }
            case "querySelectorAll" : 
            case "getElementsByTagName" : {
                me = t.memberExpression(t.identifier("self"), t.identifier("selectAll"));
                break;
            }
            default : 
                break;
        }

        if (me != null) 
            path.replaceWith(me);
    }
}

function transConsole(t, path) {
    let node = path.node;
    if (node.object && node.object.name == "console") {
        let me = t.memberExpression(t.identifier('stdout'), t.identifier('println'));
        path.replaceWith(me);
    }
}

function transStartswith(t, path) {
    let node = path.node;
    if (node.object && node.property.name == "startsWith") {
        let me = t.memberExpression(node.object, t.identifier('indexOf'));
        path.replaceWith(me);
    }
}

function transInnerHTML(t, path) {
    let node = path.node;
    if (node.object && node.property.name == "innerHTML") {
        let me = t.memberExpression(node.object, t.identifier('html'));
        path.replaceWith(me);
    }
}

function transAppendChild(t, path) {
    let node = path.node;
    if (node.object && node.property.name == "appendChild") {
        let me = t.memberExpression(node.object, t.identifier('append'));
        path.replaceWith(me);
    }
}

function transDocumentGetByClassName(t, path) {
    let node = path.node;
    let callee = path.node.callee;
    if (callee && 
        callee.object && (callee.object.name == "document") && 
        callee.property &&  (callee.property.name == "getElementsByClassName")) {

        let me = t.memberExpression(t.identifier('self'), t.identifier('selectAll'))
        let newArgument = t.stringLiteral("." + node.arguments[0].value);
        let ce = t.callExpression(me, [newArgument])
        path.replaceWith(ce);
    }
}

function transDocumentGetById(t, path) {
    let node = path.node;
    let callee = path.node.callee;
    if (callee && 
        callee.object && (callee.object.name == "document") && 
        callee.property &&  (callee.property.name == "getElementById")) {

        let me = t.memberExpression(t.identifier('self'), t.identifier('select'))
        let newArgument = t.stringLiteral("#" + node.arguments[0].value);
        let ce = t.callExpression(me, [newArgument])
        path.replaceWith(ce);
    }
}

function transDocumentCreateElem(t, path) {
    let node = path.node;
    let callee = path.node.callee;
    if (callee && 
        callee.object && (callee.object.name == "document") && 
        callee.property &&  (callee.property.name == "createElement")) {

        let ne = t.newExpression(t.identifier('Element'), node.arguments);
        let pe = t.parenthesizedExpression(ne);
            
        path.replaceWith(pe);
    }
}

function transSetTimeout(t, path) {
    let node = path.node;
    let callee = path.node.callee;
    if (callee && callee.name && (callee.name == "setTimeout")) {
        let me = t.memberExpression(t.identifier('self'), t.identifier('timer'))
        let ce = t.callExpression(me, [node.arguments[1], node.arguments[0]])

        path.replaceWith(ce);
    }
}

function transElementAttr(t, path) {
    let node = path.node;
    let callee = path.node.callee;
    if (callee && callee.property && 
        ((callee.property.name == "getAttribute") || 
         (callee.property.name == "setAttribute") || 
         (callee.property.name == "removeAttribute") || 
         (callee.property.name == "hasAttribute") )) {

        let prefix = null;
        if (node.arguments && node.arguments.length > 0 && node.arguments[0].type == "StringLiteral") {
            prefix = callee.object.name + '_ASCITERQ_' + node.arguments[0].value + '_SCITERQA_';
            path.replaceWithSourceString(prefix);
        } else {
            prefix = callee.object.name + '_ASCITER_' + node.arguments[0].name + '_SCITERA_';
        }

        switch(callee.property.name) {
            case "getAttribute" :  {
                path.replaceWithSourceString(prefix);
                break;
            }
            case "setAttribute" :  {
                let ae= t.assignmentExpression('=', t.identifier(prefix), node.arguments[1]);
                path.replaceWith(ae);
                break;
            }
            case "removeAttribute" :  {
                let ae= t.assignmentExpression('=', t.identifier(prefix), t.identifier('undefined'));
                path.replaceWith(ae);
                break;
            }
            case "hasAttribute" :  {
                let be= t.binaryExpression('!==', t.identifier(prefix), t.identifier('undefined'));
                path.replaceWith(be);
                break;
            }
            default : {
                break;
            }
        }
    }
}

function transSciterReservedKeywords(t, path) {
    let keywords = ['assert'];
    let prefix   = 'sciter_'; 

    let name = path.node.name;
    if (keywords.indexOf(name) >= 0) {
        path.replaceWith(t.identifier(prefix + name));
    }
}

function transBlkWrapper(t, path) {
    let node = path.node;

    if (node.consequent && node.consequent.length && node.consequent.length > 0) {
        if ((node.consequent.length > 1) || ((node.consequent.length == 1) && (node.consequent[0].type != "BlockStatement"))) {
            let con = t.BlockStatement(node.consequent, []);
            let sc  = t.SwitchCase(node.test, [con]);
            path.replaceWith(sc);
        }
    }
}

function transParentesizedWrapper(t, path) {
    let node = path.node;

    if (path.parentPath && path.parentPath.node && 
        ((path.parentPath.node.type == 'ParenthesizedExpression') ||
         (path.parentPath.node.type == 'ReturnStatement') ||
         (path.parentPath.node.type == 'ExpressionStatement') ||
         (path.parentPath.node.type == 'IfStatement'))
        ){
            return;
    }

    let pe = t.parenthesizedExpression(node);
    path.replaceWith(pe);
}

function transParenthesizedArgument(t, path) {
    let node = path.node;

    if (node && node.argument && 
        (node.argument.type == "ParenthesizedExpression"))
        return;

    let arg = t.parenthesizedExpression(node.argument);
    let ue  = t.unaryExpression(node.operator, arg, node.prefix);
    path.replaceWith(ue);
}

function buildClassBodyItemByObj(t, clsBody, itemDecl) {
   for (let i=0; i < itemDecl.length; i++) { 
        let itemID  = itemDecl[i].key.name;
        let itemDef = itemDecl[i].value;

        if (itemID == 'constructor')
            continue;

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
    let clsBody = [];
    let superClass = null;
    clsBody.push(t.classMethod('constructor', t.identifier('_SCITER_FUNC_this'), 
                                clsCons.params, clsCons.body, false, false));

    for (let i=0; i < clsMethods.length; i++) {
        let clsMethod  = clsMethods[i];
        let exp        = clsMethod.expression;
        let itemID     = exp.left.property;
        let itemDecl   = exp.right;
        
        if (itemDecl.type == 'NewExpression') {
            superClass = t.identifier(itemDecl.callee.name);
            continue;
        }

        if (itemDecl.type == "ObjectExpression")  {
            buildClassBodyItemByObj(t, clsBody, itemDecl.properties);
            continue;
        }

        if (itemID.name == "constructor") 
            continue;

        if (itemDecl.type == 'FunctionExpression') {
            itemID = t.identifier('_SCITER_FUNC_' + itemID.name);
            clsBody.push(t.classMethod('method', itemID, itemDecl.params, itemDecl.body, false, false));
        } else {
            itemID = t.identifier('_SCITER_THIS_VAR_' + itemID.name);
            clsBody.push(t.classProperty(itemID, itemDecl));
        }
    }
   
    return { 'clsBody' : t.classBody(clsBody), 'superClass' : superClass };
}

function buildClasses(t, path, objDecls, funcDecls) {
    let classes = [];
    for (let clsID in objDecls) {
        let clsCons    = objDecls[clsID];
        let clsMethods = funcDecls[clsID];

        if (clsMethods == null)
            continue;

        let { clsBody, superClass }  = buildClassBody(t, path, clsCons, clsMethods);

        let classDef = t.classDeclaration(t.identifier(clsID), superClass, clsBody, []);

        classes.push(classDef);
    }
    return classes;
}

function transClassProtoDef(t, path) {
    const { node } = path;

    var objDecls  = {};
    var funcDecls = {}; 
    var stats     = [];

    var protoAlias= {}; 
    var removeClsIds = {};
    var removeIdxes  = [];

    var subPaths = path.get('body');
    for (let i=0; i < node.body.length; i++) {
        let stat = node.body[i];

        if (stat.start == null)
            continue;

        if (stat.type == "FunctionDeclaration") {
            objDecls[stat.id.name] = stat;
            removeClsIds[stat.id.name] = i;
        } else if (stat.type == "VariableDeclaration") {
            if (stat.declarations && stat.declarations[0] && 
                stat.declarations[0].type == 'VariableDeclarator') {

                let varDecl = stat.declarations[0];

                if (varDecl.init && varDecl.init.type == 'FunctionExpression') {
                    let clsName = varDecl.id.name;

                    objDecls[clsName]     = varDecl.init;
                    removeClsIds[clsName] = i;
                } else if (varDecl.init && varDecl.init.type == 'MemberExpression') {
                    if (varDecl.init.property && varDecl.init.property.name == 'prototype') {
                        let varClsID = varDecl.init.object;
                        if (varClsID && (objDecls[varClsID.name] != null)) {
                            protoAlias[varDecl.id.name] = varDecl.init.object.name; 
                            removeIdxes.push(i);
                        }
                    }
                }
            }
        } else if (stat.type == "ExpressionStatement") {
            checkClassMethodByDef(i, stat, removeIdxes,removeClsIds, objDecls, funcDecls, protoAlias);
        } else {
            stats.push(stat);
        }
    }

    let classDefs = genClassDef(t, subPaths[subPaths.length-1], objDecls, funcDecls);
    if (classDefs.length > 0)
        removeOrReplaceOrignalDefs(removeIdxes, subPaths, classDefs); 
}

function checkClassMethodByDef(idx, stat, removeIdxes, removeClsIds, objDecls, funcDecls, protoAlias) {
    let exp  = stat.expression;
    let left = exp.left;

    if (exp.type == "AssignmentExpression") {
        if (exp.operator == "=" ){
            let protoName = null;

            // single level memberexpression
            if (left.type == 'MemberExpression' && (left.object.type == 'Identifier')) {
                protoName = left.object.name;

                if (protoName && protoAlias[protoName]) {
                    let objName = protoAlias[protoName];

                    if (funcDecls[objName] == null)
                        funcDecls[objName] = [];
                    funcDecls[objName].push(stat);

                    removeIdxes.push(idx);
                    removeIdxes.push(removeClsIds[objName]);
                }
            }

            if (left.type == 'identifier') {
                protoName = left.name;
                if (protoName && protoAlias[protoName]) {
                    let objName = protoAlias[protoName];
                    if (funcDecls[objName] == null)
                        funcDecls[objName] = [];

                    funcDecls[objName].push(stat);

                    removeIdxes.push(idx);
                    removeIdxes.push(removeClsIds[objName]);
                }
            }
        }
    }
}

function transClassGlobal(t, path) {

    const { node } = path;

    var objDecls  = {};
    var funcDecls = {}; 
    var stats     = [];

    var removeClsIds = {};
    var removeIdxes  = [];

    var subPaths = path.get('body');
    for (let i=0; i < node.body.length; i++) {
        let stat = node.body[i];

        if (stat.start == null)
            continue;

        if (stat.type == "FunctionDeclaration") {
            objDecls[stat.id.name] = stat;
            removeClsIds[stat.id.name] = i;
        } else if (stat.type == "VariableDeclaration") {
            if (stat.declarations && stat.declarations[0] && stat.declarations[0].type == 'VariableDeclarator') {
                let varDecl = stat.declarations[0];
                if (varDecl.init && varDecl.init.type == 'FunctionExpression') {
                    let clsName = varDecl.id.name;

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

    let classDefs = genClassDef(t, subPaths[subPaths.length-1], objDecls, funcDecls);
    if (classDefs.length > 0)
        removeOrReplaceOrignalDefs(removeIdxes, subPaths, classDefs); 
}

function checkClassMethod(idx, stat, removeIdxes, removeClsIds, objDecls, funcDecls) {
    let exp = stat.expression;
    if (exp.type == "AssignmentExpression") {
        let left = exp.left;

        if (exp.operator == "=" ){
            if (left.type == 'MemberExpression' && left.object.object && 
                left.object.property && (left.object.property.name == "prototype")) {
                let objName = left.object.object.name;
                if (funcDecls[objName] == null)
                    funcDecls[objName] = [];
                funcDecls[objName].push(stat);

                removeIdxes.push(idx);
                removeIdxes.push(removeClsIds[objName]);
            }
            if (left.type == 'MemberExpression' && left.object.type == 'Identifier' && 
                (left.property.name == "prototype")) {
                let objName = left.object.name;

                if (funcDecls[objName] == null)
                    funcDecls[objName] = [];
                funcDecls[objName].push(stat);

                removeIdxes.push(idx);
                removeIdxes.push(removeClsIds[objName]);
            }
        }
    }
}

function removeOrReplaceOrignalDefs(removeIdxes, subPaths, classDefs) {

    subPaths[removeIdxes[0]].replaceWithMultiple(classDefs);

    removeIdxes = removeIdxes.splice(1);
    removeIdxes = removeIdxes.filter(onlyUnique);
    for (let i=0; i < removeIdxes.length; i++) {
        let removeIdx = removeIdxes[i];
        subPaths[removeIdx].remove();
    } 
}

function genClassDef(t, path, objDecls, funcDecls) {
    let classes   = buildClasses(t, path, objDecls, funcDecls);
    let classDefs = []
    for(let i=0; i < classes.length; i++) {
        let classDef = classes[i];
        classDefs.push(classDef);
    }

    return classDefs;
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

