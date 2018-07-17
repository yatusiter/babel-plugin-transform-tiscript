/*
 *  Coder : chenfeng@xyzq.com.cn 
 *  Desp  : plugin for babel tranformation of javascript to tiscript 
 *  Ver   : 20180511 v1.0 Initial version.
 */

"use strict"

var path    = require('path');
var fs      = require('fs');
var assert  = require('assert');
var transformFileSync = require('babel-core').transformFileSync;

var plugin      = require('../dist/index').default;
var transCheat  = require('../dist/util').trans;

var fs = require("fs"); 
var path = require("path"); 
  
var src = "../../port/libs/zrender-4.0.4/src";
var dst = '../../port/target/zrender-4.0.4-sciter';

if (!fs.existsSync(dst))
    fs.mkdirSync(dst);

var trans = [
    //{file: 'import', options: {}},
];


readDirSync(src) ;
function readDirSync(path){  
    console.log('Scanning directory : ' + path);
    var pa = fs.readdirSync(path);  

    pa.forEach(function(ele,index){  
        var info = fs.statSync(path+"/"+ele);

        if(info.isDirectory()){  
            //console.log("dir: "+ele); 
            readDirSync(path + "/" +ele);  
        } else {  
            //console.log("file: "+ele);
            if (ele.endsWith('.js'))
                trans.push({ dir : path, file : ele });
        }     
    }); 
}  

trans.forEach( function(transFile){
    console.log('Transforming : ' + transFile.dir + '/' + transFile.file);
    var transformedCode = transformFileSync(`${transFile.dir}/${transFile.file}`, {
        plugins: [[plugin, transFile.options]],
        babelrc: false // ignore babelrc
    }).code;

    transformedCode = transCheat(transformedCode);

    let subDir      = transFile.dir.replace(src + "/", "");
    let targetDir   = dst + '/' + subDir + '/';

    if ((subDir != src) && (subDir != "")) {
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
        }
    } else {
        targetDir   = dst + '/';
    }

    let targetFile = targetDir + transFile.file.replace(".js", ".tis");
    console.log('Traget file : ', targetFile);

    fs.writeFileSync(targetFile, transformedCode);
});
