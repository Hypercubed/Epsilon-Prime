(function() {

'use strict';

function mezclar2(arr) {  // fast shuffle
  for (var i, tmp, n = arr.length; n; i = Math.floor(Math.random() * n), tmp = arr[--n], arr[n] = arr[i], arr[i] = tmp) {}
  return arr;
}

function ssCopy(src) { // shallow copy
  var dst = {};
  for (var key in src) {
    if (src.hasOwnProperty(key) && key.charAt(0) !== '$') {
      dst[key] = src[key];
    }
  }
  return dst;
}

angular.module('myApp')
.service('GAME', function($log, $localForage, World, Bot, Chunk, TILES, defaultScripts) {

  var GAME = this;

  GAME.scripts = defaultScripts;

  GAME.scanList = function(_) {

    function _nameOrTile(d) {
      return d.t === _ || d.name === _;
    }

    var bots = (!_) ? this.bots : this.bots.filter(_nameOrTile);
    var tiles = this.world.scanList(_);
    return tiles.concat(bots);
  };

  GAME.save = function() {

    var chunkData = {};
    angular.forEach(GAME.world.$$chunks, function(chunk, key) {
      chunkData[key] = {  // not sure why I need this, $localForage doesnt like typed arrays
        X: chunk.X,
        Y: chunk.Y,
        view: Array.prototype.slice.call(chunk.view)  //todo: better, convert to string?
      };
    });

    var G = {
      T: GAME.turn,
      E: GAME.E,
      S: GAME.S,
      start: GAME.start,
      stats: ssCopy(GAME.stats),
      world: ssCopy(GAME.world),
      bots: GAME.bots.map(ssCopy),
      scripts: GAME.scripts.map(ssCopy),
      chunks: chunkData
    };

    //localStorageService.set('saveGame', G);
    return $localForage.setItem('saveGame', G).then(function() {
      $log.debug('saved');
    });

    //console.log(angular.toJson(G));
  };

  GAME.load = function() {

    return $localForage.getItem('saveGame').then(function(G) {
      if (!G) { return console.log('saveGame not found'); }

      $log.debug('game loaded',arguments);

      angular.extend(GAME.world, G.world);

      angular.copy(G.scripts, GAME.scripts);
      angular.copy(G.stats, GAME.stats);

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



    });

  };

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

    //GAME.E = 0;  // todo: create stats object
    //GAME.S = 0;
    //GAME.turn = 0;
    //GAME.start = new Date();

    GAME.stats = {
      E: 0,
      S: 0,
      turn: 0,
      start: new Date()
    }

    return GAME;

  };

  GAME.takeTurn = function() {
    mezclar2(GAME.bots.slice(0)).forEach(function(_bot) {
      _bot.takeTurn(1);
    });
    GAME.stats.turn++;
    if (GAME.stats.turn % 20 === 0) {  // only save if changed?  Move to different timer
      GAME.save();
    }
  };

  GAME.reset();

});

})();
