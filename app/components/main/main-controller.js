/* global _F:true */
/* global d3:true */

(function() {

'use strict';

angular.module('myApp')
  .controller('MainCtrl', function ($scope, $log, $route, $window, $timeout, $modal, hotkeys, modals, debug, isAt, TILES, GAME) {

    var main = this;

    main.drawWatch = function drawWatch() {  // Move to GAME? Creates a fast hash of maps state.  Most tiles don't change. Better to use events?

      var s = ''+GAME.world.getHash();

      var ke = GAME.bots.length;  // do better, move to GAME service
      //var ws = GAME.world.size;
      for(var k = 0; k < ke; k++) {
        var bot = GAME.bots[k];
        var index = GAME.world.getIndex(bot);
        s += bot.t+index+(bot === main.bot ? '!' : '');
      }

      return s;
    };

    var grid = new d3.charts.Grid();

    function d3Draw() {
      $log.debug('d3 draw');

      var tiles = GAME.world.scanList();  // todo: chunk
      var bots = GAME.bots;

      d3.select('#grid').datum([tiles,bots]).call(grid);
    }

    $scope.$watch(main.drawWatch, d3Draw); // don't do this

    main.upgradeBot = function(bot) {  // TODO: delete
      bot.upgrade();
    };

    // TODO: canMove, isHome, isFull

    main.isAtHome = function(bot) {  // TODO: move to bot class? used?
      bot = bot || main.bot;
      return (bot !== main.home) && isAt(bot, main.bots[0]);
    };

    main.canMine = function(bot) {  // TODO: move to bot class?  used?
      bot = bot || main.bot;
      return GAME.world.get(bot.x,bot.y).t === TILES.MINE;
    };

    main.toggleBot = function(bot, flag) {
      if (arguments.length < 2) {
        flag = bot.manual;
      }
      bot = bot || main.bot;
      if (flag) {
        bot.run();
      } else {
        bot.stop();
      }
    };

    main.canUnload = function(bot) {
      bot = bot || main.bot;
      return isAt(bot,main.home) && bot.S > 0 && main.home.S < main.home.mS;  // ??
    };

    main.canCharge = function(bot) {
      bot = bot || main.bot;
      return isAt(bot,main.home) && bot.E < bot.mE && main.home.E > 0;
    };

    main.canMineOrUnload = function(bot) {
      bot = bot || main.bot;
      return bot.canMine() || main.canUnload(bot) || main.canCharge(bot);
    };

    main.mineOrUnload = function(bot) {
      bot = bot || main.bot;
      if (isAt(bot,main.home)) {
        bot.unloadTo(main.home);
        main.home.chargeBot(bot);
      } else {
        bot.mine();
      }
    };

    /* cheat */
    if (debug) {
      hotkeys.bindTo($scope)
        .add({
          combo: 'f',
          //description: '',
          callback: function() {
            main.cheat = true;
            GAME.bots.forEach(function(d) {
              d.E = d.mE;
            });
          }
        })
        .add({
          combo: 'g',
          //description: '',
          callback: function() {
            main.cheat = true;
            main.game.world.scanRange(main.bot.x,main.bot.y,40);
            d3Draw();
          }
        });
    }

    /* _global */
    /* hotkeys.bindTo($scope)  // esc doesn't play nice with modals
      .add({
        combo: 'esc',
        description: 'Pause game',
        callback: function() {
          main.pause();
        }
      }); */

    var d = [  // move somewhere else
      ['q','NW',-1,-1],
      ['w','N' , 0,-1],
      ['e','NE', 1,-1],
      ['a','W' ,-1, 0],
      ['d','E' , 1, 0],
      ['z','SW',-1, 1],
      ['x','S' , 0, 1],
      ['c','SE', 1, 1]
    ];

    /* bot directions */  // move somewhere else
    d.forEach(function(k) {
      hotkeys.bindTo($scope)
        .add({
          combo: k[0],
          //description: '',
          callback: function() {
            main.bot.move(k[2],k[3]);
          }
        });
    });

    /* bot actions */  // move somewhere else
    hotkeys.bindTo($scope)
      //.add({
      //  combo: 'q w e a d z x c',
      //  description: 'Move bot'
      //})
      .add({
        combo: 's',
        description: 'Action (Unload/load/mine)',
        callback: function() {
          main.mineOrUnload(main.bot);
        }
      })
      .add({
        combo: 'r',
        description: 'Manual/auto',
        callback: function() {
          main.bot.manual = !main.bot.manual;
        }
      })
      .add({
        combo: 'j k',
        description: 'Prev/next bot'
      });

    function setup() {
      main.cheat = false;
      main.game = GAME;

      main.home = GAME.bots[0];  // remove this??
      main.bot = GAME.bots[1];  // dont do this
      //main.bot.active = true;
    }

    function reset() {
      clearTimer();
      GAME.clear().then(function() {
        $window.location.reload();
      });
    }

    function pauseDialog(message,showReset) {
      var _dT = main.dT;
      main.play(0);

      //var previousEsc = hotkeys.get('esc');
      //hotkeys.del('esc');

      //console.log(previousEsc);

      modals.pauseConfirm(message,showReset).result
        .then(reset, function() {
          GAME.save();
          main.play(_dT);
          //hotkeys.add(previousEsc);
        });
    }

    main.reset = function() {
      pauseDialog('Are you sure?', true);
    };

    main.relocate = function(bot) { // TODO: do something with rovers, move to bot class
      if (bot.E >= 1000) {
        bot.E -= 1000;
        pauseDialog('Congratulations', true);
      }
    };

    main.save = function() {
      GAME.save().then(function() {
        pauseDialog('Game saved.', false);
      });
    };

    main.pause = function() {
      pauseDialog('', false);
    };

    main.showScripts = function(_) {

      if (typeof _ === 'string') {  //  move to dialog?
        GAME.scripts.forEach(function(d, i) {  // improve this
          if (d.name === _) {
            _ = i;
          }
        });
      }

      var _dT = main.dT;
      main.play(0);

      function done() {
        GAME.save();
        main.play(_dT);
      }

      $modal.open({
        templateUrl: 'components/editor/editor.html',
        size: 'lg',
        backdrop: 'static',
        controller: 'EditorCtrl as editor',
        resolve: {
          initialScriptId: function() { return _; }
        }
      }).result.then(done,done);
    };

    setup();

    d3Draw();

    //var mapDisplaySize = [GAME.world.size,GAME.world.size]; // not used anymore?
    //var mapOffset = [0,0];  // TODO: focus on

    main.dT = 0;   // move all this to GAME service?

    var timer;

    function clearTimer() {
      if (angular.isDefined(timer)) {
        $timeout.cancel( timer );
      }
    }

    main.takeTurn = function() {
      clearTimer();
      GAME.takeTurn();
      if (main.dT > 0) {
        timer = $timeout(main.takeTurn, main.dT);
      }
    };

    main.play = function(_dT) {
      clearTimer();
      main.dT = _dT;
      if (_dT > 0) {
        main.takeTurn();
      }
    };

    $scope.$on('$destroy', function() {
      console.log('destroy');
      clearTimer();
    });

  });

})();
