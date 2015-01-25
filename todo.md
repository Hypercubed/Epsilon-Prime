# Todo list

_\( managed using [todo-md](https://github.com/Hypercubed/todo-md) \)_

## Preview Milestones
- [ ] Limit map size.
- [x] Unit pathfinding/obsticle avoidance
- [x] End game
- [x] Confirm restart dialog
- [ ] favicon

## Bugs
- [ ] Too slow!
- [ ] Responsiveness bugs
  - [ ] Bot-panel disappears on small screens
  - [ ] Movement buttons distorted on small screen
- [ ] Replace hotkey help with modal dialog
- [ ] Disable hotkeys when paused dialog is shown
- [?] optimize d3 draw
- [x] Layers in d3 draw
- [ ] JS-interpretor scanning broken
- [x] Incorrect bot highlighting
- [x] Map not square
- [ ] Upgrade using base resources?
- [x] Bots can go off map
- [ ] j/k should work in bot panel
- [ ] j/k should only cycle filtered bots

## Next
- [ ] Improve efficiency of JS-interpretor
- [ ] Clean Sandbox code
- [ ] d3 hover/click dispatch
- [ ] Pan to unit on select
- [x] Script construct/set inital orders
- [ ] Indicate stuck bots?
- [ ] Ensure bot starts on plain
- [ ] Clean up classes
- [ ] Implement $bot.log() (or hide log tab)
- [ ] Improve map code, draw in chunks?
- [x] Improve drawing (isDirty flag?/faster hash). Use d3?
- [x] Scan returns list? List of pieces and terrain?
- [x] Bots store key of script not code.
- [ ] Bot memory?
- [ ] More balancing of gameplay.
- [ ] More Tooltips?
- [ ] Need to indicate when unit is on mine.  Indicate overlapping units.
- [ ] Clean terminology (bots, resources, energy units, etc)

## Decisions
- [ ] Bot tile based on size?
- [ ] End game shows easter egg?
- [x] Continue after end game?
- [ ] Set max number of bots for performance?
- [x] Autosave
- [ ] Start with rover, upgrade to base?  Start with base, build first rover?
- [x] Script panel
- [ ] Use ui-router?
- [ ] Any unit (rover, base) can mine, move, relocate, charge, upgrade?
- [ ] Faster bot (drone)? mE = mS = 1 (Can never upgrade using current rules)
- [ ] Allow scripting of change script?  Change, stop, include.
- [x] Upgrade self or upgrade in base?
- [x] Infinite map?  Grid of chunks?
- [x] Generate map as needed? Per tile or per chunk?
- [x] Randomize turn order?
- [x] Save state
- [x] Store total E/S found/spent.
- [ ] More terrain types (various movement costs?)
- [ ] replace progress bars with sparkline

## Superficial
- [ ] Rename bots -> units?
- [x] User rename bots?
  - [ ] Assign labels (A,B,C,...,@)
- [x] Improve readability of progress bars
- [ ] Map directive?

## Bugs
- [x] Tooltips get stuck if disabled while displayed (patch to bootstrap ui)

## Wish list
- [ ] Mining speed/efficency
- [-] Moving speed?
- [ ] Better terrain generation
  - [ ] Ensure starting position is not locked
  - [x] Ensure enough resources
- [ ] Environmental effects (Solar intensity, etc)
- [ ] Async Programming?  Support ES6 in user scripts?
- [ ] Aliens?  Alien tech?
- [ ] Tech tree
- [ ] Clickable map
- [x] Hover on map for location (x,y)
- [ ] Multi-Language support
- [x] Material design?
- [ ] Use $animate

## Bot upgrades
- [x] Relocate
- [x] Build bot
- [ ] Improve Scanner range?
- [x] Increase resource storage
- [x] Increase charging rate
- [x] Increase energy storage
- [ ] Increase mining efficiency?
- [ ] Improve engine?
- [ ] Mountain borer?
- [ ] Flight?
