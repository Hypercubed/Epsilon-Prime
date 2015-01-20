'use strict';

angular.module('myApp')
.service('GAME', function(World, Bot, TILES, defaultScripts, localStorageService) {
  var GAME = this;

  GAME.scripts = defaultScripts;

  GAME.scanList = function() {
    return this.world.scanList().concat(this.bots);
  };

  GAME.save = function() {

    var G = {
      world: GAME.world,
      bots: GAME.bots,
      scripts: GAME.scripts
    }

    localStorageService.set('saveGame', G);

    //console.log(angular.toJson(G));
  }

  function ab2str(arr) {
    return String.fromCharCode.apply(null, arr);
  }

  function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  GAME.load = function() {

    var G = localStorageService.get('saveGame');

    angular.extend(GAME.world, G.world);

    G.bots.forEach(function(_bot, i) {
      var bot = GAME.bots[i];
      if (!bot) {
        bot = new Bot('', 0, 1, GAME);
        GAME.bots.push(bot);
      }
      angular.extend(bot, _bot);
    });

    console.log(GAME.bots);

    angular.extend(GAME.scripts, G.scripts);

    //console.log(angular.toJson(G));
  }

  GAME.reset = function setup() {
    GAME.world = new World(60);

    var home = new Bot('Base', 30, 10, GAME);
    home.code = defaultScripts.Upgrade; // todo: only key
    home.S = 100;
    home.E = 0;
    home.dE = 0.1;
    home.mE = 100;
    home.mS = 100;
    home.dEdX = 1000;
    home.t = TILES.BASE;

    //GAME.world.get(home).t = TILES.FIELD;  // todo: make sure home is on plain

    GAME.bots = [home];

    GAME.world.scanRange(home);

    var bot = home.construct();

    GAME.bots = [home, bot];

    GAME.E = 0;
    GAME.S = 0;

  }

  GAME.reset();

});
