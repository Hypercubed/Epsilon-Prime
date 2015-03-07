/* global noise:true */
/* global d3:true */
/* global _F:true */

(function() {
  'use strict';

  /* Private functions */

  function modulo(x,n) {
    return ((x%n)+n)%n;
  }

  function perlin(x,y,N) {
    var z = 0, s = 0;
    for (var i = 0; i < N; i++) {
      var pp = 1/Math.pow(2,i)/4;
      var e = Math.PI/2*pp;  // rotate angle
      var ss = Math.sin(e);
      var cc = Math.cos(e);
      var xx = (x*ss+y*cc);  // rotation
      var yy = (-x*cc+y*ss);
      s += pp; // total amplitude
      z += pp*Math.abs(noise.perlin2(xx/pp,yy/pp));
    }
    return 2*z/s;
  }

  function poisson(mean) {
    var limit = Math.exp(-mean);

    return function() {
      var n = 0,
      x = Math.random();

      while(x > limit){
        n++;
        x *= Math.random();
      }
      return n;
    };
  }

angular.module('ePrime')
  .value('TILES', {
    EMPTY: String.fromCharCode(0),
    MOUNTAIN: '#',
    FIELD: '·',
    MINE: 'X',
    HILL: ',',
    BOT: 'A',
    BASE: '@',
    HOLE: 'O'
  })
  .factory('Chunk', function () {  // todo: Chunk component should be view and hash, move position to position component
    var SIZE = 60;
    var LEN = 60*60;

    function Chunk(_, X, Y) {

      _ = Array.isArray(_) ? _ : LEN;
      this.view = new Uint8ClampedArray(_);

      this.X = Math.floor(X);  // store offset rather than index?
      this.Y = Math.floor(Y);
      this.hash = 0;
    }

    Chunk.prototype.id = function() {
      return this.X+','+this.Y;
    };

    //Chunk.prototype.index = function(x,y) {  // check x and y are in bounds?
    //  x = modulo(Math.floor(x),SIZE); //Math.floor(x) % s;   // not working when x < -2*s
    //  y = modulo(Math.floor(y),SIZE); //Math.floor(y) % s;
    //  return y*SIZE+x;
    //};

    Chunk.prototype.get = function(x,y) {
      if (arguments.length === 2) {
        x = Chunk.getIndex(x,y);
      }
      return String.fromCharCode(this.view[x]);
    };

    Chunk.prototype.getTile = function(x,y) {  // here need to make sure I know x and y
      if (angular.isUndefined(y) && angular.isObject(x)) {
        if (angular.isUndefined(x.x) || angular.isUndefined(x.y)) {  // todo
          throw 'Invalid object pass to Chunk.getTile';
        }
        y = x.y;
        x = x.x;
      }
      var i = Chunk.getIndex(x,y);
      var z = String.fromCharCode(this.view[i]);
      return Chunk.makeTile(x,y,z);
    };

    Chunk.prototype.set = function(x,y,z) {  // check bounds
      if (arguments.length === 3) {
        x = Chunk.getIndex(x,y);
      } else {
        z = y;
      }
      this.view[x] = z.charCodeAt(0);
      this.hash++;
      return this;
    };

    Chunk.getIndex = function(x,y) {  // todo: if x is index and y is undefined
      if (arguments.length < 2 && angular.isObject(x)) {
        if (angular.isUndefined(x.x) || angular.isUndefined(x.y)) {  // todo
          throw 'Invalid object pass to Chunk.getIndex';
        }
        y = x.y;
        x = x.x;
      }
      x = modulo(Math.floor(x),SIZE); //Math.floor(x) % s;   // not working when x < -2*s
      y = modulo(Math.floor(y),SIZE); //Math.floor(y) % s;
      return y*SIZE+x;
    };

    Chunk.getChunkId = function(x,y) {
      if (angular.isUndefined(y) && angular.isObject(x)) {
        if (angular.isUndefined(x.x) || angular.isUndefined(x.y)) {  // todo
          throw 'Invalid object pass to Chunk.getChunkId';
        }
        y = x.y;
        x = x.x;
      }
      var X = Math.floor(x / SIZE);  // chunk
      var Y = Math.floor(y / SIZE);
      return X+','+Y;
    };

    Chunk.makeTile = function(x,y,z) {  // should return a component object
      return {x: x, y: y, t: z, s: false};  // is s still used?
    };

    return Chunk;
  })
  .run(function(ngEcs, Chunk) {
    ngEcs.$c('chunk', Chunk);

    ngEcs.$s('chunks', {
      $require: ['chunk'],
      $addEntity: function(e) {
        if(false === e.chunk.view instanceof Uint8ClampedArray) {  // ensure view is typed array.. shouldn't need this
          e.chunk.view = new Uint8ClampedArray(e.chunk.view);
        }
      }
    });

  })
  .factory('World', function ($log, TILES, Chunk, ngEcs) {

    // this shoud only be methdos that span across chunks, everything else should be in Chunk component

    /* constants */
    var SIZE = 60;

    var digYield = poisson(1.26);
    var mineMTTF = 0.05;

    var $$chunks = ngEcs.systems.chunks.$family;

    function World(size, seed) {  // todo: remoev size
      this.size = size = size || SIZE;  // remove
      this.seed = seed || Math.random();
    }

    World.prototype.getHash = function() {  // remove shuold use hash per chunk
      return d3.sum($$chunks, _F('chunk.hash'));
    };

    /* World.prototype.getChunkId = function(x,y) {  // should be in chunk?
      var X = Math.floor(x / SIZE);  // chunk
      var Y = Math.floor(y / SIZE);
      return X+','+Y;
    }; */

    World.prototype.getChunk = function(x,y) {  // makes chunks object
      var id = Chunk.getChunkId(x,y);
      var e = ngEcs.entities[id];
      if (!e) {
        $log.debug('new chunk',id);
        var chunk = new Chunk(this.size, x / this.size, y / this.size);
        e = ngEcs.$e(id, { chunk: chunk });
      }
      return e.chunk;
    };

    /* World.prototype.getIndex = function(x,y) {  // used, replace with Chunk.getIndex
      if (angular.isObject(x)) {
        y = x.y;
        x = x.x;
      }
      var X = Math.floor(x), Y = Math.floor(y);
      X = X % SIZE; Y = Y % SIZE;
      return Y*SIZE+X;
    }; */

    World.prototype.getHeight = function(x,y) {  // move?
      noise.seed(this.seed);  // move this
      return perlin((x-30)/SIZE,(y-10)/SIZE,4);
    };

    /* World.prototype._get = function(x,y) {  // returns tile
      return this.getChunk(x,y).get(x,y);
    };

    World.prototype._set = function(x,y,z) {  // sets tile, improve by getting index once
      return this.getChunk(x,y).set(x,y,z);
    }; */

    World.prototype.scanTile = function(x,y) {  // returns tile object
      var chunk = this.getChunk(x,y);
      var tile = chunk.get(x,y);  // maybe chunk should return charcode

      if (tile === TILES.EMPTY) {  // new tile
        var z = this.getHeight(x,y);

        tile = TILES.FIELD;
        if (z > 0.60) {
          tile = TILES.MOUNTAIN;
        } else if (Math.random() > 0.98) {
          tile = TILES.MINE;
        }

        chunk.set(x,y,tile);
      }

      return Chunk.makeTile(x,y,tile);   // todo: improve storage, store only strings again?
    };

    World.prototype.set = function(x,y,z) {  // get rid of this, does't work if  x is object
      this.getChunk(x,y).set(x,y,z);
    };

    //function makeTile(x,y,z) {  // move to chunk component
    //  return {x: x, y: y, t: z, s: false};
    //}

    World.prototype.get = function(x,y) {  // rename getTile, move to Chunk, does't work if  x is object
      return this.getChunk(x,y).getTile(x,y);
    };

    World.prototype.scanRange = function(x,y,R) {
      if (arguments.length < 3) {
        R = y;
        y = x.y;
        x = x.x;
      }
      R = R || 2;
      var r = [];
      for(var i = x-R; i <= x+R; i++) {
        for(var j = y-R; j <= y+R; j++) {  // to check range
          var d = Math.sqrt((x-i)*(x-i)+(y-j)*(y-j));
          if (d < R) {
            var t = this.scanTile(i,j);
            r.push(t);
          }
        }
      }
      return r;
    };

    World.prototype._scanList = function() {
      var r = [];
      for(var i = 0; i < SIZE; i++) {
        for(var j = 0; j < SIZE; j++) {
          var t = this.get(i,j);
          if (t !== null && t.t !== TILES.EMPTY) {
            r.push(t);
          }
        }
      }
      return r;
    };

    World.prototype.scanList = function(_) {  // list of all existing tiles
      if (angular.isDefined(_) && '#.XO'.indexOf(_) < 0) { return []; }

      var r = [];

      for (var k in $$chunks) {
        var chunk = $$chunks[k].chunk;

        var X = chunk.X*SIZE,
            Y = chunk.Y*SIZE;

        var XE = X+SIZE,
            YE = Y+SIZE;

        for(var x = X; x < XE; x++) { // try other way around  index -> x,y
          for(var y = Y; y < YE; y++) {
            var z = chunk.get(x,y);
            if (z !== TILES.EMPTY) {
              if (!_ || z === _) {
                r.push(Chunk.makeTile(x,y,z));
              }
            }
          }
        }
      }

      return r;
    };

    World.prototype.dig = function(x,y) {  // move, rewrite to use Chunk.getIndex

      if (arguments.length === 1) {
        y = x.y;
        x = x.x;
      }

      var chunk = this.getChunk(x,y);

      var z = chunk.get(x,y);

      if (z === TILES.MINE) {

        var dS = digYield();
        if (dS > 0 && Math.random() < mineMTTF) {
          chunk.set(x,y,TILES.HOLE);
        }
        return dS;
      }
      return 0;
    };

    World.prototype.canMine = function(x,y) {  // this should not be here? improve
      return this.getChunk(x,y).get(x,y) === TILES.MINE;
    };

    World.prototype.canMove = function(x,y) {  // move
      var t = this.get(x,y);
      return t !== null && t.t !== TILES.MOUNTAIN;
    };

    return World;
  });
})();
