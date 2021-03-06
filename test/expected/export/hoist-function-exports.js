namespace sciter__evens { include "./evens.tis" };
var isEven = sciter__evens.isEven;

function nextOdd(n) {
  return isEven(n) ? (n + 1) : (n + 2);
}

var isOdd = function (isEven) {
  return function (n) {
    return !isEven(n);
  };
}(isEven);
