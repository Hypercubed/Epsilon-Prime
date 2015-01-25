/* global ace:true */
/* global acorn:true */

'use strict';

/**
* @ngdoc function
* @name myApp.controller:MainCtrl
* @description
* # MainCtrl
* Controller of the myApp
*/

angular.module('myApp')
  .controller('EditorCtrl', function($log, $modalInstance, initialScriptId, GAME) {

    var editor = this;

    editor.set = function(script) {
      editor.script = script;
    };

    editor.reset = function(form) {
      if (form) {
        form.$setPristine();
        form.$setUntouched();
        form.code.$error = {};
      }
      editor.scripts = angular.copy(GAME.scripts);
      editor.script = editor.scripts[initialScriptId || 0];
    };

    editor.new = function() {
      editor.script = {name: 'new', code: '$log($bot.name, $bot.x, $bot.y);' };
      editor.scripts.push(editor.script);
    };

    editor.update = function(script, form) {

      try {
        $log.debug('Validate');

        acorn.parse(script.code);

        if (form) {
          form.$setPristine();
          form.$setUntouched();
        }

      } catch(err) {
        form.code.$error.syntaxError = err.message;
      }

    };

    //editor.cancel = function(form) {
    //  $modalInstance.dismiss('cancel');
    //};

    editor.save = function(form) {
      GAME.scripts = angular.copy(editor.scripts);
      //console.log(GAME.scripts, editor.scripts);
      $modalInstance.close();
    };

    /* editor.reset = function(form) {
      if (form) {
        form.$setPristine();
        form.$setUntouched();
        form.code.$error = {};
      }
      editor.script = angular.copy(editor.master);
    };



    editor.set = function(script) {
      editor.master = script;
      editor.reset();
    };

    editor.update = function(script, form) {

      try {
        $log.debug('Validate');

        editor.master.ast = acorn.parse(script.code);
        angular.extend(editor.master, script);

        if (form) {
          form.$setPristine();
          form.$setUntouched();
        }

      } catch(err) {
        form.code.$error.syntaxError = err.message;
      }

    }; */

    editor.aceLoaded = function(_editor){
      _editor
        .getSession()
        .setUndoManager(new ace.UndoManager());
    };

    editor.reset();

  });
