;(function() {
  'use strict';

/*jshint -W109 */
var collect =
"$bot.unload();\n" +
"$bot.charge();\n" +
"\n" +
"if ($bot.S >=  $bot.mS) {\n" +
"  var home = $bot.find('@');\n" +
"  $bot.moveTo(home.x,home.y);\n" +
"} else if ($bot.E >= 1 && $bot.mine() === false) {\n" +
"  var mine = $bot.find('X');\n" +
"\n" +
"  var x,y;\n" +
"  if (mine !== null) {\n "+
"    x = mine.x;\n" +
"    y = mine.y;\n" +
"  } else {\n" +
"    x = 2*Math.random()-1+$bot.x;\n" +
"    y = 2*Math.random()-1+$bot.y;\n" +
"  }\n"+
"  $bot.moveTo(x,y);\n"+
"}";
/*jshint +W109 */

//collect = collect.substring(collect.indexOf('{') + 1, collect.lastIndexOf('}'));

angular.module('ePrime')
  .config(function(thirdPartyProvider) {
    thirdPartyProvider.register('Aether');
  })
  .constant('defaultScripts', [   // make a hash
    { name: 'Collect', code: collect },
    { name: 'Action', code: '$bot.mine();\n$bot.charge();\n$bot.unload();' },
    //{ name: 'Mine', code: '$bot.mine();' },
    //{ name: 'Charge', code: '$bot.charge();' },
    //{ name: 'Unload', code: '$bot.unload();' },
    { name: 'Upgrade', code: '$bot.upgrade();' },
    { name: 'Construct', code: '$bot.construct();' }
  ])
  .service('aether', function(Aether) {
    /*jshint -W106 */
    return new Aether({
      executionLimit: 1000,
      functionName: 'tick',
      functionParameters: ['console','$bot','$map'],
      problems: {
        jshint_W040: {level: 'ignore'},
        aether_MissingThis: {level: 'ignore'}
      },
      noSerializationInFlow: true,
      includeFlow: false,
      includeMetrics: false,
      includeStyle: false,
      protectAPI: false,
      yieldAutomatically: true,
      protectBuiltins: false
    });
    /*jshint +W106 */
  })
  .service('sandBox', function(aether, GAME, $log) {  // move, create tests

    var $consoleInterface = {
      log: console.log.bind(console)
    };

    var $mapInterface = {
      get: GAME.world.get.bind(GAME.world)
    };

    this.run = function(script, $bot) {

      if (script === null) {
        return;
      }

      var method;
      if (typeof script === 'object') {
        if (!script.$method) { // maybe this should be done in the editor
          aether.transpile(script.code);  // todo: catch transpile problems here
          script.$method = aether.createMethod();
        }
        method = script.$method;
      } else {
        aether.transpile(script);  // todo: catch transpile problems here
        method = aether.createMethod();
      }

      try {

        var generator = method($consoleInterface, $bot, $mapInterface);
        aether.sandboxGenerator(generator);

        var c = 0;
        var result = { done: false };
        while (!result.done && c++ < 200000) {
          result = generator.next();
        }

        if (!result.done) {  // todo: throw error?
          throw new Error('User script execution limit'+c);
        }

      } catch(err) {
        var m;
        var a = aether.lastStatementRange;
        if (a && a[0]) {
          m = (a[0].row+1) +':' + a[0].col;
        }
        $log.debug(aether);
        $log.warn('User script error', err.message, m || err.stack || '');
        return err.message+m;
      }

      return true;

    };

  })
  .run(function($log, ngEcs, TILES, sandBox, GAME) {

    /* function mezclar2(arr) {  // fast shuffle
      for (var i, tmp, n = arr.length; n; i = Math.floor(Math.random() * n), tmp = arr[--n], arr[n] = arr[i], arr[i] = tmp) {}
      return arr;
    } */

    function findScript(name) {
      var value, list = GAME.scripts, len = list.length;
      for (var i = 0; i < len; i++) {
        value = list[i];
        if (value.name === name) {
          return value;
        }
      }
      return undefined;
    }

    ngEcs.$s('scripts', {
      $require: ['bot','script'],
      $addEntity: function(e) {
        var script = findScript(e.script.scriptName);
        if (!script) {
          $log.error('Script not found');
        } else {
          e.script.$script = script;
        }
      },
      $update: function() {
        //mezclar2(this.$family);
        this.$family.forEach(function(e) {
          if( /* !e.active  && */ e.script.halted !== true) {
            var script = findScript(e.script.scriptName);
            var ret = sandBox.run(script, e.$bot);
            if (ret !== true) {
              e.bot.error(ret);
            }
          }
        });
      }
    });

  });

})();
