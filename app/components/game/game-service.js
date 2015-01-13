'use strict';

angular.module('myApp')
.service('GAME', function(World, Bot, TILES, defaultScripts) {
  var GAME = this;

  GAME.scripts = defaultScripts;

  GAME.scanList = function() {
    return this.world.scanList().concat(this.bots);
  };

  function setup() {
    GAME.world = new World().generate(60,30);

    var home = new Bot('Base', 20, 10, GAME);
    home.code = defaultScripts.Upgrade; // todo: only key
    home.S = 100;
    home.E = 0;
    home.dE = 0.1;
    home.mE = 100;
    home.mS = 100;
    home.dEdX = 1000;
    home.t = TILES.BASE;

    GAME.world.get(home).t = TILES.FIELD;  // base must be on plain

    GAME.bots = [home];

    GAME.world.scan(home);

    var bot = home.construct();

    GAME.bots = [home, bot];

  }

  setup();

});
