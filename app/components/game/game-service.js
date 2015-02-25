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
.service('eprimeEcs', function(EcsFactory) {  // should not be here?
  return new EcsFactory();
})
.service('GAME', function($log, $localForage, eprimeEcs, World, Chunk, TILES, defaultScripts) {

  var GAME = this;  // todo: GAME === eprimeEcs

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

    /* var chunkData = {};
    angular.forEach(GAME.world.$$chunks, function(chunk, key) {
      chunkData[key] = {  // not sure why I need this, $localForage doesn't like typed arrays
        X: chunk.X,
        Y: chunk.Y,
        view: Array.prototype.slice.call(chunk.view)  //todo: better, convert to string?  // TODO: convert in ssCopy
      };
    }); */

    var G = {
      stats: ssCopy(GAME.stats),
      world: ssCopy(GAME.world),
      entities: eprimeEcs.entities.map(ssCopy),
      scripts: GAME.scripts.map(ssCopy),
      chunks: ssCopy(GAME.world.$$chunks)
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

      //eprimeEcs.entities.forEach(function(instance) {
      //  eprimeEcs.$$removeEntity(instance);
      //}); // hack, because starting base already created, fix by not calling reset

      //eprimeEcs.entities.splice(0,eprimeEcs.entities.length);
      //eprimeEcs.families.bot.splice(0,eprimeEcs.families.bot.length);

      G.entities.forEach(function(e) {
        //var bot = new Bot('', 0, 1, GAME);

        //angular.extend(_bot, {  // is it needed?
        //  $bot: {}
        //});

        //if (e.bot) {
        //  angular.extend(e.bot, { $game: GAME });  // eventually don't do this
        //}

        eprimeEcs.$e(e);

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

    eprimeEcs.$update(eprimeEcs.$interval);

    GAME.stats.turn++;
    if (GAME.stats.turn % 20 === 0) {  // only save if changed?  Move to different timer
      GAME.save();
    }
  };

  GAME.setup();

});

})();
