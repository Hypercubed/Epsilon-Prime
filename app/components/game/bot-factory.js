(function(window, document, undefined) {

  // Helps minimization
  var True = true;
  var False = false;
  var Eval = 'eval';

  // A Boolean flag that, when set, determines whether or not the browser
  // supports setting the '__proto__' property on the Window object.
  // Firefox, for example, supports __proto__ on other Objects, but not Window.
  var supportsProto;

  // The list of properties that should NOT be removed from the global
  // window instance, even if the "bare" parameter is set to `true`.
  var INSTANCE_PROPERTIES_WHITELIST = {
    "parseInt":undefined, "parseFloat":undefined,
    "JSON":undefined,
    "Array":undefined, "Boolean":undefined, "Date":undefined, "Function":undefined, "Number":undefined, "Object":undefined, "RegExp":undefined, "String":undefined,
    "Error":undefined, "EvalError":undefined, "RangeError":undefined, "ReferenceError":undefined, "SyntaxError":undefined, "TypeError":undefined, "URIError":undefined,
    "setTimeout":undefined, "clearTimeout":undefined, "setInterval":undefined, "clearInterval":undefined,
    "eval":undefined, "execScript":undefined,
    "undefined":undefined,
    "escape":undefined, "unescape":undefined,
    "encodeURI":undefined, "encodeURIComponent":undefined, "decodeURI":undefined, "decodeURIComponent":undefined,
    "NaN":undefined, "Infinity":undefined, "Math":undefined,
    "isNaN":undefined, "isFinite":undefined,
    // Unfortunately, the 'location' property makes the 'iframe' attempt to go
    // to a new URL if this is set, so we can't touch it. It must stay, and must
    // not be a variable name used by scripts.
    "location":undefined,
    // 'document' is needed for the current "load" implementation.
    // TODO: Figure out a better way to inject <script> tags into the iframe.
    "document":undefined
  };

  var INSTANCE_PROPERTIES_BLACKLIST = [
  'constructor',
  'Window', 'DOMWindow',
  'XMLHttpRequest'
  ];


  /**
  * The 'Sandbox' constructor. Accepts a 'bare' parameter, which defaults
  * to 'true'. If set to true, the sandbox instance is attempted to be stripped
  * of all additional browser/DOM objects and functions.
  * @constructor
  */
  function Sandbox(bare) {

    // The 'bare' parameter determines whether or not the sandbox scope should
    // be attempted to be cleared out of any extra browser/DOM objects and functions.
    // `true` attempts to make the sandbox as close to a 'bare' JavaScript
    // environment as possible, and `false` leaves things like 'alert' available.
    bare = bare !== False ? True : False;
    this['bare'] = bare;

    // Append to document so that 'contentWindow' is accessible
    var iframe = document.createElement("iframe");
    // Make the 'iframe' invisible, so it doesn't affect the HTML layout.
    iframe.style.display = "none";

    // use technique described here http://paulirish.com/2011/surefire-dom-element-insertion/
    // to allow us to insert before the body tag has been loaded
    var ref = document.getElementsByTagName('script')[0];
    ref.parentNode.insertBefore(iframe, ref);

    // Get a reference to the 'global' scope, and document instance
    var windowInstance = iframe['contentWindow'], documentInstance = windowInstance['document'];
    this['global'] = windowInstance;

    // Get a 'binded' eval function so we can execute arbitary JS inside the
    // new scope.
    documentInstance['open']();
    documentInstance['write'](
      "<script>"+
      "var MSIE/*@cc_on =1@*/;"+ // sniff
      "_e=MSIE?this:{eval:function(s){return window.eval(s)}}"+
      "<\/script>");
      documentInstance['close']();
      var evaler = windowInstance['_e'];
      this[Eval] = function(s) {
        return evaler[Eval](s);
      }
      try {
        delete windowInstance['_e'];
      } catch(ex) {
        this[Eval]('delete _e');
      }

      // Define the "load" function, which returns a Script instance that
      // will be executed inside the sandboxed 'scope'.
      this['load'] = function(filename, callback) {
        var str = "_s = document.createElement('script');"+
        "_s.setAttribute('type','text/javascript');"+
        "_s.setAttribute('src','"+filename.replace(/'/g, "\\'")+"');";
        if (callback) {
          function cb(e) {
            if (cb.called) return; // Callback already executed...
              if (!this.readyState || /complete|loaded/i.test(this.readyState)) {
                cb.called = True;
                callback(e);
              }
            }
            this[Eval](str);
            windowInstance['_s'].onload = windowInstance['_s'].onreadystatechange = cb;
            str = "";
          }
          this[Eval](str + "document.getElementsByTagName('head')[0].appendChild(_s);delete _s;");
        }

        // Synchronous load using XHR. This is discouraged.
        this['loadSync'] = function(filename) {
          throw new Error("NOT YET IMPLEMENTED: Make a GitHub Issue if you need this...");
        }

        if (bare) {
          // The scope that an iframe creates for us is polluted with a bunch of
          // DOM and window properties. We need to try our best to remove access to
          // as much of the default 'window' as possible, and provide the scope with
          // as close to a 'bare' JS environment as possible. Especially 'parent'
          // needs to be restricted, which provides access to the page's global
          // scope (very bad!).

          // Collect all the 'whitelisted' properties in an obj, we'll use it after
          // the scope has been cleaned out to ensure they all exist
          var allowed = {};
          for (var i in INSTANCE_PROPERTIES_WHITELIST) {
            allowed[i] = windowInstance[i];
          }

          if (supportsProto === True) {
            windowInstance['__proto__'] = Object.prototype;
          } else if (supportsProto === False) {
            obliterateConstructor.call(this, windowInstance);
          } else {
            function fail() {
              //console.log("browser DOES NOT support '__proto__'");
              supportsProto = False;
              obliterateConstructor.call(this, windowInstance);
            }
            try {
              // We're gonna test if the browser supports the '__proto__' property
              // on the Window object. If it does, then it makes cleaning up any
              // properties inherited from the 'prototype' a lot easier.
              if (windowInstance['__proto__']) {
                var proto = windowInstance['__proto__'];
                proto['_$'] = True;
                if (windowInstance['_$'] !== True) {
                  fail();
                }
                windowInstance['__proto__'] = Object.prototype;
                if (!!windowInstance['_$']) {
                  // If we set '__proto__', but '_$' still exists, then setting that
                  // property is not supported on the 'Window' at least, resort to obliteration.
                  delete proto['_$'];
                  windowInstance['__proto__'] = proto;
                  fail();
                }
                // If we got to here without any errors being thrown, and without "fail()"
                // being called, then it seems as though the browser supports __proto__!
                if (supportsProto !== False) {
                  //console.log("browser supports '__proto__'!!");
                  supportsProto = True;
                }
              }
            } catch(e) {
              fail();
            }
          }

          // Go through all the iterable global properties in the sandboxed scope,
          // and obliterate them as long as they're not on the whitelist.
          for (var i in windowInstance) {
            if (i in INSTANCE_PROPERTIES_WHITELIST) continue;
            obliterate(windowInstance, i);
          }

          // Ensure that anything on the BLACKLIST is gone
          for (var i=0, l=INSTANCE_PROPERTIES_BLACKLIST.length; i<l; i++) {
            var prop = INSTANCE_PROPERTIES_BLACKLIST[i];
            if (prop in INSTANCE_PROPERTIES_WHITELIST) continue;
            obliterate(windowInstance, prop);
          }

          // We might have obliterated some whitelist properties on accident,
          // copy over the global scope's copies if we did
          for (var i in INSTANCE_PROPERTIES_WHITELIST) {
            if (!!windowInstance[i]) continue;
            windowInstance[i] = allowed[i];
          }
          allowed = null;

        }

        // Inside the sandbox scope, use the 'global' property if you MUST get a reference
        // to the sandbox's global scope (in reality, the 'iframe's Window object). This is
        // encouraged over the use of 'window', since that seems impossible to hide in all
        // browsers.
        windowInstance['global'] = windowInstance;
      }

      function obliterate(obj, prop) {
        try {
          delete obj[prop];
          if (!obj[prop]) return;
        } catch(e){}
        try {
          obj[prop] = undefined;
          if (!obj[prop]) return;
        } catch(e){}
        var value;
        if ("__defineGetter__" in obj) {
          try {
            obj.__defineGetter__(prop, function() {
              return value;
            });
            obj.__defineSetter__(prop, function(v) {
              value = v;
            });
          } catch(ex) {}
        }
        try {
          obj[prop] = undefined;
        } catch(ex) {}
      }

      function obliterateConstructor(windowInstance) {
        //console.log("attempting to obliterate the constructor's prototype");
        var windowConstructor = windowInstance['constructor'] || windowInstance['DOMWindow'] || windowInstance['Window'],
        windowProto = windowConstructor ? windowConstructor.prototype : windowConstructor['__proto__'];
        if (windowProto) {
          for (var i in windowProto) {
            try {
              delete windowProto[i];
            } catch(e){}
          }
          for (var i in windowProto) {
            obliterate(windowProto, i);
          }
        } else {
          //console.log("could not find 'prototype'");
        }
      }

      // Make visible to the global scope.
      window['Sandbox'] = Sandbox;

    })(window, document)



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
  .service('sandBox', function($log) {  // move, create tests

    var sandBox = this;

    var $logInterface = function() {
      console.log.apply(console, arguments);
    };

    var _sandBox = new Sandbox();
    _sandBox.global.$log = $logInterface;

    sandBox.run = function(code, $bot) {

      _sandBox.global.$bot = $bot;
      //console.log(_sandBox.eval('$loggg($bot)'));

      try {  // move try/catch to sandbox

        _sandBox.eval(code);

        /*jshint -W054 */
        //var fn = new Function('$log', '$bot', code);  // todo: move to setup?, trap infinite loops?  don't create each time.
        /*jshint +W054 */

        //fn.call(this,$logInterface,$bot);  // todo: safer sandbox
      } catch(err) {
        var m = err.stack;
        console.log('User script error', err.message, m);
        return err.message+', '+m;
      }

      return true;

    };

    return sandBox;
  })
/*  .factory('_SandBox', function($log, Interpreter) {

    var GAME = null;  // later the game service

    var acorn = false;
    var N = 1000;  // Maximum execution steps per turn, used only when acorn is enabled

    $log.debug(acorn ? 'Using acorn' : 'Using Function');

    function createInterface(bot) {
      var $bot = {};

      return $bot;
    }

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

        /*jshint -W054 *
        var fn = new Function('$log', '$bot', code);  // todo: move to setup?, trap infinite loops?
        /*jshint +W054 *

        fn.call(this,self.$log,self.$bot);
      }

    };

    return SandBox;
  }) */
  .value('isAt', function isAt(obj,x,y) {
    if (angular.isObject(x)) {
      return x.x === obj.x && x.y === obj.y;
    }
    return x === obj.x && y === obj.y;
  })
  //.value('Interpreter', window.Interpreter)
  .factory('Bot', function (isAt, TILES, $log, sandBox, defaultScripts) {

    var GAME = null;  // later the GAME service

    function createInterface(bot) {  // move?
      var $bot = {};

      ['name','x','y','S','mS','E','mE'].forEach(function(prop) {
        Object.defineProperty($bot, prop, {
          get: function() {return bot[prop]; }
        });
      });

      $bot.move = function $$move(x,y) {
        return bot.move(x,y);
      };

      $bot.moveTo = function $$moveTo(x,y) {
        return bot.moveTo(x,y);
      };

      $bot.mine = function $$mine() {
        return bot.mine();
      };

      $bot.unload = function $$unload() {  // should unload to co-located @
        var home = GAME.bots[0];
        return bot.unloadTo(home);
      };

      $bot.charge = function $$charge() {  // should charge to co-located @
        var home = GAME.bots[0];
        return home.chargeBot(bot);
      };

      $bot.upgrade = function $$upgrade() {
        bot.upgrade();
      };

      $bot.construct = function $$construct() {
        bot.construct('Collect');
      };

      $bot.find = function $$find(_) {
        var r = bot.scanList().filter(function(d) { return d.t === _; }); // move, speed up
        return (r.length > 0) ? r[0] : null;
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

      this.manual = true;  // rename auto?
      this.active = false;

      this.message = '';
      this.scriptName = '';

      this.$script = null;
      this.$bot = createInterface(this);

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

    var _name = _F('name');

    function findScript(name) {  // todo: move, default?
      var scripts = GAME.scripts.filter(_name.eq(name));  // todo: find first or change scriots to hash
      return (scripts.length > 0) ? scripts[0] : undefined;
    }

    Bot.prototype.setCode = function(script) {

      if (typeof script === 'string') {
        script = findScript(script);
      }

      if (!script) {
        $log.error('Script not found');
        return;
      }

      this.scriptName = script.name;
      return this.$script = script;
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
      var self = this;

      if (!this.$script || this.$script.name !== this.scriptName) {
        this.setCode(this.scriptName);
      }
      var code = this.$script.code;

      GAME.E += this.charge(this.chargeRate()*dT);

      if(!this.manual) {

        var ret = sandBox.run(code, this.$bot);
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
