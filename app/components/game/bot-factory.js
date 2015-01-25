'use strict';

/*
function filter(t, fun) {
var res = [];
var len = t.length;
for (var i = 0; i < len; i++) {
var val = t[i];
if (fun(val, i, t)) {
res.push(val);
}
}

return res;
}
*/

var collect = (function random($bot) {
$bot.unload();
$bot.charge();

if ($bot.S >=  $bot.mS) {
  var home = $bot.find('@');
  $bot.moveTo(home.x,home.y);
} else {
  if ($bot.E >= 1 && $bot.mine() === false) {
    var mine = $bot.find('X');

    var x,y;
    if (mine !== null) {
      x = mine.x;
      y = mine.y;
    } else {
      x = 3*Math.random()-1+$bot.x;
      y = 3*Math.random()-1+$bot.y;
    }
    $bot.moveTo(x,y);
  }
}


}).toString();

collect = collect.substring(collect.indexOf('{') + 1, collect.lastIndexOf('}'));

angular.module('myApp')
  .constant('defaultScripts', [   // make a servioce, add Construct script
    //{ name: 'Debug', code: '$log($bot.name, $bot.x, $bot.y);' },
    { name: 'Upgrade', code: '$bot.upgrade();' },
    { name: 'Construct', code: '$bot.construct();' },
    //{ name: 'Go Home', code: '$bot.moveTo($home.x,$home.y);' },
    { name: 'Collect', code: collect }//,
    //{ name: 'Test', code: '$log($bot.list())' }
  ])
  .factory('SandBox', function($log, Interpreter) {

    var GAME = null;  // later the game service

    var acorn = false;
    var N = 1000;  // Maximum execution steps per turn, used only when acorn is enabled

    $log.debug(acorn ? 'Using acorn' : 'Using Function');

    function SandBox(bot, _GAME) {
      var self = this;

      GAME = GAME || _GAME;

      this.interpreter = (acorn) ? new window.Interpreter(bot.$$code) : null;  // do I really need a new interpreter to create objects?

      this.bot = bot;
      //GAME = GAME;

      //this.home = {x: 20, y: 10}; // hack

      if (acorn) {
        this.$bot = this.interpreter.createObject(this.interpreter.OBJECT);
        this.$home = this.interpreter.createObject(this.interpreter.OBJECT);

        this.$log = function() {
          //$log.debug(arguments);
          var args = Array.prototype.slice.call(arguments,0).map(function(arg) {
            return arg.toString() || '';
          });
          var r = console.log.apply(console, args);
          return self.interpreter.createPrimitive(r);
        };

      } else {
        this.$bot = {};
        this.$home = {};

        this.$log = function() {
          console.log.apply(console, arguments);
        };
      }

      this.setup();

    }

    SandBox.prototype.update = function() {
      var interpreter = this.interpreter;

      function setProps($obj, obj) {
        ['name','x','y','S','mS','E','mE'].forEach(function(prop) {
          if (acorn) {
            interpreter.setProperty($obj, prop, interpreter.createPrimitive(obj[prop]), false);
          } else {
            $obj[prop] = obj[prop];
          }
        });
      }

      setProps(this.$bot, this.bot);
      //setProps(this.$home, this.home);

    };

    SandBox.prototype.setup = function() {
      var self = this;
      var bot = this.bot;
      //var GAME = GAME;
      //var home = GAME.bots[0];  // todo: not this

      var interpreter = this.interpreter;

      function create(r) {
        if (Array.isArray(r)) {
          return createArray(r);
        } else if (typeof r === 'object') {
          return createObject(r);
        } else {
          return createPrimitive(r);
        }
      }

      function createPrimitive(r) {
        return acorn ? interpreter.createPrimitive(r) : r;
      }

      function createArray(r) {
        if (acorn) {
          var newArray = self.interpreter.createObject(self.interpreter.ARRAY);
          for (var i = 0; i < r.length; i++) {
            newArray.properties[i] = create(r[i]);
          }
          newArray.length = i;
          //console.log(o);
          return newArray;
        } else {
          return angular.copy(r);
        }
      }

      function createObject(r) {
        if (acorn) {
          var o = interpreter.createObject(interpreter.OBJECT);
          for (var prop in r) {
            interpreter.setProperty(o, prop, create(r[prop]));
          }
          return o;
        } else {
          return angular.copy(r);
        }
      }

      function __createObject(r, p) {
        if (acorn) {
          var o = interpreter.createObject(interpreter.OBJECT);
          p.forEach(function(prop) {
            interpreter.setProperty(o, prop, create(r[prop]));
          });
          return o;
        } else {
          var o = {};
          p.forEach(function(k) {
            o[k] = r[k];
          });
          return o;
        }
      }

      function setMethod(prop, fn) {
        if (acorn) {
          interpreter.setProperty(self.$bot, prop, interpreter.createNativeFunction(fn));
        } else {
          self.$bot[prop] = fn;
        }
      }

      function toNumber(x) {
        if (acorn) {
          return x.toNumber();
        } else {
          return x;
        }
      }

      function toString(x) {
        if (acorn) {
          return x.toString();
        } else {
          return x;
        }
      }

      function $$move(x,y) {
        x = toNumber(x);
        y = toNumber(y);
        var r = bot.move(x,y);

        self.update();

        return createPrimitive(r);
      }

      function $$moveTo(x,y) {
        x = toNumber(x);
        y = toNumber(y);
        var r = bot.moveTo(x,y);

        self.update();

        return createPrimitive(r);
      }

      function $$mine() {
        var r = bot.mine();
        self.update();
        return createPrimitive(r);
      }

      function $$unload() {
        var home = GAME.bots[0];
        var r = bot.unloadTo(home); // todo: unload to where?
        self.update();
        return createPrimitive(r);
      }

      function $$charge() {
        var home = GAME.bots[0];
        var r = home.chargeBot(bot);
        self.update();
        return createPrimitive(r);
      }

      function $$scan() {  // not working in acorn
        //var r = interpreter.createObject(interpreter.ARRAY);
        var r = self.scan();
        self.update();
        return createPrimitive(r);
      }

      function $$upgrade() {  // not working in acorn
        bot.upgrade();
      }

      function $$construct() {  // not working in acorn
        bot.construct('Collect');
      }

      function $$list() {  // not working in acorn
        var r = bot.scanList();
        return createArray(r);
      }

      function $$find(_) {  // not working in acorn
        var r = bot.scanList().filter(function(d) { return d.t === _; });
        //console.log(r);
        if (r.length > 0) {
          var o = __createObject(r[0], ['x','y']);
          return o;
        } else {
          return create(null);
        }
      }

      /* function $$x() {  // not working in acorn
        //var r = interpreter.createObject(interpreter.ARRAY);
        var r = self.bot.x;
        return createPrimitive(r);
      }

      function $$y() {  // not working in acorn
        //var r = interpreter.createObject(interpreter.ARRAY);
        var r = self.bot.y;
        return createPrimitive(r);
      } */

      setMethod('move',$$move);
      setMethod('moveTo',$$moveTo);
      setMethod('mine',$$mine);
      setMethod('scan',$$scan);
      setMethod('unload',$$unload);
      setMethod('charge',$$charge);
      setMethod('upgrade',$$upgrade);
      setMethod('construct',$$construct);
      //setMethod('list',$$list);
      setMethod('find',$$find);

      //setMethod('$x',$$x);
      //setMethod('$y',$$y);
    };

    SandBox.prototype.run = function() {
      //console.log('SandBox.prototype.run');
      var self = this;
      //var bot = this.bot;
      //var GAME = GAME;

      var scriptName = this.bot.scriptName;
      var scripts = GAME.scripts.filter(function(script) {  // todo: move this.
        return script.name === scriptName;
      });

      if (scripts.length < 1) {
        $log.error('Script not found');
        return;
      }

      var code = scripts[0].code;

      //this.home = this.bot.$home;  // hack

      function initScope(interpreter, scope) {

        //self.setup();

        interpreter.setProperty(scope, '$bot', self.$bot, true);
        //interpreter.setProperty(scope, '$home', self.$home, true);
        interpreter.setProperty(scope, '$log',interpreter.createNativeFunction(self.$log));

      }

      if (acorn) {
        self.update();
        this.interpreter = new Interpreter(code, initScope);

        var c = 0;
        while(c < N && this.interpreter.step()) { c++; } // same as .run();, check for > 1000 steps adjust if needed
        //console.log('steps', c);
      } else {

        self.update();

        /*jshint -W054 */
        var fn = new Function('$log', '$bot', code);  // todo: move to setup?, trap infinite loops?
        /*jshint +W054 */

        fn.call(this,self.$log,self.$bot);
      }

    };

    return SandBox;
  })
  .value('isAt', function isAt(obj,x,y) {
    if (angular.isObject(x)) {
      return x.x === obj.x && x.y === obj.y;
    }
    return x === obj.x && y === obj.y;
  })
  .value('Interpreter', window.Interpreter)
  .factory('Bot', function (isAt, TILES, Interpreter, $log, SandBox, defaultScripts) {

    var GAME = null;  // later the GAME service

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

      this.manual = true;  // rename auto?
      this.active = false;

      this.message = '';
      this.scriptName = '';

      this.$$script = null;  // used
      this.$$sandBox = new SandBox(this, GAME);
    }

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
    var I = 0.1; // moves per turn for base
    var E = 2/3;  // surface/volume exponent
    var N = CHAR*I/(Math.pow(20, E));  // normilization factor

    Bot.prototype.chargeRate = function() {
      return N*Math.pow(this.mass(), E);
    };

    Bot.prototype.canMove = function(dx,dy) {  // TODO: check range

      dx = Math.sign(dx);
      dy = Math.sign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));
      var dE = this.moveCost()*dr;

      return GAME.world.canMove(this.x + dx,this.y + dy) && this.E >= dE;
    };

    Bot.prototype.move = function(dx,dy) {  // TODO: check range

      dx = Math.sign(dx);
      dy = Math.sign(dy);  // max +/-1

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

      if (angular.isObject(x)) {  // TODO: Utility
        y = x.y;
        x = x.x;
      }

      var dx = x - this.x;
      var dy = y - this.y;

      for (var i = 0; i < 7; i++) {

        dx = Math.sign(dx);
        dy = Math.sign(dy);

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
          GAME.S += dS;
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

    Bot.prototype.setCode = function(script) {
      //script = script || this.script;
      this.scriptName = script.name;
      //this.script = script;  // todo: do initial check
    };

    Bot.prototype.run = function() {
      this.message = '';
      this.manual = false;
    };

    Bot.prototype.stop = function() {
      this.manual = true;
    };

    Bot.prototype.error = function(msg) {
      this.message = msg;
      this.manual = true;
    };

    Bot.prototype.takeTurn = function(dT) {
      GAME.E += this.charge(this.chargeRate()*dT);

      if(!this.manual) {

        try {
          this.$$sandBox.run();
        } catch(err) {
          var m = err.stack;
          console.log('User script error', err.message, m);
          //m = m.match(/<anonymous>:[0-9]+:[0-9]+/)[0].replace('<anonymous>:','');  // TODO: fix line number
          this.error(err.message+', '+m);
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

    Bot.prototype.upgrade = function() {
      if (this.S >= 10) {
        this.S -= 10;
        this.mS += 5;
        this.mE += 5;
      }
    };

    Bot.prototype.construct = function(script) {
      if (this.S >= 100) {
        var bot = new Bot('Rover', this.x, this.y);
        bot.scriptName = script || 'Collect';
        bot.manual = !angular.isDefined(script);
        bot.$home = this;

        this.S -= 100;
        GAME.bots.push(bot);
        return bot;
      }
      return null;
    };

    Bot.prototype.scan = function() {  // dE cost?
      return GAME.world.scan(this);
    };

    Bot.prototype.scanList = function() {  // move, GAME.scanFrom?
      var self = this;
      var l = GAME.scanList();
      l.forEach(function(d) {
        var dx = d.x - self.x;
        var dy = d.y - self.y;
        d.r = Math.max(Math.abs(dx),Math.abs(dy));
      });

      return l.sort( function(a, b) {return a.r - b.r; } );
    };

    return Bot;
  });
