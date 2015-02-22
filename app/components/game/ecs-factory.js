/* global _F:true */

(function() {
  'use strict';

  angular.module('ePrime')
  .factory('Entity', function() {

    var _uuid = 0;
    function uuid() {
      var timestamp = new Date().getUTCMilliseconds();
      return '' + _uuid++ + '_' + timestamp;
    }

    function Entity(id) {
      this._id = id || uuid();
    }

    Entity.prototype.$add = function(key, instance) {
      this[key] = this[key] || {};
      //console.log(key, instance);
      if (instance) {
        this[key] = angular.extend(instance, this[key]);
      }
      // add callback
    };

    Entity.prototype.$remove = function(key) {
      delete this[key];
      // remove call back
    };

    return Entity;
  })
  .factory('EcsFactory', function(Entity, $timeout) {

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

    Ecs.prototype.$c = function(key, value) {
      this.components[key] = value;
    };

    Ecs.prototype.$s = function(key, value) {
      this.systems[key] = value;
    };

    Ecs.prototype.$e = function(id, instance) {
      var self = this;

      if (typeof id === 'object') {
        instance = id;
        id = null;
      }
      var e = new Entity(id);

      if (Array.isArray(instance)) {
        instance.forEach(function(key) {
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
          }
        });

      }

      this.$onComponentAdd(e);
      this.entities.push(e);
      return e;
    };

    Ecs.prototype.$onComponentAdd = function(entity) {
      //console.log('$onComponentAdd', this);
      angular.forEach(this.systems, function(system) {
        if (system.$addEntity) {
          // todo: check requires
          system.$addEntity(entity);
        }
      });
    };

    Ecs.prototype.$update = function(time) {
      var self = this;
      time = time || this.$interval;
      angular.forEach(this.systems, function(system) {
        if (system.$update) {
          // todo: check requires
          system.$update(self.entities, time);
        }
      });
    };

    Ecs.prototype.$start = function() {
      if (this.$playing) {return;}

        var self = this;

        self.$playing = true;

        function tick() {
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
