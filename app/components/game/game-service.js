/* global FPSMeter:true */

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
.factory('fpsmeter', function() {  // should be a directive
  var fpsmeter = new FPSMeter({ decimals: 0, graph: true, theme: 'dark', left: '5px', top: '30px' });
  fpsmeter.$hide = true;
  fpsmeter.hide();
  return fpsmeter;
})
.service('GAME', function($log, $localForage, debounce, ngEcs, World, Chunk, TILES, defaultScripts, fpsmeter, $modal) {

  var GAME = this;  // todo: GAME === ngEcs

  GAME.ecs = ngEcs;  // eventually GAME === ngEcs
  ngEcs.$interval = 0.1;
  GAME.dT = 1;

  GAME.scripts = angular.copy(defaultScripts);  // setup?

  function _nameOrTile(_) {
    return function(d) {
      d = d.bot;
      return d.t === _ || d.name === _;
    };
  }

  GAME.scanList = function(_) { // move?
    var bots = (!_) ? this.bots : this.bots.filter(_nameOrTile(_));
    var tiles = this.world.findTiles(_);
    return tiles.concat(bots);
  };

  GAME.findBotAt = function(_,x,y) {  // move
    var len = this.bots.length, fn = _nameOrTile(_);
    for (var i = 0; i < len; i++) {
      var bot = this.bots[i];
      if (fn(bot) && bot.bot.x === x && bot.bot.y === y) {
        return bot;
      }
    }
    return null;
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
        $log.debug('saveGame not found');
        return GAME.start();
      }

      $log.debug('game loaded',arguments);

      angular.copy(G.scripts, GAME.scripts);

      if (!G.entities || !G.world) {
        $log.debug('saveGame not found');
        return GAME.start();
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

      //console.log(GAME.bots);

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
    var home = ngEcs.$e({
      $bot: {},
      bot: {
        name: 'Base',
        x: 30,
        y: 10,
        E: 10,
        $game: GAME
      },
      action: {},
      render: {},
      active: true
    });

    GAME.bots = ngEcs.families.bot;  // get rid of this

    GAME.world.scanRange(home.bot, 2);

    var chunk = GAME.world.getChunk(home.bot.x, home.bot.y);

    if (chunk.get(home.bot.x, home.bot.y) === 'X') {  // hack until mines become entities
      chunk.set(home.bot.x, home.bot.y, TILES.FIELD);
    }

    return $modal.open({
      keyboard: false,
      backdrop: 'static',
      templateUrl: 'components/modals/start-model.html'
    }).result.then(function (ret) {
      GAME.tutorial = ret;
    });

  };

  ngEcs.$s('fpsMeter', {
    $update: function() {
      fpsmeter.tick();
    }
  });

  ngEcs.$s('saveGame', {
    interval: 60,
    $update: function() {
      $log.debug('game saved');
      GAME.save();
    }
  });

  /* ngEcs.$s('tick', {
    acc: 0,
    $update: function(dt) {
      fpsmeter.tick();

      this.acc += dt;
      if (this.acc < GAME.dT) { return; }
      this.acc = 0;
      GAME.stats.turn++;
    }
  }); */

  //GAME.takeTurn = function() {  // system
  //  ngEcs.$update(ngEcs.$interval);
  //};

  GAME.setup();

});

})();
