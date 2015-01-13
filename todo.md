# Todo list

_\( managed using [todo-md](https://github.com/Hypercubed/todo-md) \)_

## Next
- [ ] Clean up classes
- [ ] Fix or remove JS-interpretor
- [ ] Enable scan in acorn scripts.
- [x] Scan/list should also return units.
- [ ] $bot.log()
- [ ] More easily cycle through units.
- [ ] Improve map code, use chunks.
- [ ] Improve drawing (isDirty flag?/faster hash). Use d3?
- [ ] Scan returns list? List of pieces and terrain?
- [ ] Bots store key of script node code.
- [ ] Bot memory?
- [ ] Start with just rover? Upgrade self?
- [ ] Scrolling map.  By chunk?
- [ ] More balancing of gameplay.
- [ ] More Tooltips?
- [ ] Need to indicate when unit is on mine.

## Decisions
- [ ] D* for moveTo
- [ ] Use ui-router?
- [ ] Any unit (rover, base) can mine, move, relocate, charge, upgrade?
- [ ] Faster bot (drone)? mE = mS = 1 (Can never upgrade using current rules)
- [ ] Allow scripting of change script?
- [x] Upgrade self or upgrade in base?
- [ ] Start with rover, upgrade to base?
- [ ] Infinite map?  Grid of chunks?
- [ ] Generate map as needed? Per tile or per chunk?
- [x] Randomize turn order?
- [ ] Save state
- [ ] Store total E/S found/spent.

## Superficial
- [ ] Rename bots -> units?
- [ ] User rename bots?  Assign labels (A,B,C,...,@)
- [x] Improve readability of progress bars
- [ ] Map directive

## Bugs
- [x] Tooltips get stuck if disabled while displayed (patch to bootstrap ui)

## Wish list
- [ ] Mining speed/efficency
- [-] Moving speed?
- [ ] Better terrain generation
  - [ ] Ensure starting position and mines are not locked
  - [ ] Ensure enough resources
- [ ] Environmental effects (Solar intensity, etc)
- [ ] Async Programming?  Support ES6 in user scripts?
- [ ] Aliens?  Alien tech?
- [ ] Tech tree
- [ ] Clickable map
- [x] Hover on map for location (x,y)
- [ ] Multi-Language support
- [ ] Material design?
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
