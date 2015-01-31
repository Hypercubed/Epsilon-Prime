/* global ace:true */
/* global _F:true */

(function() {
  'use strict';

  angular.module('myApp')
  .controller('EditorCtrl', function($log, $modalInstance, initialScriptId, GAME, aether) {

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

      form.code.$error.syntaxError = false;
      if (script.code && script.code.length > 0) {
        aether.transpile(script.code);

        //console.log(aether.problems);

        if (aether.problems.errors.length > 0) {
          form.code.$error.syntaxError = aether.problems.errors.map(_F('message')).join('\n');
        }
      }

    };

    editor.save = function() {
      GAME.scripts = angular.copy(editor.scripts);
      GAME.scripts.forEach(function(d) {
        d.$method = null;
      });
      $modalInstance.close();
    };

    editor.aceLoaded = function(_editor){
      var _session = _editor.getSession();
      _session
          .setUndoManager(new ace.UndoManager());

      _session
        .setTabSize(2);
    };

    editor.reset();

  });
})();
