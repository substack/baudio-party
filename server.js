var baudio = require('baudio');
var http = require('http');
var spawn = require('child_process').spawn;

var vm = require('vm');
var baudio = require('baudio');

var b = baudio();
var channels = [];
for (var i = 0; i < 4; i++) (function (i) {
    b.push(function () {
        return channels[i].apply(this, arguments);
    });
    channels.push(function () { return 0 });
})(i);

var server = http.createServer(function (req, res) {
    if (req.method === 'PUT') {
        var ch = Number(req.url.slice(1));
        
        var src = '';
        req.on('data', function (buf) { src += buf });
        req.on('end', function () {
            try {
                var fn = vm.runInNewContext(
                    '(function () {' + src + '})()'
                );
            }
            catch (err) {
                res.statusCode = 400;
                res.end(String(err));
            }
            channels[ch] = fn;
            
            res.end(
                'created audio channel '
                + (b.channels.length - 1)
                + '\n'
            );
        });
    }
});
server.listen(5000);

var ps = b.play();
ps.stdout.pipe(process.stdout, { end : false });
ps.stderr.pipe(process.stderr, { end : false });
