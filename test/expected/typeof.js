var parsePercent = function (value, maxValue) {
    if (typeof value === #string) {
        if (value.lastIndexOf("%") >= 0) {
            return (parseFloat(value) / 100) * maxValue;
        }
        return parseFloat(value);
    }
    return value;
};

typeof value === #string;
typeof value === #object;
typeof value === #function;
typeof value === undefined;
typeof value === #array;
typeof value !== #string;
typeof value !== #object;
typeof value !== #function;
typeof value !== undefined;
typeof value !== #array;
