(function() {

'use strict';

function ssCopy(src) { // shallow copy
  var dst = {};
  for (var key in src) {
    if (src.hasOwnProperty(key) && key.charAt(0) !== '$') {
      var s = src[key];
      if (typeof s === 'object') {
        dst[key] = ssCopy(s);
      } else if (typeof s !== 'function') {
        dst[key] = s;
      }
    }
  }
  return dst;
}

angular.module('ePrime')
.service('eprimeEcs', function(EcsFactory) {  // should not be here?
  return new EcsFactory();
})
.service('GAME', function($log, $localForage, eprimeEcs, World, Chunk, TILES, defaultScripts) {

  var GAME = this;

  GAME.ecs = eprimeEcs;

  GAME.scripts = angular.copy(defaultScripts);

  GAME.scanList = function(_) { // move.

    function _nameOrTile(d) {
      return d.bot.t === _ || d.bot.name === _;
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
      stats: ssCopy(GAME.stats),
      world: ssCopy(GAME.world),
      bots: GAME.bots.map(ssCopy),
      scripts: GAME.scripts.map(ssCopy),
      chunks: chunkData
    };

    //console.log('save', G);

    //localStorageService.set('saveGame', G);
    return $localForage.setItem('saveGame', G).then(function() {
      $log.debug('saved');
    });

    //console.log(angular.toJson(G));
  };

  GAME.load = function() {

    return $localForage.getItem('saveGame').then(function(G) {  // trap errors
      if (!G) {
        return $log.debug('saveGame not found');
      }

      $log.debug('game loaded',arguments);

      angular.copy(G.scripts, GAME.scripts);
      if (!G.world) { return; }

      angular.extend(GAME.world, G.world);

      angular.copy(G.scripts, GAME.scripts);
      angular.extend(GAME.stats,G.stats);

      GAME.world.$$chunks = {};
      angular.forEach(G.chunks, function(chunk, key) {
         GAME.world.$$chunks[key] = new Chunk(chunk.view, chunk.X, chunk.Y);
      });

      GAME.bots.splice(0,GAME.bots.length);
      G.bots.forEach(function(_bot) {
        //var bot = new Bot('', 0, 1, GAME);

        angular.extend(_bot, {
          $bot: {}
        });

        angular.extend(_bot.bot, { $game: GAME });

        GAME.ecs.$e(_bot);

        //bot.$game = GAME;
        //bot.update();
      });

    });

  };

  GAME.clear = function() {

    var G = {
      scripts: GAME.scripts.map(ssCopy)
    };

    return $localForage.setItem('saveGame', G);
  };

  GAME.reset = function setup() {

    if (GAME.world) {
      GAME.world.$$chunks = {};
    } else {
      GAME.world = new World(60);
    }

    //GAME.world = new World(60);
    //console.log(GAME.world);

    //var home = new Bot('Base', 30, 10, GAME);
    var home = GAME.ecs.$e({
      name: 'Base',
      x: 30,
      y: 10,
      $bot: {},
      bot: {
        name: 'Base',
        x: 30,
        y: 10,
        S: 100,
        mS: 100,
        E: 100,
        mE: 100,
        t: TILES.BASE,
        $game: GAME
      }
    });
    //home.name = 'Base';
    //home.x = 30;
    //home.y = 10;

    //home.$game = GAME;

    //home.active = true;
    //home.scriptName = 'Construct'; // todo: only key
    //home.manual = true;
    //home.S = home.mS = 100;  //enough for first bot
    //home.E = home.mE = 100;
    //home.t = TILES.BASE;
    //home.update();

    console.log(home);

    GAME.bots = GAME.ecs.entities;

    GAME.world.scanRange(home);
    if (GAME.world._get(home.bot.x, home.bot.y) === 'X') {  // hack untill mines become entities
      GAME.world._set(home.bot.x, home.bot.y, TILES.FIELD);
    }

    //var bot = home.construct('Collect');
    //bot.active = true;

    //GAME.E = 0;  // todo: create stats object
    //GAME.S = 0;
    //GAME.turn = 0;
    //GAME.start = new Date();

    GAME.stats = GAME.ecs.stats = {
      E: 0,
      S: 0,
      turn: 0,
      start: new Date()
    };

    return GAME;

  };

  GAME.takeTurn = function() {  // system

    eprimeEcs.$update(eprimeEcs.$interval);

    GAME.stats.turn++;
    if (GAME.stats.turn % 20 === 0) {  // only save if changed?  Move to different timer
      GAME.save();
    }
  };

  GAME.reset();
  //Bot.setGame(GAME);

});

})();
