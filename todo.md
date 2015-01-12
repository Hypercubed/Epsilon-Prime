# Todo list

_\( managed using [todo-md](https://github.com/Hypercubed/todo-md) \)_

## Next
- [x] Test ACE editor
- [x] Try https://github.com/NeilFraser/JS-Interpreter
- [x] Check for infinite loops
- [x] Add, copy, rename scripts
- [x] Validate on script save
- [x] Create gameService (stores world, bots, etc)
- [ ] Improve map code, use chunks
- [ ] Improve drawing (isDirty flag?/faster hash). Use d3?
- [ ] Scan returns list? List of pieces and terrain?
- [ ] Fix scan script
- [x] Allow scripting of upgrade
- [ ] Bots store key of script node code.
- [ ] Bot memory?
- [x] Move script editor
- [x] dEdX = A*mS + B*mE
- [x] dE = A*mE?
- [x] Adjust upgrade cost?  Upgrade rate?  (current 10 = 1+1, perhaps 10=5+5?)
- [ ] Start with just rover? Upgrade self?
- [ ] Scrolling map.  By chunk?
- [ ] More balancing of gameplay.
- [ ] More Tooltips?
- [ ] Need to indicate when unit is on mine.
- [x] Bot panel directive.

## Decisions
- [ ] Any unit (rover, base) can mine, move, relocate, charge, upgrade?
- [ ] Faster bot (drone)? mE = mS = 1 (Can never upgrade using current rules)
- [ ] Allow scripting of change script?
- [x] Can upgrade self?
- [ ] Start with rover, upgrade to base?
- [ ] Infinite map?  Grid of chunks?
- [ ] Generate map as needed? Per tile or per chunk?
- [x] Randomize turn order?
- [ ] Save state
- [ ] Store total E/S found/spent.

## Superficial
- [ ] Rename bots -> units?
- [ ] User rename bots?  Assign labels (@,A,B,C,...)
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
