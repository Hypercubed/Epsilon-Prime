'use strict';

angular.module('myApp')
.service('GAME', function(World, Bot, TILES, defaultScripts) {
  var GAME = this;

  GAME.scripts = defaultScripts;

  GAME.scanList = function() {
    return this.world.scanList().concat(this.bots);
  };

  function setup() {
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

  setup();

});
