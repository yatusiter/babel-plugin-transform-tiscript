include "./foo.tis";
namespace sciter__bar { include "./bar.tis" };
var bar = sciter__bar.sciter_default;
include "./derp.tis";
namespace sciter__qux { include "./qux.tis" };
var qux = sciter__qux.qux;
