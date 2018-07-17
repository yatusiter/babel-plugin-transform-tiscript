function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
assert(condition, message);
var ArrayCtor = (typeof Float32Array === undefined) ? Array : Float32Array;
var ArrayCtor = (typeof Int8Array === undefined) ? Array : Int8Array;
var ArrayCtor = (typeof Uint8Array === undefined) ? Array : Uint8Array;
var ArrayCtor = (typeof Uint16Array === undefined) ? Array : Uint16Array;
var ArrayCtor = (typeof Int16Array === undefined) ? Array : Int16Array;
var ArrayCtor = (typeof Int32Array === undefined) ? Array : Int32Array;
var ArrayCtor = (typeof Uint32Array === undefined) ? Array : Uint32Array;
var ArrayCtor = (typeof Float64Array === undefined) ? Array : Float64Array;
