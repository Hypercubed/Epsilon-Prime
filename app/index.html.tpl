<!doctype html>
<html class="no-js">
  <head>
    <meta charset="utf-8">
    <title>ε-prime, a (4-1)εX programming game</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width">
    <!-- Place favicon.ico and apple-touch-icon.png in the root directory -->
    <link rel="icon" type="image/x-icon" href="favicon.ico">

    <!-- build:css(.) components/vendor.css -->
    <!-- bower:css -->
    <link rel="stylesheet" href="bower_components/bootstrap/dist/css/bootstrap.css" />
    <link rel="stylesheet" href="bower_components/angular-xeditable/dist/css/xeditable.css" />
    <link rel="stylesheet" href="bower_components/bootstrap-material-design/dist/css/material.css" />
    <link rel="stylesheet" href="bower_components/bootstrap-material-design/dist/css/ripples.css" />
    <link rel="stylesheet" href="bower_components/angular-hotkeys/build/hotkeys.min.css" />
    <link rel="stylesheet" href="bower_components/font-awesome/css/font-awesome.css" />
    <!-- endbower -->
    <!-- endbuild -->
    <!-- build:css(.tmp) components/main.css -->
    <link rel="stylesheet" href="components/app.css">
    <link rel="stylesheet" href="components/main/main.css">
    <link rel="stylesheet" href="components/main/grid.css">
    <link rel="stylesheet" href="components/editor/editor.css">
    <link rel="stylesheet" href="components/list/list.css">
    <!-- endbuild -->
  </head>
  <body ng-app="ePrime">
    <!--[if lt IE 7]>
      <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
    <![endif]-->

    <div ng-view=""></div>

    <!-- Google Analytics: change UA-XXXXX-X to be your site's ID -->
     <script>
       (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
       (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
       m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
       })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

       ga('create', '<%- ga %>');
       ga('send', 'pageview');
    </script>

    <!-- build:js(.) components/oldieshim.js -->
    <!--[if lt IE 9]>
    <script src="bower_components/es5-shim/es5-shim.js"></script>
    <script src="bower_components/json3/lib/json3.js"></script>
    <![endif]-->
    <!-- endbuild -->

    <!-- build:js(.) components/vendor.js -->
    <!-- bower:js -->
    <script src="bower_components/jquery/dist/jquery.js"></script>
    <script src="bower_components/angular/angular.js"></script>
    <script src="bower_components/bootstrap/dist/js/bootstrap.js"></script>
    <script src="bower_components/angular-sanitize/angular-sanitize.js"></script>
    <script src="bower_components/angular-animate/angular-animate.js"></script>
    <script src="bower_components/angular-touch/angular-touch.js"></script>
    <script src="bower_components/angular-route/angular-route.js"></script>
    <script src="bower_components/angular-bootstrap/ui-bootstrap-tpls.js"></script>
    <script src="bower_components/ace-builds/src-min-noconflict/ace.js"></script>
    <script src="bower_components/angular-ui-ace/ui-ace.js"></script>
    <script src="bower_components/angular-messages/angular-messages.js"></script>
    <script src="bower_components/noisejs/perlin.js"></script>
    <script src="bower_components/angular-xeditable/dist/js/xeditable.js"></script>
    <script src="bower_components/bootstrap-material-design/dist/js/material.js"></script>
    <script src="bower_components/bootstrap-material-design/dist/js/ripples.js"></script>
    <script src="bower_components/angular-hotkeys/build/hotkeys.min.js"></script>
    <script src="bower_components/localforage/dist/localforage.js"></script>
    <script src="bower_components/angular-localforage/dist/angular-localForage.js"></script>
    <script src="bower_components/d3/d3.js"></script>
    <script src="bower_components/_F/_F.js"></script>
    <script src="bower_components/SandboxJS/Sandbox.js"></script>
    <script src="bower_components/moment/moment.js"></script>
    <script src="bower_components/angular-moment/angular-moment.js"></script>
    <script src="bower_components/lodash/dist/lodash.compat.js"></script>
    <script src="bower_components/aether/build/aether.js"></script>
    <script src="bower_components/ng-debounce/angular-debounce.js"></script>
    <!-- endbower -->
    <!-- endbuild -->

        <!-- build:js({.tmp,app}) components/scripts.js -->
        <script src="components/main/grid.js"></script>
        <script src="components/app.js"></script>
        <script src="components/app-config.js"></script>
        <script src="components/game/ecs-factory.js"></script>
        <script src="components/game/world-factory.js"></script>
        <script src="components/game/bot-factory.js"></script>
        <script src="components/game/game-service.js"></script>
        <script src="components/main/main-controller.js"></script>
        <script src="components/panels/panel-controllers.js"></script>
        <script src="components/modals/modal-controllers.js"></script>
        <script src="components/list/list-directive.js"></script>
        <script src="components/editor/editor-controller.js"></script>
        <!-- endbuild -->

</body>
</html>
