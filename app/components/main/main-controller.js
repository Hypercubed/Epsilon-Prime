/* _global _F:true */

(function() {

'use strict';

angular.module('ePrime')
  .controller('MainCtrl', function ($scope, $compile, $log, $route, $window, $modal, hotkeys, modals, siteConfig, isAt, sandBox, fpsmeter, TILES, GAME) {

    var main = this;

    main.introCounter = 1;  // save with game state?
    main.dT = 0;
    main.cheat = false;
    main.game = GAME;
    main.bots = GAME.bots;  // get rid of this

    main.bots.forEach(function(bot) {
      if (bot.active) {
        main.bot = bot;  // get rid of this
      }
    });

    $scope.autoStart = !!GAME.tutorial;
    delete GAME.tutorial;

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
      [ 'w'         ,'N' , 0,-1],
      [ 'e'         ,'NE', 1,-1],
      [ 'a'         ,'W',-1, 0],
      [ 'd'         ,'E' , 1, 0],
      [ 'z'         ,'SW',-1, 1],
      [ 'x'         ,'S' , 0, 1],
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
      });

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

    main.help = function(template) {
      var _dT = main.dT;
      main.play(0);

      hotkeys.pause();

      modals.openHelp(template).result
      .then(null, function() {
        main.play(_dT);
        hotkeys.unpause();
      });
    };

    main.reset = function() {
      pauseDialog('<h1 class="text-center">Are you sure?<h1>', true);
    };

    main.relocate = function(e) { // used, move?
      if (e.bot.canRelocate()) {  // use component
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

    main.takeTurn = function(dt) {
      GAME.ecs.$update(dt || 0.1);
      GAME.ecs.$render();
    };

    main.play = function(_dT) {  // _dT === fps
      GAME.ecs.$fps = main.dT = _dT;
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
        //{
        //  intro: '<h2>Welcome to Epsilon-prime</h2>In Epsilon-prime your goal is to conquer the planet of ε-prime. You do this by commanding an army of bots to explore and exploit the resources of ε-prime. You can control your bots individually using your mouse and keyboard or by using command scripts written in JavaScript. The game begins with a simple (and very inefficient) set of scripts for exploring and collecting resources. Using just these scripts you could complete this demo in ~2,500 turns. But you can you do better!'
        //},
        {
          element: '#left-panel',
          intro: 'The game map is located on the left. Use the mouse and scroll wheel (or touch screen) to pan and zoom the map. The A mark is your starting unit.',
          position: 'right'
        },
        {
          element: '#list',
          intro: 'On the right is your units list.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1)',
          intro: 'At this time you have one unit. Here also the starting unit is identified by the <i>A</i> symbol.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .energy-bar',
          intro: 'This progress bar indicates the unit’s energy and energy storage capacity. The unit begins with no energy but can harvest upto 10 J. Energy is needed to move and collect resources.',
          position: 'left'
        },
        {
          element: '#play-buttons',
          intro: 'Press the wait key <code class="cfp-hotkeys-key">.</code> or use use the <i class="fa fa-step-forward"></i> button to advance several turns.',
          position: 'right'
        },
        {
          onafterchange: function() {
            if (main.bot.bot.E < 2) {
              this.previousStep().refresh();
            }
          },
          element: '.list-group-item:nth-child(1) .energy-bar',
          intro: 'Your unit’s energy will increase.',
          position: 'left'
        },
        {
          element: '#movement-buttons',
          intro: 'You can now begin exploring the map using the <code class="cfp-hotkeys-key">q</code>-<code class="cfp-hotkeys-key">c</code> keys. The letters <code class="cfp-hotkeys-key">qweadzxc</code> are directions of movement (<code class="cfp-hotkeys-key">q</code> for North West, <code class="cfp-hotkeys-key">c</code> for South East, etc).  Imagine your unit is located at the action key <code class="cfp-hotkeys-key">s</code> on your keyboard. ',
          position: 'right'
        },
        {
          element: '.list-group-item:nth-child(1) .energy-bar',
          intro: 'You will notice that the energy depletes as you move.  This is because this unit\'s movement cost is greater than its recharge rate.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .energy-cost',
          intro: 'Above the energy indicator you will find the units movement cost and charging rate.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .energy-cost .movement-cost',
          intro: 'Notice that the unit requires 1 J to move one space.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .energy-cost .recharge-rate',
          intro: 'The unit recharges at 5 J per second. At this rate a unit can move five (5) spaces every second, not counting stored energy.',
          position: 'left'
        },
        {
          element: '#left-panel',
          intro: 'If you encounter an X on the map this is a resource cache (or mine). Collect resources using the action key <code class="cfp-hotkeys-key">s</code>.',
          position: 'right'
        },
        {
          element: '.list-group-item:nth-child(1) .storage-bar',
          intro: 'This progress bar indicates a unit’s resources and storage capacity. Resources are used to upgrade units or construct new units.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .upgrade-button',
          intro: 'Upgrading units costs 10 kg.  You should pause the tutorial now and explore.  Return to the tutrial when you have upgraded your unit several times.  <p /><b>If you continue the tutorial now we will automatically upgrade your unit several times.  Normally this would cost resources that you need to collect.</b>',
          position: 'left'
        },
        {
          onafterchange: function() {
            if (main.bot.bot.mS < 100) {
              main.bot.bot.S = 90;
              main.bot.bot.upgrade(90);
            }
          },
          element: '.list-group-item:nth-child(1) .energy-cost',
          intro: 'Notice that the movement cost and recharge rate are both higher after upgrading. Now the unit requires a full charge to move one space and even though recharge rate is higher you unit is now effectively slower.  Also notice that the unit is indicated with a <i>@</i>',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(1) .construct-button',
          intro: 'Once a unit has a storage capacity greater than 100 it is able to construct new units.  Constructing new units costs 100 kg.  You should pause the tutorial and continue exploring to collect 100 kg of storage. <br /><b>If you continue the tutorial we will construct a new unit for you.  Again this would normally cost resources that you must to collect.',
          position: 'left'
        },
        {
          onbeforechange: function() {
            if (main.bots.length < 2) {
              main.bot.bot.S = 100;
              main.bot.bot.construct();
            }
          },
          element: '.list-group-item:nth-child(2)',
          intro: 'Your new unit will appear in the list...',
          position: 'left'
        },
        {
          element: '#left-panel',
          intro: 'and on the map indicated on with an A.',
          position: 'right'
        },
        {
          element: '.list-group-item:nth-child(2) .energy-cost',
          intro: 'Notice that the movement cost and recharge rate are again low.',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(2)',
          intro: 'Small units can also charge from larger units. Make the new unit active unit by clicking the <i>A</i> in the bot list...',
          position: 'left'
        },
        {
          element: '.list-group-item:nth-child(2)',
          intro: 'Now press the action key <code class="cfp-hotkeys-key">s</code> to charge the Rover using the Base’s energy. This is the action key.  It is also used to unload any unit storage to the base and to mine resources.',
          position: 'left',
          onafterchange: function() {
            if (!main.bots[1].active) {
              this.previousStep();
            }
          }
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
          intro: 'Your game is automatically saved approximately every 60 seconds.',
          position: 'left'
        },
        {
          element: '#stats-button',
          intro: 'Check your progress here.',
          position: 'left' },
        { intro: 'How quickly can you collect 500 kg in the base unit?  <h3>Good luck!</h3>' }
      ]
    };

    function refreshIntro(intro) {
      for (var i = 0; i < intro._options.steps.length; i++) {
        var currentItem = intro._introItems[i];
        var step = intro._options.steps[i];
        if (step.element) {
          currentItem.element = document.querySelector(step.element);
          currentItem.position = step.position;
        }
      }
    }

    $scope.introAfterChange = function() {
      var intro = this;

      main.introCounter = intro._currentStep+1;

      refreshIntro(intro);

      var currentItem = intro._introItems[intro._currentStep];
      if (currentItem.onafterchange) {

        $scope.$apply(function() {
          currentItem.onafterchange.call(intro);
        });

        refreshIntro(intro);

      }

    };

    $scope.introBeforeChange = function() {
      var intro = this;

      refreshIntro(intro);

      var currentItem = intro._introItems[intro._currentStep];
      if (currentItem.onbeforechange) {

        $scope.$apply(function() {
          currentItem.onbeforechange.call(intro);
        });

        refreshIntro(intro);

      }

    };

  });

})();
