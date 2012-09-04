var freqs = [
    0, 0, 1600, 1600,
    0, 0, 2000, 2000,
    0, 1400, 0, 1400,
    0, 1600, 0, 1800
];

return function (t, i) { 
    var f = freqs[Math.floor((t * 4) % freqs.length)];
    return Math.sin(t * Math.PI * f);
};
