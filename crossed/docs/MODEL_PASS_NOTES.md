# Model pass: 3D clothes, heads and hair, plus the feeding chase

This pass follows your notes after the opening and polish pass. Where it differs from earlier notes, this file wins.

`docs/model_lineup.png` shows every character from the front, the side and the back.

## How the models are built now

Everything still comes from `tools/build_characters.py`, so rerun it after any change. The models are still rigid-skinned: each piece follows one bone, the way late-90s survival horror characters were built.

- **Rounded surfaces.** Bodies, heads and hair are built from stacks of rounded cross-sections instead of boxes, with smooth shading. Each model is about 1,500 to 2,000 triangles, up from about 600.
- **Texture atlases.** These grow to 256×256 when a character needs more swatches. Pixel density is unchanged.
- **Shape is set per character.** The `face`, `nose` and `hairdo` settings in `CAST` control it (widths at chin, jaw, cheek, brow and crown, squareness, double chin), so you can tweak each one.

## Heads

Every head is now a 3D skull with a real jaw and chin, a nose, and ears where the hair doesn't cover them.

| Character | Head |
|---|---|
| Kenneth | long and narrow, strong chin, longer nose |
| The Stranger | round and wide, full cheeks, double chin, broad nose |
| Marcus | broad and square-jawed |
| Rachel, Denise, the mom in green | oval, narrow chins |
| The dad with glasses | rounder jaw under a full 3D beard and moustache |
| The kids | rounder heads, small chins and noses |
| The ACROSS | stretched skull with sunken cheeks, a jutting chin and a shrunken nose |

## Hair

Hair is now a 3D shell over the skull, with a hairline that sits higher at the forehead and lower at the nape.

| Character | Hair |
|---|---|
| Kenneth | short, swept up at the front |
| The Stranger | bald on top, with a horseshoe fringe around the sides and back |
| Rachel | ponytail tied at the back-left and falling past her shoulder, as in her portrait |
| Marcus | close buzz |
| Denise | bob with full bangs |
| The mom in green | long hair down her back |
| Adaline | long hair and bangs |
| Amelia | curly volume with curl clusters, party hat on top |
| The boy | short, with a cowlick |
| The girl | pigtails with red ties, and bangs |
| The ACROSS | a few dead tufts |

## Clothes

The clothes are built as separate shapes on top of the body, so they read as garments rather than paint.

| Character | Clothes |
|---|---|
| Kenneth | puffer jacket with quilted baffles in the body and sleeves, a tall stand collar, a zip line, elastic cuffs and hem |
| The Stranger | striped sweater with a ribbed crew collar, cuffs and hem, hanging untucked over his belly; the burned cross is still on the back of his right shoulder |
| Rachel | open cardigan with raised front edges over a white V-neck top, ribbed hem |
| Marcus | flannel shirt with collar points, two chest pockets and an untucked hem |
| Denise | top tucked into a skirt with a waistband |
| The dad in grey | hoodie with the hood bunched behind his neck, drawstrings, a kangaroo pocket, ribbed cuffs and hem |
| The dad with glasses | polo with collar points and short sleeves, tucked in, with a belt and buckle |
| Adaline, Amelia | dresses with puffed sleeves, white collars, a waist sash and a pleated skirt with a hem band |
| The girl | short-sleeved shirt under overalls with a bib, straps over the shoulders and brass buttons |
| The boy | T-shirt with a crew collar and short sleeves, shorts with open legs |

**Throughout the cast:**
- **Shoulders:** they round over the tops of the arms.
- **Sleeves:** they open around the wrist or arm.
- **Trousers:** they break over the shoe.
- **Shoes:** each has its own sole: white for sneakers, dark for boots and dress shoes.
- **Hands:** each has a palm, a finger block and a thumb. The ACROSS has long claws.
- **The ACROSS's trousers:** they end in torn, ragged legs.

## The breach: feeding, the hallway chase, flicker

- **Feeding:** after the panic starts, the first ACROSS knocks down a father and starts feeding on the bodies near the window.
- **The hallway chase:** about a second after Kenneth reaches the hallway, it leaves the body, shrieks, comes through the doorway and chases him down the hall and out the front doors.
  - The second ACROSS takes down a mother and child and keeps feeding.
  - If Kenneth goes back near either one while it feeds, it lashes out and shoves him away.
- **Flicker:** the party room and hallway lights flicker slightly from the moment the window breaks, through the cutscene and the whole chase. Now and then there's a short dip, sometimes one bulb, sometimes the whole room. It stops once Kenneth is outside.

## The crash after the first attack

I couldn't make it happen in testing, and the full autoplay run gets through the breach, the chase and the ending without errors.

**What I hardened:**
- If Kenneth stood still, repeated hits could shove him all the way out of the building. Each hit now has a cooldown, and the shove is aimed at the exit.
- Every attack now checks that the creature and Kenneth still exist before acting.

**If it happens again,** please send me the red text from Godot's Debugger panel (the Errors tab), or the newest file in the logs folder. To find that folder, use Project > Open User Data Folder, then open `logs`.

## Also in this pass

- **A minute at the party.** After the punch, Kenneth now has 60 seconds instead of 30 to talk to the parents and look around before the window breaks. To change it, set `PARTY_FREE_TIME` in `scripts/cutscenes/prologue_director.gd`.
- **The Stranger is back in the car.** The last pass hid him during the arrival drive, since he isn't in the car yet, but nothing showed him again for the drive. His rear-view mirror shots were showing an empty seat. He's visible again.
- **Wider mirror shot.** It's slightly wider and higher, so his stretching neck stays in frame during the reveal.
- **New test scenes:**
  - `tests/carcam.tscn` renders the in-car cameras with the three seated models. You can pass poses, for example `-- kenneth=sit_look_back stranger=morph_hold`.
  - `tests/lineup.tscn` takes `cam=` and `ids=` for close-ups.
