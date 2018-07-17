namespace sciter_foo { include "foo.tis" };
var bar = sciter_foo.bar;
namespace sciter_foo { include "foo.tis" };
var bar2 = sciter_foo.bar2;
var baz = sciter_foo.baz;
namespace sciter_foo { include "foo.tis" };
var baz2 = sciter_foo.bar;
namespace sciter_foo { include "foo.tis" };
var baz3 = sciter_foo.bar;
var xyz = sciter_foo.xyz;


bar;
bar2;
baz;
baz2;
baz3;
xyz;
