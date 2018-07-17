Plugin Usage
======
0. install npm 

1. init npm packages
```
npm install 
```

2.Modify transform.js

#change diretory of plugin and target library

``` change diretory of plugin
var plugin      = require('../babel-plugin-transform-tiscript/dist/index').default;
var transCheat  = require('../babel-plugin-transform-tiscript/dist/util').trans;

var src = "../../port/libs/zrender-4.0.4/src";
var dst = '../../port/target/zrender-4.0.4-sciter';
```

2. Modify transform.js

3. Execute run.bat/run.sh
