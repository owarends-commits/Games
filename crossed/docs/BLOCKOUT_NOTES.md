# Blockout notes: community center

Convention: 1 unit = 1 metre, Y up, north = −Z, east = +X. The main entrance threshold is at (0, 0, 0) and the building extends north. The party room lies west of the hallway.

## Built to the debrief (established)

**Layout**
- **Foyer:** 4.4 m wide × 3.5 m deep, with the 2.8 m main entrance in the south wall.
- **Hallway:** 2.3 m wide, from z −3.5 to z −16.0.
- **Party room:** 13.9 × 10.0 m interior (x −15.2 to −1.3, z −18.0 to −8.0). Ceiling 3.2 m throughout.
- **Party-room doorway:** 2.0 m wide, in the hallway's west wall, z −15.5 to −13.5. The player walks the hallway and turns left into the party room.

**Windows and banner**
- Six windows, 1.4 × 1.3 m, sill at 0.95 m:
  - north wall at x −11.5 and −5.0
  - south wall at x −11.5 and −5.0
  - west wall at z −15.5 and −10.5
- **The breach window** is the west wall window at z −15.5. Its glass is `Geometry/Windows/WindowWestBreach/BreachGlass`.
- The **"HAPPY BIRTHDAY AMELIA" banner** is on the west wall at z −13, between the two west windows. This follows the debrief; the old 2D maps had it on the north wall.

**Outside**
- Kenneth's BMW is at (−6.5, 0, 5.5), its front facing the street (+Z).
- Parking lot with two rows of stalls and an aisle, sidewalk, curb, hedge, street, five lamp posts, rain.

**Cameras and zones**

| Camera | Debrief # | Trigger |
|---|---|---|
| Cam1_LotArrival | 1 | Zone_Exterior (lowest priority, covers the lot) |
| CamF_Foyer | (added) | Zone_Foyer |
| Cam2_Hallway | 2 | Zone_HallSouth (z −12 to −3.4) |
| Cam6_EscapeHall | 6 | Zone_HallNorth (z −16 to −11.8) |
| Cam3_PartyOverview | 3 | Zone_PartyEast (x −8 to −1.15) |
| Cam3b_PartyWest | (added) | Zone_PartyWest (x −15.2 to −7.8) |
| Cam4_Breach | 4 | Scripted: `Cameras.push_override()` |
| Cam5_CrowdInspection | 5 | Scripted |
| Cam7_LotAftermath | 7 | Scripted |

Zones overlap slightly. The most recently entered zone wins ties, so standing on a seam doesn't make the camera flicker. In camera-relative mode, the player keeps the old camera's direction through a cut until the stick is released.

**ACROSS breach staging (`ACROSSBreach` node)**
- `BreachWindow`
- `LandingPoint` (−13.7, 0, −15.4)
- `LandingClearArea`: x −15.1 to −12.2, z −17.2 to −13.6. The walkthrough test checks it stays free of furniture.
- `CrowdSpot1` to `CrowdSpot4`
- `FirstLungeTarget`

`StoryMarkers` holds:
- `PlayerSpawn_Exterior`
- `BMW_DriverDoor`
- `PunchTableSpot`
- `KennethSmallTalk`
- `AdalineMats`
- `ParentGroupA` to `ParentGroupD`

## My assumptions (change freely)

**Geometry**
- Wall thicknesses: 0.25 m exterior, 0.2 m interior.
- Window size and sill height. The debrief gives positions only.
- Entrance doors are outward-opening commercial doors, propped open against the façade.
- Restroom, storage and office doors along the hallway are decorative and closed, with no collision.

**Party room**
- Furniture layout:
  - cake table and gift table along the north wall
  - punch and snack tables along the east wall
  - craft table, a 4 × 3 play-mat grid
  - ball pit in the south-west corner
  - chair rows along the south and west walls
- The landing area under the breach window is kept clear on purpose.

**Outside**
- The hedge, street layout and positions of the other nine cars. The debrief only fixes the BMW.

**Lighting**
- Party room: warm and bright.
- Hallway: dim, with one flickering fluorescent tube and a red emergency light.
- Lot: sodium street lights and a moonlit fill.

**Cameras**
- Two cameras that aren't in the debrief: **CamF_Foyer** and **Cam3b_PartyWest**. One overview couldn't show the whole 14 m room while keeping the doorway readable.

**Player**
- 1.78 m tall, walk 1.7 m/s, run 3.8 m/s, turn 170°/s.

## Known limits of this pass

- The player is a box-figure placeholder. Kenneth, Adaline, the Stranger, NPCs and the ACROSS aren't modeled yet; sprite sheets were deliberately not used as 3D characters.
- No encounter logic yet. The markers and scripted cameras are in place for the breach state machine.
- Windows don't shatter yet: `BreachGlass` is a single quad, ready to be swapped for a breakable mesh.
- No doors open, there's no interaction, and there's no audio.
- The level is built from CSG boxes. For the final art, convert it to meshes, or rebuild it in Blender, using the same measurements.

## Next steps

1. Breach encounter state machine:
   - CALM → IMPACT → LANDING → CROWD_INSPECTION → FIRST_LUNGE → PANIC → ESCAPE
   - drive it with the markers and scripted cameras
2. Low-poly models: Kenneth, Adaline, the ACROSS, then NPCs.
3. Breakable glass and the window-impact effect.
4. Swap the placeholder player for Kenneth, rigged, with tank-control animations.
