#!/usr/bin/env node

var http = require('http');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var url = process.argv[2];
var theme = process.argv[3];

(function(){

  function getCNAME(cb){
    fs.readFile(path.resolve() + '/CNAME', 'utf8', function(err, data){
      // if(err) return false;
      if(data) {
        console.log('––––––––––––––––––––––––––')
        console.log('       Using CNAME       ');
        var CNAME = data.split('\n');
        if(CNAME[0]){ url = CNAME[0]; }
        if(CNAME[1]){ theme = CNAME[1]; }
      }
      cb();
    });
  }

  function getRemote(){
    if(process.argv.find(arg => arg === '-a' || arg === '--auto')){
      var fullDir = path.resolve().split(path.sep)
      var currDir = fullDir[fullDir.length -1]

      theme = currDir
      url = theme + '.thrv.xyz'

      console.log('url: ' + url)
      console.log('themeDir: ' + theme)
    }

    getCNAME(function(){
      if(!url || !theme){
        return console.log('revcheck <site-url> <theme-folder> [--auto|-a]')
      }
      if(url.indexOf('http') < 0 ){
        url = 'http://' + url;
      }

      http.get(url + '/wp-content/themes/' + theme + '/VERSION', function(res){
        res.setEncoding('utf8');
        var str = '';
        res.on('data', function(chunk){
          str += chunk;
        });
        res.on('end', function(){

          var local = getLocal(str);

        });
        res.resume();
      }).on('error', function(e) {
        console.log('Got error: ' + e.message);
      });

    });

  }

  function getLocal(remote){
    fs.readFile(path.resolve() + '/.git/refs/heads/master', 'utf8', function(err, data){
      if(err) console.log(err);
      if(data) {
        var local = data.substr(0, 7)
        if(local.trim() == remote.trim()){

          console.log('––––––––––––––––––––––––––')
          console.log('    all up to date 😁   ')
          console.log('––––––––––––––––––––––––––')

        } else if(remote.trim().length < 10 ) {
          console.log('–––––––––––––')
          console.log('mismatch 🤔')
          console.log('local: ' + local.trim())
          console.log('remote: ' + remote.trim())
          console.log('trying again...')
          setTimeout(function(){
            getRemote()
          }, 5000)
        } else {

          console.log('––––––––––––––––––––––––––')
          console.log('    CRAZY ERROR!!!!! 😦   ')
          console.log('––––––––––––––––––––––––––')

        }
      }
    })
  }

  if(process.argv.find(arg => arg === 'push' )){
    var gp = spawn('git', ['push']);
    gp.stdout.on('data', (data) => {
      console.log(`${data}`);
    });
    gp.stderr.on('data', (data) => {
      console.log(`${data}`);
    });
    gp.on('close', (code) => {
      getRemote();
    });

  } else {
    getRemote()
  }


})();
