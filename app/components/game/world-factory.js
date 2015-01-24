/* global noise:true */

(function() {
  'use strict';

  /* Private functions */

  function modulo(x,n) {
    return ((x%n)+n)%n;
  }

  function perlin(x,y,N) {
    var z = 0, s = 0;
    for (var i = 0; i < N; i++) {
      var pp = 1/Math.pow(2,i)/4
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

angular.module('myApp')
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
  .factory('Chunk', function () {
    function Chunk(_, X, Y) {

      //console.log(_);

      if (Array.isArray(_)) {
        this.length = _.length;
        this.size = Math.sqrt(_.length);
        this.view = new Uint8ClampedArray(_);
      } else {
        this.size = _;
        this.length = _*_;
        this.view = new Uint8ClampedArray(this.length);
      }

      this.X = Math.floor(X);  // store offset rather than index?
      this.Y = Math.floor(Y);
      this.hash = 0;
    }

    Chunk.prototype.id = function() {
      return this.X+','+this.Y;
    }

    Chunk.prototype.index = function(x,y) {
      var s = this.size;
      x = modulo(Math.floor(x),s); //Math.floor(x) % s;   // not working when x < -2*s
      y = modulo(Math.floor(y),s); //Math.floor(y) % s;
      return y*s+x;
    };

    Chunk.prototype.get = function(x,y) {
      if (arguments.length === 2) {
        x = this.index(x,y);
      }
      return String.fromCharCode(this.view[x]);
    };

    Chunk.prototype.set = function(x,y,z) {
      if (arguments.length === 3) {
        x = this.index(x,y);
      } else {
        z = y;
      }
      this.view[x] = z.charCodeAt(0);
      this.hash++;
      return this;
    };

    return Chunk;
  })
  .factory('World', function ($log, TILES, Chunk) {

    /* constants */
    var digYield = poisson(1.26);
    var mineMTTF = 0.05;

    function World(size, seed) {  // todo: landmarks
      this.size = size = size || 60;
      this.seed = seed || Math.random();
      this.$$chunks = {};
    }

    World.prototype.getChunkId = function(x,y) {  // should be in chunk?
      var X = Math.floor(x / this.size);  // chunk
      var Y = Math.floor(y / this.size);
      return X+','+Y;
    };

    World.prototype.getChunk = function(x,y) {  // todo: chunks object
      var id = this.getChunkId(x,y);
      var chunk = this.$$chunks[id];
      if (!chunk) {
        $log.debug('new chunk',id);
        chunk = new Chunk(this.size, x / this.size, y / this.size);
        this.$$chunks[chunk.id()] = chunk;
      }
      return chunk;
    };

    World.prototype.getIndex = function(x,y) {  // used?
      var X = Math.floor(x), Y = Math.floor(y);
      X = X % this.size; Y = Y % this.size;
      return Y*this.size+X;
    };

    World.prototype.getHeight = function(x,y) {
      noise.seed(this.seed);  // move this
      return perlin((x-30)/this.size,(y-10)/this.size,5);
    };

    World.prototype._get = function(x,y) {
      var chunk = this.getChunk(x,y);
      return chunk.get(x,y);
    };

    World.prototype._set = function(x,y) {
      var chunk = this.getChunk(x,y);
      return chunk.set(x,y,z);
    };

    World.prototype.scanTile = function(x,y) {
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

      return {x: x, y: y, t: tile, s: true};   // todo: improve storage, store only strings again?
    };

    World.prototype.set = function(x,y,z) {  // used?
      var chunk = this.getChunk(x,y);
      chunk.set(x,y,z);
    };

    World.prototype.get = function(x,y) {  // rename getTile
      if (arguments.length === 1) {
        y = x.y;
        x = x.x;
      }
      //if (x < 0 || x >= this.size) { return null; } // Git rid of this...
      //if (y < 0 || y >= 40) { return null; }

      var z = this._get(x,y);

      if (z === TILES.EMPTY) {
        return {x: x, y: y, t: z, s: false};
      }
      return this.scanTile(x,y);
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
      var xs = this.size;  // need to limit region??
      var ys = this.size;
      var r = [];
      for(var i = 0; i < xs; i++) {
        for(var j = 0; j < ys; j++) {
          var t = this.get(i,j);
          if (t !== null && t.t !== TILES.EMPTY) {
            r.push(t);
          }
        }
      }
      return r;
    };

    World.prototype.scanList = function() {  // list of all excisting tiles
      var self = this;

      var xs = this.size;
      var ys = this.size;

      var r = [];
      angular.forEach(this.$$chunks,function(chunk,key) {  // do better, need to limit range
        //console.log(key);
        var X = chunk.X*xs;
        var Y = chunk.Y*ys;
        for(var i = X; i < X+xs; i++) {
          for(var j = Y; j < Y+ys; j++) {
            var t = self.get(i,j);
            //console.log(t);
            if (t !== null && t.t !== TILES.EMPTY) {
              r.push(t);
            }
          }
        }
      });
      return r;
    };

    World.prototype.dig = function(x,y) {
      if (arguments.length === 1) {
        y = x.y;
        x = x.x;
      }
      if (this.canMine(x,y)) {

        var dS = digYield();
        if (dS > 0 && Math.random() < mineMTTF) {
          this.set(x,y,TILES.HOLE);
        }
        return dS;
      }
      return 0;
    };

    World.prototype.canMine = function(x,y) {
      return this.scanTile(x,y).t === TILES.MINE;
    };

    World.prototype.canMove = function(x,y) {  //TODO: change to cost
      var t = this.get(x,y);
      return t !== null && t.t !== TILES.MOUNTAIN;
    };

    return World;
  });
})();


