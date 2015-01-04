'use strict';

angular.module('myApp')
  .factory('SandBox', function($log) {

    var acorn = true;

    $log.debug(acorn ? 'Using acorn' : 'Using Function');

    function SandBox(bot) {
      var self = this;

      this.interpreter = (acorn) ? new window.Interpreter(bot.code) : null;  // do I really need a new interpreter to create objects?

      this.bot = bot;
      this.home = {x: 20, y: 10}; // hack

      if (acorn) {
        this.$bot = this.interpreter.createObject(this.interpreter.OBJECT);
        this.$home = this.interpreter.createObject(this.interpreter.OBJECT);

        this.$log = function() {
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
      setProps(this.$home, this.home);

    };

    SandBox.prototype.setup = function() {
      var self = this;

      var interpreter = this.interpreter;

      function createPrimitive(r) {
        return acorn ? interpreter.createPrimitive(r) : r;
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

      function $$move(x,y) {
        x = toNumber(x);
        y = toNumber(y);
        var r = self.bot.move(x,y);

        self.update();

        return createPrimitive(r);
      }

      function $$moveTo(x,y) {
        x = toNumber(x);
        y = toNumber(y);
        var r = self.bot.moveTo(x,y);

        self.update();

        return createPrimitive(r);
      }

      function $$mine() {
        var r = self.bot.mine();
        self.update();
        return createPrimitive(r);
      }

      function $$unload() {
        var r = self.bot.unloadTo(self.home);
        self.update();
        return createPrimitive(r);
      }

      function $$charge() {
        var r = self.home.chargeBot(self.bot);
        self.update();
        return createPrimitive(r);
      }

      function $$scan() {  // not working in acorn
        //var r = interpreter.createObject(interpreter.ARRAY);
        var r = self.scan();
        self.update();
        return createPrimitive(r);
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

      //setMethod('$x',$$x);
      //setMethod('$y',$$y);
    };

    SandBox.prototype.run = function(bot, home) { // bot is not needed, don't pass home
      var self = this;

      var code = this.bot.code;

      this.home = home;  // hack

      function initScope(interpreter, scope) {

        interpreter.setProperty(scope, '$bot', self.$bot, true);
        interpreter.setProperty(scope, '$home', self.$home, true);
        interpreter.setProperty(scope, '$log',interpreter.createNativeFunction(self.$log));

      }

      if (acorn) {
        self.update();
        new window.Interpreter(code, initScope).run();
      } else {

        self.update();

        /*jshint -W054 */
        var fn = new Function('$log', '$bot', '$home', code);  // todo: move to setup?
        /*jshint +W054 */

        fn.call(this,self.$log,self.$bot,self.$home);
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
  .factory('Bot', function (isAt, TILES, Interpreter, $log, SandBox) {

    function Bot(name,world,x,y) {  // TODO: move speed, mine speed, storage cap, energy cap, carge rate
      this.name = name;
      this.world = world;

      this.t = TILES.BOT;

      this.x = x;
      this.y = y;
      //this.dEdX = 1;

      this.S = 0;      // Raw material storage
      this.mS = 10;    // Maximum
      this.dS = 1;     // Mining ability

      this.E = 0;     // Energy
      this.dE = 0.01;    // Charging rate
      this.mE = 10;   // Maximum

      this.manual = true;
      this.code = '';

      this.sandBox = new SandBox(this);

      this.message = '';
    }

    Bot.prototype.charge = function(dE) {
      if (arguments.length < 1) {
        dE = this.dE;
      }
      var e = this.E;
      this.E = +Math.min(e + dE, this.mE).toFixed(2);
      return this.E - e;
    };

    Bot.prototype.isAt = function(x,y) {
      return isAt(this,x,y);
    };

    Bot.prototype.moveCost = function() {
      return this.mS/20 + this.mE/20;
    };

    Bot.prototype.canMove = function(dx,dy) {  // TODO: check range

      dx = Math.sign(dx);
      dy = Math.sign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));
      var dE = this.moveCost()*dr;

      return this.world.canMove(this.x + dx,this.y + dy) && this.E >= dE;
    };

    Bot.prototype.move = function(dx,dy) {  // TODO: check range

      dx = Math.sign(dx);
      dy = Math.sign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));
      var dE = this.moveCost()*dr;

      if (this.world.canMove(this.x + dx,this.y + dy)) {  // Need to check bot skills, check path
        if (this.E >= dE) {
          this.x += dx;
          this.y += dy;
          this.E -= dE;

          this.world.scan(this);
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

      return this.move(dx,dy);
    };

    Bot.prototype.canMine = function() {
      if (this.world.get(this).t === TILES.MINE) {  // use world.canMine?
        if (this.E >= 1 && this.S < this.mS) {
          return true;
        }
      }
      return false;
    };

    Bot.prototype.mine = function() {
      if (this.world.get(this).t === TILES.MINE) {  // use world.canMine?
        if (this.E >= 1 && this.S < this.mS) {
          this.E--;
          var dS = this.world.dig(this);  // TODO: bot effeciency
          return this.load(dS);
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

    Bot.prototype.setCode = function(code) {
      code = code || this.code;
      this.code = code;  // todo: do initial check
    };

    Bot.prototype.run = function() {
      this.setCode(this.code);
      this.manual = false;
    };

    Bot.prototype.stop = function() {
      this.manual = true;
    };

    Bot.prototype.error = function(msg) {
      this.message = msg;
      this.manual = true;
    };

    Bot.prototype.takeTurn = function(dT, main) {
      this.charge(this.dE*dT);

      if(!this.manual) {

        try {
          this.sandBox.run(this, main.home);
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

    Bot.prototype.scan = function() {  // dE cost?
      return this.world.scan(this);
    };

    return Bot;
  });
