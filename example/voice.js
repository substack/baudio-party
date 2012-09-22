var Voice = require('voice/voice')
var Env   = require('voice/envelope')

var c = new Voice().octave(4);
var m = new Voice().octave(4).harmonic(3);
var e = new Env(0, 0.3, 0, 4);

var baudio = require('baudio');
var length = 1;
var bucket = length;

return function (t, i) { 
    bucket -= 1 / baudio.rate;
    if (bucket < 0) {
        c.t = 0;
        e.t = 0;
        bucket = length;
    }
    
    return c.pitch(m.sample() * 48).sample()
        * e.sample()
        * 0.5
    ;
};
