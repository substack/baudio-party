# baudio-party

http server for javascript music parties

# example

Spin up the baudio-party server on a computer with speakers and
[sox](http://sox.sourceforge.net/) installed:

```
$ baudio-party
http://localhost:5000

-: (s2)

  Encoding: Signed PCM    
  Channels: 8 @ 16-bit   
Samplerate: 22050Hz      
Replaygain: off         
  Duration: unknown      

In:0.00% 00:00:10.26 [00:00:00.00] Out:452k  [      |      ]        Clip:0  
```

There are 8 empty channels by default:

```
$ curl -X GET http://localhost:5000
{
  "0": "function () { return 0 }",
  "1": "function () { return 0 }",
  "2": "function () { return 0 }",
  "3": "function () { return 0 }",
  "4": "function () { return 0 }",
  "5": "function () { return 0 }",
  "6": "function () { return 0 }",
  "7": "function () { return 0 }"
}
```

Upload a javascript snippet to a track with PUT:

```
$ curl -sST example/baseline.js http://localhost:5000/3
created audio channel 3
```

Read the source for a track with a GET:

```
$ curl http://localhost:5000/3
function (t, i) {
    // baseline
    var f = 800 * Math.pow(2, Math.floor(t * 4 % 4) / 6);
    return Math.sin(t * f * Math.PI)
        * Math.pow(Math.sin(t * 8 * Math.PI), 2)
    ;
}
```

Add more tracks with more PUTS.

To reset a track back to `return 0`, send a DELETE:

```
$ curl -X DELETE http://localhost:5000/3
deleted channel 3
```

To adjust the volume of a channel, send a POST:

```
$ curl -X POST -d volume=0.5 http://localhost:5000/3
```

# usage

```
usage : baudio-party

  -c, --channels   number of channels to use, default 8
  
  -r, --rate       bit rate to use, default 22050
  
  --port=PORT      port to listen on, default 5000
  
  -o FILE          record the audio stream to a file
```

# install

First install [sox](http://sox.sourceforge.net/).

Then with [npm](https://npmjs.org) do:

```
npm install -g baudio-party
```

# license

MIT
