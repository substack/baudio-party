var Voice = require('voice/voice')
var Env   = require('voice/envelope')

var c = new Voice().octave(4);
var m = new Voice().octave(4).harmonic(3);
var e = new Env(0, 0.3, 0, 4);

return function (t, i) { 
    var ii = Math.floor(i % 8000 * (44100 / 8000));
    c.t = ii;
    e.t = ii;
    return c.pitch(m.sample() * 48).sample()
        * e.sample()
        * 0.5
    ;
};
