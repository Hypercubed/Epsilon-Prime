/* global _F:true */

(function() {
  'use strict';

  angular.module('ePrime')
  .factory('EventEmitter', function EventEmitter($window) {
    if ($window.EventEmitter2) {
      $window.thirdParty = $window.thirdParty || {};
      $window.thirdParty.EventEmitter2 = $window.EventEmitter2;
      try {
        delete $window.EventEmitter2;
      } catch (err) {
        $window.EventEmitter2 = undefined;
      }
    }
    return $window.thirdParty.EventEmitter2;
  })
  .factory('Entity', function(EventEmitter) {

    var _uuid = 0;
    function uuid() {
      var timestamp = new Date().getUTCMilliseconds();
      return '' + _uuid++ + '_' + timestamp;
    }

    function Entity(id) {
      this._id = id || uuid();
      this.$$eventEmitter = new EventEmitter();
    }

    Entity.prototype.$add = function(key, instance) {
      this[key] = this[key] || {};
      if (instance) {
        this[key] = angular.extend(instance, this[key]);
      }
      this[key].$parent = this;
      this.$$eventEmitter.emit('add', this, key);
    };

    Entity.prototype.$remove = function(key) {
      delete this[key];
      this.$$eventEmitter.emit('remove', this, key);
    };

    Entity.prototype.$on = function() {
      this.$$eventEmitter.on.apply(this.$$eventEmitter, arguments);
      return this;
    }

    Entity.prototype.$emit = function() {
      this.$$eventEmitter.emit.apply(this.$$eventEmitter, arguments);
      return this;
    }

    return Entity;
  })
  .factory('EcsFactory', function($log, $timeout, Entity) {

    function Ecs(opts) {
      this.components = {};
      this.systems = {};
      this.entities = [];
      //this.families = {}; // TODO

      this.$timer = null;
      this.$playing = false;
      this.$delay = 1000;
      this.$interval = 1;

      angular.extend(this, opts);
    }

    Ecs.prototype.$c = function(key, instance) {
      this.components[key] = instance;
    };

    Ecs.prototype.$s = function(key, instance) {
      this.systems[key] = instance;
      instance.$family = [];
    };

    Ecs.prototype.$e = function(id, instance) {
      var self = this;

      if (typeof id === 'object') {
        instance = id;
        id = null;
      }
      var e = new Entity(id);
      e.$world = this;

      if (Array.isArray(instance)) {
        instance.forEach(function(key) {  // TODO: like below
          var component = self.components[key];
          e.$add(key, angular.copy(component));
        });
      } else {

        angular.extend(e, instance);

        angular.forEach(e, function(value, key) {
          var Component = self.components[key];
          if (Component) {
            if (typeof Component === 'function') {
              Component = new Component();
            } else {
              Component = angular.copy(Component);
            }
            e.$add(key, Component);
            self.$onComponentAdd(e, key);
          }
        });

      }

      e.$on('add', function(e, key) {
        self.$onComponentAdd(e, key);
      });

      e.$on('remove', function(e, key) {
        self.$onComponentRemove(e, key);
      });

      this.entities.push(e);
      return e;
    };

    function matchEntityToFamily(entity, requires) {
      if (!requires) { return true; }

      var fn = function(d) {
        return entity.hasOwnProperty(d);
      };
      return requires.every(fn);
    }

    Ecs.prototype.$onComponentAdd = function(entity, key) {
      $log.debug('$onComponentAdd', entity, key);
      angular.forEach(this.systems, function(system) {

        if (system.$require && system.$require.indexOf(key) < 0) { return; }

        if (matchEntityToFamily(entity, system.$require)) {
          var index = system.$family.indexOf(entity);
          if (index < 0) {
            system.$family.push(entity);
            if (system.$addEntity) {
              system.$addEntity(entity);
            }
          }
        }

      });
    };

    Ecs.prototype.$onComponentRemove = function(entity, key) {
      $log.debug('$onComponentRemoved', entity, key);
      angular.forEach(this.systems, function(system) {

        if (!system.$require || system.$require.indexOf(key) < 0) { return; }

        var index = system.$family.indexOf(entity);
        if (index > -1) {
          system.$family.splice(index,1);
          if (system.$removeEntity) {
            system.$removeEntity(entity);
          }
        }

      });
    };

    Ecs.prototype.$update = function(time) {
      var self = this;
      time = angular.isUndefined(time) ? self.$interval : time;
      angular.forEach(this.systems, function(system) {
        //console.log(time);
        if (system.$update && system.$family.length > 0) {
          system.$update(self.entities, time);
        }
      });
    };

    Ecs.prototype.$start = function() {
      if (this.$playing) {return;}

        var self = this;

        self.$playing = true;

        function tick() {
          //console.log('tick', self);
          self.$update(self.$interval);
          self.$timer = $timeout(tick, self.$delay); // make variable
        }

        tick();
      };

      Ecs.prototype.$stop = function() {
        this.$playing = false;
        if (this.$timer) {$timeout.cancel(this.$timer);}
      };

      return Ecs;

    });

})();
