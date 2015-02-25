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

    // add a component, key, instance, constructor
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
    };

    Entity.prototype.$off = function() {
      this.$$eventEmitter.off.apply(this.$$eventEmitter, arguments);
      return this;
    };

    Entity.prototype.$emit = function() {
      this.$$eventEmitter.emit.apply(this.$$eventEmitter, arguments);
      return this;
    };

    return Entity;
  })
  .factory('EcsFactory', function($log, $timeout, Entity) {

    function Ecs(opts) {
      this.components = {};
      this.systems = {};
      this.entities = [];
      this.families = {};

      this.$timer = null;
      this.$playing = false;
      this.$delay = 1000;
      this.$interval = 1;

      angular.extend(this, opts);
    }

    Ecs.prototype.$c = function(key, instance) {
      this.components[key] = instance;
    };


    function getFamilyIdFromRequire(require) {
      if (!require) { return '::'; }
      return require.join('::');
    }

    Ecs.prototype.$s = function(key, instance) {
      this.systems[key] = instance;
      var fid = getFamilyIdFromRequire(instance.$require);
      instance.$family = this.families[fid] = this.families[fid] || [];
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

      e.$on('add', function(e,k) { self.$onComponentAdd(e,k); });
      e.$on('remove', function(e,k) { self.$onComponentRemove(e,k); });

      this.entities.push(e);
      return e;
    };

    function remove(arr, instance) {  // maybe move to a class prototype?
      var index = arr.indexOf(instance);
      if (index > -1) {
        arr.splice(index,1);
      }
    }

    function add(arr, instance) {
      var index = arr.indexOf(instance);
      if (index < 0) {
        arr.push(instance);
      }
    }

    Ecs.prototype.$$removeEntity = function(instance) {
      var self = this;

      instance.$world = null;

      instance.$off('add', this.$onComponentAdd);
      instance.$off('remove', this.$onComponentRemove);

      angular.forEach(instance, function(value, key) {
        if (self.components[key]) {
          self.$onComponentRemove(instance, key);
        }
      });

      angular.forEach(this.families, function(family) {
        remove(family, instance);
      });

      remove(this.entities, instance);

    };

    function matchEntityToFamily(entity, require) {
      if (!require) { return true; }

      var fn = function(d) {
        return entity.hasOwnProperty(d);
      };
      return require.every(fn);
    }

    Ecs.prototype.$onComponentAdd = function(entity, key) {
      $log.debug('$onComponentAdd', entity, key);
      angular.forEach(this.systems, function(system) {

        if (system.$require && system.$require.indexOf(key) < 0) { return; }
        if (!matchEntityToFamily(entity, system.$require))  { return; }

        if (system.$addEntity) {
          system.$addEntity(entity);
        }

        add(system.$family, entity);

      });
    };

    Ecs.prototype.$onComponentRemove = function(entity, key) {
      $log.debug('$onComponentRemoved', entity, key);
      angular.forEach(this.systems, function(system) {

        if (!system.$require || system.$require.indexOf(key) < 0) { return; }

        if (system.$removeEntity) {
          system.$removeEntity(entity);
        }

        remove(system.$family, entity);

      });
    };

    Ecs.prototype.$update = function(time) {
      var self = this;
      time = angular.isUndefined(time) ? self.$interval : time;
      angular.forEach(this.systems, function(system) {
        //console.log(time);
        if (system.$update && system.$family.length > 0) {
          system.$update(time);
        }
      });
    };

    Ecs.prototype.$start = function() {
      if (this.$playing) { return; }

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
