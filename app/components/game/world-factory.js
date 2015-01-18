/* global noise:true */


'use strict';

angular.module('myApp')
  .value('TILES', {
    MOUNTAIN: '#',
    FIELD: '.',
    MINE: 'X',
    HILL: ',',
    BOT: 'A',
    BASE: '@',
    HOLE: 'O'
  })
  .factory('World', function (TILES) {

    function Chunk(size) {
      this.size = size;
      this.length = size*size;
      this.hash = 0;

      this.view = new Uint8Array(this.length);
    }

    Chunk.prototype.index = function(x,y) {
      var X = Math.floor(x), Y = Math.floor(y);
      X = X % this.size; Y = Y % this.size;
      return Y*this.size+X;
    };

    Chunk.prototype.get = function(x,y) {
      if (arguments.length === 2) {
        x = this.index(x,y);
      }
      return this.view[x];
    };

    Chunk.prototype.set = function(x,y,z) {
      if (arguments.length === 3) {
        x = this.index(x,y);
      } else {
        z = y;
      }
      this.view[x] = z;
      this.hash++;
      return this;
    };

    function World(size, seed) {  // todo: landmarks
      this._size = size || 60;
      this.seed = seed || Math.random();

      this.size = [size,size]; // todo: remove

      this.chunk = new Chunk(this._size);
    }

    World.prototype.getChunk = function(x,y) {  // todo: chunks object
      return this.chunk;
    };

    /* World.prototype.getHeight = function(x,y) {
      return this.getChunk(x,y).get(x,y);
    };*/

    World.prototype.getHeight = function(x,y) {
      noise.seed(this.seed);  // move this
      return perlin(x/this._size,y/this._size,5);  // one byte
    };

    World.prototype.scanTile = function(x,y) {
      var chunk = this.getChunk(x,y);
      var z = chunk.get(x,y);  // maybe chunk shoudl return charcode
      var tile;

      if (z === 0) {  // new tile
        z = this.getHeight(x,y);

        tile = TILES.FIELD;
        if (z > 0.60) {
          tile = TILES.MOUNTAIN;
        } else if (Math.random() > 0.98) {
          tile = TILES.MINE;
        }

        //console.log('new tile',tile);

        chunk.set(x,y,tile.charCodeAt(0));
      } else {
        tile = String.fromCharCode(z);
        //console.log('old tile',tile,z);
      }

      return {x: x, y: y, t: tile, s: true};   // todo: improve storage, store only strings again?
    };

    World.prototype.set = function(x,y,z) {
      var chunk = this.getChunk(x,y);
      chunk.set(x,y,z.charCodeAt(0));
    };

    World.prototype.get = function(x,y) {
      if (arguments.length === 1) {
        y = x.y;
        x = x.x;
      }
      if (x < 0 || x >= this.size[0]) { return null; }
      if (y < 0 || y >= this.size[1]) { return null; }

      var chunk = this.getChunk(x,y);
      var z = chunk.get(x,y);

      if (z === 0) {
        return {x: x, y: y, s: false};
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

    World.prototype.generate = function(xs,ys) {
      xs = xs||60;
      ys = ys||60;

      this.size = [xs, ys];  // cols, rows

      /* var x, y;

      this.map = new Array(xs);       // todo: improve storage

      for(x = 0; x < xs; x++) {  // col
        this.map[x] = new Array(ys);
        for(y = 0; y < ys; y++) { // row
          this.map[x][y] = this.chooseTile(x,y);   // todo: improve storage, store only strings again?
        }
      } */

      return this;
    };

    World.prototype._chooseTile = function(x,y) {  // old
      var pm = 0.01;  // Probability of a mountain
      if (y > 0 && this.map[x][y-1].t === TILES.MOUNTAIN) {
        pm += 0.4;
      }
      if (x > 0 && this.map[x-1][y].t === TILES.MOUNTAIN) {
        pm += 0.4;
      }

      var p;
      var r = Math.random();
      if (r < pm) {
        p = TILES.MOUNTAIN;
      } else if (r > 0.98) {
        p = TILES.MINE;
      } else {
        p = TILES.FIELD;
      }

      return {x: x, y: y, t: p, s: false};   // todo: improve storage, store only strings again?
    };

    World.prototype.scanList = function() {
      var xs = this.size[0];
      var ys = this.size[0];
      var r = [];
      for(var i = 0; i < xs; i++) {
        for(var j = 0; j < ys; j++) {
          var t = this.get(i,j);
          if (t !== null && t.s === true) {
            r.push(t);
          }
        }
      }
      return r;
    };

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

    var digYield = poisson(1.26);
    var mineMTTF = 0.05;

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
