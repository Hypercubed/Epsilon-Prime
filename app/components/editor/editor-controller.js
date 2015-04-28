/* global ace:true */
/* global _F:true */

(function() {
  'use strict';

  angular.module('ePrime')
  .controller('EditorCtrl', function($log, $modalInstance, initialScriptId, defaultScripts, GAME, aether, modals) {

    var editor = this;

    editor.code = '';
    editor.name = initialScriptId;

    editor.scripts = GAME.scripts;

    editor.load = function(_) {
      editor.name = _ || '';
      editor.code = GAME.scripts[_] ? GAME.scripts[_].code : '';
    };

    editor.reset = function(form) {
      if (form) {
        form.$setPristine();
        form.$setUntouched();
        form.code.$error = {};
      }
      editor.load(editor.name);
    };

    editor.resetToDefaultScripts = function() {
      angular.copy(defaultScripts, GAME.scripts);
    };

    editor.new = function(name, code) {
      name = name || 'new';
      code = code || 'console.log($bot.name, $bot.x, $bot.y);';

      editor.name = name;
      editor.code = code;
    };

    editor.delete = function(_) {
      if (typeof _ !== 'string') {
        _ = _.name;
      }
      delete GAME.scripts[_];
    };

    var _message = _F('message');

    editor.validate = function(code, form) {

      form.code.$error.syntaxError = false;
      if (code && code.length > 0) {
        aether.transpile(code);

        if (aether.problems.errors.length > 0) {
          form.code.$error.syntaxError = aether.problems.errors.map(_message).join('\n');
        }
      }

    };

    editor.save = function(_) {
      _ = _ || editor.name;

      GAME.scripts[_] = GAME.scripts[_] || {};
      GAME.scripts[_].code = editor.code;
      GAME.scripts[_].$method = null;

      $modalInstance.close(_);
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
