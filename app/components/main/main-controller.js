/* _global _F:true */
/*jshint -W003 */
/*jshint -W040 */

(function() {

'use strict';

angular.module('ePrime')
  .factory('ACTIONS', function(Position) {

    var ACTIONS = {  // move to factory?
      SUCCESS: { done: true },
      action: function(e) {
        var $bot = e.$bot;
        $bot.unload();
        $bot.charge();
        $bot.mine();
        return ACTIONS.SUCCESS;
      },
      wait: function() {
        return ACTIONS.SUCCESS;
      },
      move: function(dx,dy) {
        return function move(e) {
          if (e.bot.E >= e.bot.moveCost || e.bot.moveCost >= e.bot.mE) {
            e.bot.move(dx,dy);
            return ACTIONS.SUCCESS;
          }
          return { next: move };
        };
      },
      moveTo: function(x,y) {
        return function moveTo(e) {
          if (e.bot.moveCost >= e.bot.mE) { return ACTIONS.SUCCESS; }
          if (e.bot.E >= e.bot.moveCost) {
            e.bot.moveTo(x,y);
          }
          return (e.position.isAt(x, y)) ? ACTIONS.SUCCESS : { next: moveTo };
        };
      },
      mine: function mine(e) {
        var $bot = e.$bot;
        if (e.bot.E >= 1) {
          $bot.mine();
          return ACTIONS.SUCCESS;
        }
        return { next: mine };
      }
    };

    return ACTIONS;
  })
  .controller('MainCtrl', function ($scope, $compile, $log, $route, $window, $modal, hotkeys, modals, siteConfig, Position, sandBox, fpsmeter, gameIntro, botParams, ACTIONS, TILES, GAME) {

    var main = this;

    main.dT = 6;  // 1/time between autoturns, move?
    main.cheat = false;
    main.game = GAME;
    main.bots = GAME.bots;  // get rid of this
    main.intro = gameIntro;
    main.botParams = botParams;
    main.userHist = [];

    main.bots.forEach(function(bot) {
      if (bot.active) {
        main.bot = bot;  // get rid of this
      }
    });

    $scope.autoStart = !!GAME.tutorial;
    delete GAME.tutorial;

    GAME.ecs.$start();
    //main.play(main.dT);



    //const SUCCESS = { done: true };

    /* var ACTIONS = {  // move to factory?
      SUCCESS: { done: true },
      action: function(e) {
        var $bot = e.$bot;
        $bot.unload();
        $bot.charge();
        $bot.mine();
        return ACTIONS.SUCCESS;
      },
      wait: function() {
        return ACTIONS.SUCCESS;
      },
      move: function(dx,dy) {
        return function move(e) {
          if (e.bot.E >= e.bot.moveCost || e.bot.moveCost >= e.bot.mE) {
            e.bot.move(dx,dy);
            return ACTIONS.SUCCESS;
          }
          return { next: move };
        };
      },
      moveTo: function(x,y) {
        return function moveTo(e) {
          if (e.bot.moveCost >= e.bot.mE) { return ACTIONS.SUCCESS; }
          if (e.bot.E >= e.bot.moveCost) {
            e.bot.moveTo(x,y);
          }
          return (Position.isAt(e.bot, x, y)) ? ACTIONS.SUCCESS : { next: moveTo };
        };
      },
      mine: function mine(e) {
        var $bot = e.$bot;
        if (e.bot.E >= 1) {
          $bot.mine();
          return ACTIONS.SUCCESS;
        }
        return { next: mine };
      }
    }; */

    main.wait = function() {
      var e = main.bot;

      e.action.push(ACTIONS.wait);  //noop

    };

    main.move = function(dx,dy) {
      main.bot.action.clear();
      main.bot.action.push(ACTIONS.move(dx,dy));
    };

    main.action = function(e) {
      e = e || main.bot;
      e.action.push(ACTIONS.action);
    };

    main.mine = function(e) {  // used, move? Use action script?
      e = e || main.bot;
      e.action.push(ACTIONS.mine);
    };

    main.run = function(code) {  // used in bot panel, move?
      var ret = sandBox.run(code, main.bot.$bot);
      if (ret.error) {
        main.bot.bot.addAlert('danger',ret.error);
      } else {
        main.userHist.push(code);  // make a service/factory
      }
    };

    var d = [  // move somewhere else, combine with directions list in botcomponent
      [ 'q'         ,'NW',-1,-1],
      [ 'w'         ,'N' , 0,-1],
      [ 'e'         ,'NE', 1,-1],
      [ 'a'         ,'W',-1, 0],
      [ 'd'         ,'E' , 1, 0],
      [ 'z'         ,'SW',-1, 1],
      [ 'x'         ,'S' , 0, 1],
      [ 'c'         ,'SE', 1, 1]
    ];

    /* bot directions */  // move somewhere else?
    d.forEach(function(k) {
      hotkeys.bindTo($scope)
        .add({
          combo: k[0],
          //description: '',
          callback: function() {
            main.move(k[2],k[3]);
          }
        });
    });

    /* bot actions */  // move somewhere else
    hotkeys.bindTo($scope)
      .add({
        combo: '?',
        description: 'Show / hide this help menu',
        callback: function() {
          main.help();
        }
      })
      .add({
        combo: '~',
        description: 'Show / hide FPS meter',
        callback: function() {
          if (fpsmeter.$hide) {
            fpsmeter.show();
          } else {
            fpsmeter.hide();
          }
          fpsmeter.$hide = !fpsmeter.$hide;
        }
      })
      .add({
        combo: 's',
        description: 'Action (Unload/load/mine)',
        callback: function() {
          main.action();
        }
      })
      .add({
        combo: 'H',
        description: 'Move to home',
        callback: function() {
          main.bot.action.clear();
          main.bot.action.push(ACTIONS.moveTo(main.bots[0].bot.x,main.bots[0].bot.y));
        }
      })
      .add({
        combo: ',',
        description: 'Mine',
        callback: function() {
          main.mine();
        }
      })
      .add({
        combo: '.',
        description: 'Pass (take turn)',
        callback: function() {
          main.wait();
        }
      })
      .add({
        combo: 'S',
        description: 'Save game',
        callback: function() {
          GAME.save();
          return false;
        }
      });

    /* cheat */
    if (siteConfig.debug) {
      hotkeys.bindTo($scope)
      .add({
        combo: 'C',
        description: 'Enable cheats',
        callback: function() {
          main.cheat = true;
          GAME.bots.forEach(function(d) {
            d.bot.E = d.bot.mE;
          });
        }
      })
      .add({
        combo: 'M',
        description: 'Show map',
        callback: function() {
          main.cheat = true;
          main.game.world.scanRange(main.bot.bot.x,main.bot.bot.y,40);
          //d3Draw();
        }
      });
    }


    main.botChange = function(bot) {
      main.bots.forEach(function(_bot) {
        _bot.active = (_bot === bot);
        if (_bot.active) {
          main.bot = bot;  // get rid of this
        }
      });
    };

    function reset() {
      main.play(0);
      GAME.clear().then(function() {
        $window.location.reload();
      });
    }

    function pauseDialog(message,showReset) {
      freeze();

      modals.pauseConfirm(message,showReset).result
        .then(reset, function() {
          GAME.save();
          unfreeze();
        });
    }

    var _dT;
    function freeze() {
      _dT = main.dT;
      main.play(0);

      hotkeys.pause();
      GAME.ecs.$stop();
    }

    function unfreeze() {
      main.play(_dT);
      hotkeys.unpause();
      GAME.ecs.$start();
    }

    main.help = function(template) {
      freeze();

      modals.openHelp(template).result
        .then(null, unfreeze);
    };

    main.reset = function() {
      pauseDialog('<h1 class="text-center">Are you sure?<h1>', true);
    };

    main.relocate = function(e) { // used, move?
      if (e.bot.canRelocate()) {  // do I really need to check?
        pauseDialog('<h1 class="text-center">Congratulations<h1><h3 class="text-center">You have set off to explore another planet.</h3>', true);
      }
    };

    main.save = function() {
      GAME.save().then(function() {
        pauseDialog('<h1 class="text-center">Game saved.<h1><h4 class="text-center">You can safely close this tab<h4>', false);
      });
    };

    main.pause = function() {
      pauseDialog('', false);
    };

    main.showScripts = function(_) {

      /* if (typeof _ === 'string') {  //  move to dialog?
        GAME.scripts.forEach(function(d, i) {  // improve this
          if (d.name === _) {
            _ = i;
          }
        });
      } */

      freeze();

      function done() {
        GAME.save();
        unfreeze();
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

    main.editBotScript = function(bot) {

      freeze();

      function close(_) {
        console.log('close');
        main.setScript(bot, _);
        GAME.save();
        unfreeze();
      }

      function dismiss() {
        console.log('dismiss');
        GAME.save();
        unfreeze();
      }

      $modal.open({
        templateUrl: 'components/editor/editor.html',
        size: 'lg',
        backdrop: 'static',
        controller: 'EditorCtrl as editor',
        resolve: {
          initialScriptId: function() { return bot.script ? bot.script.scriptName : ''; }
        }
      }).result.then(close,dismiss);
    };

    main.setScript = function(bot, scriptName) {
      if (scriptName === null || scriptName.length < 1) {
        bot.$remove('script');
        return;
      }
      bot.$add('script', {scriptName: scriptName, halted: false});　　// rename scriptName -> name, use script component constructor?
    };

    main.takeTurn = function() {
      GAME.ecs.systems.scripts.acc = 1/main.dT;
    };

    main.play = function(_dT) {
      main.dT = _dT;
      GAME.ecs.systems.charging.factor = _dT > 6 ? 5 : 1;
      GAME.ecs.systems.scripts.interval = 1/_dT;  // move GAME.dT to scripts systems?
    };

  });

})();
