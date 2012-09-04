return function (t, i) {
    // baseline
    var f = 800 * Math.pow(2, Math.floor(t * 4 % 4) / 6);
    return Math.sin(t * f * Math.PI)
        * Math.pow(Math.sin(t * 8 * Math.PI), 2)
    ;
}
