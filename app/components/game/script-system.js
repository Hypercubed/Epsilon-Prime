/* global _F:true */

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
  /* .factory('Aether', function Aether($window) {
    if ($window.Aether) {
      $window.thirdParty = $window.thirdParty || {};
      $window.thirdParty.Aether = $window.Aether;
      try {
        delete $window.Aether;
      } catch (err) {
        $window.Aether = undefined;
      }
    }
    return $window.thirdParty.Aether;
  }) */
  .service('aether', function(Aether) {
    /*jshint -W106 */
    var aetherOptions = {
      executionLimit: 1000,
      functionName: 'tick',
      functionParameters: ['$log','$bot'],
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
    };
    /*jshint +W106 */

    return new Aether(aetherOptions);
  })
  .service('sandBox', function(aether) {  // move, create tests

    var sandBox = this;

    var $logInterface = function() {
      console.log.apply(console, arguments);
    };

    //var aether = new Aether(aetherOptions);  // move

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

      aether.depth = 1; //hack to avoid rebuilding globals

      try {

        //aether.transpile(code);  // todo: catch transpile problems here
        //var method = aether.createMethod(thisValue);
        //aether.run(method);

        var generator = method($logInterface, $bot);
        aether.sandboxGenerator(generator);

        var c = 0;
        var result = { done: false };
        while (!result.done && c++ < 200000) {
          result = generator.next();
        }

        if (!result.done) {  // todo: throw error?
          throw new Error('User script execution limit'+c);
          //var m = 'User script execution limit';
          //console.log(m);
          //return m;
        }

        /*jshint -W061 */
        //_sandBox.eval(code);
        /*jshint +W061 */

        /*jshint -W054 */
        //var fn = new Function('$log', '$bot', code);  // todo: move to setup?, trap infinite loops?  don't create each time.
        /*jshint +W054 */

        //fn.call(this,$logInterface,$bot);  // todo: safer sandbox
      } catch(err) {
        var m = err.stack || '';
        console.log('User script error', err.message, m);
        return err.message;
      }

      return true;

    };

    return sandBox;
  })
  .run(function($log, ngEcs, TILES, sandBox, GAME) {

    function mezclar2(arr) {  // fast shuffle
      for (var i, tmp, n = arr.length; n; i = Math.floor(Math.random() * n), tmp = arr[--n], arr[n] = arr[i], arr[i] = tmp) {}
      return arr;
    }

    var _name = _F('name');

    ngEcs.$s('scripts', {
      $require: ['bot','script'],
      $addEntity: function(e) {
        var scripts = GAME.scripts.filter(_name.eq(e.script.scriptName));    // todo: move this
        var script = (scripts.length > 0) ? scripts[0] : undefined;
        if (!script) {
          $log.error('Script not found');
        } else {
          e.script.$script = script;
        }
      },
      $update: function() {
        mezclar2(this.$family);
        this.$family.forEach(function(e) {
          if(e.script.halted !== true) {
            var ret = sandBox.run(e.script.$script, e.$bot);
            if (ret !== true) {
              e.bot.error(ret);
            }
          }
        });
      }
    });

  });

})();
