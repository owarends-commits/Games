# Ending pass: cameras, dialogue, the chase and the prologue ending

This pass follows your notes on the first playable prologue. Where it differs from `STORY_PASS_NOTES.md`, this file wins.

## Cameras you can navigate by

Every fixed camera now shows the way out of the space it covers.

| Area | Walking in | During the panic (`Cameras.escape_mode`) |
|---|---|---|
| Foyer | `CamF_Foyer`, from the hallway mouth: front doors always in frame | same |
| Hallway, south half | `Cam2a_HallSouth`, looking north | `Cam6b_EscapeHallSouth`, looking at the foyer and front doors |
| Hallway, north half | `Cam2b_HallNorth`: the lit party doorway on the left is the focus | `Cam6a_EscapeHallNorth`, looking down the hall to the exit |
| Party room, east half | `Cam3a_PartyEast`: doorway and punch table with its bowl both in frame | same (it already faces the door) |
| Party room, west half | `Cam3b_PartyWest`: banner and breach window | `Cam3c_PartyWestExit`, facing the doorway |

**Making the exits readable:**
- green EXIT signs over the party doorway (both sides) and the front entrance
- pale trim around the party doorway
- brighter warm light spilling out of the party room into the hall

**Party entry cutscene:** it now looks from inside the room toward the door. Kenneth and Adaline walk in, Rachel meets them, and the Stranger waves from the snack table.

## Dialogue

- **One speaker at a time, always in the box, always with a portrait.** That includes the window-break lines, the panic shouts and the voices in the lot.
- **Layout follows the portrait spec:**
  - the bust sits in a bottom corner with a name plate underneath
  - Kenneth speaks from the left, everyone else from the right, mirrored
  - the box has a solid dark background; the objective line and the "[E]" prompt have their own backing
- **How lines advance:**
  - Cutscene lines, like the breach, move on by themselves.
  - Lines during gameplay, like shouts in the panic, also move on by themselves, never stop Kenneth, and wait their turn.
- **"Stranger":** every speaker without a real name is now called Stranger, including the man in the sweater.
- **New portrait sets, 12 frames each:** the dad in the grey hoodie, the mom in the green sweater, the dad with glasses and a beard, the boy in the dinosaur shirt, and the girl in overalls.
  - They come from `tools/make_portraits.py`, which is your existing portrait generator moved into the project and extended.
  - Amelia still has no portrait; she has no lines.
- **The Stranger at the party:**
  - He stands near the doorway and the snack table, where Kenneth sees him on the way in.
  - Talk to him and he's warm: the deacon at Kennedy Community Church. He remembers Adaline finding the golden egg at the church's Easter egg hunt.
  - He never learns Kenneth's name at the party; that matters later.

## The ACROSS chase

- The first ACROSS finishes its first victim, knocks down a father, then **hunts Kenneth through the doorway, down the hallway and out the front doors**.
- **A second ACROSS** comes through the other west window a few seconds into the panic, takes down a mother and child, and joins the chase.
- **On the way:** they knock down stragglers they run into.
- **If one catches Kenneth:** he's shoved toward the exit with a red flash and loses a moment. There's still no fail state.
- **Speed:** they're slightly slower than Kenneth's run and faster than his walk.
- **At the doors:** they burst out after him and fall on the families still coming out.

## The ending

1. **The lot:**
   - fires, a car alarm, distant sirens
   - a man trying to start a car that won't start, until he gives up and runs
   - the chasers coming out of the doors
   - more ACROSS closing in from the street
2. **Reunion and boarding.** Unchanged.
3. **The drive.** Built as real 3D streets laid out from `city_drive.png`:
   - Main Street runs east to a T-junction
   - turning south, the church is on the left, with its lit cross and stained glass
   - then a burning store, a cross street with a bus on fire, and the utility pole on the last corner
4. **Inside the car.** A separate interior set: dashboard, seats, rain on the windshield, the wiper, streetlights sweeping through. The camera cuts to whoever is speaking.
   - **`car_1`:** "What were those?" Adaline asks to call Mommy; there's no signal; "We'll drive straight to her."
   - **`car_church`:** passing the church. "That's my church... Twenty-two years I've kept the lights on in that building. And tonight there's nobody home." Then Adaline: "Daddy... he stopped crying."
   - **The windshield:** at the store, an ACROSS throws itself onto the hood and cracks the glass.
   - **`car_reveal`, in the rear-view mirror:**
     - Kenneth notices smoke at the Stranger's leg.
     - "You can slow down now, Kenneth." / "I never told you my name." / "You didn't have to." / "I know all of their names."
     - His neck stretches and his arms lengthen. On a cut, his skin drains grey and the grin appears.
     - His portrait steps through your morph frames, `stranger_m1` to `m5`.
5. **The lunge and the crash.** He comes over the seat, Adaline screams, the BMW swerves into the pole, and it cuts to black.
6. **The last shot:**
   - Rain, and the BMW burning against the pole.
   - Kenneth lies unconscious on the sidewalk, lit by the fire.
   - Both rear doors are open and the back seat is empty. Adaline and the Stranger are nowhere in the shot.
   - Amelia's present, which Adaline left in the car, lies wrapped in the road.
   - The camera pushes in slowly.
7. **End card:** END OF THE PROLOGUE, then CHAPTER ONE: NORAH.

## Decisions to check

- **Kenneth on the concrete:** I read "lit on fire" as lit by the fire, not burning.
- **Adaline left the present in the car:** a new line in the hallway exchange. It explains why the present is in the wreck.
- **The deacon's lines** (the Easter egg hunt, the golden egg, "Twenty-two years") are invented details for you to keep or cut.
- **"I know all of their names"** is deliberately ambiguous: the town, the faithful, anyone.
- **What his arc gives away:** the Stranger's tears stop and he goes quiet in the car. Together with his church's "nobody home", this hints at what happened to the faithful without explaining who or what he is.
- **His transformation** uses a texture swap plus bone stretching on his existing model, not a separate model.

## Opening and polish pass (2026-10-26)

- **Following cameras:** the lot camera and the party room cameras slide along a rail and turn to keep Kenneth in frame (`scripts/cameras/follow_camera.gd`). They're weighted toward something important: the entrance, the doorway, the banner.
- **Kenneth stands out:** a soft light travels with him, and his jacket is a shade lighter.
- **Models:** heads, necks, torsos and arms are slimmer. The sides of each head now get the hair texture the right way round, so no more patches of bare skin at the back of the head.
- **Portraits:**
  - Kenneth's collar (and the matching dads' collars) now joins the jacket.
  - The portrait generator is deterministic now, so re-running it gives the same hair every time.
- **Kennedy from the sky** (`scripts/environments/kennedy_city.gd`, built procedurally):
  - **Town:** a grid of neighborhoods, a downtown of taller lit buildings, and a winding river with bridges.
  - **Landmarks and roads:** a grain elevator by the railroad, a water tower, a highway with lights, and a radio mast blinking out in the fields.
  - **Surroundings:** miles of patchwork farmland with farmsteads and yard lights.
  - **The opening:** a 26-second flight from high above, tipping down and sinking to the BMW, then inside the car with Kenneth and Adaline for the arrival conversation.
- **Cars:** bumpers, grilles (twin grille on the BMW), plates, mirrors, wheel arches, hubcaps, door seams and handles, plus sedan, SUV, hatchback, pickup and wagon bodies.
  - The interior adds a console, gear stick, glowing radio and gauges, vents, visors, seatbelts, door panels, a dome light and an air freshener.
  - The interior set now sits underground so nothing of the town shows through the windows.
- **Party:**
  - After the punch, Kenneth has a minute to mingle and explore (`PARTY_FREE_TIME` in `prologue_director.gd`; it was 30 seconds); Marcus is now a normal conversation.
  - Then the window goes, wherever Kenneth is and whatever anyone is saying. The crash is two stacked glass smashes plus impacts, the party audio cuts instantly, and the shake is harder.
- **The Stranger:**
  - The deacon detail is only heard if you talk to him at the party.
  - His burn is on the back of his right shoulder, smoking the whole drive.
  - In the car Adaline asks about it ("Is that a burn? ... It looks like a cross."); he answers only with silence.
- **HUD:** an objective bar in the top right that slides in when the goal changes, and a heavier frame on the dialogue box.
