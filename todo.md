# Todo list

_\( managed using [todo-md](https://github.com/Hypercubed/todo-md) \)_

## Bugs
- [x] Bot does't find closest base.
- [?] Active bot not selected in some cases (test this)
- [ ] SVG is not size responsive!!!
- [x] Active unit no longer shown in map
- [x] Drop downs in bot list cut off
- [x] Sometimes base is on top of a mine.
- [x] Optimize find to only search map if '.X#'.
- [-] Prevent duplicate scripts with the same name
- [ ] Too slow?  Test on firefox.
- [ ] Improve GUI Responsiveness to small screens
- [ ] Upgrade using base resources?
- [ ] j/k should only cycle filtered bots?
- [ ] Trap errors in GAME.load.

## ECS
- [x] Chunks -> Entities?
- [ ] Decompose BotComponents (Bot, Tile/sprite, Move, Charging)
- [x] Add filters to systems
- [ ] Move draw to system?
- [x] Entity messages ie. .$on('upgrade', fn), .$emit('upgrade')
- [x] common families
- [x] remove entities
- [ ] Order system updates by priority

## Next
- [ ] Bots could improve by keeping track of current chunk
- [?] Stop using watchers in map directive
- [ ] Add $map API to readme
- [ ] Add $bot.memory to readme
- [x] Arrow keys as alternative?  More hotkeys (`S` (shift-s) save, `,` to mine,...)
- [ ] Shortcuts for do until E = 0?
- [ ] More orders (Move to target, mine at target)
- [ ] Deactivate orders for active bot on manual keypress?
- [-] Update tutorial for new mechanics, add callback functions
- [ ] Indicate unit is on resource
- [ ] Clean up and move tutorial
- [ ] Move more GAME stuff to ecs engine
- [ ] Improve bot logging, error system.
- [ ] Finish Entity component system
- [ ] New screen shot
- [ ] Make defaultScripts as scripts service. (crud, reset, validate, run, etc), entities?
- [ ] Tests
- [ ] Move bot hot keys to bots controller?
- [ ] Improve editor save/validation
- [ ] Remove bot actions in MainCtrl, use main.bot.$bot?
- [ ] Change save rate to time based not turns?
- [ ] Better handling Aether errors
- [ ] Try other Aether supported languages?
- [ ] Upgrade units using heavy resources?
- [x] $bot.find should search both time and name.
  - [ ] Wildcard?
- [ ] Indicate bot's current target, (and heading, and action?)
- [ ] Set target using map?
- [ ] d3 hover/click dispatch
  - [x] Bots
  - [ ] Tiles
- [ ] Pan to unit on select
- [ ] Indicate stuck bots?
- [x] Ensure base starts on plain
- [ ] Clean up classes -> Entity component system
- [x] Implement $bot.log()
- [ ] Improve drawing more?  Draw by chunk, bot (entities).
- [ ] Rebalance gameplay.
- [ ] More/better Tooltips?
- [ ] Need to indicate when unit is on mine.
- [ ] Indicate overlapping units.
- [ ] Clean terminology (bots, resources, energy units, etc)

## Decisions
- [ ] Always charging, pause scripts only?
- [x] Start with full energy?
- [ ] Can bot scripts command other bots?  $bot.find('A').moveTo($bot.x,$bot.y);?
- [ ] Limit map and number of bots for performance?
- [ ] Map full screen?
- [ ] Work on small screens.
- [ ] Bots can carry other bots?
- [ ] End game shows easter egg?
- [x] Start with rover, upgrade to base?  Start with base, build first rover?
- [ ] Use ui-router?
- [x] Add about screen.
- [ ] Faster bot (drone)? mE = mS = 1 (Can never upgrade using current rules)
- [ ] Allow scripting of change script?  Change, stop, include.
- [x] Upgrade self or upgrade in base?
- [ ] replace progress bars (with sparkline?)
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
- [ ] Tech tree
- [ ] Multi-Language support
- [ ] Use $animate
- [ ] Environment modifications.

## Bot upgrades
- [ ] Improve Scanner range?
- [ ] Increase mining efficiency?
- [ ] Improve engine?
- [ ] Mountain borer?
- [ ] Flight?
