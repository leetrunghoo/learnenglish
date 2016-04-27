var fs = require('fs'); // for writing file
var http = require('http'); // make simple http request
var mkdirp = require('mkdirp'); // make dir
var getDirName = require('path').dirname; // get dir name by dest param
var _ = require('lodash'); // for processing array

function download(url, dest, cb) {
    mkdirp(getDirName(dest), function(err) {
        if (err) {
            console.log(err);
            return cb(err);
        }

        var file = fs.createWriteStream(dest);
        var requestDownload = http.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close(cb); // close() is async, call cb after close completes.
            });
        }).on('error', function(err) { // Handle errors
            console.log('error!!', err);
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            if (cb) cb(err.message);
        });
    });
}

// read file then download
fs.readFile('app/data/listSounds.json', 'utf8', function(err, data) {
    if (err) throw err;
    var sounds = JSON.parse(data);
    console.log(sounds.data.length);

    var startTime = Date.now();
    runDownload(0);

    function runDownload(index) {
        var downloadFail = {
            list: []
        };
        if (index < sounds.data.length) {
            var linkSound = sounds.data[index].link;
            var dest = 'app/data/sounds/' + linkSound.replace('http://www.talkenglish.com/', '');
            download(linkSound, dest, function(err) {
                if (err) {
                    console.log('>>>>>>>>>> fail!', err);
                    downloadFail.list.push(linkSound);
                } else {
                    if (index === sounds.data.length - 1) {
                        var processTime = Date.now() - startTime;
                        console.log('Done! Process time: ' + processTime / 60000 + " mins");
                    } else {
                        console.log('downloaded: ', linkSound);
                        runDownload(++index);
                    }
                }
            });
        }
    }
});
