(function() {

'use strict';

var TYPED_ARRAY_REGEXP = /^\[object (Uint8(Clamped)?)|(Uint16)|(Uint32)|(Int8)|(Int16)|(Int32)|(Float(32)|(64))Array\]$/;
function isTypedArray(value) {
  return TYPED_ARRAY_REGEXP.test(Object.prototype.toString.call(value));
}

// must start with object,
// skips keys that start with $
// navigates down objects but not other times (including arrays)
function ssCopy(src) { // copy objects removing $ props
  var dst = {};
  for (var key in src) {
    if (src.hasOwnProperty(key) && key.charAt(0) !== '$') {
      var s = src[key];
      if (angular.isObject(s) && !isTypedArray(s) && !angular.isArray(s) && !angular.isDate(s)) {
        dst[key] = ssCopy(s);
      } else if (typeof s !== 'function') {
        dst[key] = s;
      }
    }
  }
  return dst;
}

angular.module('ePrime')
.service('GAME', function($log, $localForage, debounce, ngEcs, World, Chunk, TILES, defaultScripts) {

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
      entities: ssCopy(ngEcs.entities),
      scripts: GAME.scripts.map(ssCopy),
      //chunks: ssCopy(GAME.world.$$chunks)  // todo: entities?
    };

    //localStorageService.set('saveGame', G);
    return $localForage.setItem('saveGame', G).then(function() {
      GAME.stats.saved = new Date();
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

      //GAME.world.$$chunks = {};
      //angular.forEach(G.chunks, function(chunk, key) {  // todo: make Chunk a component
      //   GAME.world.$$chunks[key] = new Chunk(chunk.view, chunk.X, chunk.Y);
      //});

      angular.forEach(G.entities, function(value, key) {
        ngEcs.$e(key, value);
      });

      //G.entities.forEach(ngEcs.$e, ngEcs);

      GAME.bots = GAME.ecs.families.bot;　　// get rid

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
      start: new Date(),
      saved: new Date()
    };

    return GAME;

  };

  GAME.start = function() {

    var home = GAME.ecs.$e({
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
      },
      active: true
    });

    GAME.bots = GAME.ecs.families.bot;  // get rid of this

    GAME.world.scanRange(home.bot);

    var chunk = GAME.world.getChunk(home.bot.x, home.bot.y);

    if (chunk.get(home.bot.x, home.bot.y) === 'X') {  // hack until mines become entities
      chunk.set(home.bot.x, home.bot.y, TILES.FIELD);
    }

    return GAME;

  };

  //var apply = debounce(function () {
    // Do things here.
  //}, 100);

  ngEcs.$s('turn', {
    $update: function() {
      GAME.stats.turn++;

      if (GAME.stats.turn % 20 === 0) {  // Move to different timer?
        GAME.save();
      }

    }
  });

  //GAME.takeTurn = function() {  // system
  //  ngEcs.$update(ngEcs.$interval);
  //};

  GAME.setup();

});

})();
