(function() {

'use strict';

function ssCopy(src) { // shallow copy
  var dst = {};
  for (var key in src) {
    if (src.hasOwnProperty(key) && key.charAt(0) !== '$') {
      var s = src[key];
      if (s instanceof Uint8ClampedArray) {
        dst[key] = Array.prototype.slice.call(s);  // $localForage doesn't like typed arrays
      } else if (typeof s === 'object') {
        dst[key] = ssCopy(s);
      } else if (typeof s !== 'function') {
        dst[key] = s;
      }
    }
  }
  return dst;
}

angular.module('ePrime')
.service('GAME', function($log, $localForage, ngEcs, World, Chunk, TILES, defaultScripts) {

  var GAME = this;  // todo: GAME === ngEcs

  GAME.ecs = ngEcs;  // eventually GAME === ngEcs

  GAME.scripts = angular.copy(defaultScripts);  // setup?

  GAME.scanList = function(_) { // move?

    function _nameOrTile(d) {
      return d.bot.t === _ || d.bot.name === _;
    }

    var bots = (!_) ? this.bots : this.bots.filter(_nameOrTile);
    var tiles = this.world.scanList(_);
    return tiles.concat(bots);
  };

  GAME.save = function() {

    var G = {  // eventually G = ssCopy(GAME);
      stats: ssCopy(GAME.stats),
      world: ssCopy(GAME.world),
      entities: ngEcs.entities.map(ssCopy),
      scripts: GAME.scripts.map(ssCopy),
      chunks: ssCopy(GAME.world.$$chunks)  // todo: entities?
    };

    //localStorageService.set('saveGame', G);
    return $localForage.setItem('saveGame', G).then(function() {
      $log.debug('saved');
    });

  };

  GAME.load = function() {

    return $localForage.getItem('saveGame').then(function(G) {  // trap errors
      if (!G) {
        GAME.start();
        return $log.debug('saveGame not found');
      }

      $log.debug('game loaded',arguments);

      angular.copy(G.scripts, GAME.scripts);

      if (!G.entities || !G.world) {
        GAME.start();
        return $log.debug('saveGame not found');
      }

      angular.extend(GAME.world, G.world);
      angular.extend(GAME.stats, G.stats);

      GAME.world.$$chunks = {};
      angular.forEach(G.chunks, function(chunk, key) {  // todo: make Chunk a component
         GAME.world.$$chunks[key] = new Chunk(chunk.view, chunk.X, chunk.Y);
      });

      G.entities.forEach(ngEcs.$e, ngEcs);

      console.log(ngEcs.entities);

    });

  };

  GAME.clear = function() {
    return $localForage.setItem('saveGame', {  // save only scripts
      scripts: GAME.scripts.map(ssCopy)
    });
  };

  GAME.setup = function() {

    if (GAME.world) {
      GAME.world.$$chunks = {};
    } else {
      GAME.world = new World(60);
    }

    GAME.stats = GAME.ecs.stats = {
      E: 0,
      S: 0,
      turn: 0,
      start: new Date()
    };

    GAME.bots = GAME.ecs.entities = [];

    return GAME;

  };

  GAME.start = function() {

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

    GAME.bots = GAME.ecs.entities;  // todo: remove this

    GAME.world.scanRange(home);
    if (GAME.world._get(home.bot.x, home.bot.y) === 'X') {  // hack until mines become entities
      GAME.world._set(home.bot.x, home.bot.y, TILES.FIELD);
    }

    return GAME;

  };

  GAME.takeTurn = function() {  // system

    ngEcs.$update(ngEcs.$interval);

    GAME.stats.turn++;
    if (GAME.stats.turn % 20 === 0) {  // only save if changed?  Move to different timer
      GAME.save();
    }

  };

  GAME.setup();

});

})();
