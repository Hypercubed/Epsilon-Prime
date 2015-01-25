(function() {

'use strict';

function mezclar2(arr) {  // fast shuffle
  for (var i, tmp, n = arr.length; n; i = Math.floor(Math.random() * n), tmp = arr[--n], arr[n] = arr[i], arr[i] = tmp) {}
  return arr;
}

angular.module('myApp')
.service('GAME', function($log, $localForage, World, Bot, Chunk, TILES, defaultScripts) {

  var GAME = this;

  GAME.scripts = defaultScripts;

  GAME.scanList = function() {
    return this.world.scanList().concat(this.bots);
  };

  GAME.save = function() {

    var chunkData = {};
    angular.forEach(GAME.world.$$chunks, function(chunk, key) {
      chunkData[key] = {  // not sure why I need this, $localForage doesnt like typed arrays
        X: chunk.X,
        Y: chunk.Y,
        view: Array.prototype.slice.call(chunk.view)  //todo: better, convert to string?
      }
    });

    //console.log(chunkData);

    var bots = GAME.bots.map(ssCopy);
    //console.log(bots);

    //console.log(chunkData);

    function ssCopy(src) {

      var dst = {};
      for (var key in src) {
        if (src.hasOwnProperty(key) && !(key.charAt(0) === '$')) {
          dst[key] = src[key];
        }
      }

      return dst;
    }

    var G = {
      T: GAME.turn,
      E: GAME.E,
      S: GAME.S,
      world: ssCopy(GAME.world),
      bots: bots,
      scripts: GAME.scripts,
      chunks: chunkData
    }

    //localStorageService.set('saveGame', G);
    return $localForage.setItem('saveGame', G).then(function() {
      $log.debug('saved');
    });

    //console.log(angular.toJson(G));
  }

  /* function ab2str(arr) {
    return String.fromCharCode.apply(null, arr);
  }

  function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  } */

  GAME.load = function() {

    return $localForage.getItem('saveGame').then(function(G) {
      if (!G) { return console.log('saveGame not found'); }

      $log.debug('game loaded',arguments);

      angular.extend(GAME.world, G.world);

      GAME.world.$$chunks = {};
      angular.forEach(G.chunks, function(chunk, key) {
         GAME.world.$$chunks[key] = new Chunk(chunk.view, chunk.X, chunk.Y);
      });

      G.bots.forEach(function(_bot, i) {
        var bot = GAME.bots[i];
        if (!bot) {
          bot = new Bot('', 0, 1, GAME);
          GAME.bots.push(bot);
        }
        angular.extend(bot, _bot);
      });

      //console.log(GAME.bots);

      angular.copy(G.scripts, GAME.scripts);

      GAME.E = G.E;
      GAME.S = G.S;
      GAME.turn = G.T;
    });

  }

  GAME.clear = function() {
    return $localForage.clear();
  };

  GAME.reset = function setup() {

    if (GAME.world) {
      GAME.world.$$chunks = {};
    } else {
      GAME.world = new World(60);
    }

    //GAME.world = new World(60);
    //console.log(GAME.world);

    var home = new Bot('Base', 30, 10, GAME);
    home.scriptName = 'Construct'; // todo: only key
    home.manual = false;
    home.S = 100;  //enough for first bot
    home.E = 0;
    home.dE = 0.1;
    home.mE = 100;
    home.mS = 100;
    home.dEdX = 1000;
    home.t = TILES.BASE;

    GAME.bots = [home];

    GAME.world.scanRange(home);

    var bot = home.construct('Collect');
    bot.active = true;

    GAME.E = 0;  // todo: create stats object
    GAME.S = 0;
    GAME.turn = 0;

    return GAME;

  }

  GAME.takeTurn = function() {
    mezclar2(GAME.bots.slice(0)).forEach(function(_bot) {
      _bot.takeTurn(1);
    });
    GAME.turn++;
    if (GAME.turn % 20 === 0) {  // only save if changed?
      GAME.save();
    }
  }

  GAME.reset();

});

})();
