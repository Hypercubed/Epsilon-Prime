/* global ace:true */
/* global _F:true */

(function() {
  'use strict';

  angular.module('ePrime')
  .controller('EditorCtrl', function($log, $modalInstance, initialScriptId, defaultScripts, GAME, aether, modals) {

    var editor = this;

    editor.script = {};
    editor.scripts = GAME.scripts;

    editor.load = function(_) {
      if (typeof _ === 'string') {
        _ = GAME.scripts[_];
      }
      angular.copy(_, editor.script);
    };

    editor.reset = function(form) {
      if (form) {
        form.$setPristine();
        form.$setUntouched();
        form.code.$error = {};
      }
      editor.load(initialScriptId);
    };

    editor.resetToDefaultScripts = function() {
      angular.copy(defaultScripts, GAME.scripts);
    };

    editor.new = function(name, code) {
      name = name || 'new';
      code = code || 'console.log($bot.name, $bot.x, $bot.y);';
      editor.script = {name: name, code: code };
    };

    editor.delete = function(_) {
      if (typeof _ !== 'string') {
        _ = _.name;
      }
      delete GAME.scripts[_];
    };

    var _message = _F('message');

    editor.validate = function(script, form) {

      form.code.$error.syntaxError = false;
      if (script.code && script.code.length > 0) {
        aether.transpile(script.code);

        if (aether.problems.errors.length > 0) {
          form.code.$error.syntaxError = aether.problems.errors.map(_message).join('\n');
        }
      }

    };

    editor.save = function(_) {
      _ = _ || editor.script.name;

      GAME.scripts[_] = GAME.scripts[_] || {};
      angular.copy(editor.script, GAME.scripts[_]);  // todo: ssCopy
      GAME.scripts[_].$method = null;

      $modalInstance.close();
    };

    editor.aceLoaded = function(_editor){
      var _session = _editor.getSession();

      _editor.setShowPrintMargin(false);

      _session.setUseWrapMode(false);

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
