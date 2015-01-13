/* global ace:true */

'use strict';

/**
* @ngdoc function
* @name myApp.controller:MainCtrl
* @description
* # MainCtrl
* Controller of the myApp
*/

angular.module('myApp')
  .controller('EditorCtrl', function($log, GAME, Interpreter) {

    var editor = this;

    editor.scripts = GAME.scripts;
    editor.master = editor.scripts[0];

    editor.new = function() {
      editor.master = {name: '', code: '$log($bot.name, $bot.x, $bot.y);' };
      editor.scripts.push(editor.master);
      editor.reset();
    };

    editor.set = function(script) {
      editor.master = script;
      editor.reset();
    };

    editor.update = function(script, form) {

      try {
        $log.debug('Validate', script.code);

        new Interpreter(script.code);
        angular.extend(editor.master, script);

        if (form) {
          form.$setPristine();
          form.$setUntouched();
        }

      } catch(err) {
        form.code.$error.syntaxError = err.message;
      }

    };

    editor.reset = function(form) {
      if (form) {
        form.$setPristine();
        form.$setUntouched();
        form.code.$error = {};
      }
      editor.script = angular.copy(editor.master);
    };

    editor.aceLoaded = function(_editor){
      // Editor part
      var _session = _editor.getSession();
      //var _renderer = _editor.renderer;

      // Options
      //_session.setOption('firstLineNumber', 3);
      _session.setUndoManager(new ace.UndoManager());

    };

    editor.reset();

  })
