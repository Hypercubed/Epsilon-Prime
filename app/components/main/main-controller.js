/* global d3:true */
/* _global _F:true */

(function() {

'use strict';

angular.module('ePrime')
  .controller('MainCtrl', function ($scope, $compile, $log, $route, $window, $modal, hotkeys, modals, siteConfig, isAt, sandBox, TILES, GAME) {

    var main = this;

    /* cheat */
    if (siteConfig.debug) {
      hotkeys.bindTo($scope)
        .add({
          combo: 'f',
          //description: '',
          callback: function() {
            main.cheat = true;
            GAME.bots.forEach(function(d) {
              d.bot.E = d.bot.mE;
            });
          }
        })
        .add({
          combo: 'g',
          //description: '',
          callback: function() {
            main.cheat = true;
            main.game.world.scanRange(main.bot.bot.x,main.bot.bot.y,40);
            //d3Draw();
          }
        });
    }

    main.move = function(dx,dy) {
      main.bot.bot.move(dx,dy);
      step();
    };

    main.action = function(bot) {  // used, move? Use action script?
      var $bot = bot ? bot.$bot : main.bot.$bot;

      $bot.unload();
      $bot.charge();
      $bot.mine();

      step();
    };

    main.mine = function(bot) {  // used, move
      bot = bot || main.bot;
      while(bot.bot.E > 1 && bot.$bot.mine() !== false) {}  // mine untill done?
      step();
    };

    main.run = function(code) {  // used in bot panel, move?
      var ret = sandBox.run(code, main.bot.$bot);
      step();
      if (ret !== true) {
        main.bot.bot.error(ret);
      }
    };

    function step() {
      if (main.dT === 0) {
        main.takeTurn();
      }
    }

    var d = [  // move somewhere else, combine with directions list in botcomponent
      [ 'q'         ,'NW',-1,-1],
      [['w','up']   ,'N' , 0,-1],
      [ 'e'         ,'NE', 1,-1],
      [['a','left'] ,'W' ,-1, 0],
      [['d','right'],'E' , 1, 0],
      [ 'z'         ,'SW',-1, 1],
      [['x','down'] ,'S' , 0, 1],
      [ 'c'         ,'SE', 1, 1]
    ];

    /* bot directions */  // move somewhere else
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
        combo: 's',
        description: 'Action (Unload/load/mine)',
        callback: function() {
          main.action();
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
          step();
        }
      })
      .add({
        combo: 'S',
        description: 'Save game',
        callback: function() {
          GAME.save();
          return false;
        }
      })
      .add({
        combo: '?',
        description: 'Show / hide this help menu',
        callback: function() {
          main.help();
        }
      });

    function setup() {
      main.cheat = false;
      main.game = GAME;
      main.bots = GAME.bots;  // get rid of this

      main.bots.forEach(function(bot) {
        if (bot.active) {
          main.bot = bot;  // get rid of this
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
      var _dT = main.dT;
      main.play(0);

      hotkeys.pause();

      modals.pauseConfirm(message,showReset).result
        .then(reset, function() {
          GAME.save();
          main.play(_dT);
          hotkeys.unpause();
        });
    }

    main.reset = function() {
      pauseDialog('<h1 class="text-center">Are you sure?<h1>', true);
    };

    main.relocate = function(e) { // used, move?
      if (e.bot.canRelocate()) {  // use component
        pauseDialog('<h1 class="text-center">Congratulations<h1><h3 class="text-center">You have set off to explore another planet.</h3>', true);
      }
    };

    main.help = function() {
      var _dT = main.dT;
      main.play(0);

      hotkeys.pause();

      modals.openHelp().result
        .then(null, function() {
          main.play(_dT);
          hotkeys.unpause();
        });
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

    main.dT = 0;   // move all this to GAME service?

    main.takeTurn = function() {
      GAME.ecs.$update();
    };

    main.play = function(_dT) {
      GAME.ecs.$delay = main.dT = _dT;
      if (_dT > 0) {
        GAME.ecs.$start();
      } else {
        GAME.ecs.$stop();
      }
    };

    $scope.IntroOptions = {
      disableInteraction: false,
      showStepNumbers: true,
      steps: [
        {
          intro: '<h2>Welcome to Epsilon-prime</h2>In Epsilon-prime your goal is to conquer the planet of ε-prime. You do this by commanding an army of bots to explore and exploit the resources of ε-prime. You can control your bots individually using your mouse and keyboard or by using command scripts written in JavaScript. The game begins with a simple (and very inefficient) set of scripts for exploring and collecting resources. Using just these scripts you could complete this demo in ~2,500 turns. But you can you do better!'
        },
        {
          element: '#left-panel',
          intro: 'The game map is located on the left. Use the mouse and scroll wheel (or touch screen) to pan and zoom the map. The @ mark is your starting base.',
          position: 'right'
        },
        {
          element: '#list',
          intro: 'On the right is a units lists. All your units are listed here.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1)',
          intro: 'At this time you have one unit… the base. Again the base is identified by the @ symbol.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .energy-bar',
          intro: 'The red progress bar indicates the unit’s energy storage and capacity. The base unit begins with 100 J of energy. Energy is needed to move and collected resources.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .energy-cost',
          intro: 'Above the energy indicator you will find the units movement cost and charging rate.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .energy-cost .movement-cost',
          intro: 'The energy of the base unit is depleted at a very high rate while moving. Notice that the base requires a full charge of 100 J to move one space.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .energy-cost .recharge-rate',
          intro: 'The base unit recharges at just over 2 J per turn. At this rate a heavy base unit can only move one space every 44 turns.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .storage-bar',
          intro: 'The blue progress bar indicates a units resource storage and capacity. Resources are used to upgrade units or construct new units.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .construct-button',
          intro: 'Constructing new units costs 100 kg. Construct a new unit now using the button indicated.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(2)',
          intro: 'Your new unit will appear in the list...',
          position: 'left',
          onbeforechange: function() {
            if (main.bots.length < 2) {
              this.previousStep();
            }
          }
        },
        {
          element: '#left-panel',
          intro: 'and on the map indicated on with an A.',
          position: 'right'
        },
        {
          element: '.list-group-item:nth-child(2) .energy-cost',
          intro: 'Notice that the movement cost and recharge rate are both lower. This unit can move one space every two turns using it\'s own power generation.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(2)',
          intro: 'However small units can also charge from larger units. Make the rover the active unit by clicking the A in the bot list...',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(2)',
          intro: 'Now press the action key <code class="cfp-hotkeys-key">s</code> to charge the Rover using the Base’s energy. This is the action key.  It is also used to unload any unit storage to the base and to mine resources.',
          position: 'left',
          onbeforechange: function() {
            if (!main.bots[1].active) {
              this.previousStep();
            }
          }
        },
        {
          element: '#left-panel',
          intro: 'You can now begin exploring the map using the <code class="cfp-hotkeys-key">q</code>-<code class="cfp-hotkeys-key">c</code> keys. The letters <code class="cfp-hotkeys-key">qweadzxc</code> are directions of movement (<code class="cfp-hotkeys-key">q</code> for North West, <code class="cfp-hotkeys-key">c</code> for South East, etc).  Imagine your unit is located at the action key <code class="cfp-hotkeys-key">s</code> on your keyboard. ',
          position: 'right'
        },
        {
          element: '#left-panel',
          intro: 'If you encounter an X on the map this is a resource cache (or mine). Collect resources using the action key <code class="cfp-hotkeys-key">s</code>.',
          position: 'right'
        },
        {
          element: '.list-group-item:nth-child(2) .energy-bar',
          intro: 'You will notice that the energy depletes as you move.  This is because this unit\'s movement cost is greater than it\'s recharge rate. You can use all your energy to mine or return to the base periodically to unload and charge...',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(2) .energy-bar',
          intro: 'Or use the wait key <code class="cfp-hotkeys-key">.</code> to wait one turn an recharge your unit.',
          position: 'left'
        },
        {
          element: '#play-buttons',
          intro: 'You may also use the <i class="fa fa-step-forward"></i> button to advance a turn.',
          position: 'right'
        },
        {
          element: '.list-group-item:nth-child(1)',
          intro: 'You can use this dropdown to set a bots automatic actions each turn. Select \'Construct\' for the base...',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(2)',
          intro: 'and \'Collect\' for the bot.',
          position: 'left'
        },
        {
          element: '#play-buttons',
          intro: 'Press play button to automatically cycle turns and watch your bots work autonomously.',
          position: 'right'
        },
        {
          element: '#scripts-button',
          intro: 'You can modify the action scripts here.',
          position: 'top'
        },
        {
          element: '#save-button',
          intro: 'Your game is automatically saved every 20 turns.',
          position: 'left'
        },
        {
          element: '#stats-button',
          intro: 'Check your progress here.',
          position: 'left' },
        { intro: '<h3>Enjoy</h3>' }
      ]
    };

    main.introCounter = 1;  // save with game state?

    $scope.introChange = function() {
      var intro = this;

      var currentItem = intro._introItems[intro._currentStep];

      if (currentItem.onbeforechange) {
        currentItem.onbeforechange.call(this);
      }

      main.introCounter = intro._currentStep+1;

      for (var i = intro._currentStep; i < this._options.steps.length; i++) {
        currentItem = intro._introItems[i];
        var step = intro._options.steps[i];
        if (step.element) {
          currentItem.element = document.querySelector(step.element);
          currentItem.position = step.position;
        }
      }

    };

  });

})();
