/* global ace:true */
/* global _F:true */

(function() {
  'use strict';

  angular.module('ePrime')
  .controller('EditorCtrl', function($log, $modalInstance, initialScriptId, defaultScripts, GAME, aether, modals) {

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

    editor.resetToDefaultScripts = function() {

      defaultScripts.forEach(function(script) {
        for (var i = 0; i < editor.scripts.length; i++) {
          if (editor.scripts[i].name === script.name) {
            angular.copy(script, editor.scripts[i]);
            return;
          }
        }
        editor.scripts.push(angular.copy(script));
      });

      //console.log(GAME.scripts);
      //angular.extend(editor.scripts, defaultScripts);
      //console.log(GAME.scripts);
      //editor.reset(form);
    };

    editor.new = function(name, code) {
      name = name || 'new';
      code = code || '$log($bot.name, $bot.x, $bot.y);';
      editor.script = {name: name, code: code };
      editor.scripts.push(editor.script);
      deDupNames();
    };

    editor.delete = function(script) {
      var index = editor.scripts.indexOf(script);
      editor.scripts.splice(index,1);
      if (editor.script === script) {
        editor.script = editor.scripts[index < editor.scripts.length ? index : 0];
      }
    };

    function deDupNames() {
      var names = editor.scripts.map(_F('name'));

      editor.scripts.forEach(function(d,i) {  // cheap way to unique names
        while (names.indexOf(d.name) < i) {
          d.name = names[i] = d.name+'*';
        }
      });
    }

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
      deDupNames();

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

    editor.help = function() {
      modals.openHelp('components/modals/api-help-model.html');
    };

    editor.reset();

  });
})();
