var Voice = require('voice/voice')
var Env   = require('voice/envelope')

var c = new Voice().octave(4);
var m = new Voice().octave(4).harmonic(3);
var e = new Env(0, 0.3, 0, 4);

var baudio = require('baudio');

return function (t, i) { 
    var ii = Math.floor(i % baudio.rate * (44100 / baudio.rate));
    c.t = ii;
    e.t = ii;
    return c.pitch(m.sample() * 48).sample()
        * e.sample()
        * 0.5
    ;
};
