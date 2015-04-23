# Todo list

_\( managed using [todo-md](https://github.com/Hypercubed/todo-md) \)_

## Bugs
- [?] Active bot not selected in some cases (test this)
- [ ] Can't find variable: Uint8ClampedArray in Safari 5.1.7 (shim?)
- [ ] SVG is not size responsive!!!
- [-] Prevent duplicate scripts with the same name
- [ ] Too slow?  Test on firefox.
- [ ] Improve GUI Responsiveness to small screens
- [ ] Upgrade using base resources?
- [ ] j/k should only cycle filtered bots?
- [ ] Trap errors in GAME.load.

## ECS
- [ ] Further decompose BotComponents (Bot, Tile/sprite, Move, Charging)
- [x] Move draw to system?
- [-] Order system updates by priority, add scenes
- [x] Move accumulator to engine

## Next
- [ ] Make defaultScripts as scripts service (or entities?). (crud, reset, validate, run, etc)
- [ ] Improve editor save/validation
- [ ] Re-balance gameplay, decide starting conditions, game flow.
- [ ] Store scripts separately from rest of the game?
- [ ] Achievements.
- [ ] MoveTo populates action queue.
- [ ] Trusted code/actions.
- [x] Make action queue a component e.action.queue.push(fn);
- [ ] Better in game API help
- [ ] Bots methods could improve by keeping track of current chunk
- [?] Stop using watchers in map directive
- [x] Add $map API to readme
- [-] Add $bot.memory to readme
- [x] More hotkeys (`S` (shift-s) save, `,` to mine,...)
- [ ] Shortcuts for do until E = 0?
- [ ] More orders (Move to target, mine at target)
- [ ] Deactivate orders for active bot on manual keypress?
- [x] Update tutorial for new mechanics, add callback functions
- [x] Move tutorial to service.
- [ ] Move more GAME stuff to ecs engine
- [ ] Improve $bot logging, error system.
- [ ] Finish Entity component system
- [ ] New screen shot
- [ ] Tests
- [ ] Move hot keys somewhere?
- [ ] Re-factor bot actions in MainCtrl?
- [x] Change save rate to time based not turns?
- [ ] Better handling Aether errors
- [ ] Try other Aether supported languages?
- [ ] Upgrade units using heavy resources?
- [x] $bot.find should search both tile and name.
  - [ ] Wildcard?
- [ ] Indicate bot's current target, (and heading, and action?)
- [ ] Set target using map?
- [ ] d3 hover/click dispatch
  - [x] Bots
  - [x] Tiles
- [x] Pan to unit on select
- [ ] Indicate stuck bots?
- [ ] Indicate halted bots on map.
- [x] Ensure base starts on plain
- [-] Clean up classes -> Entity component system
- [x] Implement $bot.log()
- [ ] Improve drawing more?
- [ ] More/better Tooltips?
- [ ] Need to indicate when unit is on mine.
- [ ] Indicate overlapping units.
- [ ] Clean terminology (bots, resources, energy units, etc)

## Decisions
- [-] Pause scripts, keep charging?
- [x] Start with full energy?
- [ ] Can bot scripts command other bots?  $bot.find('A').moveTo($bot.x,$bot.y)?
- [ ] Can bot scripts access other bot's memory?  $bot.find('Base').mem?
- [ ] Limit map and number of bots for performance?  Wrap map.
- [ ] Limit FPS in firefox?
- [ ] Map full screen? Resizable panels?
- [ ] Work on small screens. Responsive design.
- [ ] Bots can carry other bots?
- [ ] End game shows easter egg?
- [x] Start with rover, upgrade to base?  Start with base, build first rover?
- [-] Use ui-router?
- [x] Add about screen.
- [ ] Faster bot (drone)? mE = mS = 1 (Can never upgrade using current rules)
- [ ] Allow scripting of change script?  Change, halt, import.
- [x] Upgrade self or upgrade in base?
- [ ] replace progress bars with sparkline?
- [ ] add progress circles/bars around units?
- [x] User rename bots?
  - [ ] User assign labels (A,B,C,...,@)?

## Wish list
- [ ] More terrain types (various movement costs?), biomes.
- [ ] Mining speed/efficency
- [ ] Ensure starting position is not locked
- [ ] Environmental effects (Solar intensity, etc)
- [ ] Async Programming?  Support ES6 in user scripts?
- [ ] Aliens? Alien tech?
- [ ] Tech tree.
- [ ] Multi-Language support
- [ ] Use $animate
- [ ] Environment modifications.

## Bot features
- [ ] Bot failure rate?
- [ ] Upgrade scanner range?
- [ ] Upgrade mining efficiency?
- [ ] Upgrade engine?
- [ ] Mountain borer?
- [ ] Flight?
