var baudio = require('baudio');
var http = require('http');
var spawn = require('child_process').spawn;
var qs = require('querystring');

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
var sources = [];
var volumes = [];

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
    channels[ch] = fn;
    sources[ch] = src;
    if (!volumes[ch]) volumes[ch] = 1.0;
    cb();
}

for (var i = 0; i < argv.channels; i++) (function (i) {
    b.push(function () {
        return volumes[i] * channels[i].apply(this, arguments);
    });
    save(i, 'return ' + function () { return 0 });
})(i);

var server = http.createServer(function (req, res) {
    if (req.method === 'GET' && req.url === '/') {
        res.end(JSON.stringify(
            sources.reduce(function (acc, src, ix) {
                acc[ix] = String(src);
                return acc;
            }, {}),
            null, 
            2
        ) + '\n');
    }
    else if (req.method === 'GET') {
        var ch = Number(req.url.slice(1));
        res.setHeader('content-type', 'text/javascript');
        res.end(String(sources[ch]));
    }
    else if (req.method === 'POST') {
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
            
            if (params.volume) {
                volumes[ch] = Number(params.volume);
                res.end('set volume to ' + volumes[ch] + '\n');
            }
            else res.end('unknown parameters specified\n')
        });
    }
    else if (req.method === 'PUT') {
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
    }
    else if (req.method === 'DELETE') {
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
    }
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
