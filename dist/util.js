/*
 *  Coder : chenfeng@xyzq.com.cn 
 *  Desp  : cheat code transform for babel tiscript-javascript transpile plugin 
 *  Ver   : 20180511 v1.0 Initial version.
 */

function transSciterDefaultVars(code) {
    let nullVars = ['document', 
                 'Int8Array', 'Uint8Array', 'Int16Array', 'Uint16Array', 
                 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array'];
    let emptyVars = ['screen', 'location', 'history', 'wx', 'navigator', 'browser', 'window'];

    for(let i=0; i < emptyVars.length; i++) {
        code = 'var ' + emptyVars[i] + ' = {};\n' + code;
    }

    for(let i=0; i < nullVars.length; i++) {
        code = 'var ' + nullVars[i] + ' = undefined;\n' + code;
    }

    return code;
} 

function transTypes(code) {
    return code.replace(/'#string'/g, "#string")
               .replace(/'#object'/g, "#object")
               .replace(/'#function'/g, "#function")
               .replace(/'undefined'/g, "undefined")
               .replace(/'#array'/g, "#array");
}


function transSyntax(code) {
    code = code.replace(/"_SCITER_/g, '').replace(/_SCITER_"/g, '');
    code = code.replace(/'_SCITER_/g, '').replace(/_SCITER_'/g, '');
    code = code.replace(/_SCITERQ_/g, '"');
    code = code.replace(/_SCITERQA_/g, '"]');
    code = code.replace(/_ASCITERQ_/g, '["');
    code = code.replace(/_SCITERA_/g, ']');
    code = code.replace(/_ASCITER_/g, '[');
    code = code.replace(/_SCITERDOT_/g, '.');
    code = code.replace(/_SCITER_FUNC_/g, 'function ');
    code = code.replace(/_SCITER_THIS_VAR_/g, 'this var ');
    code = code.replace(/ extends /g, ' : ');
    return code;
}

module.exports.trans = function trans(code) {
    code = transTypes(code);
    return transSyntax(code);
}

module.exports.transTypes = transTypes;
module.exports.transTypes = transSyntax;
module.exports.transSciterDefaultVars = transSciterDefaultVars;
