'use strict';

/**
 * @ngdoc function
 * @name myApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the myApp
 */

angular.module('myApp')
  .value('EXAMPLE', (function ($bot, $home) {  // example

    if ($bot.isAt($home)) {  // is at home
      $home.chargeBot(this);
      var l = $bot.unloadTo($home);
      if (l === 0 && $bot.S === $bot.mS) { // home base full, wait
        return;
      }
    } else if ($bot.S >= $bot.mS) {  // storage full
      $bot.moveTo($home);  // todo: check for stuck
      return;
    }

    var s = $bot.scan();
    var r = s[4];  // current position

    if (r.t === 'X' && $bot.S < $bot.mS) {  // is at mine
      $bot.mine();
    }

    var rr = [];
    for(var i = 0; i < s.length; i++) {
      r = s[i];
      if (r.t === 'X' && this.S < this.mS) {  // found a mine
        $bot.moveTo(r);
        return;
      } else if (r.t === '@' && this.S > 0) {  // found home
        $bot.moveTo(r);
        return;
      } else if (r.t !== '▲') {  // can't pass
        rr.push(r);
      }
    }

    if (rr.length > 0) {
      var j = Math.floor(Math.random()*rr.length);
      $bot.moveTo(rr[j]);
    }

  }).toString())
  .controller('MainCtrl', function ($scope, $interval, isAt, World, Bot, TILES, EXAMPLE) {

    var main = this;

    main.construct = function () { // TODO: move to bot class?
      var bot = new Bot('Rover', main.world, main.home.x, main.home.y);
      bot.code = EXAMPLE.substring(EXAMPLE.indexOf('{') + 1, EXAMPLE.lastIndexOf('}')); // todo: mopve to bot constructor?
      main.bots.push(bot);
      return bot;
    };

    main.setBot = function(index) {
      if (arguments.length < 1) {
        index = main.index;
      }
      main.index = index;
      bot = main.bot = main.bots[index];  // todo: rename main.bot -> main.curbot
      main.code = bot.code;
      main.manual = bot.manual;
      main.refresh++;
    };

    function getTile(x,y) {  // todo: create map directive
      var tile = main.world.get(x,y);
      if (tile !== null) {
        for(var i = 0; i < main.bots.length; i++) {
          var bot = main.bots[i];
          if (isAt(bot,x,y)) { return '<strong class="bot bot-'+bot.name+'">'+bot.t+'</strong>'; }
        }
        if (tile.s) { return '<span class="tile tile-'+tile.t+'">'+tile.t+'</span>'; }
      }
      return '&nbsp;';
    }

    main.draw = function() {  // todo: create map directive
      console.log('draw');

      var b = '';

      for(var i = 0; i < main.mapDisplaySize[1]; i++) {
        for(var j = 0; j < main.mapDisplaySize[0]; j++) {
          b += getTile(j+main.mapOffset[0],i+main.mapOffset[1]);
        }
        b += '\n';
      }

      return b;
    };

    main.relocate = function() { // TODO: collect bots first? move to bot class?
      //console.log('main.relocate');
      if (home.E >= 1000) {
        home.E -= 1000;
        main.world.generate();
        main.world.scan(home);
      }
    };

    main.upgradeBot = function(bot) {  // TODO: move to bot class?
      if (home.S >= 10) {
        home.S -= 10;
        bot.dE += 0.01;
        bot.mS += 1;
      }
    };

    // TODO: canMove, isHome, isFull

    main.isAtHome = function(bot) {  // TODO: move to bot class?
      bot = bot || main.bot;
      return (bot !== main.home) && isAt(bot, home);
    };

    main.canMine = function() {  // TODO: move to bot class?
      return main.world.get(bot.x,bot.y).t === TILES.MINE;
    };

    /* main.chargeBot = function(bot) {
      home.chargeBot(bot);
    };

    main.move = function(dx,dy) {
      bot = bot || main.bot;
      bot.move(dx,dy);
    };

    main.mine = function() {
      bot = bot || main.bot;
      bot.mine();
    };

    main.unloadBot = function(bot) {
      bot = bot || main.bot;
      bot.unloadTo(home);
    };

    main.scan = function() {
      bot = bot || main.bot;
      return bot.scan();
    }; */

    /* main.get = function(dx,dy) {
      dx = Math.sign(dx);  // Scan distance = 1
      dy = Math.sign(dy);

      var x = dx+bot.x;
      var y = dy+bot.y;

      if (isAt(home,x,y)) { return { t: TILES.BASE }; }
      return main.world.get(x,y);

    }; */

    main.toggleBot = function(bot) {
      bot = bot || main.bot;
      if (bot.manual) {
        bot.run();
      } else {
        bot.stop();
      }
    };

    main.canUnload = function(bot) {
      bot = bot || main.bot;
      if (isAt(bot,home) && bot.S > 0 && home.S < home.mS) {
        return true;
      }
      return false;
    };

    main.canCharge = function(bot) {
      bot = bot || main.bot;
      if (isAt(bot,home) && bot.E < bot.mE && home.E > 0) {
        return true;
      }
      return false;
    };

    main.canMineOrUnload = function(bot) {
      bot = bot || main.bot;
      return bot.canMine() || main.canUnload(bot) || main.canCharge(bot);
    };

    main.mineOrUnload = function(bot) {
      bot = bot || main.bot;
      if (isAt(bot,home)) {
        bot.unloadTo(home);
        home.chargeBot(bot);
      } else {
        bot.mine();
      }
    };

    main.keypress = function($event) {  // TODO: cheat code
      switch($event.keyCode) {
        case 113:
          bot.move(-1,-1);
          break;
        case 119:
          bot.move(0,-1);
          break;
        case 101:
          bot.move(1,-1);
          break;
        case 100:
          bot.move(1,0);
          break;
        case 97:
          bot.move(-1,0);
          break;
        case 122:
          bot.move(-1,1);
          break;
        case 120:
          bot.move(0,1);
          break;
        case 99:
          bot.move(1,1);
          break;
        case 115:
          main.mineOrUnload(bot);
          break;
      }

    };

    // Init

    main.refresh = 1;

    main.world = new World().generate();

    var home = main.home = new Bot('Base', main.world, 30, 10);
    home.E = 0;
    home.dE = 0.1;
    home.mE = 100;
    home.mS = 10;
    home.dEdX = 1000;
    home.t = TILES.BASE;

    main.bots = [home];

    main.world.scan(home);

    var bot = main.construct();
    main.setBot(1);

    main.mapDisplaySize = main.world.size;
    main.mapOffset = [0,0];  // TODO: focus on

    var dT = 1;

    $interval(function tick() {
      main.bots.forEach(function(_bot) {
        //bot = _bot; // hack
        _bot.takeTurn(dT, main);
      });
    }, dT*1000); // todo: make variable speed

  });
