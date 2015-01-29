/* global ace:true */
/* global acorn:true */

(function() {
  'use strict';

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

    editor.save = function() {
      GAME.scripts = angular.copy(editor.scripts);
      //console.log(GAME.scripts, editor.scripts);
      $modalInstance.close();
    };
    
    editor.aceLoaded = function(_editor){
      _editor
      .getSession()
      .setUndoManager(new ace.UndoManager());
    };

    editor.reset();

  });
})();
