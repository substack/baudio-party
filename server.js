#!/usr/bin/env node

var baudio = require('baudio');
var http = require('http');
var spawn = require('child_process').spawn;
var qs = require('querystring');
var filed = require('filed');

var argv = require('optimist')
    .alias('channels', 'c')
    .default('channels', 8)
    .alias('rate', 'r')
    .default('rate', 8000)
    .argv
;
var fs = require('fs');
if (argv.h || argv.help) {
    return fs.createReadStream(__dirname + '/usage.txt')
        .pipe(process.stdout)
    ;
}

var vm = require('vm');
var deepFreeze = require('deep-freeze');
var clone = require('clone');

var context = deepFreeze(clone({
    Buffer : Buffer
}));

var baudio = require('baudio');

var b = baudio({ rate : argv.rate });

var channels = [];

function save (ch, src, cb) {
    if (!cb) cb = function () {};
    
    try {
        var fn = vm.runInNewContext(
            '(function () {' + src + '})()',
            context
        );
    }
    catch (err) {
        return cb(String(err));
    }
    if (!channels[ch]) channels[ch] = {};
    channels[ch].cb = fn;
    channels[ch].source = src;
    if (!channels[ch].volume) channels[ch].volume = 1.0;
    if (!channels[ch].offset) channels[ch].offset = 0;
    cb();
}

for (var i = 0; i < argv.channels; i++) (function (i) {
    b.push(function (t, counter) {
        var to = (channels[i].offset || 0) + t;
        channels[i].t = t;
        return channels[i].volume * channels[i].cb.call(this, to, counter);
    });
    save(i, 'return ' + function () { return 0 });
})(i);

var server = http.createServer();

server.on('request', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
});

server.on('request', function (req, res) {
    if (req.method === 'GET' && req.url === '/') {
        res.write('# channels\n\n');
        res.write(JSON.stringify(channels.reduce(function (acc, ch, id) {
            acc[id] = ch.source === 'return function () { return 0 }'
                ? '[empty]'
                : '[...]'
            ;
            return acc;
        }, {}), null, 2) + '\n\n');
        
        fs.createReadStream(__dirname + '/api.txt').pipe(res);
    }
});

server.on('request', function (req, res) {
    if (req.method === 'GET' && req.url === '/readme') {
        filed(__dirname + '/readme.markdown').pipe(res);
    }
});

server.on('request', function (req, res) {
    if (req.method !== 'GET' || req.url !== '/channels') return;
    res.end(JSON.stringify(
        channels.reduce(function (acc, ch, ix) {
            acc[ix] = String(ch.source);
            return acc;
        }, {}),
        null, 
        2
    ) + '\n');
});

server.on('request', function (req, res) {
    if (req.method !== 'GET' || !/^\/(\d+)/.test(req.url)) return;
    var ch = Number(req.url.slice(1));
    res.setHeader('content-type', 'text/javascript');
    res.end(String(channels[ch].source));
});

server.on('request', function (req, res) {
    if (req.method !== 'POST') return;
    var ch = Number(req.url.split('/')[1]);
    if (!channels[ch]) {
        res.statusCode = 400;
        res.end('no such channel ' + ch + '\n');
        return;
    }
    
    var data = '';
    req.on('data', function (buf) { data += buf });
    
    req.on('end', function () {
        var params = qs.parse(data);
        
        var matched = false;
        
        if (params.volume) {
            channels[ch].volume = Number(params.volume);
            res.write('set volume to ' + channels[ch].volume + '\n');
            matched = true;
        }
        
        if (params.offset) {
            var offset = Number(params.offset);
            channels[ch].offset = offset - channels[ch].t;
            res.write('set offset to ' + offset + '\n');
            matched = true;
        }
        
        if (!matched) res.end('unknown parameters specified\n')
        else res.end()
    });
});

server.on('request', function (req, res) {
    if (req.method !== 'PUT') return;
    var ch = Number(req.url.slice(1));
    
    var src = '';
    req.on('data', function (buf) { src += buf });
    req.on('end', function () {
        save(ch, src, function (err) {
            if (err) {
                res.statusCode = 400;
                res.end(String(err));
                return;
            }
            res.end('created audio channel ' + ch + '\n');
        });
    });
});

server.on('request', function (req, res) {
    if (req.method !== 'DELETE') return;
    var ch = Number(req.url.slice(1));
    if (!channels[ch]) {
        res.statusCode = 404;
        res.end('channel ' + ch + ' not available\n');
        return;
    }
    var src = 'return ' + function () { return 0 };
    save(ch, src, function (err) {
        if (err) res.end(err)
        else res.end('deleted channel ' + ch + '\n')
    });
});

var port = argv.port || 5000;
console.log('http://localhost:' + port);
server.listen(port);

var ps = b.play({ buffer : 512 });
ps.stdout.pipe(process.stdout, { end : false });
ps.stderr.pipe(process.stderr, { end : false });

if (argv.o) {
    b.record(argv.o, { buffer : 512 });
}
