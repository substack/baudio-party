var n = 0;
return function (t, i) {
    if (i % 10 === 0) n = Math.random();
    
    return t * 2 % 1/16 < 1/256
        || (t * 2 / 32) % 1/16 < 1 / 256
        || (t * 2 / 32) % 1/16 < 1 / 256
        ? n : 0
    ;
};
