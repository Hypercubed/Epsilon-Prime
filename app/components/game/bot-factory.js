/* global _F:true */
/* global Aether: true */

(function() {
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
  .constant('defaultScripts', [   // make a hash
    { name: 'Collect', code: collect },
    { name: 'Action', code: '$bot.mine();\n$bot.charge();\n$bot.unload();' },
    //{ name: 'Mine', code: '$bot.mine();' },
    //{ name: 'Charge', code: '$bot.charge();' },
    //{ name: 'Unload', code: '$bot.unload();' },
    { name: 'Upgrade', code: '$bot.upgrade();' },
    { name: 'Construct', code: '$bot.construct();' }
  ])
  .service('aether', function() {
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
  .value('isAt', function isAt(obj,x,y) {
    if (angular.isObject(x)) {
      return x.x === obj.x && x.y === obj.y;
    }
    return x === obj.x && y === obj.y;
  })
  //.value('Interpreter', window.Interpreter)
  .factory('Bot', function (isAt, TILES, $log, sandBox) {

    var GAME = null;  // later the GAME service

    var mathSign = Math.sign || function (value) {  // polyfill for Math.sign
      var number = +value;
      if (number === 0) { return number; }
      if (Number.isNaN(number)) { return number; }
      return number < 0 ? -1 : 1;
    };

    function createAccessor(bot) {
      var $bot = {};

      ['name','x','y','S','mS','E','mE'].forEach(function(prop) {
        Object.defineProperty($bot, prop, {
          get: function() {return bot[prop]; }
        });
      });

      return $bot;

    }

    function createInterface(bot) {  // move?
      var $bot = createAccessor(bot);

      $bot.move = function $$move(x,y) {
        return bot.move(x,y);
      };

      $bot.moveTo = function $$moveTo(x,y) {
        return bot.moveTo(x,y);
      };

      $bot.mine = function $$mine() {
        return bot.mine();
      };

      $bot.unload = function $$unload(_) {  // should unload to co-located @
        var home = find(_ || '@');  // gets closest
        return (home) ? bot.unloadTo(home) : null;
      };

      $bot.charge = function $$charge(_) {  // should charge to co-located @
        var home = find(_ || '@');  // gets closest
        return (home) ? home.chargeBot(bot) : null;
      };

      $bot.upgrade = function $$upgrade() {
        bot.upgrade();
      };

      $bot.construct = function $$construct(_) {
        bot.construct(_ || null);
      };

      function find(_) {  // used by unload and charge, move?
        var r = bot.scanList(_);
        return (r.length > 0) ? r[0] : null;
      }

      $bot.find = function $$find(_) {  // move?
        var r = find(_);
        return (r instanceof Bot) ? createAccessor(r) : r;  // maybe should just be properties
      };

      $bot.log = function(msg) {
        bot.addAlert('success', msg);
      };

      return $bot;
    }


    function Bot(name,x,y,_GAME) {  // TODO: move speed, mine speed, storage cap, energy cap, carge rate
      this.name = name;
      GAME = GAME || _GAME;

      this.t = TILES.BOT;

      this.x = x;
      this.y = y;
      //this.dEdX = 1;

      this.S = 0;      // Raw material storage
      this.mS = 10;    // Maximum
      this.dS = 1;     // Mining ability

      this.E = 0;     // Energy
      //this.dE = 0.01;    // Charging rate
      this.mE = 10;   // Maximum

      //this.manual = true;  // rename auto?
      this.active = false;

      this.halted = false;

      this.message = '';
      this.scriptName = null;

      this.alerts = [];

      this.$script = null;
      this.$bot = createInterface(this);

    }

    Bot.prototype.addAlert = function(type, msg) {
      this.alerts.push({type:type, msg:msg});
    };

    Bot.prototype.closeAlert = function(index) {
      this.alerts.splice(index, 1);
    };

    Bot.prototype.clearLog = function(index) {
      this.alerts.splice(0);
    };

    Bot.prototype.error = function(msg) {
      this.halted = true;
      //this.message = msg; // used as error flag, get rid of this
      this.addAlert('danger',msg);
      //this.setCode(null);
    };

    Bot.prototype.charge = function(dE) {
      var e = this.E;
      this.E = +Math.min(e + dE, this.mE).toFixed(4);
      return this.E - e;
    };

    Bot.prototype.isAt = function(x,y) {
      return isAt(this,x,y);
    };

    Bot.prototype.mass = function() {
      return this.mS + this.mE;
    };

    var DIS = 1+1;  // 1+Discharge exponent, faster discharge means lower effeciency

    Bot.prototype.moveCost = function() {
      return Math.pow(this.mass()/20, DIS);
    };

    var CHAR = 0.5; // Charging effeciency
    var I = 1; // moves per turn for base
    var E = 2/3;  // surface/volume exponent
    var N = CHAR*I/(Math.pow(20, E));  // normilization factor

    Bot.prototype.chargeRate = function() {
      return N*Math.pow(this.mass(), E);
    };

    Bot.prototype.canMove = function(dx,dy) {  // TODO: check range

      dx = mathSign(dx);
      dy = mathSign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));
      var dE = this.moveCost()*dr;

      return GAME.world.canMove(this.x + dx,this.y + dy) && this.E >= dE;
    };

    Bot.prototype.move = function(dx,dy) {  // TODO: check range

      dx = mathSign(dx);
      dy = mathSign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));
      var dE = this.moveCost()*dr;

      if (GAME.world.canMove(this.x + dx,this.y + dy)) {  // Need to check bot skills, check path
        if (this.E >= dE) {
          this.last = {x: this.x, y: this.y};
          this.heading = {x: dx, y:dy};

          this.x += dx;
          this.y += dy;
          this.E -= dE;

          GAME.world.scanRange(this);

          return true;
        }
      }
      return false;
    };

    Bot.prototype.canMoveTo = function(x,y) {  // TODO: check range

      if (angular.isObject(x)) {  // TODO: Utility
        y = x.y;
        x = x.x;
      }

      var dx = x - this.x;
      var dy = y - this.y;

      return this.canMove(dx,dy);
    };

    Bot.prototype.moveTo = function(x,y) {

      this.target = {x:x, y:y};

      if (angular.isObject(x)) {  // TODO: Utility
        y = x.y;
        x = x.x;
      }

      var dx = x - this.x;
      var dy = y - this.y;

      for (var i = 0; i < 7; i++) {

        dx = mathSign(dx);
        dy = mathSign(dy);

        //console.log(i, dx,dy);

        if (!this.obs || !isAt(this.last, this.x + dx, this.y + dy)) {
          if (this.move(dx,dy)) {
            this.obs = i > 0;
            return true;
          }
        }

        var tmp = (dx+dy);  // turn left
        dy = (dy-dx);
        dx = tmp;

        //console.log(i, dx,dy);
      }

      return false;
    };

    Bot.prototype.canMine = function() {
      if (GAME.world.get(this).t === TILES.MINE) {  // use world.canMine?
        if (this.E >= 1 && this.S < this.mS) {
          return true;
        }
      }
      return false;
    };

    Bot.prototype.mine = function() {
      if (GAME.world.get(this).t === TILES.MINE) {  // use world.canMine?
        if (this.E >= 1 && this.S < this.mS) {
          this.E--;
          var dS = GAME.world.dig(this);  // TODO: bot effeciency
          dS = this.load(dS);
          GAME.stats.S += dS;
          return dS;
        }
      }
      return false;
    };

    Bot.prototype.load = function(dS) {  // dE?
      var s = this.S;
      this.S = Math.min(s + dS, this.mS);
      return this.S - s;
    };

    Bot.prototype.unload = function() {  // dE?
      var l = this.S;
      this.S = 0;
      return l;
    };

    var _name = _F('name');

    function findScript(name) {  // todo: move, default?
      var scripts = GAME.scripts.filter(_name.eq(name));  // todo: find first or change scriots to hash
      return (scripts.length > 0) ? scripts[0] : undefined;
    }

    Bot.prototype.setCode = function(script) {

      if (script === null) {
        this.scriptName = null;
        this.$script = null;
        return null;
      }

      if (typeof script === 'string') {
        script = findScript(script);
      }

      if (!script) {
        $log.error('Script not found');
        return;
      }

      this.scriptName = script.name;
      this.$script = script;
      this.message = '';
      return script;
    };

    Bot.prototype.run = function() {  // delete?
      this.message = '';
      this.manual = false;
    };

    Bot.prototype.stop = function() {  // delete?
      this.manual = true;
    };

    Bot.prototype.takeTurn = function(dT) {
      //var self = this;

      GAME.stats.E += this.charge(this.chargeRate()*dT);

      if(this.scriptName !== null && this.halted === false) {

        //if (!this.$script || this.$script.name !== this.scriptName) {
        var script =  this.setCode(this.scriptName);  // should only need to do when scritName changes
        //}
        //var code = this.$script.code;

        //console.log(this, GAME.scripts);

        var ret = sandBox.run(script, this.$bot);
        if (ret !== true) {
          this.error(ret);
        }

      }

    };

    Bot.prototype.chargeBot = function(bot) {
      if (isAt(bot, this)) { // TODO: charging range?
        var e = Math.min(10, this.E);  // TODO: charging speed
        e = bot.charge(e);
        this.E -= e;
        return e;
      }
      return false;
    };

    Bot.prototype.unloadTo = function(bot) {
      if (isAt(bot, this)) {// TODO: unloading range?
        var s = this.unload();
        var l = bot.load(s);
        this.load(s-l);
        return l;
      }
      return 0;
    };

    Bot.prototype.canUpgrade = function() {
      return this.S >= 10;
    };

    Bot.prototype.upgrade = function() {
      if (this.S >= 10) {
        this.S -= 10;
        this.mS += 10;
        this.mE += 10;
        if (this.mS >= 100) {
          this.t = TILES.BASE;
        }
      }
    };

    Bot.prototype.canConstruct = function() {
      return this.S >= 100;
    };

    Bot.prototype.construct = function(script) {
      if (this.S >= 100) {
        var bot = new Bot('Rover', this.x, this.y);
        bot.scriptName = script || null;
        //bot.manual = !angular.isDefined(script);
        bot.$home = this;

        this.S -= 100;
        GAME.bots.push(bot);
        return bot;
      }
      return null;
    };

    Bot.prototype.canRelocate = function() {
      return this.E >= 500;
    };

    Bot.prototype.scan = function() {  // used?
      return GAME.world.scan(this);
    };

    Bot.prototype.scanList = function(_) {  // TODO: move, GAME.scanFrom?, optimize
      var self = this;
      var l = GAME.scanList(_).filter(function(r) {
        return r !== self;
      });

      if (l.length === 0) { return []; }

      l.forEach(function(d) {
        var dx = d.x - self.x;
        var dy = d.y - self.y;
        d.r = Math.max(Math.abs(dx),Math.abs(dy));
      });

      return l.sort( function(a, b) {return a.r - b.r; } );
    };

    return Bot;
  });

})();
