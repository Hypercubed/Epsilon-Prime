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
  /* .constant('defaultScripts', [   // make a hash
    { name: 'Collect', code: collect },
    { name: 'Action', code: '$bot.mine();\n$bot.charge();\n$bot.unload();' },
    //{ name: 'Mine', code: '$bot.mine();' },
    //{ name: 'Charge', code: '$bot.charge();' },
    //{ name: 'Unload', code: '$bot.unload();' },
    { name: 'Upgrade', code: '$bot.upgrade();' },
    { name: 'Construct', code: '$bot.construct();' }
  ]) */
  .constant('defaultScripts', {
    'Collect': { code: collect },
    'Action': { code: '$bot.mine();\n$bot.charge();\n$bot.unload();' },
    'Upgrade': { code: '$bot.upgrade();' },
    'Construct': { code: '$bot.construct();' }
  })
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

    var sandBox = this;

    var $consoleInterface = {
      log: console.log.bind(console)
    };

    var $mapInterface = {
      get: GAME.world.get.bind(GAME.world)
    };

    sandBox.run = function(script, $bot) {

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

      var result = { done: false };
      try {

        var generator = method($consoleInterface, $bot, $mapInterface); // does this need to be done each time?
        aether.sandboxGenerator(generator);

        var c = 0;
        while (!result.done && c++ < 200000) {
          result = generator.next();
        }

        if (!result.done) {  // todo: throw error?
          result.error = 'User script execution limit';
        }

      } catch(err) {
        var m;
        var a = aether.lastStatementRange;
        if (a && a[0]) {
          m = (a[0].row+1) +':' + a[0].col;
        }
        $log.debug(aether);
        $log.warn('User script error', err.message, m || err.stack || '');

        result.error = err.message+m;
      }

      return result;

    };

  })
  .run(function($log, ngEcs, TILES, sandBox, GAME) {

    /* function mezclar2(arr) {  // fast shuffle
      for (var i, tmp, n = arr.length; n; i = Math.floor(Math.random() * n), tmp = arr[--n], arr[n] = arr[i], arr[i] = tmp) {}
      return arr;
    } */

    /* function findScript(name) {
      var value, list = GAME.scripts, len = list.length;
      for (var i = 0; i < len; i++) {
        value = list[i];
        if (value.name === name) {
          return value;
        }
      }
      return undefined;
    } */

    ngEcs.$s('scripts', {
      acc: 0,
      interval: 1,
      $require: ['bot','script'],
      $addEntity: function(e) {
        if (!(e.script.scriptName in GAME.scripts)) {
          $log.error('Script not found');
        }
      },
      $update: function() {
        GAME.stats.turn++;  // Move this?
      },
      $updateEach: function(e) {

        //var i = -1,arr = this.$family,len = arr.length,e;
        //var script;  // reusable references

        //while (++i < len) {
          //e = arr[i];

          //if (e.bot.E < 1) { return; }

          //script = e.script;

          if( e.bot.E < 1 || e.script.halted === true || e.action.queue.length > 0) {
            return;
          }

          var script = GAME.scripts[e.script.scriptName];

          //while (e.bot.E > 1) {  // do I need this?
            var ret = sandBox.run(script, e.$bot);
            if (ret.error) {
              e.bot.error(ret.error);
              //continue;
            }
            //if (ret.done) {
              //break;
            //}
          //}

        //}

      }
    });

  });

})();
