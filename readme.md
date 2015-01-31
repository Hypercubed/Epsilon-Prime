# Epsilon-Prime

[![Join the chat at https://gitter.im/Hypercubed/Epsilon-Prime](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Hypercubed/Epsilon-Prime?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Epsilon-prime is inspired by the classic 4x game Empire.  In ε-prime a player will control units to εXplore a procedurally generated world (called ε-prime), εXploit the resource of ε-prime in order to εXpand their army of bots and eventually conquer (εXterminate?) the planet ε-prime.  The player uses units (or bots), controlled either manually or via JavaScript command scripts, to manage energy use and collect resources from the ε-prime environment.  These resources are used to create new units or upgrade existing units.  The players goal is to collect resources in the most efficient manner possible.

![Capture](http://cdn.rawgit.com/Hypercubed/Epsilon-Prime/master/app/images/eprime.png)

## Development status
Epsilon-Prime is under active development.  It is playable now (at http://hypercubed.github.io/Epsilon-Prime/#/), however, many things are likely to be broken or change in a future version.  Player and developer feedback is appreciated... and needed.  If you like the game or the idea please give feedback or encouragement.

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Hypercubed/Epsilon-Prime?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Current Features
* Fog of war.
* "Near-Infinite" procedurally generated terrain.
* Units scripted using player JavaScript.
* Production of new units, upgrade units.
* End game!

## Install  (for developers)
```
git clone https://github.com/Hypercubed/Epsilon-Prime.git
cd Epsilon-Prime
npm install
bower install
grunt serve
```

## How to play
In Epsilon-prime your goal is to conquer the planet of ε-prime.  You do this by commanding an army of bots to explore and exploit the resources or ε-prime.  You can control your bots individually using your mouse and keyboard or by writing command scripts in JavaScript.  The game begins with a simple (and very inefficient) set of scripts for exploring and collecting resources.  Using just these scripts you could complete the game in ~100,000 turns.  But you can you do better!

### Unit list
On the right of the browser window you will see a list of your units.  You begin the game with a base and a rover.  Selecting a bot in the panel will highlight the bot in the bot panel and in the map panel on the left with a blue circle.  Click the right chevron in the unit list to see additional details and control options for the selected bot.

### The map
When starting you will see your base (indicated by an `@` on the map) and a rover (indicated by a `r`).  Around the unit you will see the surrounding territory.  A `.` indicates an accessible space while `#` indicates a region where movement is impossible.  The map can be panned and zoomed using your mouse or touch screen.

### Energy
All units begin with zero energy.  Energy is harvested at a rate indicated by [J/d] in the bot panel, this indicates that amount of energy harvested at the beginning of each turn.  Notice that the base unit has a recharge rate faster than the rover.  A rover may also charge energy from a base bot. Can you use this to your advantage?  Each unit has an current and maximum energy storage indicated by a progress bar in the unit list.

### Movement
Units can move in any of eight directions (see direction keys below).  [J/km] indicates the amount of energy required for movement.  The starting rover requires one unit of energy to move one space while the base requires 100.  Notice that the base has a maximum energy storage equal to its movement cost.  It can move at most one space per turn and only when fully charged.  The rover, however, can move up to 10 spaces when fully charged.  A unit can be moved manually using the bot panel, hot keys, or as directed by command scripts.  A unit can move and mine as many times as desired per turn until energy is depleted.  Energy is not recovered until the next turn.

With a bot selected (indicated by a circle in the map and highlighting in the bot list) you can use the following hotkeys.

Direction keys:
```
QWE
A D
ZXC
```

S - Action key (Mine, charge, unload).

### Taking turns
On the top left is the turn indicator.  This shows the current turn and provides controls for taking turns.  You may take turns one at a time using the `>|` button or automatically cycle through turns using the `>` and `>>` buttons.  Stop turns using the `[ ]`button.

### Resources
Resources are indicated on the map as a `X`.  Once a unit has moved to the same location as the resource it can begin collecting using the buttons in the bot panel, the action hot key (`s`), or by script commands.  A unit can collect resource up to the maximum storage capacity indicated in the bot panel.  The unit storage capacity and maximum capacity is also indicated by a progress bar.  Eventually a resource will become depleted.  A depleted resource is indicated by a `O` on the map.

### Upgrading
Upgrading a unit costs 10 resource units.  After an upgrade the units maximum energy and maximum resource storage capacity each increase by 5 units.  The bots charging rate and movement cost also increase.  A bots movement costs increases faster than its maximum energy storage.  When the movement cost exceeds the maximum energy storage capacity the unit can no longer move.  Your base begins at the threshold of immovability.  If it is upgraded it will no longer be able to move.  Do you upgrade quickly or wait?

### Constructing
Constructing a new unit costs 100 resource units.  This will create a new unit with initial resource and energy storage capacity of 10 units each.  The constructed bot begins with zero energy but can charge from the base.

### Saving
The game is automatically saved to your browser's local storage every 20 turns.  To ensure you don't lose any progress press the ~SAVE~ button in the lower right.  This will save your progress and pause the game (if it is running).  You may now close your browser without losing any progress.

### Scripts
Pressing the ~Scripts~ button on the bottom left will pause the game and open the scripts panel.  If you modify a script in the script panel it will not be applied until you press the save button.  After pressing save any bots currently using this script will automatically start using the new version.  You may also create a new script to apply to select bots.

In the bots list each bot has a dropdown button displaing teh name of teh currently active script. An arrow ">" indicates that this script will run on each turn (see taking turns above). Press the button to toggle the bot script off.  Use the drop-down menu (caret) to change the script.

The starting rover, and any bot created during the game, begin with the random collection script selected by default.  Here is the default collection script:

```
$bot.unload();
$bot.charge();

if ($bot.S >=  $bot.mS) {
  var home = $bot.find('@');
  $bot.moveTo(home.x,home.y);
} else {
  if ($bot.E >= 1 && $bot.mine() === false) {
    var mine = $bot.find('X');

    var x,y;
    if (mine !== null) {
      x = mine.x;
      y = mine.y;
    } else {
      x = 3*Math.random()-1+$bot.x;
      y = 3*Math.random()-1+$bot.y;
    }
    $bot.moveTo(x,y);
  }
}
```

The bot first try to unload its current storage and charge from a base.  If the bot is not located at a base nothing will happen.  Then script then checks if the bots storage is at max, if so it finds the nearest heavy bot and begins navigating towards that position.  If storage is not full and if the bots energy is greater than 1 unit the bot will attempt to mine, if there is no mine the bot will then either try to navigate to the nearest mine or random walk if no mine is visible.  This script is very basic, you can do better.

## $bot properties
* .x, .y   -- Bot x and y positions
* .E, .mE  -- Bot current and maximum energy capacity
* .S, .mS  -- Bot current and maximum storage capacity

## $bot methods

### unload({string="@"})
Attempts to unload storage to another bot.  Unloading is only successful if the units are located in the same space. If a string is provided the bot will attempt to unload to another bot with the matching name, otherwise "@" (a "heavy" bot) is assumed.  If unloading is not possible this method has no effect.

Example:
```
$bot.unload(); 		  // Tries to unload to a heavy unit
$bot.unload('Bob'); // Tries to unload to a bot named 'Bob.
```

### charge({string="@"})
Attempts to charge batteries from another bot.  Charging is only successful if the units are located in the same space. If a string is provided will attempt to unload to a bot with the matching name.  Otherwise "@" (a "heavy" bot) is assumed.  If charging is not possible this method has no effect.

Example:
```
$bot.charge(); 		  // Tries to charge from the heavy unit
$bot.charge('Bob'); // Tries to charge from a bot named 'Bob.
```

### mine()
Attempts to mine at the current location.  Returns the number of resources collected or false if no resource are available.  If mining is not possible this method has no effect.

Example:
```
$bot.mine();
```

### upgrade()
Attempts to upgrade the bot using current resources.  If upgrading is not possible this method has no effect.

Example:
```
$bot.upgrade();
```

### construct({string})
Attempts to construct a new bot using current resources.  If a string is provided the constructed bot will start with the named script, otherwise "Collect" is assumed.  If construction is not possible this method has no effect.

Example:
```
$bot.construct();
$bot.construct("my script");
```

### find({string})
Finds the nearest bot or tile whose name or tile character matches the string.

Example:
```
$bot.find('@');    // Finds the nearest heavy bot
$bot.find('X');	   // Finds the nearest resource cache
$bot.find('Bob');  // Finds the nearest unit named "Bob"
```

### moveTo({number},{number})
Moves towards the given x,y position.  Will perform very basic obstacle avoidance.

Example:
```
$bot.moveTo($bot.x + 5,$bot.y + 5);
var bob = $bot.find('Bob');
$bot.moveTo(bob.x,bob.y);
```

## License
Copyright (c) 2015 Jayson Harshbarger [![Gittip donate button](http://img.shields.io/gratipay/Hypercubed.svg)](https://www.gittip.com/hypercubed/ "Donate weekly to this project using Gittip")

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
