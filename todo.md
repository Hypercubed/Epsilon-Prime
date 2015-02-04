# Todo list

_\( managed using [todo-md](https://github.com/Hypercubed/todo-md) \)_

## Bugs
- [ ] Sometimes base is on top of a mine.
- [x] icon and title missing
- [ ] Script defaults should be "@" not "Base", optimize serach to only serach map if '.X#'.
- [ ] Prevent duplicate scripts with the same name.
- [ ] Valid bot names have length > 1
- [ ] Too slow!
  - [?] $bot.find & World.get needs optimization.
  - [x] Improve d3 drawing, don't remove elements
- [  ] Check GUI Responsiveness to small screens
- [ ] Replace hotkey help with modal dialog
- [ ] Disable hotkeys when paused dialog is shown
- [ ] Upgrade using base resources?
- [ ] j/k should only cycle filtered bots?
- [ ] SVG size

## Next
- [ ] Prevent deploymengt if env !== production in gruntfile
- [ ] Tutorial
- [x] Increase rate?
- [ ] Tests
- [ ] Move bot hot keys to different controller?
- [ ] Option to reset scripts to default code
- [ ] Improve editor save/validation
- [x] ! error icon should open log
- [ ] Remove bot actions in MainCtrl, use main.bot.$bot
- [ ] Change save rate to time not turns?
- [ ] Better handling Aether errors
- [ ] Try other Aether supported languages?
- [ ] Upgrade units using heavy resources?
- [x] $bot.find should search both time and name.
  - [ ] Wildcard?
- [ ] Indicate bot's current target, (and heading, and action?)
- [ ] d3 hover/click dispatch
- [ ] Pan to unit on select
- [ ] Indicate stuck bots?
- [ ] Ensure base starts on plain
- [ ] Clean up classes
- [ ] Implement $bot.log()
- [ ] Improve drawing more?  Draw by chunk.
- [ ] Bot memory?
- [ ] More balancing of gameplay.
- [ ] More Tooltips?
- [ ] Need to indicate when unit is on mine.  Indicate overlapping units.
- [ ] Clean terminology (bots, resources, energy units, etc)

## Decisions
- [x] Start with full energy?
- [ ] Can bot scripts command other bots?  $bot.find('A').moveTo($bot.x,$bot.y);?
- [ ] Limit map and number of bots for performance?
- [ ] Map full screen?
- [ ] Work on small screens.
- [ ] Bots can carry other bots?
- [ ] End game shows easter egg?
- [x] Start with rover, upgrade to base?  Start with base, build first rover?
- [ ] Use ui-router?  Add about screen.
- [ ] Faster bot (drone)? mE = mS = 1 (Can never upgrade using current rules)
- [ ] Allow scripting of change script?  Change, stop, include.
- [x] Upgrade self or upgrade in base?
- [ ] More terrain types (various movement costs?)
- [ ] replace progress bars (with sparkline?)
- [ ] add progress circles to map?
- [x] User rename bots?
  - [ ] User assign labels (A,B,C,...,@)?
- [ ] Map directive?

## Wish list
- [ ] Mining speed/efficency
- [ ] Ensure starting position is not locked
- [ ] Environmental effects (Solar intensity, etc)
- [ ] Async Programming?  Support ES6 in user scripts?
- [ ] Aliens? Alien tech?
- [ ] Tech tree
- [ ] Multi-Language support
- [ ] Use $animate
- [ ] More ability to alter e-prime environment.

## Bot upgrades
- [ ] Improve Scanner range?
- [ ] Increase mining efficiency?
- [ ] Improve engine?
- [ ] Mountain borer?
- [ ] Flight?
