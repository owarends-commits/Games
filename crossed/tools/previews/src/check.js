"use strict";
const LIB_ASSETS = {"bed_twin":{"name":"Bed, twin","cat":"indoor","bb":[-0.52,0.52,0,1.0,-1.02,1.015],"g":0.411},"bed_double":{"name":"Bed, double","cat":"indoor","bb":[-0.78,0.78,0,1.165,-1.04,1.02],"g":0.649},"couch":{"name":"Couch","cat":"indoor","bb":[-1.01,1.01,0,0.891,-0.42,0.46],"g":0.471},"armchair":{"name":"Armchair","cat":"indoor","bb":[-0.425,0.425,0,1.05,-0.425,0.42],"g":0.429},"table":{"name":"Table","cat":"indoor","bb":[-0.6,0.6,0,0.755,-0.39,0.39],"g":0.428},"chair":{"name":"Chair","cat":"indoor","bb":[-0.22,0.22,0,0.99,-0.22,0.23],"g":0.446},"counter":{"name":"Kitchen counter","cat":"indoor","bb":[-0.62,0.62,0,0.91,-0.32,0.325],"g":0.489,"search":true},"fridge":{"name":"Fridge","cat":"indoor","bb":[-0.35,0.35,0,1.76,-0.35,0.4],"g":0.652,"search":true},"stove":{"name":"Stove","cat":"indoor","bb":[-0.31,0.31,0,1.1,-0.31,0.345],"g":0.666},"sink":{"name":"Sink (bathroom)","cat":"indoor","bb":[-0.26,0.26,0,1.66,-0.22,0.23],"g":0.677},"tub":{"name":"Bathtub","cat":"indoor","bb":[-0.8,0.8,0,0.72,-0.37,0.37],"g":0.677},"toilet":{"name":"Toilet","cat":"indoor","bb":[-0.23,0.23,0,0.845,-0.3,0.33],"g":0.677},"wardrobe":{"name":"Wardrobe","cat":"storage","bb":[-0.54,0.54,0,2.04,-0.3,0.31],"g":0.426,"search":true},"dresser":{"name":"Dresser","cat":"storage","bb":[-0.565,0.565,0,1.63,-0.245,0.257],"g":0.446,"search":true},"bookshelf":{"name":"Bookshelf","cat":"indoor","bb":[-0.455,0.455,0,1.8,-0.16,0.16],"g":0.388},"nightstand":{"name":"Nightstand","cat":"storage","bb":[-0.245,0.245,0,0.97,-0.215,0.227],"g":0.446,"search":true,"light":{"p":[0,0.84,-0.04],"color":"#ffd8a0","energy":0.5,"range":3.0}},"tvstand":{"name":"TV + stand","cat":"indoor","bb":[-0.5,0.5,0,1.193,-0.26,0.237],"g":0.392},"rug":{"name":"Rug","cat":"indoor","bb":[-1.05,1.05,0,0.016,-0.75,0.75],"g":0.449},"lamp":{"name":"Floor lamp","cat":"indoor","bb":[-0.21,0.21,0,1.68,-0.21,0.21],"g":0.664,"light":{"p":[0,1.4,0],"color":"#ffd8a0","energy":0.8,"range":4.0}},"stairs":{"name":"Stairs (12 steps)","cat":"indoor","bb":[-0.45,0.45,0,2.4,-1.6,1.64],"g":0.47},"crate":{"name":"Crate","cat":"storage","bb":[-0.31,0.31,0,0.6,-0.315,0.315],"g":0.494,"search":true},"desk":{"name":"Desk","cat":"indoor","bb":[-0.65,0.65,0,0.775,-0.34,0.34],"g":0.426,"search":true},"cabinet":{"name":"Cabinet","cat":"storage","bb":[-0.415,0.415,0,1.224,-0.24,0.255],"g":0.465,"search":true},"tree":{"name":"Tree","cat":"outdoor","bb":[-1.3,1.4,0,6.1,-1.2,1.2],"g":0.401},"tree_pine":{"name":"Pine tree","cat":"outdoor","bb":[-1.3,1.3,0,5.6,-1.3,1.3],"g":0.381},"tree_birch":{"name":"Birch tree","cat":"outdoor","bb":[-0.8,0.85,0,5.6,-0.8,0.8],"g":0.522},"tree_bare":{"name":"Bare tree","cat":"outdoor","bb":[-0.963,1.133,0,5.52,-0.845,0.8],"g":0.4},"tree_dead":{"name":"Dead tree (snapped)","cat":"outdoor","bb":[-0.212,2.827,0,3.376,-0.212,1.412],"g":0.424},"stump":{"name":"Stump","cat":"outdoor","bb":[-0.31,0.31,0,0.45,-0.31,0.31],"g":0.416},"log":{"name":"Fallen log","cat":"outdoor","bb":[-1.3,1.3,0,0.44,-0.2,0.225],"g":0.416},"bush":{"name":"Bush","cat":"plants","bb":[-0.438,0.574,0.051,0.933,-0.48,0.572],"g":0.413},"rock":{"name":"Rock","cat":"outdoor","bb":[-0.615,0.616,0,0.678,-0.582,0.582],"g":0.483},"boulder":{"name":"Boulder (mossy)","cat":"outdoor","bb":[-1.14,1.14,0,1.312,-1.077,1.077],"g":0.483},"fence":{"name":"Fence (2 m)","cat":"outdoor","bb":[-1.05,1.05,0,1.2,-0.05,0.05],"g":0.465},"fence_picket":{"name":"Picket fence (2 m)","cat":"outdoor","bb":[-1.0,1.0,0.024,0.976,-0.015,0.035],"g":0.652},"fence_iron":{"name":"Iron fence (2 m)","cat":"graves","bb":[-1.035,1.035,0,1.4,-0.035,0.035],"g":0.361},"gate_iron":{"name":"Iron gate","cat":"graves","bb":[-1.2,1.2,0,2.4,-0.1,0.618],"g":0.483},"mailbox":{"name":"Mailbox","cat":"outdoor","bb":[-0.13,0.15,0,1.36,-0.23,0.23],"g":0.459},"car":{"name":"Sedan","cat":"outdoor","bb":[-0.939,0.939,0,1.425,-2.24,2.24],"g":0.391},"pole":{"name":"Power pole","cat":"outdoor","bb":[-0.9,0.9,0,8.0,-0.13,0.38],"g":0.421},"streetlight":{"name":"Street light","cat":"outdoor","bb":[-0.15,0.15,0,5.05,-1.36,0.06],"g":0.439,"light":{"p":[0,4.6,-1.15],"color":"#ffe2a8","energy":1.6,"range":9.0}},"sign":{"name":"Sign post","cat":"outdoor","bb":[-0.75,0.75,0,2.1,-0.045,0.045],"g":0.555},"bench":{"name":"Bench","cat":"outdoor","bb":[-0.8,0.8,0,0.871,-0.254,0.21],"g":0.386},"trashcan":{"name":"Trash can","cat":"outdoor","bb":[-0.27,0.27,0,0.94,-0.27,0.27],"g":0.429,"search":true},"porch":{"name":"Porch (1\u00d73 m)","cat":"outdoor","bb":[-0.55,0.55,0,2.39,-1.55,1.55],"g":0.465},"woodpile":{"name":"Woodpile","cat":"outdoor","bb":[-1.0,1.0,0,0.61,-0.25,0.25],"g":0.396},"well":{"name":"Well","cat":"outdoor","bb":[-0.7,0.7,0,2.35,-0.6,0.6],"g":0.489},"bell_tower":{"name":"Bell tower top","cat":"church","bb":[-1.3,1.3,0,5.9,-1.3,1.3],"g":0.599},"shed":{"name":"Garden shed","cat":"storage","bb":[-1.1,1.1,0,2.6,-0.9,0.9],"g":0.465,"search":true},"wheelbarrow":{"name":"Wheelbarrow","cat":"outdoor","bb":[-0.3,0.3,0,0.6,-0.99,0.73],"g":0.476},"pew":{"name":"Church pew","cat":"church","bb":[-1.52,1.52,0,1.145,-0.51,0.28],"g":0.426},"pew_short":{"name":"Pew, short","cat":"church","bb":[-0.81,0.81,0,1.11,-0.51,0.28],"g":0.426},"pew_broken":{"name":"Pew, broken","cat":"church","bb":[-1.525,1.476,0,1.116,-0.404,0.457],"g":0.426},"kneeler":{"name":"Kneeler","cat":"church","bb":[-0.72,0.72,0,0.16,-0.15,0.15],"g":0.408},"prie_dieu":{"name":"Prie-dieu (prayer kneeler)","cat":"church","bb":[-0.3,0.3,0,0.981,-0.17,0.34],"g":0.408},"altar":{"name":"Altar","cat":"church","bb":[-1.1,1.1,0,1.67,-0.46,0.46],"g":0.647},"altar_plain":{"name":"Altar (bare wood)","cat":"church","bb":[-0.975,0.975,0,1.06,-0.44,0.445],"g":0.426},"tabernacle":{"name":"Tabernacle","cat":"church","bb":[-0.28,0.28,0,0.9,-0.23,0.23],"g":0.549,"search":true},"crucifix_wall":{"name":"Crucifix (wall)","cat":"church","bb":[-0.45,0.45,1.3,2.8,-0.025,0.085],"g":0.384,"solid":false},"processional_cross":{"name":"Processional cross","cat":"church","bb":[-0.16,0.16,0,2.7,-0.15,0.15],"g":0.549},"candlestick_tall":{"name":"Candlestick, tall (pair)","cat":"church","bb":[-0.38,0.38,0,1.57,-0.13,0.13],"g":0.549,"light":{"p":[0,1.6,0],"color":"#ffc878","energy":0.6,"range":3.5}},"paschal_candle":{"name":"Paschal candle","cat":"church","bb":[-0.2,0.2,0,2.04,-0.2,0.2],"g":0.549,"light":{"p":[0,2.05,0],"color":"#ffc878","energy":0.5,"range":3.0}},"sanctuary_lamp":{"name":"Sanctuary lamp (hanging, red)","cat":"church","bb":[-0.12,0.152,1.86,3.05,-0.133,0.132],"g":0.549,"solid":false,"light":{"p":[0,2.05,0],"color":"#ff3a2a","energy":0.35,"range":3.0}},"ambo":{"name":"Ambo / lectern","cat":"church","bb":[-0.35,0.35,0,1.223,-0.275,0.276],"g":0.426},"lectern_eagle":{"name":"Lectern (brass eagle)","cat":"church","bb":[-0.522,0.522,0,1.393,-0.25,0.25],"g":0.549},"pulpit":{"name":"Pulpit (raised)","cat":"church","bb":[-1.15,0.6,0,1.475,-0.6,0.652],"g":0.426},"baptismal_font":{"name":"Baptismal font","cat":"church","bb":[-0.4,0.4,0,1.42,-0.4,0.4],"g":0.426},"holy_water_stoup":{"name":"Holy water stoup (wall)","cat":"church","bb":[-0.15,0.15,0.92,1.4,-0.02,0.21],"g":0.647,"solid":false},"confessional":{"name":"Confessional","cat":"church","bb":[-1.25,1.25,0,2.78,-0.55,0.55],"g":0.406,"search":true},"votive_rack":{"name":"Votive candle rack","cat":"church","bb":[-0.5,0.5,0,1.095,-0.2,0.23],"g":0.386,"light":{"p":[0,1.05,0],"color":"#ffb060","energy":0.6,"range":3.0}},"hymn_board":{"name":"Hymn board","cat":"church","bb":[-0.31,0.31,1.25,2.26,-0.03,0.035],"g":0.406,"solid":false},"statue_mary":{"name":"Statue on plinth (robed)","cat":"church","bb":[-0.28,0.28,0,2.16,-0.28,0.28],"g":0.572},"statue_saint":{"name":"Statue on plinth (worn saint)","cat":"church","bb":[-0.25,0.3,0,2.065,-0.25,0.25],"g":0.528},"station_cross":{"name":"Station of the Cross (plaque)","cat":"church","bb":[-0.21,0.21,1.29,2.0,-0.02,0.035],"g":0.426,"solid":false},"communion_rail":{"name":"Communion rail (2 m)","cat":"church","bb":[-1.0,1.0,0,0.855,-0.13,0.3],"g":0.406},"credence_table":{"name":"Credence table","cat":"church","bb":[-0.48,0.48,0,0.88,-0.25,0.253],"g":0.426},"sedilia":{"name":"Celebrant's chair","cat":"church","bb":[-0.36,0.36,0,1.92,-0.3,0.31],"g":0.406},"organ":{"name":"Pump organ","cat":"church","bb":[-0.65,0.65,0,1.95,-0.3,0.45],"g":0.406},"church_bell":{"name":"Church bell (hung)","cat":"church","bb":[-0.66,0.66,0,1.82,-0.375,0.375],"g":0.485},"offering_box":{"name":"Poor box (offerings)","cat":"church","bb":[-0.15,0.15,0,1.13,-0.12,0.13],"g":0.406,"search":true},"stained_window":{"name":"Stained glass window","cat":"church","bb":[-0.5,0.5,0.65,3.15,-0.02,0.12],"g":0.44,"solid":false,"light":{"p":[0,1.8,0.4],"color":"#8aa0ff","energy":0.3,"range":3.0}},"banner":{"name":"Hanging banner","cat":"church","bb":[-0.4,0.4,0.94,2.415,-0.015,0.015],"g":0.406,"solid":false},"chandelier":{"name":"Chandelier (iron, candles)","cat":"church","bb":[-0.502,0.502,2.34,3.5,-0.502,0.502],"g":0.361,"solid":false,"light":{"p":[0,2.6,0],"color":"#ffc070","energy":1.2,"range":7.0}},"lamp_church_pendant":{"name":"Church pendant lamp","cat":"church","bb":[-0.25,0.25,2.15,3.55,-0.25,0.25],"g":0.386,"solid":false,"light":{"p":[0,2.2,0],"color":"#ffdca0","energy":1.0,"range":6.0}},"lamp_church_sconce":{"name":"Church wall sconce","cat":"church","bb":[-0.06,0.06,1.75,2.08,-0.015,0.24],"g":0.67,"solid":false,"light":{"p":[0,2.0,0.2],"color":"#ffcf88","energy":0.6,"range":4.0}},"lamp_candelabra":{"name":"Floor candelabra (7 lights)","cat":"church","bb":[-0.38,0.38,0,1.64,-0.2,0.2],"g":0.549,"light":{"p":[0,1.65,0],"color":"#ffc070","energy":0.8,"range":4.5}},"chalice":{"name":"Chalice","cat":"mass","bb":[-0.06,0.06,0,0.2,-0.06,0.06],"g":0.574,"solid":false},"paten":{"name":"Paten with host","cat":"mass","bb":[-0.075,0.075,0,0.013,-0.075,0.075],"g":0.574,"solid":false},"ciborium":{"name":"Ciborium","cat":"mass","bb":[-0.065,0.065,0,0.28,-0.065,0.065],"g":0.574,"solid":false},"monstrance":{"name":"Monstrance","cat":"mass","bb":[-0.215,0.215,0,0.6,-0.07,0.07],"g":0.574,"solid":false},"thurible":{"name":"Thurible (censer) on stand","cat":"mass","bb":[-0.15,0.37,0,1.5,-0.15,0.15],"g":0.386},"incense_boat":{"name":"Incense boat + spoon","cat":"mass","bb":[-0.07,0.082,0,0.082,-0.035,0.035],"g":0.549,"solid":false},"cruets":{"name":"Cruets (water and wine) on tray","cat":"mass","bb":[-0.12,0.12,0,0.14,-0.07,0.07],"g":0.614,"solid":false},"lavabo":{"name":"Lavabo bowl + towel","cat":"mass","bb":[-0.1,0.24,0,0.04,-0.1,0.1],"g":0.614,"solid":false},"aspergillum":{"name":"Aspergillum + bucket","cat":"mass","bb":[-0.09,0.125,0,0.425,-0.09,0.09],"g":0.549,"solid":false},"altar_bells":{"name":"Altar bells","cat":"mass","bb":[-0.075,0.075,0,0.2,-0.025,0.025],"g":0.574,"solid":false},"missal_stand":{"name":"Missal on stand","cat":"mass","bb":[-0.16,0.16,0,0.188,-0.12,0.122],"g":0.406,"solid":false},"bible_open":{"name":"Bible (open)","cat":"mass","bb":[-0.16,0.16,0,0.041,-0.12,0.14],"g":0.367,"solid":false},"pyx":{"name":"Pyx + burse","cat":"mass","bb":[-0.03,0.16,0,0.024,-0.06,0.06],"g":0.677,"solid":false},"corporal":{"name":"Corporal + purificator (linens)","cat":"mass","bb":[-0.25,0.36,0,0.008,-0.25,0.25],"g":0.677,"solid":false},"candle_altar":{"name":"Altar candle, single","cat":"mass","bb":[-0.07,0.07,0,0.54,-0.07,0.07],"g":0.549,"solid":false,"light":{"p":[0,0.55,0],"color":"#ffc878","energy":0.35,"range":2.0}},"crucifix_small":{"name":"Altar crucifix (small)","cat":"mass","bb":[-0.12,0.12,0,0.45,-0.05,0.05],"g":0.574,"solid":false},"stole":{"name":"Stole (folded)","cat":"mass","bb":[-0.06,0.214,0,0.02,-0.25,0.257],"g":0.42,"solid":false},"chasuble_hanging":{"name":"Chasuble on a stand","cat":"mass","bb":[-0.425,0.425,0,1.55,-0.2,0.2],"g":0.413},"sacristy_vestment_chest":{"name":"Vestment chest (sacristy)","cat":"storage","bb":[-0.815,0.815,0,0.974,-0.39,0.402],"g":0.406,"search":true},"office_desk":{"name":"Steel office desk","cat":"office","bb":[-0.75,0.75,0.01,0.76,-0.38,0.387],"g":0.476,"search":true},"office_chair":{"name":"Office chair (swivel)","cat":"office","bb":[-0.346,0.41,0.005,1.072,-0.398,0.398],"g":0.406},"filing_cabinet":{"name":"Filing cabinet, 4-drawer","cat":"office","bb":[-0.235,0.235,0,1.34,-0.335,0.335],"g":0.515,"search":true},"filing_cabinet_2":{"name":"Filing cabinet, 2-drawer","cat":"office","bb":[-0.235,0.235,0,0.82,-0.335,0.335],"g":0.476,"search":true},"typewriter":{"name":"Typewriter","cat":"office","bb":[-0.24,0.24,0,0.259,-0.17,0.17],"g":0.386,"solid":false},"desk_phone":{"name":"Desk phone (push-button)","cat":"office","bb":[-0.11,0.172,0,0.125,-0.11,0.138],"g":0.646,"solid":false},"desk_phone_rotary":{"name":"Rotary phone","cat":"office","bb":[-0.12,0.12,0,0.135,-0.11,0.11],"g":0.361,"solid":false},"desk_lamp":{"name":"Desk lamp (banker's)","cat":"office","bb":[-0.15,0.15,0,0.39,-0.07,0.1],"g":0.433,"solid":false,"light":{"p":[0,0.28,0.04],"color":"#ffe0a8","energy":0.5,"range":2.5}},"computer_crt":{"name":"Computer (beige CRT)","cat":"office","bb":[-0.22,0.33,0,0.44,-0.22,0.4],"g":0.634,"solid":false},"fax_machine":{"name":"Fax machine","cat":"office","bb":[-0.17,0.17,0,0.17,-0.15,0.18],"g":0.411,"solid":false},"photocopier":{"name":"Photocopier","cat":"office","bb":[-0.45,0.6,0,0.94,-0.325,0.352],"g":0.627,"search":true},"water_cooler":{"name":"Water cooler","cat":"office","bb":[-0.16,0.16,0,1.455,-0.16,0.19],"g":0.652},"coat_rack":{"name":"Coat rack","cat":"office","bb":[-0.225,0.361,0,1.8,-0.225,0.225],"g":0.416,"solid":false},"corkboard":{"name":"Corkboard (wall)","cat":"office","bb":[-0.63,0.63,1.02,1.98,-0.02,0.022],"g":0.522,"solid":false},"chalkboard":{"name":"Chalkboard (wall)","cat":"office","bb":[-1.04,1.04,0.86,2.04,-0.02,0.08],"g":0.402,"solid":false},"cubicle_wall":{"name":"Cubicle partition (1.5 m)","cat":"office","bb":[-0.765,0.765,0,1.525,-0.035,0.035],"g":0.471},"metal_shelving":{"name":"Metal shelving (boxes)","cat":"storage","bb":[-0.615,0.615,0,1.9,-0.235,0.235],"g":0.542,"search":true},"bookcase_office":{"name":"Bookcase (binders)","cat":"office","bb":[-0.46,0.46,0,1.8,-0.17,0.17],"g":0.495,"search":true},"wastebasket":{"name":"Wastebasket","cat":"office","bb":[-0.14,0.14,0,0.365,-0.14,0.14],"g":0.439,"solid":false},"paper_stacks":{"name":"Paper stacks + binders","cat":"office","bb":[-0.12,0.32,0,0.3,-0.16,0.171],"g":0.666,"solid":false},"desk_clutter":{"name":"Desk clutter (mug, stapler, rolodex)","cat":"office","bb":[-0.19,0.24,0,0.12,-0.219,0.08],"g":0.411,"solid":false},"wall_clock":{"name":"Wall clock","cat":"office","bb":[-0.18,0.18,1.82,2.18,-0.025,0.032],"g":0.386,"solid":false},"office_safe":{"name":"Office safe","cat":"office","bb":[-0.3,0.3,0,0.8,-0.3,0.345],"g":0.411,"search":true},"conference_table":{"name":"Conference table","cat":"office","bb":[-1.3,1.3,0.01,0.765,-0.55,0.55],"g":0.47},"footlocker":{"name":"Footlocker","cat":"storage","bb":[-0.41,0.41,0.01,0.42,-0.22,0.235],"g":0.424,"search":true},"cedar_chest":{"name":"Cedar chest (hope chest)","cat":"storage","bb":[-0.56,0.56,0,0.58,-0.26,0.26],"g":0.46,"search":true},"steamer_trunk":{"name":"Steamer trunk","cat":"storage","bb":[-0.52,0.475,0.02,0.855,-0.285,0.295],"g":0.391,"search":true},"toolchest":{"name":"Tool chest (rolling)","cat":"storage","bb":[-0.35,0.35,0.01,0.93,-0.23,0.257],"g":0.43,"search":true},"locker":{"name":"Metal locker","cat":"storage","bb":[-0.195,0.195,0,1.82,-0.23,0.23],"g":0.479,"search":true},"locker_row":{"name":"Lockers (row of 3)","cat":"storage","bb":[-0.58,0.58,0,1.8,-0.225,0.474],"g":0.479,"search":true},"crate_open":{"name":"Crate (lid off)","cat":"storage","bb":[-0.35,0.941,0,0.65,-0.25,0.705],"g":0.494,"search":true},"crate_stack":{"name":"Crates (stacked)","cat":"storage","bb":[-0.62,0.636,0,1.12,-0.3,0.366],"g":0.494,"search":true},"cardboard_boxes":{"name":"Cardboard boxes","cat":"storage","bb":[-0.25,0.653,0,0.795,-0.2,0.298],"g":0.542,"search":true},"barrel":{"name":"Barrel","cat":"storage","bb":[-0.3,0.3,0,0.905,-0.3,0.3],"g":0.445,"search":true},"toy_chest":{"name":"Toy chest","cat":"storage","bb":[-0.41,0.41,0,0.53,-0.235,0.235],"g":0.634,"search":true},"sideboard":{"name":"Sideboard / buffet","cat":"storage","bb":[-0.815,0.815,0,0.884,-0.255,0.267],"g":0.406,"search":true},"china_hutch":{"name":"China hutch","cat":"storage","bb":[-0.615,0.615,0,1.95,-0.255,0.267],"g":0.406,"search":true},"armoire":{"name":"Armoire (tall)","cat":"storage","bb":[-0.6,0.6,0,2.27,-0.33,0.33],"g":0.388,"search":true},"medicine_cabinet":{"name":"Medicine cabinet (wall)","cat":"storage","bb":[-0.25,0.25,1.175,1.825,-0.07,0.08],"g":0.652,"search":true,"solid":false},"pantry_shelf":{"name":"Pantry shelf (jars, cans)","cat":"storage","bb":[-0.5,0.5,0,1.8,-0.16,0.16],"g":0.44,"search":true},"gun_cabinet":{"name":"Gun cabinet","cat":"storage","bb":[-0.365,0.365,0,1.824,-0.19,0.202],"g":0.388,"search":true},"pie_safe":{"name":"Pie safe (tin panels)","cat":"storage","bb":[-0.45,0.45,0,1.5,-0.21,0.237],"g":0.453,"search":true},"shrub_round_1":{"name":"Shrub, round","cat":"plants","bb":[-0.568,0.483,0.033,0.927,-0.608,0.412],"g":0.413},"shrub_round_2":{"name":"Shrub, small","cat":"plants","bb":[-0.392,0.402,0.014,0.695,-0.273,0.369],"g":0.413},"shrub_round_3":{"name":"Shrub, wide","cat":"plants","bb":[-1.078,1.158,0.006,1.293,-0.821,1.177],"g":0.413},"hedge":{"name":"Hedge (2 m)","cat":"plants","bb":[-1.0,1.0,0,1.27,-0.35,0.35],"g":0.407},"hedge_overgrown":{"name":"Hedge, overgrown (2 m)","cat":"plants","bb":[-1.0,1.033,0,1.669,-0.417,0.425],"g":0.407},"boxwood":{"name":"Boxwood (clipped ball)","cat":"plants","bb":[-0.4,0.4,0.025,0.775,-0.4,0.4],"g":0.416},"juniper":{"name":"Juniper (cone)","cat":"plants","bb":[-0.4,0.4,0,1.8,-0.4,0.4],"g":0.394},"holly":{"name":"Holly bush","cat":"plants","bb":[-0.59,0.567,0.011,1.098,-0.605,0.589],"g":0.386},"fern_clump":{"name":"Fern clump","cat":"plants","bb":[-0.47,0.47,0.048,0.352,-0.431,0.431],"g":0.438,"solid":false},"tall_grass":{"name":"Tall grass clump","cat":"plants","bb":[-0.136,0.136,0.001,0.599,-0.199,0.197],"g":0.503,"solid":false},"weeds":{"name":"Weeds","cat":"plants","bb":[-0.185,0.175,0,0.3,-0.219,0.217],"g":0.422,"solid":false},"dead_bush":{"name":"Dead bush (brittle)","cat":"plants","bb":[-0.513,0.468,0.008,0.955,-0.42,0.471],"g":0.42},"bramble":{"name":"Bramble / thorns","cat":"plants","bb":[-0.715,0.789,0.005,0.781,-1.029,1.031],"g":0.402},"flower_bed":{"name":"Flower bed (1\u00d72 m)","cat":"plants","bb":[-0.56,0.56,0,0.45,-1.06,1.06],"g":0.391,"solid":false},"flower_bed_dead":{"name":"Flower bed, dead (1\u00d72 m)","cat":"plants","bb":[-0.56,0.56,0,0.41,-1.06,1.06],"g":0.391,"solid":false},"rose_bush":{"name":"Rose bush","cat":"plants","bb":[-0.42,0.509,0.039,0.978,-0.439,0.423],"g":0.386},"rose_bush_dead":{"name":"Rose bush, dead","cat":"plants","bb":[-0.434,0.41,0.048,0.825,-0.339,0.435],"g":0.392},"wildflowers":{"name":"Wildflower patch","cat":"plants","bb":[-0.6,0.6,0,0.402,-0.6,0.6],"g":0.438,"solid":false},"daisies":{"name":"Daisies","cat":"plants","bb":[-0.25,0.279,0,0.325,-0.26,0.261],"g":0.438,"solid":false},"lilies":{"name":"Lilies (white)","cat":"plants","bb":[-0.213,0.19,0.0,0.847,-0.188,0.248],"g":0.7,"solid":false},"sunflowers":{"name":"Sunflowers (wilting)","cat":"plants","bb":[-0.33,0.38,0,1.729,-0.132,0.271],"g":0.57,"solid":false},"potted_plant":{"name":"Potted plant","cat":"plants","bb":[-0.241,0.224,0,0.914,-0.174,0.257],"g":0.416},"potted_plant_dead":{"name":"Potted plant, dead","cat":"plants","bb":[-0.167,0.161,0,0.653,-0.167,0.166],"g":0.49},"flower_urn":{"name":"Stone urn with flowers","cat":"plants","bb":[-0.31,0.31,0,0.911,-0.31,0.31],"g":0.555},"flower_urn_dead":{"name":"Stone urn, dead flowers","cat":"plants","bb":[-0.31,0.34,0,0.764,-0.541,0.496],"g":0.528},"wreath_dead":{"name":"Dead wreath (on stand)","cat":"plants","bb":[-0.37,0.37,0.004,1.505,-0.03,0.07],"g":0.419},"bouquet_grave":{"name":"Grave bouquet (fresh)","cat":"plants","bb":[-0.089,0.101,0,0.407,-0.076,0.091],"g":0.614,"solid":false},"bouquet_dead":{"name":"Grave bouquet (dead, wrapped)","cat":"plants","bb":[-0.125,0.15,0,0.06,-0.208,0.253],"g":0.621,"solid":false},"leaf_pile":{"name":"Leaf pile","cat":"plants","bb":[-0.6,0.6,0,0.18,-0.5,0.5],"g":0.451,"solid":false},"gravestone":{"name":"Headstone, rounded","cat":"graves","bb":[-0.45,0.45,0,0.86,-0.13,1.9],"g":0.396},"gravestone_square":{"name":"Headstone, square","cat":"graves","bb":[-0.45,0.45,0,0.75,-0.15,1.9],"g":0.396},"gravestone_gothic":{"name":"Headstone, gothic arch","cat":"graves","bb":[-0.45,0.45,0,1.15,-0.11,1.9],"g":0.425},"gravestone_old":{"name":"Headstone, old (leaning, mossy)","cat":"graves","bb":[-0.45,0.45,0,0.854,-0.167,1.9],"g":0.425},"gravestone_broken":{"name":"Headstone, broken","cat":"graves","bb":[-0.45,0.767,0,0.608,-0.07,1.9],"g":0.425},"gravestone_cracked":{"name":"Headstone, cracked","cat":"graves","bb":[-0.45,0.45,0,0.805,-0.13,1.9],"g":0.396},"gravestone_flat":{"name":"Flat marker","cat":"graves","bb":[-0.3,0.3,0,0.077,-0.162,0.162],"g":0.475,"solid":false},"ledger_slab":{"name":"Ledger slab (tomb lid)","cat":"graves","bb":[-0.55,0.55,0,0.455,-0.15,2.05],"g":0.528},"obelisk":{"name":"Obelisk","cat":"graves","bb":[-0.45,0.45,0,2.75,-0.45,0.45],"g":0.508},"celtic_cross":{"name":"Celtic cross","cat":"graves","bb":[-0.45,0.45,0,1.75,-0.2,1.9],"g":0.425},"angel_monument":{"name":"Angel monument","cat":"graves","bb":[-0.544,0.544,0,2.19,-0.33,0.33],"g":0.555},"angel_weeping":{"name":"Weeping angel (kneeling)","cat":"graves","bb":[-0.628,0.628,0,1.429,-0.318,0.3],"g":0.528},"lamb_grave":{"name":"Child's grave (lamb)","cat":"graves","bb":[-0.3,0.3,0,0.66,-0.15,1.5],"g":0.396},"grave_cross_wood":{"name":"Grave cross, wooden","cat":"graves","bb":[-0.45,0.45,0,1.1,-0.035,1.9],"g":0.396},"cross_grave":{"name":"Grave cross (simple)","cat":"graves","bb":[-0.25,0.25,0,1.1,-0.04,0.04],"g":0.465},"grave_cross_iron":{"name":"Grave cross, iron","cat":"graves","bb":[-0.45,0.45,0,1.25,-0.03,1.9],"g":0.425},"grave_cross_tilted":{"name":"Grave cross, leaning","cat":"graves","bb":[-0.599,0.45,0,0.988,-0.035,1.9],"g":0.425},"grave_fresh":{"name":"Fresh grave (mound + marker)","cat":"graves","bb":[-0.5,0.5,0,0.51,-0.05,1.95],"g":0.391},"grave_open":{"name":"Open grave","cat":"graves","bb":[-0.75,1.787,0,1.052,-0.2,2.1],"g":0.391,"solid":false},"grave_plot_fenced":{"name":"Family plot (iron rail)","cat":"graves","bb":[-0.93,0.93,0,0.72,-0.28,2.2],"g":0.425},"mausoleum":{"name":"Mausoleum (small)","cat":"graves","bb":[-1.3,1.3,0,3.65,-1.65,1.6],"g":0.555,"search":true},"sarcophagus":{"name":"Sarcophagus","cat":"graves","bb":[-0.5,0.5,0,0.97,-1.1,1.1],"g":0.555,"search":true},"grave_lantern":{"name":"Grave lantern (memorial candle)","cat":"graves","bb":[-0.1,0.1,0,0.32,-0.1,0.1],"g":0.386,"solid":false,"light":{"p":[0,0.12,0],"color":"#ff6a3a","energy":0.35,"range":1.8}},"lamp_cemetery_post":{"name":"Cemetery lamp post (iron, lantern)","cat":"graves","bb":[-0.2,0.2,0,3.07,-0.2,0.2],"g":0.361,"light":{"p":[0,2.6,0],"color":"#ffcf88","energy":1.1,"range":8.0}},"lamp_cemetery_post_broken":{"name":"Cemetery lamp post (dead, glass broken)","cat":"graves","bb":[-0.17,0.321,0,3.055,-0.2,0.2],"g":0.361},"lamp_grave_shepherd":{"name":"Shepherd's hook lantern","cat":"graves","bb":[-0.015,0.3,0,1.463,-0.08,0.08],"g":0.65,"solid":false,"light":{"p":[0.22,1.2,0],"color":"#ffb070","energy":0.5,"range":3.0}},"lamp_lantern_ground":{"name":"Oil lantern (on the ground)","cat":"graves","bb":[-0.08,0.08,0,0.326,-0.08,0.08],"g":0.65,"solid":false,"light":{"p":[0,0.14,0],"color":"#ffb060","energy":0.5,"range":3.0}},"grave_vase":{"name":"Grave vase (bronze)","cat":"graves","bb":[-0.116,0.151,0,0.341,-0.154,0.148],"g":0.47,"solid":false},"grave_bench_stone":{"name":"Stone bench (memorial)","cat":"graves","bb":[-0.7,0.7,0,0.47,-0.21,0.21],"g":0.528},"cemetery_sign":{"name":"Cemetery arch sign","cat":"graves","bb":[-1.56,1.56,0,3.21,-0.06,0.06],"g":0.361,"solid":false}};
const LIB_TEXTURES = {};
function SB_GEN_TEXTURES(){ return {}; }
const MODEL_LIB = {"across_imp01":{"f":"m/across/imposing/across_imp01.json","g":"across/imposing","h":1.9,"hip":1.0028,"x":2,"end":false,"tri":1776,"clips":["walk","run","hit","death"],"kb":530},"across_imp02":{"f":"m/across/imposing/across_imp02.json","g":"across/imposing","h":1.98,"hip":1.0626,"x":2,"end":false,"tri":1648,"clips":["walk","run","hit","death"],"kb":534},"across_imp03":{"f":"m/across/imposing/across_imp03.json","g":"across/imposing","h":1.8,"hip":0.9581,"x":1,"end":false,"tri":1864,"clips":["walk","run","hit","death"],"kb":535},"across_imp04":{"f":"m/across/imposing/across_imp04.json","g":"across/imposing","h":2.1,"hip":1.1361,"x":2,"end":false,"tri":1596,"clips":["walk","run","hit","death"],"kb":561},"across_01":{"f":"m/across/men/across_01.json","g":"across/men","h":1.77,"hip":0.892,"x":0,"end":false,"tri":1616,"clips":["walk","run","hit","death"],"kb":510},"across_v01":{"f":"m/across/men/across_v01.json","g":"across/men","h":1.75,"hip":0.882,"x":0,"end":false,"tri":1488,"clips":["walk","run","hit","death"],"kb":488},"across_v02":{"f":"m/across/men/across_v02.json","g":"across/men","h":1.88,"hip":0.9475,"x":1,"end":false,"tri":1800,"clips":["walk","run","hit","death"],"kb":523},"across_v03":{"f":"m/across/men/across_v03.json","g":"across/men","h":1.53,"hip":0.7711,"x":0,"end":false,"tri":1736,"clips":["walk","run","hit","death"],"kb":509},"across_v04":{"f":"m/across/men/across_v04.json","g":"across/men","h":1.95,"hip":0.9828,"x":1,"end":false,"tri":1488,"clips":["walk","run","hit","death"],"kb":516},"across_v05":{"f":"m/across/men/across_v05.json","g":"across/men","h":1.71,"hip":0.8618,"x":0,"end":false,"tri":1468,"clips":["walk","run","hit","death"],"kb":537},"across_v06":{"f":"m/across/men/across_v06.json","g":"across/men","h":1.75,"hip":0.882,"x":0,"end":false,"tri":1656,"clips":["walk","run","hit","death"],"kb":502},"across_v07":{"f":"m/across/men/across_v07.json","g":"across/men","h":1.69,"hip":0.8517,"x":0,"end":false,"tri":1784,"clips":["walk","run","hit","death"],"kb":549},"across_v08":{"f":"m/across/men/across_v08.json","g":"across/men","h":1.57,"hip":0.7912,"x":0,"end":false,"tri":1488,"clips":["walk","run","hit","death"],"kb":502},"across_v09":{"f":"m/across/men/across_v09.json","g":"across/men","h":1.86,"hip":0.9374,"x":1,"end":false,"tri":1488,"clips":["walk","run","hit","death"],"kb":525},"across_v10":{"f":"m/across/men/across_v10.json","g":"across/men","h":1.67,"hip":0.8416,"x":1,"end":false,"tri":1468,"clips":["walk","run","hit","death"],"kb":544},"across_v11":{"f":"m/across/men/across_v11.json","g":"across/men","h":1.65,"hip":0.8316,"x":0,"end":false,"tri":1468,"clips":["walk","run","hit","death"],"kb":512},"across_v12":{"f":"m/across/men/across_v12.json","g":"across/men","h":1.7,"hip":0.8568,"x":0,"end":false,"tri":1624,"clips":["walk","run","hit","death"],"kb":503},"across_unc01":{"f":"m/across/uncanny/across_unc01.json","g":"across/uncanny","h":1.92,"hip":1.0133,"x":2,"end":false,"tri":1648,"clips":["walk","run","hit","death"],"kb":493},"across_unc02":{"f":"m/across/uncanny/across_unc02.json","g":"across/uncanny","h":1.84,"hip":0.9794,"x":1,"end":false,"tri":1840,"clips":["walk","run","hit","death"],"kb":501},"across_unc03":{"f":"m/across/uncanny/across_unc03.json","g":"across/uncanny","h":1.86,"hip":0.99,"x":1,"end":false,"tri":1872,"clips":["walk","run","hit","death"],"kb":466},"across_unc05":{"f":"m/across/uncanny/across_unc05.json","g":"across/uncanny","h":2.02,"hip":1.0928,"x":2,"end":false,"tri":1616,"clips":["walk","run","hit","death"],"kb":509},"across_unc06":{"f":"m/across/uncanny/across_unc06.json","g":"across/uncanny","h":1.82,"hip":0.9687,"x":1,"end":false,"tri":1800,"clips":["walk","run","hit","death"],"kb":524},"across_01f":{"f":"m/across/women/across_01f.json","g":"across/women","h":1.65,"hip":0.8316,"x":0,"end":false,"tri":1672,"clips":["walk","run","hit","death"],"kb":524},"across_v01f":{"f":"m/across/women/across_v01f.json","g":"across/women","h":1.63,"hip":0.8215,"x":0,"end":false,"tri":1752,"clips":["walk","run","hit","death"],"kb":517},"across_v02f":{"f":"m/across/women/across_v02f.json","g":"across/women","h":1.75,"hip":0.882,"x":1,"end":false,"tri":1688,"clips":["walk","run","hit","death"],"kb":509},"across_v03f":{"f":"m/across/women/across_v03f.json","g":"across/women","h":1.53,"hip":0.7711,"x":0,"end":false,"tri":1488,"clips":["walk","run","hit","death"],"kb":467},"across_v04f":{"f":"m/across/women/across_v04f.json","g":"across/women","h":1.81,"hip":0.9122,"x":0,"end":false,"tri":1488,"clips":["walk","run","hit","death"],"kb":502},"across_v05f":{"f":"m/across/women/across_v05f.json","g":"across/women","h":1.59,"hip":0.8013,"x":0,"end":false,"tri":1704,"clips":["walk","run","hit","death"],"kb":538},"across_v06f":{"f":"m/across/women/across_v06f.json","g":"across/women","h":1.63,"hip":0.8215,"x":0,"end":false,"tri":1704,"clips":["walk","run","hit","death"],"kb":517},"across_v07f":{"f":"m/across/women/across_v07f.json","g":"across/women","h":1.69,"hip":0.8517,"x":0,"end":false,"tri":1680,"clips":["walk","run","hit","death"],"kb":542},"across_v08f":{"f":"m/across/women/across_v08f.json","g":"across/women","h":1.57,"hip":0.7912,"x":0,"end":false,"tri":1712,"clips":["walk","run","hit","death"],"kb":528},"across_v09f":{"f":"m/across/women/across_v09f.json","g":"across/women","h":1.73,"hip":0.8719,"x":1,"end":false,"tri":1656,"clips":["walk","run","hit","death"],"kb":526},"across_v10f":{"f":"m/across/women/across_v10f.json","g":"across/women","h":1.55,"hip":0.7812,"x":0,"end":false,"tri":1800,"clips":["walk","run","hit","death"],"kb":569},"across_v11f":{"f":"m/across/women/across_v11f.json","g":"across/women","h":1.53,"hip":0.7711,"x":0,"end":false,"tri":1608,"clips":["walk","run","hit","death"],"kb":533},"across_v12f":{"f":"m/across/women/across_v12f.json","g":"across/women","h":1.7,"hip":0.8568,"x":0,"end":false,"tri":1664,"clips":["walk","run","hit","death"],"kb":508},"brute_clubfist_m01":{"f":"m/bcross/brute/brute_clubfist_m01.json","g":"bcross/brute","h":1.82,"hip":0.9172,"x":0,"end":false,"tri":5154,"clips":["walk","run","hit","death"],"kb":849},"brute_onearm_f01":{"f":"m/bcross/brute/brute_onearm_f01.json","g":"bcross/brute","h":2.47,"hip":1.2851,"x":0,"end":false,"tri":1372,"clips":["walk","run","hit","death"],"kb":662},"brute_twoarm_m01":{"f":"m/bcross/brute/brute_twoarm_m01.json","g":"bcross/brute","h":2.874,"hip":null,"x":0,"end":false,"tri":9380,"clips":[],"kb":879},"brute_twoarm_m02_legless":{"f":"m/bcross/brute/brute_twoarm_m02_legless.json","g":"bcross/brute","h":3.161,"hip":null,"x":0,"end":false,"tri":8836,"clips":[],"kb":867},"brute_twoarm_m03_split":{"f":"m/bcross/brute/brute_twoarm_m03_split.json","g":"bcross/brute","h":2.722,"hip":null,"x":0,"end":false,"tri":10874,"clips":[],"kb":999},"brute_twoarm_m04_armored":{"f":"m/bcross/brute/brute_twoarm_m04_armored.json","g":"bcross/brute","h":3.054,"hip":null,"x":0,"end":false,"tri":13804,"clips":[],"kb":1362},"louis_brute":{"f":"m/bcross/brute/louis_brute.json","g":"bcross/brute","h":2.637,"hip":1.3859,"x":0,"end":false,"tri":1332,"clips":["walk","run","hit","death"],"kb":704},"contortionist_c01":{"f":"m/bcross/contortionist/contortionist_c01.json","g":"bcross/contortionist","h":1.107,"hip":0.5241,"x":0,"end":false,"tri":2180,"clips":["walk","run","hit","death","spider_idle"],"kb":697},"contortionist_c02":{"f":"m/bcross/contortionist/contortionist_c02.json","g":"bcross/contortionist","h":1.009,"hip":0.4737,"x":0,"end":false,"tri":2180,"clips":["walk","run","hit","death","spider_idle"],"kb":687},"contortionist_c03":{"f":"m/bcross/contortionist/contortionist_c03.json","g":"bcross/contortionist","h":1.183,"hip":0.5645,"x":0,"end":false,"tri":2348,"clips":["walk","run","hit","death","spider_idle"],"kb":728},"contortionist_l01":{"f":"m/bcross/contortionist/contortionist_l01.json","g":"bcross/contortionist","h":1.959,"hip":0.9979,"x":0,"end":false,"tri":2196,"clips":["walk","run","hit","death","spider_idle"],"kb":728},"contortionist_l02":{"f":"m/bcross/contortionist/contortionist_l02.json","g":"bcross/contortionist","h":2.058,"hip":1.0483,"x":0,"end":false,"tri":2176,"clips":["walk","run","hit","death","spider_idle"],"kb":748},"contortionist_m01":{"f":"m/bcross/contortionist/contortionist_m01.json","g":"bcross/contortionist","h":1.563,"hip":0.7963,"x":0,"end":false,"tri":2168,"clips":["walk","run","hit","death","spider_idle"],"kb":700},"contortionist_m02_armored":{"f":"m/bcross/contortionist/contortionist_m02_armored.json","g":"bcross/contortionist","h":1.66,"hip":0.8366,"x":0,"end":true,"tri":3844,"clips":["walk","run","hit","death","spider_idle"],"kb":995},"contortionist_m03_armored":{"f":"m/bcross/contortionist/contortionist_m03_armored.json","g":"bcross/contortionist","h":1.8,"hip":0.9072,"x":0,"end":true,"tri":3844,"clips":["walk","run","hit","death","spider_idle"],"kb":1032},"reacher_f01":{"f":"m/bcross/reacher/reacher_f01.json","g":"bcross/reacher","h":1.514,"hip":0.9072,"x":0,"end":false,"tri":3692,"clips":["walk","run","hit","death"],"kb":773},"reacher_f02":{"f":"m/bcross/reacher/reacher_f02.json","g":"bcross/reacher","h":1.84,"hip":0.9273,"x":0,"end":false,"tri":3016,"clips":["walk","run","hit","death","arms_front"],"kb":723},"reacher_f03":{"f":"m/bcross/reacher/reacher_f03.json","g":"bcross/reacher","h":2.511,"hip":0.8971,"x":0,"end":false,"tri":1968,"clips":["walk","run","hit","death"],"kb":524},"reacher_m01":{"f":"m/bcross/reacher/reacher_m01.json","g":"bcross/reacher","h":3.095,"hip":0.9576,"x":0,"end":false,"tri":1608,"clips":["walk","run","hit","death"],"kb":543},"reacher_m02":{"f":"m/bcross/reacher/reacher_m02.json","g":"bcross/reacher","h":1.86,"hip":0.9374,"x":0,"end":false,"tri":3072,"clips":["walk","run","hit","death","arms_front"],"kb":727},"runner_f01":{"f":"m/bcross/runner/runner_f01.json","g":"bcross/runner","h":1.95,"hip":1.1024,"x":0,"end":false,"tri":1488,"clips":["walk","run","hit","death"],"kb":488},"runner_m01":{"f":"m/bcross/runner/runner_m01.json","g":"bcross/runner","h":2.05,"hip":1.1589,"x":0,"end":false,"tri":1368,"clips":["walk","run","hit","death"],"kb":478},"runner_m02_armored":{"f":"m/bcross/runner/runner_m02_armored.json","g":"bcross/runner","h":2.08,"hip":1.1838,"x":0,"end":true,"tri":3056,"clips":["walk","run","hit","death"],"kb":814},"tactician_m01":{"f":"m/bcross/tactician/tactician_m01.json","g":"bcross/tactician","h":2.336,"hip":0.8668,"x":0,"end":false,"tri":3032,"clips":["walk","run","hit","death"],"kb":713},"kenneth":{"f":"m/cast/kenneth.json","g":"cast","h":1.915,"hip":0.95,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":391},"louis":{"f":"m/cast/louis.json","g":"cast","h":1.667,"hip":0.8467,"x":0,"end":false,"tri":1048,"clips":["walk","run","hit","death"],"kb":444},"norah":{"f":"m/cast/norah.json","g":"cast","h":1.65,"hip":0.8316,"x":0,"end":false,"tri":1312,"clips":["walk","run","hit","death"],"kb":419},"rachel_v2":{"f":"m/cast/rachel_v2.json","g":"cast","h":1.697,"hip":0.8467,"x":0,"end":false,"tri":1120,"clips":["walk","run","hit","death"],"kb":427},"stranger":{"f":"m/cast/stranger.json","g":"cast","h":1.671,"hip":0.8467,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":404},"cat01_m_roundglasses_tee":{"f":"m/catalogue/cat01_m_roundglasses_tee.json","g":"catalogue","h":1.796,"hip":0.9072,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":429},"cat02_m_spikyhair_hoodie":{"f":"m/catalogue/cat02_m_spikyhair_hoodie.json","g":"catalogue","h":1.775,"hip":0.892,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":438},"cat03_m_glasses_beard_polo":{"f":"m/catalogue/cat03_m_glasses_beard_polo.json","g":"catalogue","h":1.796,"hip":0.9072,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":427},"cat04_f_longdark_sweater":{"f":"m/catalogue/cat04_f_longdark_sweater.json","g":"catalogue","h":1.677,"hip":0.8366,"x":0,"end":false,"tri":1088,"clips":["walk","run","hit","death"],"kb":378},"cat05_f_longblonde_cardigan":{"f":"m/catalogue/cat05_f_longblonde_cardigan.json","g":"catalogue","h":1.667,"hip":0.8316,"x":0,"end":false,"tri":1088,"clips":["walk","run","hit","death"],"kb":439},"cat06_m_roundglasses_polo":{"f":"m/catalogue/cat06_m_roundglasses_polo.json","g":"catalogue","h":1.78,"hip":0.8971,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":420},"cat07_m_grey_blazer":{"f":"m/catalogue/cat07_m_grey_blazer.json","g":"catalogue","h":1.84,"hip":0.9223,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":423},"cat08_m_elder_stripedshirt":{"f":"m/catalogue/cat08_m_elder_stripedshirt.json","g":"catalogue","h":1.696,"hip":0.8568,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":458},"cat09_m_elder_plaidshirt":{"f":"m/catalogue/cat09_m_elder_plaidshirt.json","g":"catalogue","h":1.755,"hip":0.882,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":430},"kid01_m_brown_short":{"f":"m/kids/kid01_m_brown_short.json","g":"kids","h":1.082,"hip":0.504,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":391},"kid02_f_blonde_long":{"f":"m/kids/kid02_f_blonde_long.json","g":"kids","h":0.998,"hip":0.4687,"x":0,"end":false,"tri":1088,"clips":["walk","run","hit","death"],"kb":403},"kid03_m_black_curly":{"f":"m/kids/kid03_m_black_curly.json","g":"kids","h":1.179,"hip":0.5493,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":387},"kid04_f_dark_long":{"f":"m/kids/kid04_f_dark_long.json","g":"kids","h":0.89,"hip":0.4183,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":408},"kid05_m_red_freckles":{"f":"m/kids/kid05_m_red_freckles.json","g":"kids","h":1.233,"hip":0.5745,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":390},"kid06_m_round_dark":{"f":"m/kids/kid06_m_round_dark.json","g":"kids","h":0.973,"hip":0.4536,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":431},"kid07_f_auburn_long":{"f":"m/kids/kid07_f_auburn_long.json","g":"kids","h":1.116,"hip":0.5241,"x":0,"end":false,"tri":1088,"clips":["walk","run","hit","death"],"kb":387},"kid08_m_round_blond":{"f":"m/kids/kid08_m_round_blond.json","g":"kids","h":0.952,"hip":0.4435,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":389},"kid09_f_curly_black":{"f":"m/kids/kid09_f_curly_black.json","g":"kids","h":1.137,"hip":0.5342,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":374},"kid10_m_lightbrown":{"f":"m/kids/kid10_m_lightbrown.json","g":"kids","h":1.276,"hip":0.5947,"x":0,"end":false,"tri":920,"clips":["walk","run","hit","death"],"kb":390}};
// ================================================================ sandbox: shared state the combat engine reads
// MODE is "build" (the map builder) or "play" (Norah in the map). The engine below only runs its game logic in play.
let MODE = "build";
let REC = null;            // when set, the arena builders record map objects instead of building them
let QUIET_SPAWN = false;
const edPrefs = (()=>{ try{ return Object.assign({pixel:false, fog:false, work:true, grid:true}, JSON.parse(localStorage.getItem("crossed_sandbox_prefs")||"{}")); }catch(e){ return {pixel:false, fog:false, work:true, grid:true}; } })();
function savePrefs(){ try{ localStorage.setItem("crossed_sandbox_prefs", JSON.stringify(edPrefs)); }catch(e){} }
function ED_RES(){ return edPrefs.pixel ? 400 : 1600; }
const hexStr = c => typeof c==="number" ? "#"+c.toString(16).padStart(6,"0") : (c||"#888888");
const hexNum = c => typeof c==="number" ? c : parseInt(String(c||"#888888").replace("#",""),16);

// height of the ground under a point: a raised floor if one covers it, otherwise the terrain, otherwise 0
function groundY(x,z){
  if(!world) return 0;
  let best=null;
  for(const f of world.floorRects){ if(x>=f.x0&&x<=f.x1&&z>=f.z0&&z<=f.z1){ if(best===null||f.y>best) best=f.y; } }
  if(best!==null) return best;
  const T=world.terrain; if(!T) return 0;
  const fx=(x-T.x0)/T.cell, fz=(z-T.z0)/T.cell;
  if(fx<0||fz<0||fx>T.nx-1||fz>T.nz-1) return 0;
  const i=Math.min(T.nx-2,Math.floor(fx)), j=Math.min(T.nz-2,Math.floor(fz)), u=fx-i, v=fz-j, H=T.h, n=T.nx;
  const a=H[j*n+i], b=H[j*n+i+1], c=H[(j+1)*n+i], d=H[(j+1)*n+i+1];
  return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
}
// ================================================================ tunables
const DEFAULTS = {
  rev:{damage:1, chambers:5, spare:30, hammer:1.15, reloadBase:0.6, reloadPerRound:0.35, recoil:0.07, shake:0.25, hitstop:0.07, killSlowmo:0.7, assist:true, assistAngle:40, assistRange:12, aimFriction:0.45, fixedAimAngle:60, fixedAimRange:15, infinite:false},
  runner:{hp:10, limb:3, speed:1.85, walk:1.85, sprint:8.0, turn:260, sight:24, homing:70, charge:0.55, sprintMin:3.5, sprintMax:15, sprintCool:3.5, holdDist:2.4, kickRange:1.7, kickReach:1.8, kickCool:2.2, chamber:0.38, chamberHold:0.16, stompChance:0.35, stompReach:1.5, kickDamage:22, kickPush:3.2, kickDown:0.7, stompDamage:26, kneel:1.4, buttChance:0.35, buttDamage:18, buttPush:5, buttDown:0.9, grabChance:0.3, grabDamage:6, crushDamage:40, crushTime:1.3, hugGap:0.2, stunTime:0.9, stunStep:0.55, dropChance:0.04, dropDamage:65, dropThrow:9, dropDown:1.6, downTime:0.9, impactFreeze:0.2, stagger:0.6, afterimages:true},
  norah:{hp:100, hurtAt:0.6, critAt:0.3, hurtSpeed:0.8, critSpeed:0.62, jogStride:0.55, bleedAt:0.6, dripGap:1.1, walk:1.7, run:3.8, aimWalk:0.7, fireSlow:0.3, fireSlowTime:0.25, backpedal:0.6, vaultReach:0.75, vaultMinH:0.35, vaultMaxH:1.3, slowVault:1.4, fastVault:0.5, keyTurn:170, dodgeDist:3, dodgeTime:0.55, dodgeIframes:0.8, stumble:0.4,
         shoveRange:1.4, shoveCooldown:1.2, shoveStunSmall:1.0, shoveStunBig:0.35, shoveDamage:0.25, pushStep:0.15, god:false},
  brute:{hp:16, bigArm:3, limb:2, height:2.64, walk:1.0, turn:90, reach:2.6, windup:0.9, swing:0.25, recover:0.9, damage:40,
         rakeReach:1.5, rakeWindup:0.45, rakeDamage:15, dragSpeed:0.45, crawlSpeed:0.25, doorDamage:1.5, wallHp:4, wallDamage:1, wallSense:9, hearing:1.3, trailSense:10, slamWindup:0.85, slamRadius:2.4, slamDamage:22, slamDown:1.2, slamCool:5, slamRecover:1.4, grabWindup:0.55, grabReach:1.8, grabSteps:3, grabDamage:8, grabCool:7, throwSpeed:8, throwDamage:14, throwWallDamage:14, throwDown:1.3, liftTime:0.9, furnSpeed:9, furnDamage:20, furnCool:7, furnMin:4.5, furnMax:14, furnMaxVol:1.2, fetchRange:6, chargeWindup:0.75, chargeSpeed:6.5, chargeTime:1.8, chargeDamage:30, chargeDown:1.4, chargeStun:2.2, chargeCool:8, chargeMin:3.5, chargeMax:12, chargeMaxVol:2.5},
  across:{hp:3, limb:2, speed:1.7, turn:170, erratic:0.3, lungeRange:2.4, lungeWindup:0.65, lungeSpeed:5.5, lungeTime:0.45, damage:15, recover:1.2,
          burstMin:0.9, burstMax:1.9, stallMin:0.3, stallMax:0.8, tripChance:0.25, landTrip:0.4, fallTime:0.8, riseTime:0.4, jerk:0.6,
          swipeRange:1.1, swipeWindup:0.42, swipeDamage:10, swipeCool:1.4, crawlerShare:0.35, crawlerSpeed:0.7, crawlTrip:0.4, clothesChance:0.5,
          maxAttackers:99, circleDist:3.2, punish:1.8, hugMash:true, hugTime:2.6, mashPer:0.11, mashDecay:0.35, tellGap:0.35, walkerShamble:1.1, walkerClose:4, walkerBurst:1.9, walkerBurstMin:0.3, walkerBurstMax:0.6, walkerStallMin:0.4, walkerStallMax:0.8, walkerGapMin:0.5, walkerGapMax:1.0, walkerBiteTell:0.25, walkerBiteDamage:8, walkerBiteRange:1.2, walkerWoundSlow:0.88, walkerMinSpeed:0.5, walkerMob:0.35, walkerMobRange:6, crawlerHp:2, crawlerSpeed:0.8, crawlerFlee:2.5, crawlerHold:6, crawlerAmbush:2, crawlerAmbushTell:0.15, crawlerPauseMin:1, crawlerPauseMax:2.5, crawlerCornered:1.5, crawlerSwipeDamage:6, crawlerRetreatMin:6, crawlerRetreatMax:10, crawlerNewSide:60, crawlerDark:0.18, matronHp:4.5, matronSpeed:1.3, matronStagger:0.35, matronKnock:0.1, matronHugRange:1.3, matronHugTell:0.5, matronHugDamage:12, matronHugCool:4, matronShoveRange:0.9, matronShoveTell:0.35, matronShoveDamage:6, matronShoveDown:1.0, matronShoveCool:3, matronDoorDamage:0.75, matronBatterRate:1.0, joinKeys:2, joinDrain:0.35, mournerHp:6, mournerNear:3.5, mournerCrouch:0.6, mournerLight:1.0, mournerLightRange:9, mournerLightCone:24, mournerCalm:6, mournerCall1:8, mournerCall2:15, mournerCall3:99, mournerWailGap1:5, mournerWailGap2:4, mournerWailGap3:3, mournerClingWail:1.5, mournerLunge:3.2, mournerLungeTime:0.6, mournerLungePause:0.9, mournerSprint:4.2, mournerScreamRange:2.5, mournerScreamTell:0.4, mournerScreamCool:5, mournerStun1:0.6, mournerStun2:0.9, mournerStun3:1.2, mournerClingRange:1.2, mournerClingTell:0.25, mournerClingCool:5, mournerClingDamage1:6, mournerClingDamage2:10, mournerClingDamage3:16, mournerSwipe1:6, mournerSwipe2:10, mournerSwipe3:18, mournerStagger1:1, mournerStagger2:0.7, mournerStagger3:0.35, moveLurcherChance:0.25, movePullerChance:0.12, moveDegLurch:0.6, moveDegPull:0.3, moveLurchSpeed:0.8, movePullSpeed:0.55, animRunMix:0.45, animClip:1, animWalkRef:1.2, animRunRef:3.0, animSnap:1, animFlinch:1, animFlinchTime:0.4, hitboxScale:1.15, limbHitbox:1.25, legShotFall:0.8, torsoFall:0.3, headFall:0.15, shoveFall:1.0, jawShot:0.35, grabTime:1.2, grabDamage:8, grabMash:0.25, qteSteps:2, hugSteps:3, qteWindow:0.9, qteSlow:0.5, smoke:true,
          dragSpeed:0.45, crawlSpeed:0.3},
  zones:{headMult:2, headKb:0.35, headStag:1.1, torsoMult:1, torsoKb:0.9, torsoStag:0.55,
         armMult:0.4, armKb:0.15, armStag:0.25, legMult:0.4, legKb:0.05, legStag:0.75},
  world:{arena:"open", res:480, timeScale:1, freezeAI:false, showZones:false, fog:0.045, doorHp:3, doorScratch:0.25, budget:false, propBlock:true},
  phys:{on:true, norahAccel:12, norahDecel:16, aimAccel:7, acrossAccel:4, acrossDecel:5, bruteAccel:2.5, bruteDecel:3.5, skid:14, momentumTrip:0.6, bulletPush:120, shovePush:140, knockPush:90, haymakerPush:320, lungePush:120, swipePush:70, recoilPush:0.35, bruteMass:170, acrossMass:1, norahMass:60, furnitureWeight:1, bodyCheck:true},
  stealth:{startUnaware:false, indicators:true, showNoise:false, ambient:0.1, crouchVis:0.55, slowVaultNoise:1.0, fastVaultNoise:6, crouchSpeed:0.9, sightRange:14, sightCone:110, sightRate:1.4, decay:0.35, loseTime:5, searchTime:10, wanderRadius:4, shareRange:8,
    gunNoise:25, runNoise:7, walkNoise:2.5, crouchNoise:0.8, aimNoise:1.5, reloadNoise:2.5, doorNoise:4, slamNoise:12, pushNoise:6, shoveNoise:3, glassNoise:15},
  ctrl:{camDist:1.7, camSide:0.5, camHeight:1.65, aimDist:0.9, aimSide:0.42, aimHeight:1.58, cam:"ots", mouseSens:1, padLook:2.5, invertY:false, touch:false, volume:0.7},
  debug:{rings:false, cone:false, dodgeBar:true, attackLog:false},
  items:{searchTime:1.4, searchNoise:2.0, pickupRange:1.3, pillHeal:25, bandageHeal:12, kitHeal:60, flashDrain:0.006, flashRange:13, flashAngle:28, flashVis:0.4, glints:true}
};
const clone = o => JSON.parse(JSON.stringify(o));
let CFG = clone(DEFAULTS);
function deepMerge(a,b){ for(const k in b){ if(a[k]&&typeof a[k]==="object"&&b[k]&&typeof b[k]==="object") deepMerge(a[k],b[k]); else if(k in a) a[k]=b[k]; } }
const LS = {
  get(k,d){ try{ const s=localStorage.getItem(k); return s?JSON.parse(s):d; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
deepMerge(CFG, LS.get("crossed_sandbox_cfg_v3", {}));
if(!CFG.world.resV2){ if(CFG.world.res===320) CFG.world.res=480; CFG.world.resV2=true; }
function saveCfg(){ LS.set("crossed_sandbox_cfg_v3", CFG); }
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a));

// seeded random so a scenario plays out the same way each time
let seed = 1;
function rng(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }

// ================================================================ renderer
const canvas = document.getElementById("view");
const renderer = new THREE.WebGLRenderer({canvas, antialias:false});
renderer.setPixelRatio(1);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07080a);
scene.fog = new THREE.FogExp2(0x07080a, CFG.world.fog);
const camera = new THREE.PerspectiveCamera(60, 4/3, 0.05, 150);
function resize(){
  const cw=canvas.clientWidth||innerWidth, ch=canvas.clientHeight||innerHeight; const w = MODE!=="play" ? Math.round(Math.min(cw*Math.min(2,devicePixelRatio||1), ED_RES())) : CFG.world.res, h = Math.max(1,Math.round(w * ch / cw));
  renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();
const hemi=new THREE.HemisphereLight(0x5a6070, 0x1a140e, 0.55); scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9aa6c0, 0.5); moon.position.set(-6,12,4); scene.add(moon);
const muzzle = new THREE.PointLight(0xffd090, 0, 9); scene.add(muzzle);
const M = (c)=>new THREE.MeshLambertMaterial({color:c});
function noiseTex(a,b,cells=4,rep=1){
  const c=document.createElement("canvas"); c.width=c.height=32; const g=c.getContext("2d");
  const s=32/cells; for(let y=0;y<cells;y++)for(let x=0;x<cells;x++){ g.fillStyle=((x+y)&1)?a:b; g.fillRect(x*s,y*s,s,s); }
  for(let i=0;i<70;i++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.25})`; g.fillRect(Math.random()*32|0,Math.random()*32|0,1,1); }
  const t=new THREE.CanvasTexture(c); t.magFilter=t.minFilter=THREE.NearestFilter; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep,rep); return t;
}

// ================================================================ world
let world = null;
function newWorld(){
  if(world){ scene.remove(world.group); }
  world = {crowd:null, trail:[], weakWalls:[], flying:[], floorRects:[], containers:[], pickups:[], exits:[], ambient:null, terrain:null, lightCapped:false, group:new THREE.Group(), segs:[], circles:[], boxes:[], doors:[], blockers:[], cams:[], portals:[], lightPts:[], windows:[], noises:[], corpses:[], goal:null, bounds:{x0:-12,x1:12,z0:-12,z1:12}, spawn:{x:0,z:8,yaw:Math.PI}, enemySpawns:[], name:""};
  scene.add(world.group);
}
function addFloor(x0,z0,x1,z1,a="#2c2925",b="#36322c",o={}){
  if(REC){ REC.push({type:"floor",x:x0,z:z0,w:x1-x0,d:z1-z0,colA:a,colB:b,tex:"",y:0}); return; }
  const w=x1-x0,d=z1-z0, y=o.y||0; let mat;
  if(o.tex && SBTEX[o.tex] && SBTEX[o.tex].ready) mat=texMat(o.tex,w/(o.scale||1),d/(o.scale||1),a);
  else { const t=noiseTex(a,b,4,1); t.repeat.set(w/2,d/2); mat=new THREE.MeshLambertMaterial({map:t}); }
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d), mat);
  m.rotation.x=-Math.PI/2; m.position.set((x0+x1)/2,y,(z0+z1)/2); world.group.add(m); world.floorRects.push({x0,z0,x1,z1,y});
  if(y>0.05){ const sk=new THREE.Mesh(new THREE.BoxGeometry(w,y+2,d),M(0x2a2420)); sk.position.set((x0+x1)/2,y/2-1-0.01,(z0+z1)/2); world.group.add(sk); }
}
// a wall from a to b; openings = [{at, width, kind:"door"|"window"|"gap", sill, top, hinge:"start"|"end", side:1|-1, closed}]
function addWall(ax,az,bx,bz,h=3,t=0.2,col=0x4a443b,openings=[],wo={}){
  if(REC){ REC.push({type:"wall",a:[ax,az],b:[bx,bz],height:h,thick:t,color:hexStr(col),tex:"",openings:openings.map(x=>Object.assign({},x))}); return; }
  const L=Math.hypot(bx-ax,bz-az); if(L<0.01) return; const base=wo.base||0; const wrec = wo.weak ? {segs:[],meshes:[],hp:CFG.brute.wallHp,broken:false,ax,az,bx,bz} : null; if(wrec) world.weakWalls.push(wrec);
  const ux=(bx-ax)/L, uz=(bz-az)/L, ang=Math.atan2(uz,ux);
  const pieces=[]; let s=0;
  for(const op of [...openings].sort((p,q)=>p.at-q.at)){
    const s0=clamp(op.at-op.width/2,0,L), s1=clamp(op.at+op.width/2,0,L);
    if(s0>s) pieces.push([s,s0,0,h,true]);
    const top = op.top ?? (op.kind==="window"?2.2:2.1);
    if(op.kind==="window"){ const sill=op.sill??0.9; const win={broken:false, segs:[], meshes:[], gap:{ax:ax+ux*s0,az:az+uz*s0,bx:ax+ux*s1,bz:az+uz*s1}}; world.windows.push(win); pieces.push([s0,s1,0,sill,true,win]); pieces.push([s0,s1,sill,top,"glass",win]);
      const c=(s0+s1)/2, cx=ax+ux*c, cz=az+uz*c; for(const sd of [-1,1]) world.portals.push({x:cx-uz*0.7*sd, z:cz+ux*0.7*sd, pair:world.portals.length+(sd<0?1:-1), win}); }
    if(top<h) pieces.push([s0,s1,top,h,false]);
    if(op.kind!=="window"){ const c=(s0+s1)/2, cx=ax+ux*c, cz=az+uz*c; for(const sd of [-1,1]) world.portals.push({x:cx-uz*0.7*sd, z:cz+ux*0.7*sd, pair:world.portals.length+(sd<0?1:-1)}); }
    if(op.kind==="door") addDoor(ax+ux*(op.hinge==="end"?s1:s0), az+uz*(op.hinge==="end"?s1:s0), op.hinge==="end"?-ux:ux, op.hinge==="end"?-uz:uz, s1-s0, Math.min(top,h), op.side||1, !!op.closed, op, base);
    s=Math.max(s,s1);
  }
  if(s<L) pieces.push([s,L,0,h,true]);
  for(const [p0,p1,h0,h1,block,win] of pieces){
    const len=p1-p0, hh=h1-h0; if(len<0.005||hh<0.005) continue;
    const glass = block==="glass";
    const wm = wo.tex&&SBTEX[wo.tex]&&SBTEX[wo.tex].ready ? (()=>{ const s=wo.scale||1, A=texMat(wo.tex,len/s,hh/s,hexStr(col)), Bm=wo.texB&&SBTEX[wo.texB]&&SBTEX[wo.texB].ready?texMat(wo.texB,len/s,hh/s,hexStr(col)):A, E=texMat(wo.tex,t/s,hh/s,hexStr(col)); return [E,E,E,E,A,Bm]; })() : M(col);
    const m=new THREE.Mesh(new THREE.BoxGeometry(len,hh,glass?0.03:t), glass?new THREE.MeshLambertMaterial({color:0x1a2230,transparent:true,opacity:0.5}):wm);
    const mid=(p0+p1)/2; m.position.set(ax+ux*mid,(h0+h1)/2+base,az+uz*mid); m.rotation.y=-ang; world.group.add(m);
    if(!glass){ world.blockers.push(m); if(wrec) wrec.meshes.push(m); }
    if(win) win.meshes.push(m), (glass && (win.glass=m));
    if(block && h0<0.3){ const sg={ax:ax+ux*p0,az:az+uz*p0,bx:ax+ux*p1,bz:az+uz*p1,t}; if(win){ sg.win=win; win.segs.push(sg); } else if(wrec){ sg.weak=wrec; wrec.segs.push(sg); } world.segs.push(sg); }
    if(glass){ const sg={ax:ax+ux*p0,az:az+uz*p0,bx:ax+ux*p1,bz:az+uz*p1,t:0.05,glass:true,win}; win.segs.push(sg); world.segs.push(sg); }
  }
  if(wo.skirt){ const sk=new THREE.Mesh(new THREE.BoxGeometry(L,3,t*0.98),M(col)); sk.position.set((ax+bx)/2,base-1.5+0.001,(az+bz)/2); sk.rotation.y=-ang; world.group.add(sk); if(wrec) wrec.meshes.push(sk); }
}
function addDoor(hx,hz,ux,uz,width,h,side,closed,op={},baseY=0){
  const pivot=new THREE.Object3D(); pivot.position.set(hx,baseY,hz); world.group.add(pivot);
  const leaf=new THREE.Mesh(new THREE.BoxGeometry(width-0.04,h-0.03,0.05), M(0x6a4a30)); leaf.position.set((width-0.04)/2+0.02,(h-0.03)/2,0); pivot.add(leaf);
  const knob=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.12), M(0xb09060)); knob.position.set(width-0.12,1.0,0); pivot.add(knob);
  const base=Math.atan2(uz,ux);
  const d={pivot,leaf,hx,hz,base,width,side,ang:closed?0:1.45,target:closed?0:1.45,hp:CFG.world.doorHp,broken:false,speed:2.5,shake:0,locked:!!op.locked,key:op.key||""};
  world.doors.push(d); world.blockers.push(leaf); applyDoor(d); return d;
}
function doorEnd(d){ const a=d.base+d.side*d.ang; return {x:d.hx+Math.cos(a)*d.width, z:d.hz+Math.sin(a)*d.width}; }
function applyDoor(d){ d.pivot.rotation.y = -(d.base+d.side*d.ang) + (d.shake?Math.sin(performance.now()*0.08)*0.03*d.shake:0); }
function addPillar(x,z,r=0.45,h=3,col=0x5a5246){ if(REC){ REC.push({type:"pillar",x,z,r,h,color:hexStr(col)}); return; } const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.1,h,8), M(col)); m.position.set(x,h/2+groundY(x,z),z); world.group.add(m); world.blockers.push(m); world.circles.push({x,z,r:r*1.1}); }
function addBox(x,z,w,d,h,col=0x5b4128,push=false,name="",bo={}){
  if(REC){ REC.push({type:"block",x,z,w,d,h,color:hexStr(col),push,name,tex:""}); return; }
  const y0=groundY(x,z); const bm = bo.tex&&SBTEX[bo.tex]&&SBTEX[bo.tex].ready ? (()=>{ const A=texMat(bo.tex,w,h,hexStr(col)), B=texMat(bo.tex,d,h,hexStr(col)), T=texMat(bo.tex,w,d,hexStr(col)); return [B,B,T,T,A,A]; })() : M(col);
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), bm); m.position.set(x,y0+h/2,z); world.group.add(m); world.blockers.push(m);
  const b={x,z,w,d,h,y0,mesh:m,push,name,under:/bed|table|desk|pew|gurney/.test(name)&&h>=0.5,get x0(){return this.x-this.w/2},get x1(){return this.x+this.w/2},get z0(){return this.z-this.d/2},get z1(){return this.z+this.d/2}};
  world.boxes.push(b); return b;
}
function addCorpse(x,z,yaw){ if(REC){ REC.push({type:"corpse",x,z,yaw:Math.round(yaw*180/Math.PI)}); return; } const g=new THREE.Group(); g.position.set(x,groundY(x,z),z); g.rotation.y=yaw; world.group.add(g); world.corpses.push({x,z});
  const c=[0x3a3430,0x4a3a3a,0x2e3440][Math.floor(Math.random()*3)];
  const add=(w,h,d,col,px,py,pz)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(col)); m.position.set(px,py,pz); g.add(m); };
  add(0.42,0.2,0.62,c,0,0.1,0); add(0.2,0.18,0.22,0x9a8a7a,0,0.1,0.45); add(0.12,0.12,0.5,c,0.24,0.06,0.05); add(0.12,0.12,0.5,c,-0.26,0.06,-0.1); add(0.14,0.14,0.85,0x2a2a30,0.1,0.07,-0.7); add(0.14,0.14,0.85,0x2a2a30,-0.12,0.07,-0.72);
  bloodPool(x,z,0.7); }
function addLight(x,y,z,col=0xffb060,i=1.1,r=12){ if(REC){ REC.push({type:"light",x,y,z,color:hexStr(col),intensity:i,dist:r}); return; } const l=new THREE.PointLight(col,i,r); l.position.set(x,y,z); world.group.add(l); world.lightPts.push({x,y,z,i,r}); return l; }
function addCam(x,y,z,lx,ly,lz,track=true,fov=60){ if(REC){ REC.push({type:"camera",x,y,z,look:[lx,ly,lz],track,fov}); return; } world.cams.push({pos:new THREE.Vector3(x,y,z), look:new THREE.Vector3(lx,ly,lz), track, fov}); }

// ---------------------------------------------------------------- collision
function pushSeg(p,r,s){
  const dx=s.bx-s.ax, dz=s.bz-s.az, L2=dx*dx+dz*dz; if(L2<1e-8) return false;
  const u=clamp(((p.x-s.ax)*dx+(p.z-s.az)*dz)/L2,0,1); const cx=s.ax+dx*u, cz=s.az+dz*u;
  const ex=p.x-cx, ez=p.z-cz, d=Math.hypot(ex,ez), m=r+s.t/2;
  if(d<m){ if(d>1e-5){ p.x=cx+ex/d*m; p.z=cz+ez/d*m; } else { const L=Math.sqrt(L2); p.x=cx-dz/L*m; p.z=cz+dx/L*m; } return true; }
  return false;
}
function doorSeg(d){ const e=doorEnd(d); return {ax:d.hx,az:d.hz,bx:e.x,bz:e.z,t:0.07}; }
function collide(p, r, skipBox, under, climb){
  const B=world.bounds; p.x=clamp(p.x,B.x0+r,B.x1-r); p.z=clamp(p.z,B.z0+r,B.z1-r);
  let hit=false;
  for(const s of world.segs){ if(climb && s.win && s.win.broken) continue; hit = pushSeg(p,r,s) || hit; }
  for(const d of world.doors) if(!d.broken) hit = pushSeg(p,r,doorSeg(d)) || hit;
  for(const c of world.circles){ const dx=p.x-c.x, dz=p.z-c.z, d=Math.hypot(dx,dz), m=c.r+r; if(d<m){ hit=true; if(d>1e-4){ p.x=c.x+dx/d*m; p.z=c.z+dz/d*m; } } }
  for(const b of world.boxes){ if(b===skipBox || (under && b.under)) continue;
    const cx=clamp(p.x,b.x0,b.x1), cz=clamp(p.z,b.z0,b.z1), dx=p.x-cx, dz=p.z-cz, d=Math.hypot(dx,dz);
    if(d<r){ hit=true; if(d>1e-4){ p.x=cx+dx/d*r; p.z=cz+dz/d*r; } else { const opts=[[b.x0-r-p.x,0],[b.x1+r-p.x,0],[0,b.z0-r-p.z],[0,b.z1+r-p.z]].sort((a,c)=>Math.abs(a[0]+a[1])-Math.abs(c[0]+c[1])); p.x+=opts[0][0]; p.z+=opts[0][1]; } } }
  return hit;
}
function segsCross(ax,az,bx,bz,cx,cz,dx,dz){
  const d=(bx-ax)*(dz-cz)-(bz-az)*(dx-cx); if(Math.abs(d)<1e-9) return false;
  const u=((cx-ax)*(dz-cz)-(cz-az)*(dx-cx))/d, v=((cx-ax)*(bz-az)-(cz-az)*(bx-ax))/d; return u>0&&u<1&&v>0&&v<1;
}
function boxEdges(b){ return [[b.x0,b.z0,b.x1,b.z0],[b.x1,b.z0,b.x1,b.z1],[b.x1,b.z1,b.x0,b.z1],[b.x0,b.z1,b.x0,b.z0]]; }
// see=true: can you see along it (glass and low furniture don't block). see=false: can you walk along it (everything blocks).
function lineOfSight(ax,az,bx,bz, see, skipDoors){
  for(const s of world.segs){ if(s.glass && see) continue; if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) return false; }
  if(!skipDoors) for(const d of world.doors){ if(d.broken) continue; const s=doorSeg(d); if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) return false; }
  for(const b of world.boxes){ if(see && b.h<1.6) continue; for(const e of boxEdges(b)) if(segsCross(ax,az,bx,bz,...e)) return false; }
  if(!see) for(const c of world.circles){ const dx=bx-ax, dz=bz-az, L2=dx*dx+dz*dz||1; const u=clamp(((c.x-ax)*dx+(c.z-az)*dz)/L2,0,1); if(Math.hypot(ax+dx*u-c.x, az+dz*u-c.z)<c.r) return false; }
  return true;
}
// shortest route through doorways (doors count as passable; enemies bash closed ones on the way)
// walls only: furniture and pillars are left to local steering
function wallsClear(ax,az,bx,bz){ for(const s of world.segs) if(!s.win && segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) return false; return true; }
// the window in the way, if a window is the only thing between two points
function windowBlock(ax,az,bx,bz){ let w=null; for(const s of world.segs){ if(!segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) continue; if(s.win) w=s.win; else return null; } return w; }
function smashWindow(win, by){
  if(win.broken) return; win.broken=true; for(const sg of win.segs){ const i=world.segs.indexOf(sg); if(i>=0) world.segs.splice(i,1); }
  if(win.glass){ win.glass.visible=false; const p=win.glass.position.clone(); spray(p,new THREE.Vector3(0,0,0),0x9ab0c0); spray(p,new THREE.Vector3(0,0,0),0x9ab0c0); SFX.glass(p); makeNoise(p.x,p.z,CFG.stealth.glassNoise,"glass",true); }
  log(`${by.name} smashes through a window`,"#ffb070");
}
function route(fx,fz,tx,tz){
  if(wallsClear(fx,fz,tx,tz)) return {x:tx,z:tz,direct:true};
  const N=world.portals, n=N.length; if(!n) return {x:tx,z:tz,direct:true};
  const dist=new Array(n).fill(1e9), prev=new Array(n).fill(-1), done=new Array(n).fill(false);
  for(let i=0;i<n;i++) if(wallsClear(fx,fz,N[i].x,N[i].z)) dist[i]=Math.hypot(N[i].x-fx,N[i].z-fz);
  let best=-1, bestCost=1e9;
  for(let it=0;it<n;it++){
    let u=-1; for(let i=0;i<n;i++) if(!done[i]&&dist[i]<1e9&&(u<0||dist[i]<dist[u])) u=i; if(u<0) break; done[u]=true;
    if(wallsClear(N[u].x,N[u].z,tx,tz)){ const c=dist[u]+Math.hypot(tx-N[u].x,tz-N[u].z); if(c<bestCost){ bestCost=c; best=u; } }
    for(let v=0;v<n;v++){ if(done[v]) continue; const pairStep = N[u].pair===v; if(pairStep || wallsClear(N[u].x,N[u].z,N[v].x,N[v].z)){ const c=dist[u]+Math.hypot(N[v].x-N[u].x,N[v].z-N[u].z); if(c<dist[v]){ dist[v]=c; prev[v]=u; } } }
  }
  if(best<0) return {x:tx,z:tz,direct:true};
  let first=best; while(prev[first]>=0) first=prev[first];
  // skip a waypoint we're already standing on
  if(Math.hypot(N[first].x-fx,N[first].z-fz)<0.35){ let k=best; while(prev[k]>=0 && prev[k]!==first) k=prev[k]; if(k!==first) first=k; else if(N[first].pair!==undefined && N[N[first].pair]) first=N[first].pair; }
  return {x:N[first].x,z:N[first].z,direct:false};
}
function blockingDoor(ax,az,bx,bz){ for(const d of world.doors){ if(d.broken||d.ang>0.6) continue; const s=doorSeg(d); if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) return d; } return null; }

// ---------------------------------------------------------------- arenas
const ARENAS = {
  open:{name:"Open arena (24 × 24 m)", build(){
    const A=12; world.bounds={x0:-A,x1:A,z0:-A,z1:A};
    addFloor(-A,-A,A,A);
    addWall(-A,-A,A,-A); addWall(A,-A,A,A); addWall(A,A,-A,A); addWall(-A,A,-A,-A);
    addPillar(-4,-4); addPillar(4,-4); addPillar(-4,4); addPillar(4,4);
    addBox(0,-7,1.1,1.1,1.0); addBox(1.1,-7,1.1,1.1,0.8); addBox(-8,0,1.1,1.1,1.0,0x5b4128,true,"crate"); addBox(8,1,1.1,1.1,1.3,0x5b4128,true,"crate"); addBox(-1,6,1.6,1.6,0.9);
    // a narrow corridor with a door at its mouth
    addWall(-8.6,-11.9,-8.6,-5.5,3,0.25); addWall(-6.4,-11.9,-6.4,-5.5,3,0.25);
    addWall(-8.6,-5.5,-6.4,-5.5,3,0.25,0x4a443b,[{at:1.1,width:1.0,kind:"door",side:1}]);
    addLight(-5,3,-5); addLight(6,3,6,0xffb060,1.0); addLight(-7.5,2.6,-9,0xffa050,0.8,6);
    addCam(-10.8,3.6,10.8,0,0.8,0); addCam(10.8,3.6,10.8,0,0.8,0); addCam(10.8,3.6,-10.8,0,0.8,0); addCam(-10.8,3.6,-10.8,0,0.8,0); addCam(-7.5,2.6,-11.5,-7.5,0.8,-5,false); addCam(0,9,0.1,0,0,0);
    world.spawn={x:0,z:8,yaw:Math.PI};
  }},
  house:{name:"Norah's house (bedroom + living room)", build(){
    world.bounds={x0:-4.5,x1:4.5,z0:-5,z1:5.5};
    addFloor(-2.6,-4.6,2.6,0,"#3a2e24","#43352a"); addFloor(-4.2,0,4.2,5.2,"#2f2a26","#37312b");
    const h=2.6;
    // bedroom
    addWall(-2.6,-4.6,2.6,-4.6,h,0.2,0x6a6458,[{at:3.7,width:1.1,kind:"window",sill:0.95,top:2.1}]);
    addWall(-2.6,-4.6,-2.6,0,h,0.2,0x6a6458); addWall(2.6,-4.6,2.6,0,h,0.2,0x6a6458);
    // shared wall with the door
    addWall(-4.2,0,4.2,0,h,0.15,0x6a6458,[{at:5.6,width:0.9,kind:"door",side:1}]);
    // living room
    addWall(-4.2,0,-4.2,5.2,h,0.2,0x5e594f); addWall(4.2,0,4.2,5.2,h,0.2,0x5e594f,[{at:2.6,width:1.2,kind:"window",sill:0.9}]);
    addWall(-4.2,5.2,4.2,5.2,h,0.2,0x5e594f,[{at:2.2,width:1.0,kind:"door",side:-1,closed:true}]);
    addBox(-1.4,-3.4,1.5,2.0,0.55,0x7a6a5a,false,"bed");
    addBox(1.9,-4.15,1.0,0.55,1.9,0x4a3424,true,"wardrobe");
    addBox(-1.8,2.6,0.9,1.9,0.8,0x40362c,false,"couch"); addBox(1.2,2.8,1.0,0.6,0.45,0x3a2e22,false,"coffee table");
    addBox(3.6,0.7,0.9,0.35,1.8,0x4a3424,true,"bookshelf");
    addLight(0,2.3,-2.3,0xffc890,0.8,7); addLight(0,2.3,2.6,0xffc070,0.9,8);
    addCam(2.4,2.4,-0.3,-1,0.6,-3.2); addCam(-2.4,2.4,-4.4,0.8,0.6,-1.2); addCam(4.0,2.4,5.0,-1,0.6,1.5); addCam(-4.0,2.4,0.2,1.5,0.6,3.5);
    world.spawn={x:0.5,z:3.8,yaw:Math.PI}; world.enemySpawns=[{x:0.8,z:-3.6},{x:-1.8,z:-1.2}];
  }},
  corridor:{name:"Corridor with side rooms", build(){
    world.bounds={x0:-5,x1:5,z0:-15,z1:2};
    addFloor(-1,-14.5,1,1.5,"#2a2724","#312d29"); addFloor(-4.6,-14.5,-1,1.5,"#26221f","#2e2925"); addFloor(1,-14.5,4.6,1.5,"#26221f","#2e2925");
    const h=3;
    addWall(-1,1.5,-1,-14.5,h,0.2,0x4f4a42,[{at:3,width:1,kind:"door",side:-1},{at:9,width:1,kind:"door",side:-1,closed:true}]);
    addWall(1,-14.5,1,1.5,h,0.2,0x4f4a42,[{at:5,width:1,kind:"door",side:-1},{at:12,width:1,kind:"door",side:-1}]);
    addWall(-4.6,1.5,4.6,1.5); addWall(-4.6,-14.5,4.6,-14.5); addWall(-4.6,1.5,-4.6,-14.5); addWall(4.6,1.5,4.6,-14.5);
    addWall(-4.6,-6,-1,-6,h,0.2); addWall(1,-7.5,4.6,-7.5,h,0.2);
    addBox(-3.5,-2,0.9,1.6,0.9,0x4a3a2a,true,"desk"); addBox(3.4,-11,1.4,0.6,1.7,0x4a3424,true,"cabinet");
    addLight(0,2.7,-2,0xd8e0ff,0.8,7); addLight(0,2.7,-10,0xff4040,0.6,6); addLight(-3,2.6,-10,0xffb060,0.5,5); addLight(3,2.6,-3,0xffb060,0.5,5);
    addCam(0,2.8,1.2,0,0.8,-6); addCam(0,2.8,-14.2,0,0.8,-6); addCam(-4.2,2.6,1.2,-2.5,0.6,-3); addCam(-4.2,2.6,-14.2,-2.5,0.6,-9); addCam(4.2,2.6,1.2,2.5,0.6,-4); addCam(4.2,2.6,-14.2,2.5,0.6,-11);
    world.spawn={x:0,z:0.6,yaw:Math.PI}; world.enemySpawns=[{x:0,z:-13.5},{x:-0.4,z:-12.5},{x:0.4,z:-11.6}];
  }},
  clinic:{name:"Abandoned clinic (stealth)", build(){
    world.bounds={x0:-10,x1:10,z0:-13.4,z1:5.6};
    addFloor(-9.5,-12,9.5,5,"#2a2824","#302d29"); addFloor(-1.4,-13.2,1.4,-12,"#1e2a1e","#243024");
    const h=2.8, W=0x5e5a52, I=0x6a665c;
    // outer walls: entrance south, exit north, windows on the sides
    addWall(-9.5,5,9.5,5,h,0.25,W,[{at:9.5,width:1.2,kind:"gap"}]);
    addWall(9.5,-12,-9.5,-12,h,0.25,W,[{at:9.5,width:1.1,kind:"door",side:1}]);
    addWall(-9.5,-12,-9.5,5,h,0.25,W,[{at:4,width:1.2,kind:"window",sill:0.9},{at:13,width:1.2,kind:"window",sill:0.9}]);
    addWall(9.5,5,9.5,-12,h,0.25,W,[{at:12,width:1.2,kind:"window",sill:0.9}]);
    // hallway walls with doors into the rooms
    addWall(-1.2,5,-1.2,-12,h,0.18,I,[{at:4,width:1.0,kind:"door",side:-1},{at:12,width:1.0,kind:"door",side:-1,closed:true}]);
    addWall(1.2,-12,1.2,5,h,0.18,I,[{at:5.5,width:1.0,kind:"door",side:-1},{at:12.5,width:1.0,kind:"door",side:-1,closed:true}]);
    // rooms: office / ward on the west, storage / cafeteria on the east
    addWall(-9.5,-3,-1.2,-3,h,0.18,I,[{at:4.2,width:1.0,kind:"door",side:1,closed:true}]);
    addWall(1.2,-2,9.5,-2,h,0.18,I,[{at:4,width:1.0,kind:"door",side:1}]);
    // ward: beds a crawler can get under
    for(const [x,z] of [[-7.2,-10.6],[-7.2,-8.2],[-7.2,-5.6],[-3.4,-10.6],[-3.4,-5.6]]) addBox(x,z,2.0,1.0,0.55,0x8a8478,false,"bed");
    // office
    addBox(-5,3.2,1.5,0.75,0.75,0x4a3a2a,false,"desk"); addBox(-8.7,-0.5,0.55,1.1,1.8,0x4a4a4a,true,"cabinet"); addBox(-3,0.5,0.5,0.5,0.9,0x3a3a3a,false,"chair");
    // storage
    addBox(4,4.2,1.8,0.5,1.8,0x4a3424,true,"shelf"); addBox(7.4,4.2,1.8,0.5,1.8,0x4a3424,true,"shelf"); addBox(8.4,0.2,1.0,1.0,1.0,0x5b4128,true,"crate"); addBox(4.6,-0.6,1.0,1.0,0.8,0x5b4128,true,"crate");
    // cafeteria
    for(const [x,z] of [[4,-9.5],[7,-9.5],[4,-5.5],[7,-5.5]]) addBox(x,z,1.6,0.9,0.75,0x6a5a48,false,"table");
    addBox(8.9,-4,0.6,2.6,1.0,0x5a5a58,false,"counter");
    // hallway gurney
    addBox(0.55,-4.5,0.6,1.9,0.8,0x9a9a90,false,"gurney");
    // bodies on the floor
    addCorpse(5.6,-7.4,0.6); addCorpse(-0.4,2.2,2.2); addCorpse(-5,-1.6,1.2);
    // light: mostly dark, a few pools
    addLight(0,2.6,3.5,0xd8e0ff,0.45,5); addLight(0,2.6,-9.5,0xff3020,0.45,5); addLight(5.6,2.5,-7.2,0xffd8a0,1.1,6.5); addLight(-5,1.6,3.2,0xffc070,0.7,4);
    addLight(6,2.5,1.5,0xc0c8d0,0.25,5); addLight(-5.5,2.5,-8,0x8090a0,0.18,6);
    const ex=addLight(0,2.4,-12.7,0x60ff80,0.7,3.5);
    world.goal={x:0,z:-12.75,r:0.7}; const ring=ringMesh(); ring.position.set(0,0.03,-12.75); ring.scale.set(0.7,0.7,1); ring.material.color.setHex(0x60ff80); scene.remove(ring); world.group.add(ring);
    addCam(0,2.6,4.6,0,0.8,-2); addCam(0,2.6,-11.6,0,0.8,-4); addCam(-9,2.5,4.6,-4,0.6,0); addCam(-9,2.5,-11.6,-4,0.6,-7); addCam(9,2.5,-11.6,4,0.6,-7); addCam(9,2.5,4.6,4,0.6,1);
    world.spawn={x:0,z:4.3,yaw:Math.PI};
  }},
  chapel:{name:"Chapel nave", build(){
    world.bounds={x0:-5.5,x1:5.5,z0:-12,z1:11};
    addFloor(-5.2,-11.6,5.2,10.6,"#3a3530","#423c36");
    const h=5;
    addWall(-5.2,10.6,5.2,10.6,h,0.25,0xb8b2a2,[{at:5.2,width:1.8,kind:"gap"}]);
    addWall(-5.2,-11.6,5.2,-11.6,h,0.25,0xb8b2a2);
    addWall(-5.2,-11.6,-5.2,10.6,h,0.25,0xb8b2a2,[{at:5,width:1.2,kind:"window",sill:1.4,top:3.6},{at:11,width:1.2,kind:"window",sill:1.4,top:3.6},{at:17,width:1.2,kind:"window",sill:1.4,top:3.6}]);
    addWall(5.2,10.6,5.2,-11.6,h,0.25,0xb8b2a2,[{at:5,width:1.2,kind:"window",sill:1.4,top:3.6},{at:11,width:1.2,kind:"window",sill:1.4,top:3.6},{at:17,width:1.2,kind:"window",sill:1.4,top:3.6}]);
    for(let i=0;i<7;i++){ const z=6.5-i*2.1; addBox(-2.9,z,3.4,0.55,0.9,0x5a3e28,false,"pew"); addBox(2.9,z,3.4,0.55,0.9,0x5a3e28,false,"pew"); }
    addBox(0,-10.2,10.3,2.6,0.6,0x6a6258,false,"stage"); addBox(0,-10.3,2.2,0.9,1.0,0xd8d0c0,false,"altar");
    addPillar(-3.9,-5,0.35,5,0x8a8478); addPillar(3.9,-5,0.35,5,0x8a8478); addPillar(-3.9,3,0.35,5,0x8a8478); addPillar(3.9,3,0.35,5,0x8a8478);
    addLight(0,3.5,-9.8,0xff3020,0.9,8); addLight(0,4,0,0xffc080,0.6,12); addLight(0,4,8,0xffc080,0.6,10);
    addCam(0,4.2,10.2,0,0.8,0); addCam(0,3.4,-8.2,0,0.8,4); addCam(-4.8,3.6,-1,1,0.8,-4); addCam(4.8,3.6,7,-1,0.8,2);
    world.spawn={x:0,z:9.4,yaw:Math.PI}; world.enemySpawns=[{x:-1.5,z:-7.8},{x:1.5,z:-7.8},{x:0,z:-6.5},{x:-0.6,z:-4},{x:0.7,z:-2.5}];
  }}
};
let importedMap = LS.get("crossed_playground_map", null);
function buildArena(key){
  newWorld(); world.name=key;
  if(key==="imported" && importedMap){ buildImported(importedMap); }
  else (ARENAS[key]||ARENAS.open).build();
  activeCam=null;
  for(const e of enemies) e.removeRings&&e.removeRings();
}

// ---------------------------------------------------------------- Map Designer import
const PROP_SIZES = [ // keyword → [w, d, h]
  ["wardrobe",[1.0,0.6,1.9]],["bookshelf",[0.9,0.35,1.8]],["shelf",[0.9,0.35,1.6]],["bed",[1.5,2.0,0.6]],["pew",[3.0,0.55,0.9]],["altar",[2.0,0.9,1.0]],
  ["table",[1.2,0.8,0.75]],["desk",[1.3,0.7,0.75]],["dresser",[1.1,0.5,0.9]],["couch",[1.9,0.9,0.85]],["sofa",[1.9,0.9,0.85]],["cabinet",[0.9,0.5,1.4]],
  ["fridge",[0.75,0.7,1.8]],["stove",[0.75,0.65,0.9]],["counter",[1.2,0.6,0.9]],["crate",[1.0,1.0,1.0]],["box",[0.6,0.6,0.5]],["piano",[1.5,0.6,1.2]],
  ["bench",[1.5,0.4,0.45]],["toilet",[0.45,0.7,0.8]],["tub",[1.6,0.75,0.6]],["bath",[1.6,0.75,0.6]],["chair",[0.5,0.5,0.9]],["truck",[2.0,5.2,1.9]],["car",[1.8,4.4,1.4]],["sedan",[1.8,4.4,1.4]],
  ["pillar",[0.6,0.6,3]],["column",[0.6,0.6,3]],["grave",[0.6,0.25,0.9]],["tomb",[1.0,2.0,0.9]],["organ",[2.0,0.9,2.2]],["lectern",[0.6,0.5,1.2]],["pulpit",[1.2,1.0,1.2]]
];
function findMap(j){
  if(!j||typeof j!=="object") return null;
  if(Array.isArray(j.objects)) return j;
  for(const k in j){ const r=findMap(j[k]); if(r) return r; }
  return null;
}
function mapLevels(m){
  const lv = Array.isArray(m.levels)&&m.levels.length ? m.levels : [{id:undefined,name:"Ground",elev:0}];
  return lv.map((l,i)=>({id:l.id, name:l.name||("Level "+(i+1)), elev:l.elev||0, dark:!!l.dark}));
}
let importLevel = LS.get("crossed_playground_maplevel", null);
function buildImported(m){
  const levels=mapLevels(m); const lvl = levels.find(l=>l.id===importLevel) || levels.find(l=>(l.elev||0)===0) || levels[0];
  const onLvl = o => (o.level===undefined || lvl.id===undefined || o.level===lvl.id);
  const objs = m.objects.filter(onLvl);
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; const grow=(x,z)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);};
  for(const o of objs){
    if(o.type==="wall"&&o.a&&o.b){ grow(o.a[0],o.a[1]); grow(o.b[0],o.b[1]); }
    else if((o.type==="floor"||o.type==="stage")&&o.w&&o.d&&!o.ground){ grow(o.x,o.z); grow(o.x+o.w,o.z+o.d); }
    else if(typeof o.x==="number"&&typeof o.z==="number") grow(o.x,o.z);
  }
  if(x0>x1){ x0=-10;x1=10;z0=-10;z1=10; }
  world.bounds={x0:x0-1,x1:x1+1,z0:z0-1,z1:z1+1};
  let floors=0;
  for(const o of objs){
    if(o.type==="floor"&&o.w&&o.d){ addFloor(o.x,o.z,o.x+o.w,o.z+o.d,"#2e2a26","#36312c"); floors++; }
    else if(o.type==="wall"&&o.a&&o.b){
      const ops=(o.openings||[]).map(op=>({at:op.at,width:op.width,kind:op.kind==="window"?"window":op.kind==="door"?"door":"gap",sill:op.sill,top:op.top,hinge:op.hinge,side:op.side==="out"?1:-1,closed:(op.ajar!==undefined&&op.ajar<10)}));
      addWall(o.a[0],o.a[1],o.b[0],o.b[1],o.height||2.8,o.thick||0.2,0x5a554c,ops);
    }
    else if(o.type==="stage"&&o.w&&o.d){ addBox(o.x+o.w/2,o.z+o.d/2,o.w,o.d,o.h||o.height||0.6,0x6a6258,false,"stage"); }
    else if(o.type==="prop"&&CFG.world.propBlock){
      const nm=String(o.asset||"").toLowerCase(); const hit=PROP_SIZES.find(([k])=>nm.includes(k)); if(!hit) continue;
      const sc=o.scale||1; let [w,d,h]=hit[1]; w*=sc; d*=sc; h*=sc; const r=((o.rot||0)%180+180)%180; if(r>45&&r<135){ const t=w; w=d; d=t; }
      addBox(o.x,o.z,w,d,h,0x4a3a2c,/wardrobe|shelf|dresser|cabinet|crate|box|desk|table|couch|sofa|chair/.test(nm),nm);
    }
    else if(o.type==="light"&&typeof o.x==="number"){ addLight(o.x,(o.y||2.4),o.z,new THREE.Color(o.color||"#ffb060").getHex(),(o.energy||1)*1.2,(o.range||8)*1.5); }
    else if(o.type==="camera"&&typeof o.x==="number"){
      const yaw=(o.yaw||0)*Math.PI/180, pit=(o.pitch||0)*Math.PI/180; const y=o.y??2.6;
      const fx=-Math.sin(yaw)*Math.cos(pit), fy=Math.sin(pit), fz=-Math.cos(yaw)*Math.cos(pit);
      addCam(o.x,y,o.z,o.x+fx*5,y+fy*5,o.z+fz*5,o.mode&&o.mode!=="fixed",o.fov||60);
    }
    else if(o.type==="marker"&&typeof o.x==="number"){
      if(o.kind==="spawn") world.spawn={x:o.x,z:o.z,yaw:(o.rot||0)*Math.PI/180};
      if(o.kind==="enemy"){ const t=JSON.stringify(o).toLowerCase(); world.enemySpawns.push({x:o.x,z:o.z,type:/brute|louis|bcross/.test(t)?"brute":/dummy/.test(t)?"dummy":"across"}); }
    }
  }
  if(!floors) addFloor(x0-1,z0-1,x1+1,z1+1);
  if(!world.cams.length){ const B=world.bounds; addCam(B.x0+0.5,3.5,B.z0+0.5,(B.x0+B.x1)/2,0.5,(B.z0+B.z1)/2); addCam(B.x1-0.5,3.5,B.z1-0.5,(B.x0+B.x1)/2,0.5,(B.z0+B.z1)/2); }
  addLight((x0+x1)/2,3,(z0+z1)/2,0xffc080,lvl.dark?0.2:0.8,30);
  if(!objs.some(o=>o.type==="marker"&&o.kind==="spawn")){ const p={x:(x0+x1)/2,z:(z0+z1)/2}; world.spawn={x:p.x,z:p.z,yaw:0}; }
}
function importMapText(txt){
  let j; try{ j=JSON.parse(txt); }catch(e){ return "That isn't valid JSON. Use the file from the Map Designer's export or Send to Claude."; }
  const m=findMap(j); if(!m) return "No map found in that file (looking for an 'objects' list).";
  const slim={objects:m.objects.filter(o=>["wall","floor","stage","prop","light","camera","marker"].includes(o.type)).map(o=>{ const c=Object.assign({},o); delete c.data; return c; }), levels:m.levels};
  importedMap=slim; LS.set("crossed_playground_map", slim);
  const walls=slim.objects.filter(o=>o.type==="wall").length, cams=slim.objects.filter(o=>o.type==="camera").length;
  return `Imported: ${walls} walls, ${cams} cameras, ${mapLevels(slim).length} level(s).`;
}

// ================================================================ bodies
const ZONE_COL = {head:0xd84040, torso:0xd8b040, arm:0x40a0d8, leg:0x50c060};
const SKIN = {norah:0xd9b49a, across:0xcfcac0, brute:0xb8a894, dummy:0x8a7a62};
const PIV = ["hips","torso","neck","armL","armR","legL","legR","kneeL","kneeR"];
function part(parent, w,h,d, y, col, info){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), M(col)); mesh.position.y = y; parent.add(mesh);
  if(info) mesh.userData = Object.assign({baseCol:col}, info); return mesh;
}
function piv(parent,x=0,y=0,z=0){ const o=new THREE.Object3D(); o.position.set(x,y,z); parent.add(o); return o; }
// ================================================================ ACROSS subclasses (shared with the ACROSS Lineup page)
const lerp=(a,b,t)=>a+(b-a)*t;
function mulberry(seed){ let s=seed|0; return ()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const Mt=(c,o={})=>new THREE.MeshPhongMaterial(Object.assign({color:c, flatShading:true, shininess:3},o));
const SKINS={pale:[0xd8d4cb,0xcfcac0,0xc9c6bd,0xd2cdbf], grey:[0xb9b8b2,0xaeb0ad,0xc2bfb6], sallow:[0xcdc4a6,0xc8bea0], fresh:[0xd9b8a0,0xc69c80,0x9a7058,0xe0c2aa]};
const HAIR=[0x2a1c12,0x4a3424,0x6a5a48,0x9a9080,0xb8b0a0,0x1a1614,0x7a4a2a];
// stance params for standing types
const STAND={
  walker:{hunch:0.45,chest:0.15,buckle:0.5,armFwd:0.5,armOut:0.2,loll:0.35,step:0.65,swing:0.6,elbow:0.3,head:0,jaw:0.05,jerk:1.0,speed:1.6},
  mourner:{hunch:0.7,chest:0.35,buckle:0.35,armFwd:0.05,armOut:0.05,loll:0.15,step:0.35,swing:0.12,elbow:0.1,head:0.35,jaw:0.02,jerk:0.8,speed:0.9},
  matron:{hunch:0.55,chest:0.25,buckle:0.3,armFwd:0.85,armOut:0.25,loll:0.25,step:0.28,swing:0.35,elbow:0.6,head:-0.1,jaw:0.1,jerk:1.0,speed:1.0},
};
const VARIANTS=[
  {key:"walker",name:"Walker",stance:"stand",p:"walker",h:[1.68,1.86],fw:[0.95,1.08],skin:"pale",hair:[0.35,0.7],long:0.2,clothes:"tee",
   moves:"Lurches upright in bursts, one knee giving way, head lolling. Trips when it hurries.", wears:"Torn t-shirt and jeans, frayed at the knees.", fight:{}, fights:"The baseline: lurching bursts, a lunge with a short tell, a quick swipe."},
  {key:"crawler",name:"Crawler",stance:"crawl",p:"walker",h:[1.55,1.76],fw:[0.9,1.0],skin:"pale",hair:[0.1,0.4],long:0.6,clothes:"loin",
   moves:"Low on hands and knees, elbows out. Slower, trips less, lunges from the floor.", wears:"Almost nothing: rags knotted at the waist, one sleeve.", fight:{ankle:true}, fights:"A small, low target. Grabs ankles even with its legs intact: mash to break free."},
  {key:"mourner",name:"Mourner",stance:"stand",p:"mourner",h:[1.78,1.95],fw:[0.95,1.05],skin:"grey",hair:[0.5,0.8],long:0,clothes:"suit",
   moves:"Bent nearly double, head bowed, arms hanging. Slow, then sudden.", wears:"Black funeral suit, coat tails in strips, white collar.", fight:{speed:0.9,creep:true,lungeRange:1.5,lungeWindup:0.6}, fights:"Creeps with its head bowed while you're far off, then bursts into a lunge from further out than the others, with almost no tell."},
  {key:"matron",name:"Matron",stance:"stand",p:"matron",h:[1.48,1.6],fw:[1.05,1.18],skin:"pale",hair:[0.7,0.95],long:0.9,hairCol:[0x9a9080,0xb8b0a0,0x8a8070],clothes:"dress",
   moves:"Small hunched steps, both arms reaching out in front.", wears:"Long dress with a ragged hem and a torn shawl.", fight:{speed:0.85,hug:true}, fights:"Small but strong: grabs and holds in a bear hug that takes twice the effort to break."}
];

function cyl(par,rT,rB,len,col,y,seg=7){ const m=new THREE.Mesh(new THREE.CylinderGeometry(rT,rB,len,seg),typeof col==="number"?Mt(col):col); m.position.y=y??-len/2; par.add(m); return m; }
function ball(par,r,col,x=0,y=0,z=0){ const m=new THREE.Mesh(new THREE.SphereGeometry(r,6,5),typeof col==="number"?Mt(col):col); m.position.set(x,y,z); par.add(m); return m; }
function box(par,w,h,d,col,x=0,y=0,z=0){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof col==="number"?Mt(col):col); m.position.set(x,y,z); par.add(m); return m; }

function buildPerson(V, seed, heightOverride){
  const R=mulberry(seed); const pick=a=>a[Math.floor(R()*a.length)];
  const height = heightOverride ?? lerp(V.h[0],V.h[1],R());
  const fw = lerp(V.fw[0],V.fw[1],R()), lm = V.fresh?1.45:1, legF = 0.97+R()*0.06;
  const skin = pick(SKINS[V.skin]); const skinM=Mt(skin); const boneM=Mt(new THREE.Color(skin).multiplyScalar(1.08).getHex());
  const hairCol = V.hairCol ? pick(V.hairCol) : pick(HAIR);
  const T=0.46*legF, Sh=0.47*legF, hipY=T+Sh+0.035;
  const root=new THREE.Group(); const P={strips:[]};
  P.hips=piv(root,0,hipY,0);
  const pelvis=cyl(P.hips,0.12*fw*(V.fresh?1.08:1),0.105*fw,0.13,skinM,0.02,8); pelvis.scale.z=0.62;
  // the brand: a cross burned into the lower hip, smouldering
  const brandM=new THREE.MeshBasicMaterial({color:0x8a2a0a}); P.brandM=brandM;
  P.brand=box(P.hips,0.022,0.09,0.01,brandM,0.07*fw,0.01,0.075*fw); box(P.hips,0.06,0.02,0.01,brandM,0.07*fw,0.025,0.075*fw);
  P.torso=piv(P.hips,0,0.075,0);
  const ab=cyl(P.torso,0.1*fw*(V.fresh?1.25:1),0.092*fw*(V.fresh?1.2:0.95),0.21,skinM,0.105,8); ab.scale.z=V.fresh?0.7:0.5;
  for(let i=0;i<4;i++) box(P.torso,0.022,0.03,0.025,boneM,0,0.02+i*0.05,-0.05*fw);
  P.chest=piv(P.torso,0,0.2,0);
  const ch=P.chestMesh=cyl(P.chest,0.152*fw*(V.fresh?1.05:1),0.112*fw*(V.fresh?1.12:1),0.32,skinM,0.16,8); ch.scale.z=0.6;
  if(!V.fresh){ for(let i=0;i<5;i++){ const r=(0.112+i*0.008)*fw; const rib=new THREE.Mesh(new THREE.TorusGeometry(r,0.009,3,9,Math.PI),boneM); rib.rotation.x=Math.PI/2; rib.scale.y=0.64; rib.position.set(0,0.03+i*0.05,0.004); P.chest.add(rib); } }
  for(let i=0;i<5;i++) box(P.chest,0.024,0.03,0.025,boneM,0,0.02+i*0.06,-0.088*fw);
  for(const sx of [-1,1]){ box(P.chest,0.08,0.11,0.02,boneM,sx*0.075*fw,0.22,-0.085*fw); const cb=cyl(P.chest,0.012,0.012,0.15*fw,boneM,0); cb.rotation.z=Math.PI/2; cb.position.set(sx*0.07*fw,0.3,0.06); }
  P.neck=piv(P.chest,0,0.32,0); cyl(P.neck,0.034,0.045,0.1,skinM,0.05,6);
  P.head=piv(P.neck,0,0.09,0);
  const skull=ball(P.head,0.1,skinM,0,0.12,0); P.skull=skull; skull.scale.set(0.92*(V.fresh?1.03:1),1.16,1.05);
  box(P.head,0.16,0.025,0.03,skinM,0,0.165,0.085);
  for(const sx of [-1,1]){ box(P.head,0.045,0.03,0.02,0x1c1614,sx*0.038,0.135,0.094); box(P.head,0.03,0.016,0.01,new THREE.MeshBasicMaterial({color:0xffffff}),sx*0.038,0.134,0.104); box(P.head,0.02,0.045,0.03,skinM,sx*0.093,0.12,0.0); }
  const nose=new THREE.Mesh(new THREE.ConeGeometry(0.016,0.045,4),skinM); nose.position.set(0,0.11,0.11); nose.rotation.x=Math.PI/2*0.9; P.head.add(nose);
  if(!V.fresh) for(const sx of [-1,1]) box(P.head,0.03,0.04,0.02,Mt(new THREE.Color(skin).multiplyScalar(0.8).getHex()),sx*0.06,0.085,0.075);
  box(P.head,0.075,0.035,0.03,0x140c0c,0,0.065,0.072); // mouth cavity
  P.jaw=piv(P.head,0,0.075,0.0); box(P.jaw,0.105,0.035,0.085,skinM,0,-0.02,0.035); box(P.jaw,0.07,0.012,0.012,0xd8ccaa,0,0.0,0.077);
  // hair: what's left of it
  const cover=lerp(V.hair[0],V.hair[1],R()), hairM=Mt(hairCol);
  for(let i=0;i<34;i++){ const th=R()*Math.PI*2, ph=R()*1.15; if(R()>cover) continue; if(ph>0.85 && Math.cos(th)>0.3) continue;
    const x=Math.sin(ph)*Math.sin(th)*0.095, y=Math.cos(ph)*0.116+0.12, z=Math.sin(ph)*Math.cos(th)*0.1-0.005; const b=box(P.head,0.055,0.022,0.055,hairM,x,y,z); b.rotation.set(-Math.sin(ph)*Math.cos(th)*1.2,0,Math.sin(ph)*Math.sin(th)*1.2); }
  if(R()<V.long*cover+0.05) for(let i=0;i<7;i++){ const a=(i/6-0.5)*2.6+Math.PI; rag(P,P.head,Math.sin(a)*0.085,0.15,Math.cos(a)*0.085,0.15+R()*0.3*V.long+0.05,0.04,hairCol,R); }
  // arms
  for(const [side,sx] of [["L",1],["R",-1]]){
    const sh=piv(P.chest,sx*0.165*fw,0.29,0); P["arm"+side]=sh; ball(sh,0.04*fw*(V.fresh?1.2:1),boneM);
    cyl(sh,0.034*lm,0.027*lm,0.29,skinM);
    const el=piv(sh,0,-0.29,0); P["elbow"+side]=el; ball(el,0.03*lm,boneM);
    cyl(el,0.028*lm,0.019*lm,0.27,skinM);
    const wr=piv(el,0,-0.27,0); P["wrist"+side]=wr; box(wr,0.05,0.085,0.025,skinM,0,-0.04,0);
    for(let f=0;f<3;f++){ const fg=box(wr,0.011,0.085,0.012,skinM,(f-1)*0.016,-0.12,0.004); fg.rotation.x=0.25+R()*0.2; }
  }
  // legs
  for(const [side,sx] of [["L",1],["R",-1]]){
    const hp=piv(P.hips,sx*0.085*fw,0,0); P["leg"+side]=hp; cyl(hp,0.055*lm*fw,0.036*lm,T,skinM);
    const kn=piv(hp,0,-T,0); P["knee"+side]=kn; ball(kn,0.042*(V.fresh?1.1:1),boneM);
    P["shin"+side]=cyl(kn,0.036*lm,0.026*lm,Sh,skinM);
    const an=piv(kn,0,-Sh,0); P["ankle"+side]=an; box(an,0.07,0.045,0.2,skinM,0,-0.02,0.05);
  }
  dress(V,P,R,fw,lm,T,Sh);
  const s=height/(T+Sh+0.035+0.075+0.2+0.32+0.09+0.236); root.scale.setScalar(s);
  return {root,P,V,height,fw,seed,skin,scale:s,hipY};
}
function rag(P,par,x,y,z,len,w,col,R){ const pv=piv(par,x,y,z); const m=new THREE.Mesh(new THREE.BoxGeometry(w,len,0.012),Mt(col)); m.position.y=-len/2; pv.add(m); pv.userData.ph=R()*10; pv.userData.rag=true; P.strips.push(pv); return pv; }
function shell(par,rT,rB,len,col,y,sz=0.62){ const m=cyl(par,rT,rB,len,Mt(col),y,8); m.scale.z=sz; return m; }
const CLOTH=[0x4a5560,0x6a655c,0x8f897c,0x5a4636,0x3e3a34,0x6b5a4a,0x3a4a3a,0x5a3a3a];
function dress(V,P,R,fw,lm,T,Sh){
  const pick=a=>a[Math.floor(R()*a.length)]; const c1=pick(CLOTH), c2=pick(CLOTH);
  const hem=(par,y,r,n,col,lenMax,sz=0.62)=>{ for(let i=0;i<n;i++){ const a=(i/n)*Math.PI*2+R()*0.3; rag(P,par,Math.sin(a)*r,y,Math.cos(a)*r*sz,0.06+R()*lenMax,0.045+R()*0.05,col,R); } };
  const sleeve=(side,len,col,fore)=>{ shell(P["arm"+side],0.045*lm,0.04*lm,len,col,-len/2,1); if(fore) shell(P["elbow"+side],0.038*lm,0.03*lm,0.22,col,-0.11,1); };
  const trouser=(side,col,full)=>{ shell(P["leg"+side],0.068*lm*fw,0.05*lm,T,col,-T/2,1); if(full) shell(P["knee"+side],0.048*lm,0.04*lm,Sh*0.9,col,-Sh*0.45,1); };
  const k=V.clothes;
  if(k==="tee"){ shell(P.chest,0.162*fw,0.125*fw,0.3,c1,0.15,0.66); hem(P.chest,0.0,0.12*fw,6,c1,0.22); sleeve("L",0.1,c1); if(R()<0.6) sleeve("R",0.08,c1);
    const jean=pick([0x34425a,0x2c3648,0x4a5670]); trouser("L",jean,true); trouser("R",jean,R()<0.5); hem(P.kneeL,0,0.045,3,jean,0.12,1); hem(P.kneeR,0,0.045,3,jean,0.14,1); }
  else if(k==="sweater"){ shell(P.chest,0.168*fw,0.135*fw,0.32,c1,0.16,0.68); shell(P.torso,0.135*fw,0.125*fw,0.22,c1,0.105,0.72); sleeve("L",0.29,c1,true); sleeve("R",0.29,c1,true); hem(P.torso,0.0,0.12*fw,3,c1,0.08);
    const sl=pick([0x3a3630,0x4a4438,0x2a2c30]); trouser("L",sl,true); trouser("R",sl,true); for(const s of ["L","R"]) box(P["ankle"+s],0.085,0.06,0.22,0x1e1a16,0,-0.01,0.05); }
  else if(k==="sunday"){ shell(P.chest,0.16*fw,0.122*fw,0.3,0xcac4b4,0.15,0.66); shell(P.chest,0.165*fw,0.13*fw,0.22,0x3a3028,0.12,0.67); sleeve("L",0.29,0xcac4b4,true); sleeve("R",0.2,0xcac4b4); hem(P.elbowR,0,0.03,3,0xcac4b4,0.1,1);
    trouser("L",0x2e2c2a,true); trouser("R",0x2e2c2a,true); hem(P.kneeL,0.02,0.05,4,0x2e2c2a,0.08,1); hem(P.kneeR,0.02,0.05,4,0x2e2c2a,0.08,1); }
  else if(k==="loin"){ hem(P.hips,0.05,0.12*fw,8,c1,0.22); box(P.hips,0.26*fw,0.04,0.17*fw,c1,0,0.05,0); if(R()<0.7) { sleeve("L",0.14,c2); hem(P.armL,-0.14,0.04,2,c2,0.15,1); } }
  else if(k==="overalls"){ const d=pick([0x3a4a62,0x4a5468,0x5a5040]); shell(P.torso,0.12*fw,0.13*fw,0.22,d,0.105,0.7); box(P.chest,0.2*fw,0.16,0.02,d,0,0.06,0.075*fw); for(const sx of [-1,1]) box(P.chest,0.025,0.26,0.015,d,sx*0.07*fw,0.17,0.085*fw).rotation.x=-0.1;
    shell(P.chest,0.155*fw,0.118*fw,0.3,c1,0.15,0.64); trouser("L",d,true); shell(P.legR,0.068*lm*fw,0.06*lm,T*0.35,d,-T*0.17,1); hem(P.legR,-T*0.33,0.06,4,d,0.12,1); }
  else if(k==="suit"){ const blk=0x18181c; shell(P.chest,0.17*fw,0.135*fw,0.32,blk,0.16,0.68); shell(P.torso,0.14*fw,0.135*fw,0.22,blk,0.105,0.72); box(P.chest,0.08,0.05,0.02,0xc8c4b8,0,0.27,0.09*fw);
    sleeve("L",0.29,blk,true); sleeve("R",0.29,blk,true); for(let i=0;i<5;i++) rag(P,P.torso,(i-2)*0.05*fw,0.0,-0.08*fw,0.3+R()*0.25,0.05,blk,R); hem(P.torso,0.0,0.13*fw,4,blk,0.15);
    trouser("L",0x202024,true); trouser("R",0x202024,true); for(const s of ["L","R"]) box(P["ankle"+s],0.085,0.06,0.22,0x0e0e10,0,-0.01,0.05); }
  else if(k==="dress"){ const dc=pick([0x5a4a5a,0x4a5a5a,0x6a5a4a,0x3a3a4a]); shell(P.chest,0.162*fw,0.13*fw,0.32,dc,0.16,0.66); shell(P.torso,0.13*fw,0.15*fw,0.22,dc,0.1,0.72);
    const sk=new THREE.Mesh(new THREE.CylinderGeometry(0.15*fw,0.25*fw,0.62,9,1,true),Mt(dc,{side:THREE.DoubleSide})); sk.position.y=-0.3; sk.scale.z=0.75; P.hips.add(sk); sk.userData.rag=true; hem(P.hips,-0.6,0.24*fw,9,dc,0.18,0.75);
    sleeve("L",0.29,dc,true); sleeve("R",0.29,dc,true); const sh=pick([0x6a5a48,0x4a3a30,0x7a6a5a]); for(let i=0;i<6;i++) rag(P,P.chest,(i-2.5)*0.05*fw,0.31,-0.08*fw,0.18+R()*0.22,0.06,sh,R); }
  else if(k==="gown"){ const gc=0x8aa0a8; box(P.chest,0.3*fw,0.32,0.02,Mt(gc),0,0.15,0.1*fw); box(P.torso,0.26*fw,0.22,0.02,Mt(gc),0,0.1,0.085*fw); const front=piv(P.hips,0,0.0,0.08*fw); box(front,0.26*fw,0.36,0.015,gc,0,-0.17,0);
    hem(P.hips,-0.3,0.13*fw,5,gc,0.12); for(const sx of [-1,1]) box(P.chest,0.06,0.28,0.12,gc,sx*0.13*fw,0.17,0); sleeve("L",0.1,gc); sleeve("R",0.1,gc);
    box(P.wristL,0.06,0.02,0.035,0xe8e4d8,0,0.0,0); const band=cyl(P.head,0.104,0.104,0.035,0xd8d2c0,0.15,8); band.scale.z=1.05; rag(P,P.head,0.03,0.16,-0.1,0.12,0.03,0xd8d2c0,R); }
  else if(k==="vest"){ shell(P.chest,0.158*fw,0.12*fw,0.28,0xc8c0ae,0.14,0.64); hem(P.chest,0.0,0.115*fw,6,0xc8c0ae,0.18); const tr=pick([0x3a3630,0x4a4438,0x2a2c30]); trouser("L",tr,false); trouser("R",tr,false); hem(P.legL,-T,0.06,5,tr,0.16,1); hem(P.legR,-T,0.06,5,tr,0.16,1); }
}


function basePose(p,mv,w){
  const V=p.V, v={hy:p.hipY,hp:0,hr:0,cH:0,aLX:0,aRX:0,aLZ:0,aRZ:0,eL:0,eR:0,lLX:0,lRX:0,lLZ:0,lRZ:0,kL:0,kR:0,nX:0,nZ:0,jaw:0.05};
  if(V.stance==="stand"){ const q=STAND[V.p];
    v.hy=p.hipY-0.05*Math.abs(Math.sin(w))*mv-q.buckle*0.06; v.hp=q.hunch; v.cH=q.chest; v.hr=Math.sin(w*0.5)*0.16*mv;
    v.aLX=q.armFwd+Math.sin(w*1.13)*q.swing*mv; v.aRX=q.armFwd*0.75-Math.sin(w*0.87+1)*q.swing*mv; v.aLZ=q.armOut; v.aRZ=-q.armOut*0.8; v.eL=q.elbow+0.2*mv; v.eR=q.elbow*0.6;
    v.lLX=q.hunch+Math.sin(w)*q.step*mv; v.lRX=q.hunch-Math.sin(w*1.21+0.5)*q.step*0.85*mv; v.lLZ=0.05; v.lRZ=-0.08;
    v.kL=0.15+Math.max(0,Math.sin(w))*1.3*q.step*mv; v.kR=q.buckle+Math.max(0,-Math.sin(w*1.21))*q.step*mv; v.nX=-q.hunch*0.7-q.chest+q.head; v.nZ=q.loll; v.jaw=q.jaw;
 }
  else if(V.stance==="crawl"){ v.hy=0.5; v.hp=1.2; v.hr=Math.sin(w*0.5)*0.15*mv;
    v.aLX=1.1+Math.sin(w)*0.6*mv; v.aRX=1.1-Math.sin(w*1.17)*0.6*mv; v.aLZ=0.4; v.aRZ=-0.4; v.eL=0.3; v.eR=0.3;
    v.lLX=1.25-Math.sin(w*0.93)*0.4*mv; v.lRX=1.25+Math.sin(w*1.07)*0.4*mv; v.lLZ=0.15; v.lRZ=-0.15; v.kL=1.55; v.kR=1.5; v.nX=-1.05; v.nZ=0.2; }
  else if(V.stance==="kneel"){ v.hy=0.52; v.hp=0.15+Math.sin(w)*0.08*mv; v.cH=0.1; v.hr=Math.sin(w*0.9)*0.25*mv;
    v.aLX=0.9+Math.sin(w*1.1)*0.5*mv; v.aRX=0.7-Math.sin(w*0.95+1)*0.5*mv; v.aLZ=0.2; v.aRZ=-0.2; v.eL=0.4; v.eR=0.6;
    v.lLX=0.15+Math.sin(w)*0.3*mv; v.lRX=0.15-Math.sin(w)*0.3*mv; v.kL=1.62; v.kR=1.6; v.nX=-0.2; v.nZ=0.3; }
  else if(V.stance==="drag"){ v.hy=p.hipY-0.08; v.hp=0.5; v.cH=0.2; v.hr=-0.22+Math.sin(w)*0.08*mv;
    v.aLX=1.0+Math.sin(w)*0.55*mv; v.aRX=0.4+Math.sin(w+1)*0.3*mv; v.aLZ=0.25; v.aRZ=-0.1; v.eL=0.3+Math.max(0,-Math.sin(w))*0.8*mv; v.eR=0.2;
    v.lLX=0.55+Math.sin(w)*0.7*mv; v.kL=0.25+Math.max(0,Math.sin(w))*1.0*mv; v.lRX=-0.25; v.lRZ=-0.3; v.kR=0.06; v.nX=-0.45; v.nZ=0.4; }
  return v;
}
const VMAP={}; for(const V of VARIANTS) VMAP[V.key]=V;

// an ACROSS subclass body. Shots test invisible hitboxes that follow each part and are a little more
// generous than the gaunt limbs, so thin bodies stay reasonable to hit at low resolution.
function buildAcrossBody(owner, opts){
  const pr=buildPerson(VMAP[opts.variant], opts.seed); const root=pr.root, P=pr.P, fw=pr.fw||1, H=CFG.across;
  const T=Math.abs(P.kneeL.position.y), Sh=Math.abs(P.ankleL.position.y), crawl=VMAP[opts.variant].stance==="crawl";
  const hb=(par,w,h,d,x,y,z,info)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshBasicMaterial({color:ZONE_COL[info.zone],transparent:true,opacity:0.35,depthWrite:false,visible:!!CFG.world.showZones}));
    m.position.set(x,y,z); par.add(m); m.userData=Object.assign({enemy:owner, hitbox:true, baseCol:ZONE_COL[info.zone]}, info); return m; };
  const g=H.hitboxScale, gl=H.limbHitbox*g;
  P.hbHead=hb(P.head,0.24*g,0.3*g,0.26*g,0,0.12,0.01,{zone:"head"});
  hb(P.neck,0.11*g,0.12,0.11*g,0,0.05,0,{zone:"torso"});
  P.hbChest=hb(P.chest,0.37*fw*g,0.36,0.25*g,0,0.16,0,{zone:"torso"});
  hb(P.torso,0.3*fw*g,0.24,0.22*g,0,0.1,0,{zone:"torso"});
  hb(P.hips,0.32*fw*g,0.2,0.24*g,0,0.0,0,{zone:"torso"});
  for(const [s,limb] of [["L","armL"],["R","armR"]]){
    hb(P["arm"+s],0.095*gl,0.32,0.095*gl,0,-0.15,0,{zone:"arm",limb});
    hb(P["elbow"+s],0.09*gl,0.38,0.09*gl,0,-0.18,0,{zone:"arm",limb}); }
  for(const [s,limb] of [["L","legL"],["R","legR"]]){
    hb(P["leg"+s],0.16*fw*gl,T,0.15*gl,0,-T/2,0,{zone:"leg",limb,seg:"upper"});
    P["hbShin"+s]=hb(P["knee"+s],0.125*gl,Sh+0.06,0.12*gl,0,-Sh/2-0.02,0.02,{zone:"leg",limb,seg:"lower"}); }
  P.headMesh=P.hbHead; P.torsoMesh=P.hbChest; P.legLLo=P.hbShinL; P.legRLo=P.hbShinR; P.brandGlow=P.brandM;
  root.userData.parts=P; root.userData.person=pr; scene.add(root); return root;
}
function buildBody(kind, owner, opts={}){
  if(kind==="across" && opts.variant) return buildAcrossBody(owner, opts);
  const root = new THREE.Group(); const skin = SKIN[kind];
  const cloth = kind==="norah"?0x3b4a5e : kind==="brute"?0x4d5a3a : kind==="dummy"?0x6a5a40 : skin;
  const pants = kind==="norah"?0x2c3a55 : kind==="brute"?0x4a3f33 : kind==="dummy"?0x6a5a40 : skin;
  const I = (zone,limb,seg)=> owner ? {enemy:owner, zone, limb, seg} : null;
  const P = {}; const thin = kind==="across" ? 0.75 : 1;
  P.hips = piv(root,0,0.95,0); P.torso = piv(P.hips,0,0,0);
  P.torsoMesh = part(P.torso, 0.42*thin,0.62,0.24*thin, 0.31, cloth, I("torso"));
  P.neck = piv(P.torso,0,0.62,0); P.headMesh = part(P.neck, 0.22,0.27,0.25, 0.15, skin, I("head"));
  if(kind==="norah"){ part(P.neck,0.25,0.12,0.27,0.27,0x3a2416); part(P.neck,0.24,0.22,0.08,0.12,0x3a2416).position.z=-0.12; }
  if(kind==="across"||kind==="brute"){ const eye=new THREE.MeshBasicMaterial({color:0xffffff}); for(const sx of [-0.05,0.05]){ const e=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.025,0.01),eye); e.position.set(sx,0.17,0.126); P.neck.add(e); } }
  if(kind==="across"){ const b=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.12,0.01),new THREE.MeshBasicMaterial({color:0x5a1206})); b.position.set(0.1,0.08,0.091); P.torso.add(b); P.brand=b;
    const bar=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.12,0.012),new THREE.MeshBasicMaterial({color:0x8a2a0a})); bar.position.set(0.1,0.08,0.092); const cr=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.03,0.012),bar.material); cr.position.set(0.1,0.1,0.092); P.torso.add(bar); P.torso.add(cr); P.brandGlow=bar.material; }
  const armW = kind==="across"?0.08:0.11;
  P.armL = piv(P.torso, 0.27,0.56,0); P.armR = piv(P.torso,-0.27,0.56,0);
  P.armLMesh = part(P.armL, armW,0.68,armW, -0.34, kind==="norah"?cloth:skin, I("arm","armL"));
  P.armRMesh = part(P.armR, armW,0.68,armW, -0.34, kind==="norah"?cloth:skin, I("arm","armR"));
  if(kind==="brute"){
    P.armL.position.x = 0.40; P.armLMesh.geometry = new THREE.BoxGeometry(0.30,0.80,0.30); P.armLMesh.position.y=-0.40;
    P.armLMesh.material = M(0x8a4a44); P.armLMesh.userData.baseCol = 0x8a4a44;
    for(let i=0;i<4;i++){ const lump=new THREE.Mesh(new THREE.BoxGeometry(0.17,0.17,0.17),M(0x7a3c38)); lump.position.set((Math.random()-.5)*0.24,-0.15-i*0.18,(Math.random()-.5)*0.24); lump.rotation.set(Math.random(),Math.random(),0); P.armL.add(lump); }
  }
  if(kind==="norah"){ P.gun = new THREE.Mesh(new THREE.BoxGeometry(0.04,0.06,0.2), M(0x222222)); P.gun.position.set(0,-0.68,0.06); P.armR.add(P.gun); }
  const legW = kind==="across"?0.1:0.15;
  P.legL = piv(P.hips, 0.11,0,0); P.legR = piv(P.hips,-0.11,0,0);
  P.legLUp = part(P.legL, legW,0.47,legW, -0.235, pants, I("leg","legL","upper"));
  P.legRUp = part(P.legR, legW,0.47,legW, -0.235, pants, I("leg","legR","upper"));
  P.kneeL = piv(P.legL,0,-0.47,0); P.kneeR = piv(P.legR,0,-0.47,0);
  P.legLLo = part(P.kneeL, legW*0.9,0.48,legW*0.9, -0.24, pants, I("leg","legL","lower"));
  P.legRLo = part(P.kneeR, legW*0.9,0.48,legW*0.9, -0.24, pants, I("leg","legR","lower"));
  P.strips=[];
  if(kind==="across" && opts.clothed){ // tattered clothes hanging off the body
    const pal=[0x4a5560,0x6a655c,0x8f897c,0x5a4636,0x3e3a34,0x6b5a4a]; const c1=pal[Math.floor(Math.random()*pal.length)], c2=pal[Math.floor(Math.random()*pal.length)];
    const rag=(parent,x,y,z,len,w,col)=>{ const pv=piv(parent,x,y,z); const m=new THREE.Mesh(new THREE.BoxGeometry(w,len,0.012),M(col)); m.position.y=-len/2; pv.add(m); pv.userData.ph=Math.random()*10; P.strips.push(pv); return pv; };
    const shirt=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.3,0.2),M(c1)); shirt.position.set(0.02,0.44,0); P.torso.add(shirt);
    for(const [x,z] of [[-0.12,0.1],[0.0,0.1],[0.11,0.1],[-0.08,-0.1],[0.07,-0.1],[0.16,0.0]]) rag(P.torso,x,0.3,z,0.18+Math.random()*0.32,0.05+Math.random()*0.05,c1);
    for(const arm of [P.armL,P.armR]){ if(Math.random()<0.75){ const sl=new THREE.Mesh(new THREE.BoxGeometry(0.11,0.2,0.11),M(c1)); sl.position.y=-0.1; arm.add(sl); rag(arm,0,-0.2,0.04,0.15+Math.random()*0.2,0.05,c1); } }
    if(Math.random()<0.8){ for(const leg of [P.legL,P.legR]){ const pt=new THREE.Mesh(new THREE.BoxGeometry(0.13,0.32,0.13),M(c2)); pt.position.y=-0.16; leg.add(pt); rag(leg,0.03,-0.3,0.05,0.15+Math.random()*0.25,0.06,c2); rag(leg,-0.03,-0.3,-0.05,0.1+Math.random()*0.2,0.05,c2); } }
  }
  root.userData.parts = P; scene.add(root); return root;
}
function setZoneView(on){ for(const e of enemies){ e.root.traverse(o=>{ if(!o.isMesh || !o.userData.zone) return; if(o.userData.hitbox) o.material.visible=on; else o.material.color.setHex(on?ZONE_COL[o.userData.zone]:o.userData.baseCol); }); } }

// ================================================================ sound (synthesized)
let AC=null, master=null, noiseBuf=null;
function audio(){
  if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); master=AC.createGain(); master.connect(AC.destination);
    noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }catch(e){ AC=null; } }
  if(AC&&AC.state==="suspended"){ try{ AC.resume(); }catch(e){} }
}
function sfxOut(vol,pos){
  if(!AC) return null; master.gain.value=CFG.ctrl.volume;
  const g=AC.createGain(); let v=vol, pan=0;
  if(pos){ const d=camera.position.distanceTo(pos); v*=1/(1+d*0.12); const r=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion); pan=clamp(r.dot(pos.clone().sub(camera.position))/5,-1,1); }
  g.gain.value=v; let out=g;
  if(AC.createStereoPanner){ const p=AC.createStereoPanner(); p.pan.value=pan; g.connect(p); p.connect(master); } else g.connect(master);
  return out;
}
function tone(f0,f1,dur,type,vol,pos,delay=0){
  const out=sfxOut(vol,pos); if(!out) return; const t=AC.currentTime+delay;
  const o=AC.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  const e=AC.createGain(); e.gain.setValueAtTime(0.0001,t); e.gain.exponentialRampToValueAtTime(1,t+0.005); e.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(e); e.connect(out); o.start(t); o.stop(t+dur+0.02);
}
function noise(dur,vol,ftype,freq,pos,q=1,delay=0){
  const out=sfxOut(vol,pos); if(!out) return; const t=AC.currentTime+delay;
  const s=AC.createBufferSource(); s.buffer=noiseBuf; const f=AC.createBiquadFilter(); f.type=ftype; f.frequency.value=freq; f.Q.value=q;
  const e=AC.createGain(); e.gain.setValueAtTime(1,t); e.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f); f.connect(e); e.connect(out); s.start(t, Math.random()*0.5); s.stop(t+dur+0.02);
}
const SFX = {
  shot(){ noise(0.35,0.9,"lowpass",3200); tone(140,38,0.25,"sine",0.7); noise(0.6,0.15,"lowpass",600,null,1,0.05); },
  hammer(){ noise(0.03,0.35,"highpass",3000); tone(1900,1700,0.025,"square",0.08); },
  empty(){ tone(2300,2100,0.02,"square",0.15); },
  roundIn(i){ tone(900,860,0.04,"triangle",0.18,null,i*0.0); },
  cylinder(){ noise(0.07,0.35,"bandpass",1600,null,2); },
  flesh(p){ noise(0.14,0.7,"lowpass",650,p); tone(95,50,0.12,"sine",0.5,p); },
  limb(p){ noise(0.35,0.9,"lowpass",900,p); tone(60,30,0.3,"sine",0.6,p); },
  cover(p){ noise(0.08,0.4,"bandpass",2400,p,3); },
  grunt(p,dur){ tone(95,58,dur,"sawtooth",0.35,p); noise(dur,0.15,"lowpass",300,p); },
  shriek(p){ tone(900,1700,0.32,"sawtooth",0.22,p); noise(0.3,0.25,"bandpass",2600,p,4); },
  chitter(p){ tone(300+rng()*250,250,0.05,"square",0.05,p); },
  stomp(p){ tone(55,35,0.12,"sine",0.25,p); },
  hurt(){ tone(320,140,0.22,"triangle",0.35); noise(0.15,0.3,"lowpass",900); },
  dodge(){ noise(0.28,0.25,"lowpass",520); },
  shove(){ noise(0.1,0.45,"bandpass",420,null,1.5); },
  slam(p){ noise(0.28,0.95,"lowpass",320,p); tone(70,40,0.25,"sine",0.6,p); },
  creak(p){ tone(190,260,0.45,"sawtooth",0.04,p); },
  doorHit(p){ noise(0.25,0.9,"lowpass",420,p); noise(0.12,0.5,"bandpass",1300,p,2); },
  scratch(p){ noise(0.18,0.2,"highpass",2500,p); },
  doorBreak(p){ noise(0.6,1,"bandpass",1000,p,0.7); tone(60,30,0.4,"sine",0.6,p); },
  drag(){ noise(0.12,0.25,"lowpass",250); },
  wail(p){ tone(380,980,1.25,"sawtooth",0.35,p); tone(520,1300,1.25,"square",0.12,p); noise(1.2,0.3,"bandpass",1800,p,2); },
  scrape(p){ noise(0.35,0.55,"lowpass",420,p); noise(0.2,0.2,"bandpass",900,p,2); },
  vaultSlow(){ noise(0.5,0.12,"lowpass",500); noise(0.3,0.08,"bandpass",900,null,1,0.5); },
  vaultFast(){ noise(0.15,0.5,"lowpass",400); tone(90,50,0.12,"sine",0.4); noise(0.25,0.35,"bandpass",1200,null,2,0.05); },
  glass(p){ noise(0.5,0.9,"highpass",3500,p); tone(2600,1900,0.25,"triangle",0.2,p); tone(3400,2500,0.3,"triangle",0.15,p,0.05); noise(0.3,0.5,"bandpass",1800,p,3,0.08); },
  win(){ tone(392,392,0.25,"triangle",0.15); tone(523,523,0.4,"triangle",0.15,null,0.2); },
};

// ================================================================ effects
const debris = [], pools = [], sprays=[];
function bloodPool(x,z,max){
  const m = new THREE.Mesh(new THREE.CircleGeometry(1,10), new THREE.MeshBasicMaterial({color:0x2a0404, transparent:true, opacity:0.85, depthWrite:false}));
  m.rotation.x=-Math.PI/2; m.position.set(x,groundY(x,z)+0.012+(pools.length%20)*0.0005,z); m.scale.setScalar(0.05); scene.add(m); pools.push({m,max,t:0});
  if(pools.length>180){ const o=pools.shift(); scene.remove(o.m); }
}
function spray(pt, dir, col=0x3a0606){
  for(let i=0;i<8;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.04,0.04), new THREE.MeshBasicMaterial({color:col})); m.position.copy(pt); scene.add(m);
    sprays.push({m, v:new THREE.Vector3(dir.x*2+(Math.random()-.5)*2, Math.random()*2.2, dir.z*2+(Math.random()-.5)*2), t:0.6}); }
}

// ================================================================ log
const logEl = document.getElementById("log"); const logLines=[];
function log(s, col="#d8d2c4"){ logLines.push(`<div style="color:${col}">${s}</div>`); while(logLines.length>8) logLines.shift(); logEl.innerHTML=logLines.join(""); }

// ================================================================ run stats
let run = null; let results = LS.get("crossed_playground_results", []);
let scenarioKey = "sandbox";
function newRun(name){
  run = {name, slot:currentSlot||"—", t:0, shots:0, hits:0, head:0, limbs:0, kills:0, dmgTaken:0, hitsTaken:0, dodges:0, saves:0, shoves:0, grabs:0, escapes:0, vaults:0,
         ammoStart:player.rounds+player.spare, enemies:0, over:false, result:""};
  document.getElementById("result").style.display="none";
}
function endRun(result){
  if(!run||run.over) return; run.over=true; run.result=result;
  const ammoLeft=player.rounds+player.spare;
  const row={name:run.name, slot:run.slot, result, time:+run.t.toFixed(1), shots:run.shots, acc:run.shots?Math.round(run.hits/run.shots*100):0, head:run.head, limbs:run.limbs,
    dmg:Math.round(run.dmgTaken), hitsTaken:run.hitsTaken, dodges:run.dodges, saves:run.saves, shoves:run.shoves, ammoLeft: CFG.rev.infinite?"∞":ammoLeft, when:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})};
  results.unshift(row); results=results.slice(0,20); LS.set("crossed_playground_results", results); renderResults();
  const R=document.getElementById("result");
  R.innerHTML = `<h2 style="color:${result!=="DIED"?"#9ed08a":"#e06a5a"}">${result==="WON"?"CLEARED":result==="ESCAPED"?"ESCAPED":"YOU DIED"}</h2>
   <div>${row.name}</div><div style="color:#9a9283">settings: ${row.slot}</div><br>
   Time ${row.time}s (game time) · Shots ${row.shots} · Accuracy ${row.acc}%<br>
   Head shots ${row.head} · Limbs taken ${row.limbs}<br>
   Damage taken ${row.dmg} (${row.hitsTaken} hits) · Dodges ${row.dodges}, ${row.saves} saved you · Shoves ${row.shoves}<br>
   Grabbed ${run.grabs} times, broke free ${run.escapes} · Spotted ${run.spotted||0} times · Vaults ${run.vaults||0}<br>
   Ammo left ${row.ammoLeft}<br><br><span style="color:#9a9283">N restarts the map · B goes back to the builder · results are in the panel</span>`;
  R.style.display="block"; if(result!=="DIED") SFX.win(); setTimeout(()=>{ if(MODE==="play"&&run&&run.over) openSimMenu(result); },1600);
}

// ================================================================ stealth: noise and light
let noiseId=0; const noiseRings=[]; let hudNoise={r:0,t:-9};
function makeNoise(x,z,r,kind,loud=false,tx,tz,src){
  world.noises.push({id:++noiseId,x,z,r,kind,loud,tx:tx??x,tz:tz??z,src,t:gameTime}); if(world.noises.length>40) world.noises.shift();
  if(!src && kind!=="glass") hudNoise={r,t:gameTime};
  if(CFG.stealth.showNoise||CFG.debug.rings){ const m=ringMesh(); m.position.set(x,groundY(x,z)+0.04,z); m.material.color.setHex(loud?0xff8040:0x80c0ff); noiseRings.push({m,r,t:0}); }
}
// how lit a spot is, 0..1
function lightAt(x,z){ let v=(world.ambient??CFG.stealth.ambient); for(const L of world.lightPts){ const d=Math.hypot(L.x-x,L.y-1.0,L.z-z); if(d<L.r) v+=L.i*0.6*(1-d/L.r)**2; } return clamp(v,0,1); }
function playerVis(){ return clamp(lightAt(player.pos.x,player.pos.z)*(player.crouch?CFG.stealth.crouchVis:1)*(player.vel.length()>2.6?1.2:1)+flashVis(),0,1); }

// ================================================================ enemies
const enemies = []; let enemyCount = 0;
class Enemy{
  constructor(type, x, z, opts={}){
    this.type = type; this.id = ++enemyCount;
    const big = type==="brute"||type==="dummy"; if(type==="runner") opts.variant="runner";
    this.kind = big ? "brute" : type==="runner" ? "runner" : "across";
    if(!big){ const keys=VARIANTS.filter(v=>v.key!=="mourner").map(v=>v.key); this.variant = opts.variant ? (VMAP[opts.variant]?opts.variant:"walker") : keys[Math.floor(rng()*keys.length)]; this.V=VMAP[this.variant];
      this.stance = this.V.stance==="crawl"?"crawling":"standing"; this.move = pickMove(opts.move, this.variant); this.gait={mode:"stall",t:0.2,dur:0.2,mul:1};
      this.disguised = !!(this.V.fight.disguise && rng()<0.7); this.disguiseYaw=rng()*Math.PI*2; this.wailCool=2+rng()*3; this.rally=0; }
    this.mdl = big ? (type==="brute"?pickModel("louis"):null) : pickModel(this.variant);
    const S = this.S;
    this.name = type==="dummy" ? `Dummy ${this.id}` : type==="brute" ? `Louis ${this.id}` : `${this.V.name} ${this.id}`;
    this.root = big ? buildBody(type==="dummy"?"dummy":"brute", this) : buildBody("across", this, {variant:this.variant, seed:(rng()*1e9)|0}); this.P = this.root.userData.parts;
    if(!big){ const pr=this.root.userData.person; this.hipY=pr.hipY; this.height=pr.height; this.fw=pr.fw; }
    this.scale = big ? S.height/1.8 : this.root.userData.person.scale; this.root.scale.setScalar(this.scale);
    skinEnemy(this);
    this.pos = new THREE.Vector3(x,0,z); this.yaw = Math.atan2(player.pos.x-x, player.pos.z-z);
    this.maxHp = S.hp; this.hp = S.hp;
    this.limbMax = big ? {armL:S.bigArm, armR:S.limb, legL:S.limb, legR:S.limb} : {armL:S.limb,armR:S.limb,legL:S.limb,legR:S.limb};
    this.limbHp = Object.assign({}, this.limbMax); this.lost = {armL:false,armR:false,legL:false,legR:false};
    this.state = "chase"; this.t = 0; this.stagger = 0; this.kb = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.desired=null;
    this.cool = 0.5 + rng(); this.phase = rng()*10; this.jitter = 0; this.jitterT = 0;
    this.dead = false; this.deadT = 0; this.flinch = 0; this.hitDone=false;
    this.radius = big ? 0.45 : this.stance==="crawling" ? 0.3 : 0.33; this.attackKind = null; this.lungeDir = new THREE.Vector3();
    if(!big){ this.aware = opts.aware || (CFG.stealth.startUnaware?"unaware":"hunting"); this.awareness=0; this.lostT=0; this.lastKnown=null; this.heardId=noiseId; this.huntFlash=0;
      const ik=opts.idle||"wander"; this.idle={kind:ik, base:ik, home:{x,z}, tx:null, tz:null, t:0, face:opts.face??(opts.yaw??0)};
      if(opts.yaw!==undefined) this.yaw=opts.yaw;
      if(this.aware==="unaware" && ik==="playdead"){ this.gait.mode="fallen"; this.gait.t=this.gait.dur=1e9; this.gait.side=rng()<0.5?-1:1; } }
    this.heading = this.yaw; this.steerT = 0; this.sideBias = rng()<0.5?1:-1; this.door=null; this.chitT=rng()*3; this.stepT=0;
    enemies.push(this); if(run) run.enemies++;
    if(CFG.world.showZones) setZoneView(true);
  }
  // each subclass fights to its own numbers, built on the ACROSS sliders
  get S(){
    if(this.kind==="brute") return CFG.brute;
    if(this.kind==="runner") return CFG.runner;
    if(this._sf===frameNo && this._s) return this._s;
    const B=CFG.across, m=(this.V&&this.V.fight)||{}, ral=this.rally>0, o=Object.assign({},B);
    o.hp=B.hp*(m.hp||1)*(this.hpMul||1); o.speed=B.speed*(m.speed||1)*(ral?1.3:1); o.tripChance=B.tripChance*(m.trip??1); o.erratic=B.erratic*(m.erratic??1)*(ral?0.5:1); o.jerk=B.jerk*(m.jerk??1);
    o.lungeRange=B.lungeRange*(m.lungeRange||1); o.lungeSpeed=B.lungeSpeed*(m.lungeSpeed||1); o.lungeTime=B.lungeTime*(m.lungeTime||1); o.lungeWindup=B.lungeWindup*(m.lungeWindup||1);
    o.swipeDamage=B.swipeDamage*(m.swipeDamage||1); o.swipeRange=B.swipeRange*(m.swipeRange||1);
    if(this.variant==="crawler"){ o.hp=B.crawlerHp*(this.hpMul||1); o.swipeDamage=B.crawlerSwipeDamage; }
    if(this.variant==="mourner"){ o.hp=B.mournerHp*(this.hpMul||1); o.swipeDamage=B["mournerSwipe"+mStage(this.mstage)]; o.creep=false; }
    if(this.variant==="matron"){ o.hp=B.matronHp*(this.hpMul||1); for(const k of ["legShotFall","torsoFall","headFall","shoveFall"]) o[k]*=B.matronKnock; }
    if(this.mdl && this.variant!=="mourner") o.hp += (MODEL_LIB[this.mdl]||{}).x||0;
    const kn=m.knock??1; o.legShotFall=B.legShotFall*kn; o.torsoFall=B.torsoFall*kn; o.headFall=B.headFall*kn; o.shoveFall=B.shoveFall*kn;
    for(const f of ["ankle","hug","wail","creep","disguise","dragSound","upswipe"]) o[f]=!!m[f];
    if(this.move==="marionette") o.erratic*=1.4; else if(this.move==="lurcher"){ o.erratic*=0.6; o.tripChance*=0.5; }
    this._s=o; this._sf=frameNo; return o;
  }
  legsLost(){ if(this.move==="puller") return 2; return (this.lost.legL?1:0)+(this.lost.legR?1:0); }
  inSwing(){ return this.state==="windup"||this.state==="active"||this.state==="slamWind"||this.state==="slam"||this.state==="chargeWind"||this.state==="charge"; }
  speedNow(){ const S=this.S, base = (this.kind==="brute"?S.walk:S.speed*(this.stance==="crawling"?S.crawlerSpeed:1))*(this.kind==="across"?(this.hurtLimb("legL")?0.8:1)*(this.hurtLimb("legR")?0.8:1):1), l=this.legsLost(); const b2=base*(this.speedMul||1)*(this.woundMul||1); const mm=this.move?this.moveSpeedMul():1; return l===0?b2*mm : l===1? b2*S.dragSpeed : this.move==="puller"&&!this.lost.legL&&!this.lost.legR ? b2*CFG.across.movePullSpeed*mm : b2*S.crawlSpeed; }
  update(dt){
    if(this.dead && (this.kind==="across"||this.kind==="runner")){ this.rootY=0; this.deadT+=dt; if(this.rag && !this.rag.low) this.ragdollStep(dt); else { this.ragSlide(dt); this.poseDead(dt); this.syncRoot(); } this.updateRings(); this.updateStrips(dt); this.emitSmoke(dt); return; }
    if(this.dead){ this.deadT+=dt; const k=Math.min(1,this.deadT/0.5); this.root.rotation.x = -Math.PI/2*k*(this.legsLost()===2?0.2:1); this.P.hips.position.y = 0.95*(1-k)+0.15*k; this.syncRoot(); this.updateRings(); return; }
    if(this.kb.lengthSq()>1e-5){ this.push(this.kb.clone().normalize(), this.kb.length()*CFG.phys.bulletPush); this.kb.set(0,0,0); }
    this.flinch = Math.max(0,this.flinch-dt*4); if(this.rally>0) this.rally-=dt; if(this.bargeT>0) this.bargeT-=dt;
    const toP = new THREE.Vector3(player.pos.x-this.pos.x,0,player.pos.z-this.pos.z); const dist = toP.length(); toP.normalize();
    const want = Math.atan2(toP.x,toP.z);
    const ai = !CFG.world.freezeAI && this.type!=="dummy" && !player.dead;
    this.t += dt;
    if(this.carry && this.state!=="lift") this.dropCarry();
    if(this.stagger>0){ this.stagger-=dt; if(this.stagger<=0){ this.state="chase"; this.t=0; } }
    else if(ai){ this.cool -= dt;
      if(this.kind==="brute") this.brainBrute(dt, dist, want, toP);
      else if(this.kind==="runner") this.brainRunner(dt, dist, want, toP);
      else { this.perceive(dt, dist); if(this.aware==="hunting" || ["windup","lunge","swipe","grab","wail","recover","bite","mshove","mscream"].includes(this.state)) this.brainAcross(dt, dist, want, toP); else this.brainIdle(dt, dist); } }
    else if(this.type==="dummy"){ this.turnTo(want, dt, CFG.brute.turn); }
    if(ai && this.kind==="across"){ this.chitT-=dt; if(this.chitT<=0){ this.chitT=1.5+rng()*3; SFX.chitter(this.pos); } }
    this.integrate(dt);
    if(this.kind==="across" && (this.wounds||this.legsLost())){ this.trailD=(this.trailD||0)+Math.hypot(this.vel.x,this.vel.z)*dt; const gap=this.legsLost()||this.stance==="crawling"?0.45:1.3;
      if(this.trailD>gap){ this.trailD=0; bloodPool(this.pos.x+(Math.random()-.5)*0.2,this.pos.z+(Math.random()-.5)*0.2,0.1+Math.random()*0.12); } }
    // bodies push each other by weight
    const dx=this.pos.x-player.pos.x, dz=this.pos.z-player.pos.z, d=Math.hypot(dx,dz), m=this.radius+0.3;
    if(d<m && d>1e-4 && this.state!=="lunge" && !this.rNoPush){ const ov=m-d, pm=CFG.phys.norahMass, em=this.mass, share=CFG.phys.on?pm/(pm+em):1;
      this.pos.x+=dx/d*ov*share; this.pos.z+=dz/d*ov*share; if(!player.grabbed&&!player.dead){ player.pos.x-=dx/d*ov*(1-share); player.pos.z-=dz/d*ov*(1-share); collide(player.pos,0.3); } }
    for(const o of enemies){ if(o===this||o.dead) continue; const ex=this.pos.x-o.pos.x, ez=this.pos.z-o.pos.z, ed=Math.hypot(ex,ez), em=this.radius+o.radius;
      if(ed<em&&ed>1e-4){ const share=CFG.phys.on? o.mass/(o.mass+this.mass) : 0.5; this.pos.x+=ex/ed*(em-ed)*share; this.pos.z+=ez/ed*(em-ed)*share;
        // a heavy body moving fast bowls lighter ones over
        if(CFG.phys.on && CFG.phys.bodyCheck && o.mass>this.mass*2 && o.vel.length()>0.6 && this.kind==="across" && this.legsLost()===0 && this.gait && this.gait.mode!=="fallen" && !(this.bargeT>0)){ this.bargeT=1.5;
          this.push(new THREE.Vector3(-ex/ed,0,-ez/ed).negate(), o.mass*o.vel.length()*0.5); this.knockDown(new THREE.Vector3(ex/ed,0,ez/ed),"barge"); log(`${o.name} barges ${this.name} over`,"#c0a080"); } } }
    this.pose(dt); this.syncRoot(); this.updateRings(); this.updateStrips(dt); this.emitSmoke(dt);
  }
  // the brand smoulders and smokes, and keeps going a while after death
  emitSmoke(dt){
    const P=this.P; if(!P.brand) return;
    if(P.brandGlow && !this.dead && (this.state==="windup" || (this.state==="swipe"&&!this.hitDone) || (this.state==="grab"&&!this.hitDone) || (this.state==="bite"&&!this.hitDone) || (this.state==="mshove"&&!this.hitDone) || (this.state==="mscream"&&!this.hitDone))){ const f=0.6+0.4*Math.sin(performance.now()*0.04); P.brandGlow.color.setRGB(1,0.55*f+0.2,0.1); }
    else if(P.brandGlow){ const k=0.5+0.5*Math.sin(performance.now()*0.004+this.phase); P.brandGlow.color.setRGB(0.45+0.35*k*(this.dead?Math.max(0,1-this.deadT/8):1),0.1+0.08*k,0.03); }
    if(!CFG.across.smoke || (this.dead && this.deadT>6)) return;
    this.smokeT=(this.smokeT||0)-dt; if(this.smokeT>0) return; this.smokeT=0.11+Math.random()*0.08;
    const wp=new THREE.Vector3(); P.brand.getWorldPosition(wp);
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.05), new THREE.MeshBasicMaterial({color:0x8a8680,transparent:true,opacity:0.45,depthWrite:false}));
    m.position.copy(wp); scene.add(m); smokes.push({m, v:new THREE.Vector3((Math.random()-.5)*0.12,0.32+Math.random()*0.15,(Math.random()-.5)*0.12), t:0, life:1.2+Math.random()*0.6});
  }
  poseDead(dt){ // twitches that slowly die out
    const P=this.P; const sd=this.gait&&this.gait.side||1; const amp=2.4*Math.exp(-this.deadT*1.0)+(this.deadT<5&&Math.random()<0.004?1.5:0);
    const v={hy:0.16,hp:1.5,hr:0.3*sd,aLX:0.6,aRX:1.6,aLZ:1.3*sd,aRZ:-1.1,lLX:-0.2,lRX:0.4,lLZ:0.3,lRZ:-0.2,kL:0.4,kR:0.9,nX:-0.3,nZ:0.5*sd};
    const k=Math.min(1,this.deadT/0.25);
    P.hips.position.y=0.95*(1-k)+v.hy*k; P.hips.rotation.x=v.hp*k+this.jn("dhp",0.1*amp,dt); P.hips.rotation.z=v.hr;
    P.neck.rotation.x=v.nX+this.jn("dnx",0.5*amp,dt); P.neck.rotation.z=v.nZ+this.jn("dnz",0.5*amp,dt);
    P.armL.rotation.x=-v.aLX+this.jn("dal",0.6*amp,dt); P.armR.rotation.x=-v.aRX+this.jn("dar",0.6*amp,dt); P.armL.rotation.z=v.aLZ; P.armR.rotation.z=v.aRZ;
    P.legL.rotation.x=-v.lLX+this.jn("dll",0.5*amp,dt); P.legR.rotation.x=-v.lRX+this.jn("dlr",0.5*amp,dt); P.legL.rotation.z=v.lLZ; P.legR.rotation.z=v.lRZ;
    P.kneeL.rotation.x=v.kL+Math.abs(this.jn("dkl",0.8*amp,dt)); P.kneeR.rotation.x=v.kR+Math.abs(this.jn("dkr",0.8*amp,dt));
    this.root.rotation.x=0;
  }
  get mass(){ if(this.kind==="brute") return CFG.phys.bruteMass; const V=this.V||{}; return 55*(this.height||1.75)/1.75*(this.fw||1)*(V.fresh?1.3:1)*(this.stance==="crawling"?0.9:1)*(this.variant==="matron"?1.6:1)*CFG.phys.acrossMass; }
  push(dir, impulse){ if(this.dead) return; this.vel.addScaledVector(dir, impulse/this.mass); }
  // velocity-based movement: bodies speed up and slow down instead of snapping, and slide when knocked
  integrate(dt){
    const PH=CFG.phys, v=this.vel, brute=this.kind==="brute";
    if(this.state!=="lunge" && !this.rDirect){
      const fallen=this.gait&&this.gait.mode==="fallen";
      const skid = fallen || this.stagger>0 || this.state==="stagger" || (this.state==="recover"&&!brute);
      const w=this.desired||{x:0,z:0}; const ws=Math.hypot(w.x,w.z), vs=Math.hypot(v.x,v.z);
      let a = skid ? PH.skid : ws>vs ? (brute?PH.bruteAccel:PH.acrossAccel) : (brute?PH.bruteDecel:PH.acrossDecel);
      if(!PH.on && !skid) a=1e6;
      const tx=skid?0:w.x, tz=skid?0:w.z; let dvx=tx-v.x, dvz=tz-v.z; const dl=Math.hypot(dvx,dvz), mx=a*dt; if(dl>mx){ dvx*=mx/dl; dvz*=mx/dl; } v.x+=dvx; v.z+=dvz;
    }
    this.desired=null;
    const bx=this.pos.x, bz=this.pos.z; this.pos.x+=v.x*dt; this.pos.z+=v.z*dt;
    this.shoveFurniture(dt);
    const px=this.pos.x, pz=this.pos.z; collide(this.pos, this.climbT>0?0.28:this.radius, null, this.canUnder()||this.climbT>0, true);
    const cx=this.pos.x-px, cz=this.pos.z-pz, cl=Math.hypot(cx,cz); if(cl>1e-4){ const nx=cx/cl, nz=cz/cl, vn=v.x*nx+v.z*nz; if(vn<0){ v.x-=nx*vn; v.z-=nz*vn; } }
  }
  // heavy bodies drive furniture in front of them
  shoveFurniture(dt){
    if(!CFG.phys.on) return; const v=this.vel, vs=Math.hypot(v.x,v.z); if(vs<0.3) return;
    for(const b of world.boxes){ if(!b.push) continue; const cx=clamp(this.pos.x,b.x0,b.x1), cz=clamp(this.pos.z,b.z0,b.z1), dx=this.pos.x-cx, dz=this.pos.z-cz, d=Math.hypot(dx,dz);
      if(d>=this.radius) continue; const bm=b.w*b.d*b.h*90*CFG.phys.furnitureWeight, share=this.mass/(this.mass+bm); if(share<0.25) continue;
      const step=vs*dt*share; const ox=b.x, oz=b.z; b.x+=v.x/vs*step; b.z+=v.z/vs*step; const probe=new THREE.Vector3(b.x,0,b.z); collide(probe,Math.min(b.w,b.d)/2*0.95,b);
      if(Math.hypot(probe.x-b.x,probe.z-b.z)>0.02){ b.x=ox; b.z=oz; } else { placeBoxMesh(b); if(Math.random()<dt*4) SFX.drag(); } }
  }
  turnTo(want, dt, rateDeg){ const d=wrapA(want-this.yaw); const r=rateDeg*Math.PI/180*dt; this.yaw += clamp(d,-r,r); }
  facing(toP){ return Math.cos(Math.atan2(toP.x,toP.z)-this.yaw); }
  // walk toward the player, picking the nearest open heading when something is in the way
  steer(dt, want, speed, rate){
    this.steerT -= dt;
    if(this.steerT<=0){
      this.steerT = 0.2;
      const g=this.goalPt||player.pos; let clear = lineOfSight(this.pos.x,this.pos.z,g.x,g.z,false,true);
      if(!clear && (this.kind==="brute"||this.aware==="hunting"||this.allowSmash)){ const w=windowBlock(this.pos.x,this.pos.z,g.x,g.z);
        if(w){ clear=true; if(w.segs.some(sg=>pushSeg(this.pos.clone(),this.radius+0.35,sg))) smashWindow(w,this); } }
      const offs = clear ? [0] : [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5, 2.1, -2.1, 2.7, -2.7];
      this.heading = want;
      for(const o0 of offs){ const o=o0*this.sideBias; const h=want+o; const p=this.pos.clone(); const L=0.7;
        p.x+=Math.sin(h)*L; p.z+=Math.cos(h)*L; collide(p,this.climbT>0?0.28:this.radius,null,(this.canUnder&&this.canUnder())||this.climbT>0,true);
        const prog=(p.x-this.pos.x)*Math.sin(h)+(p.z-this.pos.z)*Math.cos(h);
        if(prog>L*0.6){ this.heading=h; if(o0!==0 && rng()<0.1) this.sideBias*=-1; break; } }
    }
    this.turnTo(this.heading, dt, rate);
    this.desired={x:Math.sin(this.yaw)*speed, z:Math.cos(this.yaw)*speed};
  }
  goal(dt){
    this.routeT=(this.routeT||0)-dt;
    const T = this.kind==="brute" ? this.louisTarget() : (this.kind==="across" && !this.sees && this.lostT>1.0 && this.lastKnown) ? this.lastKnown : player.pos;
    if(this.routeT<=0 || !this.goalPt){ this.routeT=0.35; this.goalPt=route(this.pos.x,this.pos.z,T.x,T.z); }
    if(this.goalPt.direct) this.goalPt={x:T.x,z:T.z,direct:true};
    return this.goalPt;
  }
  findDoor(dist){
    const g=this.goalPt||player.pos;
    const d = blockingDoor(this.pos.x,this.pos.z,g.x,g.z) || blockingDoor(this.pos.x,this.pos.z,player.pos.x,player.pos.z); if(!d) return null;
    const s=doorSeg(d); const mx=(s.ax+s.bx)/2, mz=(s.az+s.bz)/2; const dd=Math.hypot(mx-this.pos.x,mz-this.pos.z);
    return dd < (this.kind==="brute"?CFG.brute.reach*0.8:1.0)+0.4 ? {d,mx,mz} : null;
  }
  // ---------------- Louis: hunts Norah through the map, breaks doors, windows and weak walls, slams, grabs and throws her, throws furniture
  louisSense(dt, see){
    const S=CFG.brute, H=this.hunt||(this.hunt={x:player.pos.x,z:player.pos.z,t:gameTime,src:"start"});
    this.seesP=see;
    if(see){ H.x=player.pos.x; H.z=player.pos.z; H.t=gameTime; H.src="sight"; this.searchPt=null; return; }
    for(const n of world.noises){ if(n.id<=(this.heardId||0)) continue; this.heardId=n.id; if(n.src===this) continue;
      const d=Math.hypot(n.x-this.pos.x,n.z-this.pos.z), eff=n.r*S.hearing*(wallsClear(this.pos.x,this.pos.z,n.x,n.z)?1:0.6);
      if(d<eff){ H.x=n.tx; H.z=n.tz; H.t=gameTime; H.src="noise"; this.searchPt=null; } }
    const tr=world.trail; for(let i=tr.length-1;i>=0;i--){ const q=tr[i]; if(q.t<=H.t) break; if(Math.hypot(q.x-this.pos.x,q.z-this.pos.z)<S.trailSense){ H.x=q.x; H.z=q.z; H.t=q.t; H.src="blood"; this.searchPt=null; break; } }
  }
  louisTarget(){
    const H=this.hunt; if(this.seesP||!H) return player.pos;
    if(Math.hypot(H.x-this.pos.x,H.z-this.pos.z)>1.0 && !this.searchPt) return H;
    this.searchT=(this.searchT||0)-0.35;
    if(!this.searchPt || this.searchT<=0 || Math.hypot(this.searchPt.x-this.pos.x,this.searchPt.z-this.pos.z)<0.8){ this.searchPt=this.randomPoint(H.x,H.z,4.5); this.searchT=4; }
    return this.searchPt;
  }
  findThrowable(){
    const S=CFG.brute; let best=null, bd=S.fetchRange;
    for(const b of world.boxes){ if(!b.push||b.flying||b.w*b.d*b.h>S.furnMaxVol) continue; const d=Math.hypot(b.x-this.pos.x,b.z-this.pos.z);
      if(d<bd && wallsClear(this.pos.x,this.pos.z,b.x,b.z)){ bd=d; best=b; } }
    return best;
  }
  dropCarry(){ const b=this.carry; this.carry=null; if(!b) return; b.x=this.pos.x+Math.sin(this.yaw)*0.8; b.z=this.pos.z+Math.cos(this.yaw)*0.8; louisLand(b,null); }
  brainBrute(dt, dist, want, toP){
    const S=CFG.brute, rake=this.lost.armL, C=this.lc||(this.lc={slam:1.5,grab:2.5,throw:3,charge:2});
    for(const k in C) C[k]-=dt;
    const reach=(rake?S.rakeReach:S.reach)*(this.legsLost()?0.8:1);
    const see=!player.dead && dist<30 && lineOfSight(this.pos.x,this.pos.z,player.pos.x,player.pos.z,true);
    this.louisSense(dt, see);
    // at a smashed window he squeezes through and clambers over whatever is under it (the bed, in Chapter One)
    this.climbT=Math.max(0,(this.climbT||0)-dt);
    for(const w of world.windows){ if(!w.broken||!w.gap) continue; const G=w.gap, dx=G.bx-G.ax, dz=G.bz-G.az, L2=dx*dx+dz*dz||1, u=clamp(((this.pos.x-G.ax)*dx+(this.pos.z-G.az)*dz)/L2,0,1);
      if(Math.hypot(G.ax+dx*u-this.pos.x,G.az+dz*u-this.pos.z)<1.3){ if(!this.climbT) SFX.scrape(this.pos); this.climbT=0.9; } }
    const st=this.state, front=this.facing(toP);
    const startWind=(kind)=>{ this.state="windup"; this.t=0; this.attackKind=kind; this.hitDone=false; SFX.grunt(this.pos,(kind==="rake"?S.rakeWindup:S.windup)*0.8); };
    if(st==="chase"){
      // close in: pick the attack the distance calls for. Each has its own tell.
      const thruWin=world.windows.some(w=>w.gap&&segsCross(this.pos.x,this.pos.z,player.pos.x,player.pos.z,w.gap.ax,w.gap.az,w.gap.bx,w.gap.bz)); // a window between: climb in, don't swing through it
      // the charge: a straight run at her (or at where he heard her), through anything breakable in the lane
      if(C.charge<=0 && this.cool<=0 && !player.grabbed && this.legsLost()===0 && rng()<dt*2.5){
        const H=this.hunt, tx=see?player.pos.x:H.x, tz=see?player.pos.z:H.z, dd=Math.hypot(tx-this.pos.x,tz-this.pos.z), fresh=see||(H&&gameTime-H.t<6);
        if(fresh && dd>S.chargeMin && dd<S.chargeMax && chargeLane(this.pos.x,this.pos.z,tx,tz)){
          this.chargeDir=new THREE.Vector3(tx-this.pos.x,0,tz-this.pos.z).normalize(); this.state="chargeWind"; this.t=0; this.hitDone=false; this.chargeHurt=false; C.charge=S.chargeCool;
          SFX.grunt(this.pos,S.chargeWindup); SFX.scrape(this.pos); this.attackLog(`${this.name} lowers his head to charge${see?"":" (through the wall, at a sound)"}`); return; } }
      if(see && !thruWin && this.cool<=0 && !player.grabbed){
        if(dist<S.slamRadius*0.8 && C.slam<=0 && rng()<0.4){ this.state="slamWind"; this.t=0; this.hitDone=false; C.slam=S.slamCool; SFX.grunt(this.pos,S.slamWindup); this.attackLog(`${this.name} raises both arms for a slam`); return; }
        if(!this.lost.armL && dist<S.grabReach && front>0.7 && C.grab<=0 && rng()<0.45){ this.state="grabWind"; this.t=0; this.hitDone=false; C.grab=S.grabCool; SFX.grunt(this.pos,S.grabWindup); this.attackLog(`${this.name} reaches for her`); return; }
        if(dist<reach && front>0.8 && !(rake&&this.lost.armR)){ this.door=null; this.wallT=null; startWind(rake?"rake":"haymaker"); this.attackLog(`${this.name} winds up a ${this.attackKind}`); return; }
      }
      // out of reach but in sight: throw the furniture nearest him
      if(see && dist>S.furnMin && dist<S.furnMax && C.throw<=0 && !this.lost.armL && !this.lost.armR){ const b=this.findThrowable(); if(b){ this.carryTarget=b; this.state="fetch"; this.t=0; C.throw=S.furnCool; this.attackLog(`${this.name} goes for the ${b.name||"crate"}`); return; } }
      const g=this.goal(dt); let gx=g.x, gz=g.z;
      // a door in the way: smash it
      const door=this.findDoor(dist);
      if(door && this.cool<=0 && !(rake&&this.lost.armR)){ this.door=door.d; this.wallT=null; this.turnTo(Math.atan2(door.mx-this.pos.x,door.mz-this.pos.z),dt,S.turn); startWind(rake?"rake":"haymaker"); this.attackLog(`${this.name} winds up on the door`); return; }
      // a weak wall between him and where she is: go straight through it
      const H=this.hunt;
      if(H && !see && Math.hypot(H.x-this.pos.x,H.z-this.pos.z)<S.wallSense){ const ww=weakBlock(this.pos.x,this.pos.z,H.x,H.z);
        if(ww){ const q=weakNearest(ww,this.pos.x,this.pos.z), dd=Math.hypot(q.x-this.pos.x,q.z-this.pos.z);
          if(dd<reach*0.7 && this.cool<=0){ this.wallT=ww; this.door=null; this.turnTo(Math.atan2(q.x-this.pos.x,q.z-this.pos.z),dt,S.turn); startWind("haymaker"); this.attackLog(`${this.name} winds up on the wall`); return; }
          const back=Math.max(0.01,dd); gx=q.x-(q.x-this.pos.x)/back*0.6; gz=q.z-(q.z-this.pos.z)/back*0.6; this.goalPt={x:gx,z:gz,direct:true}; } }
      if(dist>reach*0.8 || !g.direct || !see || thruWin){ this.steer(dt, Math.atan2(gx-this.pos.x,gz-this.pos.z), this.speedNow(), S.turn); this.stepT-=dt; if(this.stepT<=0){ this.stepT=0.55/Math.max(0.3,S.walk); SFX.stomp(this.pos); } }
      else this.turnTo(want, dt, S.turn);
    } else if(st==="windup"){
      if(!this.door && !this.wallT) this.turnTo(want, dt, S.turn*0.5);
      if(this.t >= (this.attackKind==="rake"?S.rakeWindup:S.windup)){ this.state="active"; this.t=0; }
    } else if(st==="active"){
      if(!this.hitDone && this.t>S.swing*0.4){
        this.hitDone=true; this.hitFlash=0.25;
        if(this.door){ hitDoor(this.door, S.doorDamage, this); }
        else if(this.wallT){ hitWeak(this.wallT, S.wallDamage, this); }
        else { const r=this.attackKind==="rake"?S.rakeReach:S.reach; const inRange=dist<r+0.3, inFront=front>0.45;
          this.attackLog(`${this.name} ${this.attackKind} lands: Norah ${dist.toFixed(2)} m → ${inRange&&inFront?"HIT":"miss"}`);
          if(inRange && inFront) player.hurt(this.attackKind==="rake"?S.rakeDamage:S.damage, this, this.attackKind==="rake"?"rake":"haymaker"); } }
      if(this.t>=S.swing){ this.state="recover"; this.t=0; }
    } else if(st==="chargeWind"){
      const want2=Math.atan2(this.chargeDir.x,this.chargeDir.z); this.turnTo(want2, dt, 360); this.stepT-=dt; if(this.stepT<=0){ this.stepT=0.18; SFX.scrape(this.pos); }
      if(this.t>=S.chargeWindup){ this.yaw=want2; this.state="charge"; this.t=0; this.vel.copy(this.chargeDir).multiplyScalar(S.chargeSpeed); SFX.grunt(this.pos,0.5); }
    } else if(st==="charge"){
      const D=this.chargeDir, along=this.vel.x*D.x+this.vel.z*D.z;
      if(this.t>0.15 && along<S.chargeSpeed*0.4){ // stopped dead by something he can't break
        this.state="stagger"; this.stagger=S.chargeStun; this.t=0; this.flinch=1; this.vel.set(0,0,0); shake=Math.max(shake,0.6); SFX.slam(this.pos); SFX.doorBreak(this.pos);
        makeNoise(this.pos.x,this.pos.z,14,"crash",true,undefined,undefined,this); log(`${this.name} slams into the wall and staggers`,"#ffb070"); return; }
      chargeSmash(this, D);
      if(!this.hitDone && !this.chargeHurt && dist<this.radius+0.5){ this.hitDone=true; this.chargeHurt=true; this.hitFlash=0.3; const saved=dodgeSaves(); knockNorah(S.chargeDamage, this, "charge", S.chargeDown); if(!saved&&!player.dead){ player.vel.copy(D).multiplyScalar(7); player.thrown={t:0.6,last:7,hit:false,by:this}; } }
      this.stepT-=dt; if(this.stepT<=0){ this.stepT=0.22; SFX.stomp(this.pos); makeNoise(this.pos.x,this.pos.z,9,"charge",true,undefined,undefined,this); }
      this.vel.copy(D).multiplyScalar(S.chargeSpeed); this.desired={x:this.vel.x,z:this.vel.z};
      if(this.t>=S.chargeTime){ this.state="recover"; this.t=-0.3; this.vel.multiplyScalar(0.5); }
    } else if(st==="slamWind"){
      this.turnTo(want, dt, S.turn*0.3);
      if(this.t>=S.slamWindup){ this.state="slam"; this.t=0; }
    } else if(st==="slam"){
      if(!this.hitDone && this.t>=0.1){ this.hitDone=true; this.hitFlash=0.3; shake=Math.max(shake,0.7); SFX.slam(this.pos); SFX.stomp(this.pos); makeNoise(this.pos.x,this.pos.z,14,"slam",true,undefined,undefined,this);
        const p=this.pos.clone(); p.y=groundY(p.x,p.z)+0.1; spray(p,new THREE.Vector3(0,0,0),0x6a5a48); spray(p,new THREE.Vector3(0,0,0),0x6a5a48);
        this.attackLog(`${this.name} slams the floor: Norah ${dist.toFixed(2)} m (radius ${S.slamRadius}) → ${dist<S.slamRadius?"DOWN":"clear"}`);
        if(dist<S.slamRadius && wallsClear(this.pos.x,this.pos.z,player.pos.x,player.pos.z)) knockNorah(S.slamDamage, this, "ground slam", S.slamDown);
        for(const e of enemies) if(e!==this && !e.dead && e.kind==="across" && e.legsLost()===0 && e.gait && Math.hypot(e.pos.x-this.pos.x,e.pos.z-this.pos.z)<S.slamRadius) e.knockDown(new THREE.Vector3(e.pos.x-this.pos.x,0,e.pos.z-this.pos.z),"slam"); }
      if(this.t>=0.35){ this.state="recover"; this.t=-(S.slamRecover-S.recover); }
    } else if(st==="grabWind"){
      this.turnTo(want, dt, S.turn*1.2);
      if(this.t>=S.grabWindup){ const ok = dist<S.grabReach+0.25 && front>0.55 && player.grab(this,{dmg:S.grabDamage, how:"Louis's grip"});
        this.attackLog(`${this.name} grab: Norah ${dist.toFixed(2)} m → ${ok?"CAUGHT":"miss"}`);
        if(ok){ this.state="grab"; this.t=0; } else { this.state="recover"; this.t=-0.4; } }
    } else if(st==="grab"){
      this.turnTo(want, dt, S.turn); if(!(player.grabbed && player.grabbed.by===this)){ this.state="recover"; this.t=0; }
    } else if(st==="fetch"){
      const b=this.carryTarget; if(!b || b.flying || this.t>6 || (see && dist<reach*0.9)){ this.carryTarget=null; this.state="chase"; return; }
      const cx=clamp(this.pos.x,b.x0,b.x1), cz=clamp(this.pos.z,b.z0,b.z1), d=Math.hypot(cx-this.pos.x,cz-this.pos.z);
      if(d<0.95){ const i=world.boxes.indexOf(b); if(i>=0) world.boxes.splice(i,1); b.flying=true; this.carry=b; this.carryTarget=null; this.state="lift"; this.t=0; b.liftFrom={x:b.x,y:b.y0||0,z:b.z}; SFX.drag(); this.attackLog(`${this.name} lifts the ${b.name||"crate"}`); return; }
      this.goalPt={x:cx,z:cz,direct:true}; this.steer(dt, Math.atan2(cx-this.pos.x,cz-this.pos.z), this.speedNow(), S.turn);
    } else if(st==="lift"){
      const b=this.carry; if(!b){ this.state="chase"; return; } this.turnTo(want, dt, S.turn*0.8);
      const k=Math.min(1,this.t/S.liftTime), top=groundY(this.pos.x,this.pos.z)+S.height*0.92+0.1;
      const hx=this.pos.x+Math.sin(this.yaw)*0.25, hz=this.pos.z+Math.cos(this.yaw)*0.25, L=b.liftFrom;
      louisPlaceAir(b, L.x+(hx-L.x)*k, L.y+(top-L.y)*k, L.z+(hz-L.z)*k);
      if(this.t>=S.liftTime){ louisThrowBox(this,b); this.carry=null; this.state="recover"; this.t=0; }
    } else if(st==="recover"){ if(this.t>=S.recover){ this.state="chase"; this.cool=0.2; this.door=null; this.wallT=null; } }
  }
  // ---------------- stealth: what an ACROSS notices, and what it does before it notices Norah
  canUnder(){ return this.kind==="across" && (this.stance==="crawling" || this.legsLost()===2); }
  coneDeg(){ const SS=CFG.stealth, I=this.idle; if(this.aware==="unaware"){ if(I.kind==="playdead") return 0; if(I.kind==="feed") return 50; if(I.kind==="lurk") return 70; }
    let c=SS.sightCone; if(this.V&&this.V.fight.creep) c*=0.7; return c; }
  hearMul(){ const I=this.idle; if(this.aware==="unaware"){ if(I.kind==="feed") return 0.5; if(I.kind==="playdead") return 0.8; } return 1; }
  perceive(dt, dist){
    if(this.variant==="mourner" && this.aware!=="hunting"){ this.mournerWatch(dt,dist); return; }
    const SS=CFG.stealth, pp=player.pos, I=this.idle; if(this.huntFlash>0) this.huntFlash-=dt;
    if(this.variant==="walker" && this.aware==="searching" && world.crowd && gameTime-world.crowd.t<1){ this.lastKnown={x:world.crowd.x,z:world.crowd.z}; this.alert("joins the others",false); return; }
    for(const n of world.noises){ if(n.id<=this.heardId) continue; this.heardId=n.id; if(n.src===this) continue;
      const d=Math.hypot(n.x-this.pos.x,n.z-this.pos.z), eff=n.r*(wallsClear(this.pos.x,this.pos.z,n.x,n.z)?1:0.5)*this.hearMul(); if(d>eff) continue;
      if(this.aware==="hunting"){ if(!this.sees && this.variant!=="matron" && this.variant!=="mourner"){ this.lastKnown={x:n.tx,z:n.tz}; this.lostT=Math.min(this.lostT,1.5); crowdNote(n.tx,n.tz,"noise"); } continue; }
      if(n.kind==="gunshot" || (n.loud && d<eff*0.5)){ this.lastKnown={x:n.tx,z:n.tz}; this.alert(`hears the ${n.kind}`,false); return; }
      if(this.aware==="unaware") this.attackLog(`${this.name} hears something (${n.kind})`);
      if(this.aware==="searching") this.searchT=SS.searchTime; else { this.aware="suspicious"; this.susT=0; }
      this.awareness=Math.max(this.awareness,0.45); this.lastKnown={x:n.tx,z:n.tz}; this.arrived=false; }
    const vis=playerVis(), range=SS.sightRange*(0.35+0.65*vis), cone=this.coneDeg(); let sees=false;
    if(!player.dead && dist<range && cone>0){ const ang=Math.abs(wrapA(Math.atan2(pp.x-this.pos.x,pp.z-this.pos.z)-this.yaw)); if((ang<cone*Math.PI/360 || dist<1.4 || (this.aware==="hunting"&&dist<8)) && lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,true)) sees=true; }
    this.sees=sees;
    const amb = this.aware==="unaware" && (I.kind==="playdead"||I.kind==="lurk");
    const prox = this.aware==="hunting"?0 : amb ? (I.kind==="playdead"?1.6:2.0) : 0.9;
    if(prox && dist<prox && !player.dead && lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,true)){
      this.alert(amb?"ambush":"touch",true);
      if(amb && !player.grabbed && !(this.lost.armL&&this.lost.armR)){ this.grabKind="ankle"; this.state="grab"; this.t=0.12; this.hitDone=false; this.grabReach=2.0; } return; }
    if(this.aware==="hunting"){ if(sees || (dist<2 && lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,true))){ this.lastKnown={x:pp.x,z:pp.z}; this.lostT=0; crowdNote(pp.x,pp.z,"sight"); } else { this.lostT+=dt; const CW=this.variant==="walker"?walkerCrowd(this):null; if(CW){ this.lastKnown={x:CW.x,z:CW.z}; this.lostT=Math.min(this.lostT,1.5); } else if(this.variant==="matron"){ if(!this.lastKnown) this.lastKnown=world.crowd?{x:world.crowd.x,z:world.crowd.z}:{x:player.pos.x,z:player.pos.z}; this.lostT=Math.min(this.lostT,2); } else if(this.variant==="mourner"){ if(this.lostT>CFG.across.mournerCalm) this.mournerCalm(); } else if(this.lostT>SS.loseTime) this.toSearch(); } return; }
    if(sees){ const moving=player.vel.length()>0.4; this.awareness+=SS.sightRate*Math.max(0.15,1.15-dist/range)*vis*(this.aware==="unaware"?1:2)*(moving?1:0.5)*dt; this.lastKnown={x:pp.x,z:pp.z};
      if(this.aware==="unaware" && this.awareness>0.35){ this.aware="suspicious"; this.susT=0; this.arrived=false; }
      if(this.awareness>=1) this.alert("saw her",true); }
    else this.awareness=Math.max(0,this.awareness-SS.decay*dt*(this.aware==="unaware"?1:0.35));
  }
  alert(why, seen){
    if(this.kind!=="across" || this.aware==="hunting") return;
    this.aware="hunting"; this.awareness=1; this.lostT=0; this.huntFlash=2.2; if(seen) this.lastKnown={x:player.pos.x,z:player.pos.z};
    if(this.gait.mode==="fallen" && this.idle.kind==="playdead"){ this.gait.mode="rising"; this.gait.t=this.gait.dur=0.3; }
    this.idle.kind=this.idle.base; this.cool=Math.min(this.cool,0.3); SFX.shriek(this.pos); if(run) run.spotted=(run.spotted||0)+1;
    log(`${this.name} ${why==="saw her"?"spots Norah":why==="ambush"?"was lying in wait":why==="touch"?"feels her brush past":why}`,"#ff9a6a");
    const L=this.lastKnown||this.pos; makeNoise(this.pos.x,this.pos.z,CFG.stealth.shareRange,"shriek",false,L.x,L.z,this);
  }
  toSearch(){ this.aware="searching"; this.searchT=CFG.stealth.searchTime; this.idle.tx=null; this.arrived=false; this.state="chase"; this.attackLog(`${this.name} lost her and starts searching`); }
  returnHome(){ const I=this.idle; if(I.base==="wander"){ I.kind="wander"; I.tx=null; } else I.kind="return"; }
  randomPoint(cx,cz,r){ for(let i=0;i<8;i++){ const a=rng()*Math.PI*2, d=0.5+rng()*r, x=cx+Math.sin(a)*d, z=cz+Math.cos(a)*d;
      if(wallsClear(cx,cz,x,z)){ const p=new THREE.Vector3(x,0,z); collide(p,this.radius,null,this.canUnder()); return {x:p.x,z:p.z}; } } return {x:cx,z:cz}; }
  moveTo(x,z,speed,dt,smash){
    this.mvT=(this.mvT||0)-dt;
    if(this.mvT<=0||!this.mvGoal||this.mvGoal.tx!==x||this.mvGoal.tz!==z){ this.mvT=0.4; const g=route(this.pos.x,this.pos.z,x,z); this.mvGoal={x:g.direct?x:g.x, z:g.direct?z:g.z, tx:x, tz:z, direct:g.direct}; }
    this.goalPt=this.mvGoal; this.allowSmash=smash; this.steer(dt, Math.atan2(this.mvGoal.x-this.pos.x,this.mvGoal.z-this.pos.z), speed, CFG.across.turn*0.5); this.allowSmash=false;
    this.idleMv=Math.min(1,speed/1.6)+0.15; }
  brainIdle(dt, dist){
    const SS=CFG.stealth, I=this.idle, sp=Math.max(0.3,this.speedNow()/Math.max(0.1,CFG.across.speed)); this.idleMv=0;
    if(this.aware==="suspicious"){ this.susT=(this.susT||0)+dt; const L=this.lastKnown||this.pos, d=Math.hypot(L.x-this.pos.x,L.z-this.pos.z);
      if(this.susT<0.7){ this.turnTo(Math.atan2(L.x-this.pos.x,L.z-this.pos.z),dt,200); return; }
      if(d>0.9 && this.susT<8){ this.moveTo(L.x,L.z,0.75*sp,dt,false); return; }
      this.turnTo(this.yaw+Math.sin(this.susT*2)*1.5,dt,90);
      if(this.susT>10 || (d<=0.9 && this.susT>3.5)){ this.aware="unaware"; this.awareness=0; this.returnHome(); } return; }
    if(this.aware==="searching"){ this.searchT-=dt; const L=this.lastKnown||this.pos;
      if(!this.arrived){ if(Math.hypot(L.x-this.pos.x,L.z-this.pos.z)>0.8) this.moveTo(L.x,L.z,1.3*sp,dt,true); else this.arrived=true; }
      else { I.t-=dt; if(I.tx===null || Math.hypot(I.tx-this.pos.x,I.tz-this.pos.z)<0.6 || I.t<=0){ const pt=this.randomPoint(L.x,L.z,3); I.tx=pt.x; I.tz=pt.z; I.t=2.5; } this.moveTo(I.tx,I.tz,0.9*sp,dt,true); }
      if(this.searchT<=0){ this.aware="unaware"; this.awareness=0; I.home={x:this.pos.x,z:this.pos.z}; I.kind=I.base==="wander"?"wander":"return"; I.tx=null; this.attackLog(`${this.name} gives up the search`); } return; }
    if(I.kind==="return"){ if(Math.hypot(I.home.x-this.pos.x,I.home.z-this.pos.z)>0.5) this.moveTo(I.home.x,I.home.z,0.6*sp,dt,false);
      else { I.kind=I.base; if(I.base==="playdead"){ this.gait.mode="fallen"; this.gait.t=this.gait.dur=1e9; } } return; }
    if(I.kind==="wander"){ if(I.tx===null || Math.hypot(I.tx-this.pos.x,I.tz-this.pos.z)<0.5){ I.t-=dt; if(I.t<=0){ const pt=this.randomPoint(I.home.x,I.home.z,SS.wanderRadius); I.tx=pt.x; I.tz=pt.z; I.t=1+rng()*2.5; } return; }
      this.moveTo(I.tx,I.tz,0.55*sp,dt,false); return; }
    if(I.kind==="stand"){ I.t-=dt; if(I.t<=0){ I.face+=(rng()-0.5)*0.8; I.t=4+rng()*5; } this.turnTo(I.face,dt,30); return; }
    if(I.kind==="feed"){ this.turnTo(I.face,dt,60); return; }
  }
  // ---------------- ACROSS: a demon working a body it doesn't understand
  // It moves in lurching bursts and stalls, snaps its heading, and trips. Its attacks stay fast and hard.
  brainAcross(dt, dist, want, toP){
    const S=this.S, G=this.gait, crawl=this.stance==="crawling";
    this.swCool=(this.swCool||0)-dt; this.wailCool-=dt; this.biteCool=(this.biteCool||0)-dt;
    if(this.state==="mshove"){ this.matronShove(dt,dist,want); return; }
    if(this.state==="mscream"){ this.mournerScream(dt,dist,want); return; }
    if(this.state==="wail"){
      this.turnTo(want, dt, S.turn*0.5);
      if(this.t>=1.2){ this.doWail(); this.state="recover"; this.t=0; this.wailCool=9; }
      return;
    }
    const canSee = () => lineOfSight(this.pos.x,this.pos.z,player.pos.x,player.pos.z,false);
    if(this.state==="grab"){
      this.turnTo(want, dt, S.turn);
      if(this.variant==="mourner" && this.mc && this.hitDone && player.grabbed && player.grabbed.by===this){ this.mc.wail-=dt; if(this.mc.wail<=0){ this.mc.wail=CFG.across.mournerClingWail; this.mournerWail(); } }
      if(this.grabReach && !this.hitDone) this.desired={x:toP.x*3.5, z:toP.z*3.5}; // springs at her from the floor
      if(!this.hitDone && this.t>=0.3){ this.hitDone=true; this.hitFlash=0.2;
        const ok = dist<(this.grabReach||1.1) && player.grab(this, this.grabKind==="hug"?{dmg:(this.variant==="matron"?CFG.across.matronHugDamage:12)*(this.jawLost?0.4:1), how:"bear hug"}:this.grabKind==="cling"?{dmg:CFG.across["mournerClingDamage"+mStage(this.mstage)]*(this.jawLost?0.4:1), how:"clings"}:{dmg:CFG.across.grabDamage*(this.jawLost?0.4:1)}); this.attackLog(`${this.name} grab: Norah ${dist.toFixed(2)} m → ${ok?"CAUGHT":"miss"}`); this.grabReach=0; if(!ok){ this.state="recover"; this.t=0; } }
      else if(this.hitDone && !(player.grabbed && (player.grabbed.by===this || (player.grabbed.extra||[]).includes(this)))){ this.state="recover"; this.t=0; }
      return;
    }
    if(this.state==="bite"){
      this.turnTo(want, dt, S.turn*1.5);
      if(!this.hitDone && this.t>=S.walkerBiteTell){ this.hitDone=true; this.hitFlash=0.2; const ok=dist<S.walkerBiteRange+0.25; this.attackLog(`${this.name} bite: Norah ${dist.toFixed(2)} m → ${ok?"HIT":"miss"}`); if(ok) player.hurt(S.walkerBiteDamage, this, "bite"); }
      if(this.t>=S.walkerBiteTell+0.3){ this.state="chase"; this.t=0; }
      return;
    }
    if(this.state==="swipe"){
      this.turnTo(want, dt, S.turn*1.5);
      if(!this.hitDone && this.t>=S.swipeWindup){
        this.hitDone=true; this.hitFlash=0.2; const ok = dist<S.swipeRange+0.25 && this.facing(toP)>0.3;
        this.attackLog(`${this.name} swipe${this.swFloor?" from the floor":""}: Norah ${dist.toFixed(2)} m → ${ok?"HIT":"miss"}`);
        if(ok) player.hurt(S.swipeDamage, this, this.swFloor?"swipe from the floor":"swipe");
      }
      if(this.t>=S.swipeWindup+0.22){ this.state="chase"; this.t=0; this.swCool=S.swipeCool; }
      return;
    }
    if(this.state==="chase" && this.variant==="mourner" && this.legsLost()===0 && G.mode!=="fallen" && G.mode!=="rising"){ this.mournerBrain(dt,dist,want,toP); return; }
    if(this.state==="chase" && this.variant==="matron" && this.legsLost()===0 && G.mode!=="fallen" && G.mode!=="rising"){ this.matronBrain(dt,dist,want,toP); return; }
    if(this.state==="chase" && this.variant==="crawler" && this.legsLost()===0 && G.mode!=="fallen" && G.mode!=="rising"){ this.crawlerBrain(dt,dist,want,toP); return; }
    if(this.state==="chase"){
      if(G.mode==="fallen"){
        G.t-=dt;
        if(dist<S.swipeRange*0.9 && this.swCool<=0 && G.t<G.dur*0.7 && tellOk()){ markTell(); this.startSwipe(true); return; }
        if(G.t<=0){ G.mode="rising"; G.dur=G.t=S.riseTime*(0.7+rng()*0.6); SFX.scratch(this.pos); }
        return;
      }
      if(G.mode==="rising"){ G.t-=dt; if(G.t<=0) this.newGait("stall"); return; }
      if(this.disguised){ // standing still, passing for a person
        if(dist<4 || this.rally>0){ this.disguised=false; this.cool=0; SFX.shriek(this.pos); log(`${this.name} was only pretending`,"#ffb070"); }
        else { this.turnTo(this.disguiseYaw, dt, 40); return; } }
      if(S.wail && this.wailCool<=0 && dist<10 && this.legsLost()<2 && lineOfSight(this.pos.x,this.pos.z,player.pos.x,player.pos.z,true)){
        this.state="wail"; this.t=0; SFX.wail(this.pos); this.attackLog(`${this.name} draws breath to scream`); return; }
      const g=this.goal(dt); let gWant=Math.atan2(g.x-this.pos.x,g.z-this.pos.z); if(this.variant==="walker" && !this.sees) gWant=walkerMob(this,gWant);
      const door = this.findDoor(dist);
      if(door){ this.turnTo(Math.atan2(door.mx-this.pos.x,door.mz-this.pos.z),dt,S.turn); this.scratchT=(this.scratchT||0)-dt; if(this.scratchT<=0){ this.scratchT=0.7; SFX.scratch(this.pos); if(CFG.world.doorScratch>0) hitDoor(door.d, CFG.world.doorScratch, this); } return; }
      // a pack takes turns: only a few attack at once, the rest circle and wait for an opening
      const token = acrossAttackers(this) < S.maxAttackers;
      this.waiting = !token && dist < S.lungeRange+1.5;
      if(this.waiting && g.direct){ const a1=Math.atan2(this.pos.x-player.pos.x,this.pos.z-player.pos.z)+this.sideBias*0.9;
        const tx=player.pos.x+Math.sin(a1)*S.circleDist, tz=player.pos.z+Math.cos(a1)*S.circleDist; gWant=Math.atan2(tx-this.pos.x,tz-this.pos.z); }
      if(this.legsLost()===2 && this.armsLeft()>0 && dist<1.0 && this.cool<=0 && token && !player.grabbed && canSee() && tellOk()){ markTell(); this.grabKind="ankle"; this.state="grab"; this.t=0; this.hitDone=false; SFX.scratch(this.pos); this.attackLog(`${this.name} reaches for Norah's ankle`); return; }
      if(this.variant==="walker" && (player.downT>0||player.stumble>0.2) && !player.grabbed && dist<S.walkerBiteRange && (this.biteCool||0)<=0 && canSee() && tellOk()){ markTell(); this.state="bite"; this.t=0; this.hitDone=false; this.biteCool=1.5; SFX.chitter(this.pos); this.attackLog(`${this.name} goes for a bite`); return; }
      if(dist<S.swipeRange && this.swCool<=0 && token && this.armsLeft()>0 && canSee() && tellOk()){ markTell();
        if((S.ankle||S.hug) && !player.grabbed && rng()<0.55){ this.grabKind=S.hug&&this.armsLeft()===2?"hug":"ankle"; this.state="grab"; this.t=0; this.hitDone=false; SFX.scratch(this.pos); this.swCool=S.swipeCool; this.attackLog(`${this.name} ${S.hug?"opens its arms":"reaches for Norah's ankle"}`); return; }
        this.startSwipe(false); return; }
      if(dist<S.lungeRange && dist>S.swipeRange*0.8 && this.cool<=0 && token && this.legsLost()<2 && canSee() && tellOk()){ markTell();
        this.state="windup"; this.t=0; this.hitDone=false; SFX.shriek(this.pos); this.attackLog(`${this.name} coils to lunge (Norah at ${dist.toFixed(2)} m)`); return; }
      if(this.variant==="walker") this.walkerGait(dt, dist); else { G.t-=dt; if(G.t<=0) this.newGait(G.mode==="burst"?"stall":"burst"); }
      this.jitterT-=dt;
      if(this.jitterT<=0){ this.jitter=(rng()*2-1)*S.erratic*(dist>2.5&&g.direct?1.3:0.45); this.jitterT=0.08+rng()*0.3; }
      this.creeping = S.creep && dist>5 && !(this.rally>0);
      const sp = this.variant==="walker" ? this.walkerSpeed() : this.creeping ? this.speedNow()*0.32 : G.mode==="burst" ? this.speedNow()*G.mul : this.speedNow()*0.07;
      if(S.dragSound && G.mode==="burst"){ this.dragT=(this.dragT||0)-dt; if(this.dragT<=0){ this.dragT=0.45; SFX.scrape(this.pos); } }
      const prevYaw=this.yaw;
      this.steer(dt, gWant+this.jitter, sp, S.turn);
      if(G.mode==="burst" && !this.creeping){ // the faster it goes and the harder it turns, the likelier it trips over itself
        const turn=Math.abs(wrapA(this.yaw-prevYaw))/Math.max(dt,1e-4);
        const vs=Math.hypot(this.vel.x,this.vel.z), lat=vs>0.1?Math.abs(Math.sin(Math.atan2(this.vel.x,this.vel.z)-this.yaw))*vs:0; // sideways momentum from turning at speed
        const pTrip=S.tripChance*(crawl?S.crawlTrip:1)*((CFG.phys.on?vs:sp)/Math.max(0.1,S.speed))*(1+(CFG.phys.on?lat*CFG.phys.momentumTrip*2:turn*0.25))*dt;
        if(rng()<pTrip) this.trip(false);
      }
    } else if(this.state==="windup"){
      this.turnTo(want, dt, S.turn*2);
      if(this.t>=S.lungeWindup){ this.state="lunge"; this.t=0; this.lungeDir.set(Math.sin(this.yaw),0,Math.cos(this.yaw)); }
    } else if(this.state==="lunge"){
      this.hitFlash=0.1;
      const sp = S.lungeSpeed*(this.legsLost()?0.5:1)*(crawl?0.85:1); this.vel.copy(this.lungeDir).multiplyScalar(sp);
      if(!this.hitDone && dist<0.8){ this.hitDone=true; this.attackLog(`${this.name} lunge connects at ${dist.toFixed(2)} m`); player.hurt(S.damage*(this.jawLost?0.55:1)*(this.armsLeft()===0?0.6:1), this, "lunge"); }
      if(this.t>=S.lungeTime){ if(!this.hitDone) this.attackLog(`${this.name} lunge misses`);
        if(this.legsLost()===0 && rng()<S.landTrip){ this.trip(true); this.cool=S.recover; } else { this.state="recover"; this.t=0; } }
    } else if(this.state==="recover"){ if(this.t>=S.recover){ this.state="chase"; this.cool=0.3+rng()*0.7; this.newGait("stall"); } }
  }
  walkerGait(dt, dist){
    const S=this.S, G=this.gait; if(G.mode==="fallen"||G.mode==="rising") return;
    const pick=(a,b)=>a+rng()*Math.max(0,b-a), set=m=>{ G.mode=m; G.mul=1; G.dur=G.t=m==="burst"?pick(S.walkerBurstMin,S.walkerBurstMax):m==="stall"?pick(S.walkerStallMin,S.walkerStallMax):pick(S.walkerGapMin,S.walkerGapMax); };
    if(dist>S.walkerClose){ if(G.mode!=="shamble"||G.near){ G.near=false; G.mode="shamble"; G.mul=1; G.t=G.dur=1; } return; }
    if(!G.near){ G.near=true; set("burst"); return; }
    G.t-=dt; if(G.t>0) return; set(G.mode==="burst"?"stall":G.mode==="stall"?"shamble":"burst");
  }
  walkerSpeed(){ const S=this.S, G=this.gait, f=this.speedNow()/Math.max(0.1,S.speed);
    return f*(G.mode==="burst"?S.walkerBurst:G.mode==="stall"?S.walkerBurst*0.06:S.walkerShamble*(G.near?0.85:1)); }
  newGait(mode){ const S=this.S, G=this.gait; G.mode=mode;
    if(mode==="burst"){ G.dur=G.t=S.burstMin+rng()*Math.max(0,S.burstMax-S.burstMin); G.mul=0.7+rng()*0.6; }
    else { G.dur=G.t=S.stallMin+rng()*Math.max(0,S.stallMax-S.stallMin); } }
  trip(afterLunge){
    const S=this.S, G=this.gait; if(this.legsLost()) return;
    G.mode="fallen"; G.dur=G.t=S.fallTime*(0.6+rng()*0.8); G.side=rng()<0.5?-1:1; G.back=false;
    G.slide=new THREE.Vector3(); this.vel.addScaledVector(new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)), afterLunge?0.6:0.4);
    this.state="chase"; this.t=0; this.trips=(this.trips||0)+1; SFX.stomp(this.pos); SFX.scratch(this.pos);
    this.attackLog(`${this.name} trips and goes down (${G.dur.toFixed(2)} s)`);
  }
  knockDown(dir, why){
    const S=this.S, G=this.gait; this.disguised=false;
    if(G.mode==="fallen"){ G.t+=0.25; return "pinned down"; }
    G.mode="fallen"; G.dur=G.t=S.fallTime*(0.7+rng()*0.5); G.side=rng()<0.5?-1:1; G.back=rng()<0.75;
    G.slide=new THREE.Vector3(); this.push(new THREE.Vector3(dir.x,0,dir.z).normalize(), CFG.phys.knockPush);
    this.yaw=Math.atan2(-dir.x,-dir.z); this.state="chase"; this.stagger=0; this.t=0; this.knocks=(this.knocks||0)+1; SFX.stomp(this.pos);
    return `knocked down by the ${why}`;
  }
  doWail(){
    let n=0; for(const e of enemies){ if(e===this||e.dead||e.kind!=="across") continue; if(Math.hypot(e.pos.x-this.pos.x,e.pos.z-this.pos.z)<18){ e.rally=4; e.disguised=false; e._sf=-1; n++; } }
    const d=Math.hypot(player.pos.x-this.pos.x,player.pos.z-this.pos.z); if(d<10){ player.dazed=1.5; shake=Math.max(shake,0.4); }
    log(`${this.name} screams: ${n} ACROSS answer${d<10?", and Norah is dazed":""}`,"#ffb070");
  }
  startSwipe(fromFloor){ this.state="swipe"; this.t=0; this.hitDone=false; this.swFloor=fromFloor; SFX.chitter(this.pos); SFX.scratch(this.pos); this.attackLog(`${this.name} swipes${fromFloor?" from the floor":""}`); }
  attackLog(s){ if(CFG.debug.attackLog) log(s,"#c8a0ff"); }
  // sample-and-hold noise: each joint snaps to a new offset at random moments, so nothing moves smoothly
  jn(key, amp, dt){ const J=this.jj||(this.jj={}); let j=J[key]; if(!j) j=J[key]={cur:0,tg:0,t:0};
    j.t-=dt; if(j.t<=0){ j.tg=(Math.random()*2-1)*amp; j.t=0.05+Math.random()*0.35; } j.cur+=(j.tg-j.cur)*Math.min(1,dt*24); return j.cur; }
  poseAcross(dt){
    const S=this.S, P=this.P, G=this.gait, crawl=this.stance==="crawling";
    const live = !CFG.world.freezeAI && !player.dead;
    let mv = this.state==="chase" && live ? (G.mode==="burst"?1:G.mode==="shamble"?0.55:G.mode==="stall"?0.2:0) : 0;
    if(this.creeping && this.state==="chase") mv=0.35; if(this.disguised) mv=0;
    const idleNow = this.aware && this.aware!=="hunting" && this.state==="chase", I=this.idle;
    if(idleNow) mv = live ? (this.idleMv||0) : 0;
    this.wt=(this.wt||0)+dt*(crawl?8:this.V.stance==="kneel"?7:9)*(0.4+mv)*(G.mul||1); const w=this.wt;
    const v=basePose(this, mv, w);
    let calm=1;
    if(this.disguised){ v.hp=0.02; v.cH=0; v.aLX=v.aRX=0.05; v.aLZ=0.08; v.aRZ=-0.08; v.eL=v.eR=0.1; v.lLX=v.lRX=0.02; v.kL=v.kR=0.05; v.nX=0.15; v.nZ=0.05; v.jaw=0; calm=0.05; }
    if(this.creeping && this.state==="chase"){ v.nX+=0.45; v.hp+=0.15; calm=0.6; }
    if(idleNow && this.aware==="unaware" && I.kind==="feed"){ const k=performance.now()/1000; v.hy*=0.55; v.hp=1.15; v.aLX=v.aRX=1.45; v.eL=0.9+Math.sin(k*3)*0.3; v.eR=1.0+Math.cos(k*2.7)*0.3; v.lLX=v.lRX=1.4; v.kL=v.kR=2.0; v.nX=-0.7+Math.sin(k*6)*0.15; v.jaw=0.3+Math.abs(Math.sin(k*8))*0.35; calm=0.5; }
    if(idleNow && this.aware==="unaware" && I.kind==="lurk"){ v.hy*=0.75; v.hp+=0.1; v.nX=-0.2; calm=0.3; }
    if(idleNow && this.aware==="unaware" && I.kind==="playdead") calm=0.15;
    if(idleNow && this.aware!=="unaware"){ v.nZ+=0.35; }
    // falling over and scrambling up
    let f=0; if(this.state==="chase"&&G.mode==="fallen") f=1; else if(this.state==="chase"&&G.mode==="rising") f=Math.max(0,G.t/G.dur);
    if(this.cr&&this.cr.playDead&&this.state==="chase") f=1;
    if(this.state==="swipe"&&this.swFloor) f=1;
    if(f>0){ const sd=G.side||1, F = G.back && !(this.state==="swipe"&&this.swFloor)
        ? {hy:0.16,hp:-1.45,hr:0.25*sd,cH:0,aLX:-0.3,aRX:0.2,aLZ:1.25*sd,aRZ:-1.15,eL:0.4,eR:0.6,lLX:0.25,lRX:0.1,lLZ:0.2,lRZ:-0.25,kL:0.9,kR:0.4,nX:0.35,nZ:0.4*sd,jaw:0.3}
        : {hy:0.16,hp:1.5,hr:0.3*sd,cH:0,aLX:0.6,aRX:1.6,aLZ:1.3*sd,aRZ:-1.1,eL:0.3,eR:0.5,lLX:-0.2,lRX:0.4,lLZ:0.3,lRZ:-0.2,kL:0.4,kR:0.9,nX:-0.3,nZ:0.5*sd,jaw:0.2};
      for(const k in F) v[k]=v[k]*(1-f)+F[k]*f; }
    // attacks
    if(this.state==="windup"){ v.hy*=0.82; v.nX=-0.6; v.hr=Math.sin(this.t*60)*0.12; v.aLX=v.aRX=crawl?0.8:-0.3; v.eL=v.eR=1.1; v.jaw=0.5; }
    else if(this.state==="lunge"){ v.hy=crawl?0.55:this.hipY*0.78; v.hp=1.0; v.aLX=v.aRX=2.2; v.aLZ=0.2; v.aRZ=-0.2; v.eL=v.eR=0.1; v.lLX=v.lRX=-0.4; v.kL=v.kR=0.2; v.nX=-0.8; v.jaw=0.65; }
    else if(this.state==="swipe"){ const a=this.t/S.swipeWindup;
      let ax, ex;
      if(S.upswipe){ const b=Math.min(1,Math.max(0,(this.t-S.swipeWindup)/0.1)); ax = a<1 ? -0.7*a : -0.7+3.4*b; ex=a<1?1.2:0.1; v.hp-=0.3*b; }
      else { ax = a<1 ? (crawl?0.6:-0.2)-1.4*a : -1.6+3.8*Math.min(1,(this.t-S.swipeWindup)/0.1); ex=a<1?1.4:0.2; }
      if(this.lost.armR){ v.aLX=ax; v.eL=ex; v.aLZ=0.45; } else { v.aRX=ax; v.eR=ex; v.aRZ=-0.45; }
      v.nX=-0.5; v.jaw=0.55; }
    else if(this.state==="grab"){
      if(this.grabKind==="hug"){ const held=player.grabbed&&player.grabbed.by===this; const s=Math.sin(this.t*30)*0.06;
        if(!this.hitDone){ v.aLX=v.aRX=1.1; v.aLZ=1.35; v.aRZ=-1.35; v.eL=v.eR=0.3; v.jaw=0.4; }
        else { v.aLX=v.aRX=1.35; v.aLZ=-0.35+(held?s:0); v.aRZ=0.35-(held?s:0); v.eL=v.eR=1.7; v.jaw=0.65; v.hp+=0.15; } }
      else { v.aLX=v.aRX=1.6; v.eL=v.eR=this.hitDone?1.3:0.2; v.nX=-0.7; v.jaw=0.55; } }
    else if(this.state==="mscream"){ const a=Math.min(1,this.t/CFG.across.mournerScreamTell); if(!this.hitDone){ v.nX=-0.9*a; v.hp-=0.2*a; v.cH=-0.15*a; v.jaw=0.3; v.aLX=v.aRX=-0.2; v.aLZ=0.6*a; v.aRZ=-0.6*a; } else { v.nX=0.35; v.hp+=0.45; v.jaw=1.0; v.aLX=v.aRX=-0.5; v.aLZ=0.7; v.aRZ=-0.7; } calm=0.6; }
    else if(this.state==="mshove"){ const a=Math.min(1,this.t/CFG.across.matronShoveTell); if(!this.hitDone){ v.aLX=v.aRX=0.9*a; v.eL=v.eR=1.6*a; v.hp-=0.15*a; } else { v.aLX=v.aRX=1.55; v.eL=v.eR=0.1; v.hp+=0.25; } v.aLZ=0.15; v.aRZ=-0.15; v.jaw=0.4; }
    else if(this.state==="bite"){ const a=Math.min(1,this.t/CFG.across.walkerBiteTell); v.hp+=0.55*a; v.hy*=1-0.25*a; v.nX=-0.9*a+(this.hitDone?0.5:0); v.jaw=this.hitDone?0.1:0.8; v.aLX=v.aRX=1.1; v.eL=v.eR=0.6; }
    else if(this.state==="wail"){ v.nX=-1.15; v.hp=-0.15; v.cH=-0.15; v.jaw=0.85; v.aLX=v.aRX=0.5; v.aLZ=1.35+Math.sin(this.t*40)*0.08; v.aRZ=-1.35+Math.cos(this.t*37)*0.08; calm=0.7; }
    if(this.variant==="mourner" && this.state==="chase" && this.aware==="hunting"){ if(this.mwT>0){ v.nX=-1.1; v.hp=Math.min(v.hp,0); v.jaw=0.9; v.aLZ=1.1+Math.sin(this.t*40)*0.1; v.aRZ=-1.1+Math.cos(this.t*37)*0.1; calm=0.7; } else if((this.mstage||1)>=3){ v.hp+=0.35; v.nX+=0.3; v.jaw=0.7; } }
    // jumble everything
    // they only twitch hard when they struggle to move; at rest they're nearly still, with the odd single twitch
    let motion = !live ? 0.08 : this.state==="chase" ? (G.mode==="burst"?1 : G.mode==="rising"?2.2 : G.mode==="fallen"?0.4 : 0.15) : ["windup","lunge","swipe","grab","wail","mscream"].includes(this.state) ? (this.state==="windup"?1.3:0.8) : 0.15;
    if(idleNow) motion = (this.idleMv||0)>0.1 ? 0.35 : 0.12;
    this.twT=(this.twT||0)-dt; if(motion<0.5 && Math.random()<dt*0.2) this.twT=0.18; if(this.twT>0) motion=Math.max(motion,1.1);
    const amp=S.jerk*motion*calm;
    v.hp+=this.jn("hp",0.15*amp,dt); v.hr+=this.jn("hr",0.25*amp,dt); v.nX+=this.jn("nx",0.55*amp,dt); v.nZ+=this.jn("nz",0.6*amp,dt);
    v.aLX+=this.jn("alx",0.5*amp,dt); v.aRX+=this.jn("arx",0.5*amp,dt); v.aLZ+=this.jn("alz",0.35*amp,dt); v.aRZ+=this.jn("arz",0.35*amp,dt);
    v.eL+=Math.abs(this.jn("el",0.5*amp,dt)); v.eR+=Math.abs(this.jn("er",0.5*amp,dt));
    v.lLX+=this.jn("llx",0.25*amp,dt); v.lRX+=this.jn("lrx",0.25*amp,dt); v.kL+=Math.abs(this.jn("kl",0.35*amp,dt)); v.kR+=Math.abs(this.jn("kr",0.35*amp,dt)); v.jaw+=Math.abs(this.jn("jw",0.12*amp,dt));
    if(this.hurtLimb("armL") && !(this.state==="swipe"&&this.lost.armR)){ v.aLX*=0.25; v.aLZ=0.1; v.eL*=0.2; }
    if(this.hurtLimb("armR") && !(this.state==="swipe"&&!this.lost.armR)){ v.aRX*=0.25; v.aRZ=-0.1; v.eR*=0.2; }
    if(this.hurtLimb("legL")){ v.kL+=0.35; v.lLX*=0.7; } if(this.hurtLimb("legR")){ v.kR+=0.35; v.lRX*=0.7; }
    if(this.jawLost) v.jaw=0;
    if(this.stagger>0){ v.hp-=0.35*Math.min(1,this.stagger*3); v.nX-=0.5*this.flinch; }
    if(this.move) this.moveLayer(v,dt,mv);
    this.animLayer(v,dt,mv);
    P.hips.position.y=v.hy; P.hips.rotation.x=v.hp-this.flinch*0.4; P.hips.rotation.z=v.hr; P.chest.rotation.x=v.cH; P.torso.rotation.x=v.cH*0.5;
    P.neck.rotation.x=v.nX-this.flinch*0.8; P.neck.rotation.z=v.nZ; P.jaw.rotation.x=clamp(v.jaw,0,0.85);
    P.armL.rotation.x=-v.aLX; P.armR.rotation.x=-v.aRX; P.armL.rotation.z=v.aLZ; P.armR.rotation.z=v.aRZ; P.elbowL.rotation.x=-clamp(v.eL,0,2.4); P.elbowR.rotation.x=-clamp(v.eR,0,2.4);
    P.legL.rotation.x=-v.lLX; P.legR.rotation.x=-v.lRX; P.legL.rotation.z=v.lLZ; P.legR.rotation.z=v.lRZ; P.kneeL.rotation.x=v.kL; P.kneeR.rotation.x=v.kR;
    P.ankleR.rotation.x=this.V.stance==="drag"?-0.9:0;
    P.chest.rotation.y=this.twist||0;
  }
  // rags hang toward the ground and trail behind the body as it moves
  updateStrips(dt){
    const st=this.P.strips; if(!st||!st.length) return;
    const vx=(this.pos.x-(this.lastX??this.pos.x))/Math.max(dt,1e-4), vz=(this.pos.z-(this.lastZ??this.pos.z))/Math.max(dt,1e-4); this.lastX=this.pos.x; this.lastZ=this.pos.z;
    const now=performance.now()/1000;
    for(const sp of st){ const par=sp.parent; if(!par||!par.matrixWorld) continue; const e=par.matrixWorld.elements;
      const c0=[e[0],e[1],e[2]], c1=[e[4],e[5],e[6]], c2=[e[8],e[9],e[10]]; const n=c=>{ const l=Math.hypot(c[0],c[1],c[2])||1; return [c[0]/l,c[1]/l,c[2]/l]; };
      const a=n(c0), b=n(c1), c=n(c2); const fl=Math.sin(now*9+sp.userData.ph)*0.12*(0.3+Math.min(1,Math.hypot(vx,vz)/3));
      let d=[-clamp(vx,-6,6)*0.1+fl, -1, -clamp(vz,-6,6)*0.1+fl*0.5]; const dl=Math.hypot(d[0],d[1],d[2]); d=[d[0]/dl,d[1]/dl,d[2]/dl];
      const lx=a[0]*d[0]+a[1]*d[1]+a[2]*d[2], ly=b[0]*d[0]+b[1]*d[1]+b[2]*d[2], lz=c[0]*d[0]+c[1]*d[1]+c[2]*d[2];
      const rx=Math.atan2(-lz,-ly), rz=Math.asin(clamp(lx,-1,1)); const k=Math.min(1,dt*10);
      sp.rotation.x+=(rx-sp.rotation.x)*k; sp.rotation.z+=(rz-sp.rotation.z)*k; }
  }
  pose(dt){
    const P=this.P, L=this.legsLost(), k=this.kind;
    if(k==="runner"){ this.poseRunner(dt); return; }
    if(k==="across" && L===0){ this.poseAcross(dt); return; }
    if(k==="across"){ P.armL.rotation.z=P.armR.rotation.z=P.neck.rotation.z=P.legL.rotation.z=P.legR.rotation.z=0; this.clipW=0; }
    const moving = (this.state==="chase"||this.state==="fetch"||this.state==="charge") && this.type!=="dummy" && !CFG.world.freezeAI && !player.dead && this.stagger<=0;
    const w = moving ? this.t*(k==="brute"?5:11) : 0;
    let hipY=0.95, hipPitch=0, armLX=0, armRX=0, legLX=0, legRX=0, kneeL=0, kneeR=0, neck=0;
    if(k==="across" && L===0){ hipY=0.62; hipPitch=1.0; armLX=1.0+Math.sin(w)*0.6; armRX=1.0-Math.sin(w)*0.6; legLX=0.9-Math.sin(w)*0.5; legRX=0.9+Math.sin(w)*0.5; kneeL=kneeR=0.9; neck=-0.9; }
    else if(L===0){ armLX=Math.sin(w)*0.35; armRX=-Math.sin(w)*0.35; legLX=-Math.sin(w)*0.45; legRX=Math.sin(w)*0.45; kneeL=Math.max(0,Math.sin(w))*0.6; kneeR=Math.max(0,-Math.sin(w))*0.6; }
    else if(L===1){ hipY=0.55; hipPitch=1.05; armLX=1.0+Math.sin(w)*0.5; armRX=1.0-Math.sin(w)*0.5; legLX=legRX=0.6; kneeL=kneeR=1.4; neck=-0.8; }
    else { hipY=0.22; hipPitch=1.45; armLX=1.3+Math.sin(w)*0.6; armRX=1.3-Math.sin(w)*0.6; legLX=legRX=1.2; neck=-1.2;
      if(k==="across" && this.move==="puller" && !this.lost.legL && !this.lost.legR && !this.dead){ const b=this.pullerPose(dt,moving,{}); ({hipY,hipPitch,armLX,armRX,legLX,legRX,kneeL,kneeR,neck}=b); } }
    if(k==="brute" && this.state==="windup"){ const a=Math.min(1,this.t/(this.attackKind==="rake"?CFG.brute.rakeWindup:CFG.brute.windup));
      if(this.attackKind==="haymaker"){ armLX = -0.3-1.2*a; P.torso.rotation.y = 0.7*a; } else { armRX = 0.4+1.6*a; P.torso.rotation.y=-0.4*a; } }
    else if(k==="brute" && this.state==="active"){ const a=Math.min(1,this.t/CFG.brute.swing);
      if(this.attackKind==="haymaker"){ armLX = -1.5+3.1*a; P.torso.rotation.y = 0.7-1.3*a; } else { armRX=2.0-1.8*a; P.torso.rotation.y=-0.4+0.8*a; } }
    else if(k==="brute" && this.state==="recover"){ P.torso.rotation.y *= 0.9; armLX=1.6*(1-Math.min(1,this.t/0.4)); }
    else P.torso.rotation.y *= 0.85;
    if(k==="brute"){ const S=CFG.brute;
      if(this.state==="chargeWind"){ hipPitch=0.55; neck=-0.6; armLX=armRX=0.5; P.hips.rotation.z=Math.sin(this.t*40)*0.05; }
      else if(this.state==="charge"){ hipPitch=0.75; neck=-0.7; armLX=1.2; armRX=-0.4; legLX=-Math.sin(this.t*18)*0.9; legRX=Math.sin(this.t*18)*0.9; }
      else if(this.state==="slamWind"){ const a=Math.min(1,this.t/S.slamWindup); armLX=armRX=2.9*a; hipPitch=-0.25*a; }
      else if(this.state==="slam"){ const a=Math.min(1,this.t/0.1); armLX=armRX=2.9-2.6*a; hipPitch=0.55*a; hipY=0.95-0.25*a; }
      else if(this.state==="recover" && this.t<0){ armLX=armRX=0.3; hipPitch=0.45; hipY=0.8; }
      else if(this.state==="grabWind"){ const a=Math.min(1,this.t/S.grabWindup); armLX=1.5*a; P.torso.rotation.y=-0.35*a; }
      else if(this.state==="grab"){ armLX=1.5+Math.sin(this.t*20)*0.05; armRX=0.7; }
      else if(this.state==="lift"){ const a=Math.min(1,this.t/S.liftTime); armLX=armRX=2.9*a; hipPitch=-0.1*a; } }
    if(k==="across" && this.state==="windup"){ hipY*=0.85; neck=-0.4; P.hips.rotation.z=Math.sin(this.t*60)*0.08; }
    else if(k==="across" && this.state==="lunge"){ armLX=armRX=2.2; legLX=legRX=-0.4; kneeL=kneeR=0.2; }
    else P.hips.rotation.z = (k==="across"&&moving&&Math.random()<0.04) ? (Math.random()-.5)*0.4 : P.hips.rotation.z*0.8;
    if(this.stagger>0){ hipPitch -= 0.35*Math.min(1,this.stagger*3); neck += -0.5*this.flinch; }
    P.hips.position.y = hipY; P.hips.rotation.x = hipPitch - this.flinch*0.4;
    P.neck.rotation.x = neck - this.flinch*0.8;
    P.armL.rotation.x = -armLX; P.armR.rotation.x = -armRX;
    P.legL.rotation.x = -legLX; P.legR.rotation.x = -legRX; P.kneeL.rotation.x = kneeL; P.kneeR.rotation.x = kneeR;
  }
  syncRoot(){ this.root.position.copy(this.pos); this.root.position.y=groundY(this.pos.x,this.pos.z)+(this.rootY||0); this.root.rotation.y = this.yaw; }
  // reach ring overlay
  updateRings(){
    const on = CFG.debug.rings && !this.dead && this.type!=="dummy";
    if(!on){ if(this.ring) this.ring.visible=false; if(this.ring2) this.ring2.visible=false; return; }
    if(!this.ring){ this.ring=ringMesh(); this.ring2=ringMesh(); }
    const S=this.S; const r = this.kind==="brute" ? ((this.lost.armL?S.rakeReach:S.reach)+0.3)*(this.legsLost()?0.8:1) : S.lungeRange;
    this.ring.visible=true; this.ring.position.set(this.pos.x,groundY(this.pos.x,this.pos.z)+0.03,this.pos.z); this.ring.scale.set(r,r,1);
    this.hitFlash=Math.max(0,(this.hitFlash||0)-1/60);
    const col = this.hitFlash>0 ? 0xff2020 : this.state==="windup" ? 0xffc030 : this.state==="lunge"||this.state==="active" ? 0xff6020 : 0x8a8478;
    this.ring.material.color.setHex(col); this.ring.material.opacity = this.hitFlash>0?0.95:0.6;
    if(this.kind==="across"){ this.ring2.visible=true; this.ring2.position.set(this.pos.x,groundY(this.pos.x,this.pos.z)+0.035,this.pos.z); this.ring2.scale.set(S.swipeRange,S.swipeRange,1); this.ring2.material.color.setHex(this.state==="swipe"?(this.hitDone?0xff2020:0xffc030):0x5a5650); }
    else this.ring2.visible=false;
  }
  removeRings(){ if(this.ring){ scene.remove(this.ring); scene.remove(this.ring2); this.ring=this.ring2=null; } }
  hit(mesh, point, dir){
    const wasRecover = this.kind==="across" && this.state==="recover";
    if(this.kind==="across" && this.aware!=="hunting") this.alert("is shot",true);
    const z = mesh.userData.zone, ZC=CFG.zones;
    const mult = ZC[z+"Mult"], kb = ZC[z+"Kb"]; let stag = ZC[z+"Stag"];
    this.lastZone=z; this.lastLimb=mesh.userData.limb||null; if(this.kind==="across") this.hfx={z, limb:this.lastLimb, t:0};
    const dmg = CFG.rev.damage*mult; this.hp -= dmg;
    if(run){ run.hits++; if(z==="head") run.head++; }
    let limbNote = ""; const limb = mesh.userData.limb; let lostNow = false;
    if(limb && !this.lost[limb]){
      this.limbHp[limb] -= CFG.rev.damage;
      limbNote = ` · ${limbName(limb, this)} ${Math.max(0,this.limbHp[limb]).toFixed(1)}/${this.limbMax[limb]}`;
      if(this.limbHp[limb]<=0){ this.loseLimb(limb, mesh.userData.seg, dir); lostNow = true; }
    }
    spray(point, dir); SFX.flesh(point); if(this.kind==="across") this.addWound(mesh, point, z==="head");
    if(this.kind==="across" && z==="head" && !this.jawLost && this.hp>0 && rng()<this.S.jawShot){ this.jawLost=true; this.P.jaw.visible=false; this.addWound(this.P.headMesh, point, true); log(`${this.name}: jaw shot away, it can't bite any more`,"#ffb070"); }
    const col = {head:"#ff8a7a",torso:"#e8c77a",arm:"#8ac8f0",leg:"#9ee08a"}[z];
    if(this.hp>0 && this.variant==="walker") this.woundMul=Math.max(CFG.across.walkerMinSpeed,(this.woundMul||1)*CFG.across.walkerWoundSlow);
    if(this.hp>0 && this.variant==="crawler") this.crawlerHurt(dir);
    if(this.hp>0 && this.variant==="mourner") this.mournerHurt();
    if(this.hp>0 && this.move) this.moveDegrade(dir);
    if(this.hp<=0){ this.die(dir); log(`${this.name} · ${z.toUpperCase()} · ${dmg.toFixed(1)} dmg · <b>DOWN</b>`, "#ff6a5a"); return true; }
    const swinging = this.kind==="brute" && this.inSwing(); const breaks = z==="head" || z==="leg" || lostNow;
    let stagNote;
    const S2=this.S; let fallP=0; this.disguised=false;
    if(this.kind==="across" && this.legsLost()===0 && !lostNow && this.gait){ fallP = z==="leg"?S2.legShotFall : z==="torso"?S2.torsoFall*(this.gait.mode==="burst"||this.state==="lunge"?1.6:1) : z==="head"?S2.headFall : 0; if(this.gait.mode==="fallen" && this.state==="chase") fallP=1; }
    if(this.variant==="matron") fallP*=CFG.across.matronKnock;
    if(fallP>0 && rng()<fallP){ stagNote = this.knockDown(dir, "shot"); this.flinch=1; }
    else if(swinging && !breaks){ stagNote = "no flinch (mid-swing)"; this.flinch = 0.6; }
    else if(this.kind==="runner" && this.rSuper){ stagNote="shrugs it off mid-charge"; this.flinch=0.6; }
    else { this.stagger = stag*(wasRecover?CFG.across.punish:1)*(this.variant==="matron"?CFG.across.matronStagger:1)*(this.variant==="mourner"?CFG.across["mournerStagger"+mStage(this.mstage)]:1)*(this.kind==="runner"?CFG.runner.stagger:1); if(wasRecover) stag=this.stagger; this.state="stagger"; this.t=0; this.flinch=1; this.door=null; this.push(new THREE.Vector3(dir.x,0,dir.z).normalize(), kb*CFG.phys.bulletPush); stagNote = `stagger ${stag.toFixed(2)}s${wasRecover?" (caught recovering)":""}`; }
    log(`${this.name} · ${z.toUpperCase()}${mesh.userData.seg?" ("+mesh.userData.seg+")":""} · ${dmg.toFixed(1)} dmg · ${stagNote} · body ${Math.max(0,this.hp).toFixed(1)}/${this.maxHp}${limbNote}${lostNow?" · <b>LIMB OFF</b>":""}`, col);
    return false;
  }
  loseLimb(limb, seg, dir){
    this.lost[limb] = true; if(run) run.limbs++;
    const P=this.P; let cut;
    if(limb==="armL"||limb==="armR") cut = limb==="armL"?P.armL:P.armR;
    else cut = seg==="lower" ? (limb==="legL"?P.kneeL:P.kneeR) : (limb==="legL"?P.legL:P.legR);
    const parent = cut.parent;
    const stump = new THREE.Mesh(new THREE.BoxGeometry(0.13,0.07,0.13), M(0x4a0c0a)); stump.position.copy(cut.position); stump.position.y -= 0.03; parent.add(stump);
    const piece = new THREE.Group(); scene.add(piece); piece.attach(cut);
    if(this.skin){ (this.lostSeg=this.lostSeg||{})[limb]=seg; const mp=mdlCollapse(this.skin, limb, seg); if(mp){ this.root.add(mp); mp.updateMatrixWorld(true); piece.attach(mp); } }
    cut.traverse(o=>{ if(o.isMesh){ if(o.userData.hitbox) o.visible=false; o.userData = {}; } });
    debris.push({o:piece, cut, v:new THREE.Vector3(dir.x*2.5+(Math.random()-.5), 1.5, dir.z*2.5+(Math.random()-.5)), spin:new THREE.Vector3(Math.random()*6-3,Math.random()*6-3,Math.random()*6-3), rest:false});
    bloodPool(this.pos.x, this.pos.z, 0.5); SFX.limb(this.pos);
    const what = {armL: this.kind==="brute"?"big arm":"left arm", armR:"right arm", legL:"left leg", legR:"right leg"}[limb];
    if(limb==="armL" && this.kind==="brute") log(`${this.name}: big arm gone, no more haymakers, rake only`, "#ffb070");
    else if(limb.startsWith("arm")) log(`${this.name}: ${what} off at the shoulder${this.kind==="across"?(this.armsLeft()===0?", it can only lunge and bite":", it swipes with the other"):""}`, "#ffb070");
    if(limb.startsWith("leg")){ const l=this.legsLost(); log(`${this.name}: ${what} off at the ${seg==="lower"?"knee":"hip"} → ${l===1?"drags on its knuckles":"crawls"}`, "#ffb070"); }
    if(this.inSwing() || this.state==="lunge") this.state="chase";
  }
  die(dir){
    this.dead = true; this.deadT = 0; if(this.carry) this.dropCarry();
    if(this.kind==="across"||this.kind==="runner"){ this.vel.addScaledVector(new THREE.Vector3(dir.x,0,dir.z).normalize(), 1.4); this.startRagdoll(dir); }
    else { this.kb.set(dir.x,0,dir.z).normalize().multiplyScalar(0.8); this.pos.add(this.kb); collide(this.pos,this.radius); }
    bloodPool(this.pos.x+dir.x*0.6, this.pos.z+dir.z*0.6, this.kind==="brute"?1.4:0.9);
    killSlowmo = CFG.rev.killSlowmo; hitstop = CFG.rev.hitstop*2.5;
    this.root.traverse(o=>{ if(o.isMesh) o.userData.enemy = null; });
    if(run){ run.kills++; if(!run.over && clearWins() && enemies.every(e=>e.dead||e.type==="dummy") && enemies.some(e=>e.type!=="dummy")) setTimeout(()=>{ if(enemies.every(e=>e.dead||e.type==="dummy")) endRun("WON"); }, 900); }
  }
  // ---------------- ragdoll-style deaths: the body tips over on its momentum, stops against walls,
  // drapes over furniture, and its arms and head go limp toward the ground
  startRagdoll(dir){
    const d=new THREE.Vector3(dir.x,0,dir.z); if(d.lengthSq()<1e-4) d.set(-Math.sin(this.yaw),0,-Math.cos(this.yaw)); d.normalize();
    const v=this.vel.clone(); v.y=0; const c=d.clone().addScaledVector(v,0.25); if(c.lengthSq()>1e-4) c.normalize();
    const low = this.stance==="crawling" || this.legsLost()>0 || (this.gait&&this.gait.mode==="fallen");
    const L=(this.height||1.75)*0.92/this.scale;
    const hz=this.lastZone, hl=this.lastLimb; this.deathSpin=0;
    if(!low && hz==="leg" && hl){ const sx=hl==="legL"?1:-1; c.addScaledVector(new THREE.Vector3(Math.cos(this.yaw)*sx,0,-Math.sin(this.yaw)*sx),0.9).normalize(); }
    if(!low && hz==="arm" && hl) this.deathSpin=(hl==="armL"?-1:1)*2.2;
    this.rag={dir:c, th:low?Math.PI/2:0.08, om:low?0:hz==="head"?0.1:hz==="torso"?1.5+Math.min(2,v.length()*0.4):1.0+Math.min(2,v.length()*0.4), L:L*this.scale, limit:Math.PI/2, low, lean:null, kind:hz, crumple:(!low&&hz==="head")?0.32:0};
    if(!low) this.rag.limit=this.fallLimit(c, L*this.scale);
    this.root.rotation.order="YXZ";
  }
  fallLimit(d, L){
    let lim=Math.PI/2;
    for(let s=0.15; s<=L; s+=0.08){ const qx=this.pos.x+d.x*s, qz=this.pos.z+d.z*s; let wall=false;
      for(const sg of world.segs){ if(sg.glass) continue; if(segsCross(this.pos.x,this.pos.z,qx,qz,sg.ax,sg.az,sg.bx,sg.bz)){ wall=true; break; } }
      if(!wall) for(const dd of world.doors){ if(dd.broken) continue; const sg=doorSeg(dd); if(segsCross(this.pos.x,this.pos.z,qx,qz,sg.ax,sg.az,sg.bx,sg.bz)){ wall=true; break; } }
      if(!wall) for(const c of world.circles) if(Math.hypot(qx-c.x,qz-c.z)<c.r) wall=true;
      if(wall){ lim=Math.min(lim,Math.asin(clamp((s-0.12)/L,0.15,1))); this.rag.lean="wall"; break; }
      let hitBox=false; for(const b of world.boxes){ if(qx>b.x0&&qx<b.x1&&qz>b.z0&&qz<b.z1){ const a=Math.atan2(s,b.h); if(a<lim){ lim=a; this.rag.lean="box"; } hitBox=true; } }
      if(hitBox) break; }
    return lim;
  }
  ragSlide(dt){ this.vel.multiplyScalar(Math.max(0,1-dt*4)); this.pos.x+=this.vel.x*dt; this.pos.z+=this.vel.z*dt; collide(this.pos,this.radius*0.8,null,true); }
  ragdollStep(dt){
    const R=this.rag; this.ragSlide(dt); if(R.crumple && this.deadT<R.crumple){ R.om=0.05; R.th=0.08; } if(this.deathSpin){ this.yaw+=this.deathSpin*dt*Math.exp(-this.deadT*4); }
    if(R.th<R.limit || R.om<0){ R.om+=9.8/R.L*Math.sin(Math.max(0.05,R.th))*1.3*dt; R.th+=R.om*dt;
      if(R.th>=R.limit){ R.th=R.limit; if(R.om>1.2 && !R.bounced){ R.om=-R.om*0.22; R.bounced=true; SFX.stomp(this.pos); } else { R.om=0; if(!R.landed){ R.landed=true; SFX.stomp(this.pos); bloodPool(this.pos.x+R.dir.x*R.L*0.6,this.pos.z+R.dir.z*R.L*0.6,0.7); } } } }
    const lz=R.dir.x*Math.sin(this.yaw)+R.dir.z*Math.cos(this.yaw), lx=R.dir.x*Math.cos(this.yaw)-R.dir.z*Math.sin(this.yaw);
    this.root.position.set(this.pos.x, 0.11*Math.sin(R.th)+groundY(this.pos.x,this.pos.z), this.pos.z); this.root.rotation.set(R.th*lz, this.yaw, -R.th*lx);
    // limbs go limp
    const P=this.P, k=Math.min(1,dt*6), sg=lz>=0?1:-1, settled=R.landed;
    const amp=(settled?2.0:0.6)*Math.exp(-this.deadT*1.0)+(this.deadT<5&&Math.random()<0.004?1.2:0);
    const drape = R.lean==="box" && settled ? Math.min(1.4, Math.PI/2-R.th+0.35) : 0;
    P.hips.position.y+=(this.hipY*(R.kind==="head"?0.55:1)-P.hips.position.y)*k; P.hips.rotation.x*=1-k; P.hips.rotation.z*=1-k;
    P.chest.rotation.x+=(drape*0.65*sg-P.chest.rotation.x)*k; P.torso.rotation.x+=(drape*0.45*sg-P.torso.rotation.x)*k;
    for(const pv of [P.armL,P.armR]) hangLimp(pv,k*0.8,1.0);
    P.elbowL.rotation.x+=(-0.3-P.elbowL.rotation.x)*k+this.jn("del",0.5*amp,dt)*0.2; P.elbowR.rotation.x+=(-0.25-P.elbowR.rotation.x)*k+this.jn("der",0.5*amp,dt)*0.2;
    P.legL.rotation.x+=(0.05+this.jn("dll",0.4*amp,dt)-P.legL.rotation.x)*k; P.legR.rotation.x+=(-0.08+this.jn("dlr",0.4*amp,dt)-P.legR.rotation.x)*k; P.legL.rotation.z*=1-k; P.legR.rotation.z*=1-k;
    P.kneeL.rotation.x+=((R.kind==="head"?1.4:0.15)+Math.abs(this.jn("dkl",0.7*amp,dt))-P.kneeL.rotation.x)*k; P.kneeR.rotation.x+=((R.kind==="head"?1.5:0.3)+Math.abs(this.jn("dkr",0.7*amp,dt))-P.kneeR.rotation.x)*k;
    P.neck.rotation.x+=((drape?0.9:0.45)*sg+this.jn("dnx",0.4*amp,dt)-P.neck.rotation.x)*k; P.neck.rotation.z+=(0.4-P.neck.rotation.z)*k*0.5;
    if(!this.jawLost) P.jaw.rotation.x+=(0.35-P.jaw.rotation.x)*k;
    if(R.crumple && this.deadT<R.crumple+0.15){ const f=Math.min(1,this.deadT/R.crumple); P.hips.position.y=this.hipY*(1-0.45*f); P.kneeL.rotation.x=P.kneeR.rotation.x=1.5*f; P.legL.rotation.x=P.legR.rotation.x=-0.75*f; P.neck.rotation.x=-0.9*Math.min(1,this.deadT*8); P.chest.rotation.x=-0.25*f; }
  }
  // ---------------- wounds that stay on the body, and limbs that hang when hurt
  addWound(mesh, point, big){
    const par=mesh.parent; if(!par||!par.worldToLocal) return; this.wounds=(this.wounds||0)+1; if(this.wounds>16) return;
    if(par.updateWorldMatrix) par.updateWorldMatrix(true,false);
    const lp=par.worldToLocal(point.clone()); lp.x*=0.75; lp.z*=0.75; const sz=big?0.08:0.045;
    const w=new THREE.Mesh(new THREE.BoxGeometry(sz,sz,sz),new THREE.MeshBasicMaterial({color:0x2a0303})); w.position.copy(lp); par.add(w);
    const drip=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.08,0.02),new THREE.MeshBasicMaterial({color:0x4a0606})); drip.position.copy(lp); drip.position.y-=0.05; par.add(drip);
  }
  armsLeft(){ return 2-(this.lost.armL?1:0)-(this.lost.armR?1:0); }
  hurtLimb(l){ return !this.lost[l] && this.limbHp[l]<this.limbMax[l]; }
  remove(){ if(this.runnerRemoveFx) this.runnerRemoveFx(); scene.remove(this.root); this.removeRings(); if(this.tag) this.tag.remove(); }
}
function hangLimp(pv, k, lim){ const par=pv.parent; if(!par||!par.matrixWorld) return; const e=par.matrixWorld.elements;
  const n=(a,b,c)=>{ const l=Math.hypot(a,b,c)||1; return [a/l,b/l,c/l]; }; const A=n(e[0],e[1],e[2]), B=n(e[4],e[5],e[6]), C=n(e[8],e[9],e[10]);
  const lx=-A[1], ly=-B[1], lz=-C[1]; const rx=clamp(Math.atan2(-lz,-ly),-2.6,2.6), rz=clamp(Math.asin(clamp(lx,-1,1)),-1.4,1.4);
  pv.rotation.x+=(rx-pv.rotation.x)*k; pv.rotation.z+=(rz-pv.rotation.z)*k; }
function acrossAttackers(except){ let n=0; for(const e of enemies) if(e!==except && !e.dead && e.kind==="across" && ["windup","lunge","swipe","grab","bite","mshove","mscream"].includes(e.state)) n++; return n; }
const smokes=[];
function ringMesh(){ const m=new THREE.Mesh(new THREE.RingGeometry(0.95,1,40), new THREE.MeshBasicMaterial({color:0x8a8478,transparent:true,opacity:0.6,depthWrite:false,side:THREE.DoubleSide})); m.rotation.x=-Math.PI/2; scene.add(m); return m; }
function limbName(l,e){ return {armL:e.kind==="brute"?"big arm":"L arm", armR:"R arm", legL:"L leg", legR:"R leg"}[l]; }

// ---------------------------------------------------------------- doors
function hitDoor(d, amount, by){
  if(d.broken) return; d.hp -= amount; d.shake = 1;
  const s=doorSeg(d); const p=new THREE.Vector3((s.ax+s.bx)/2,1.2,(s.az+s.bz)/2);
  if(amount>=1) SFX.doorHit(p);
  if(d.hp<=0){ d.broken=true; d.pivot.visible=false; const i=world.blockers.indexOf(d.leaf); if(i>=0) world.blockers.splice(i,1); SFX.doorBreak(p); spray(p, new THREE.Vector3(0,0,0), 0x6a4a30); log(`${by.name} smashes the door`, "#ffb070"); }
  else if(amount>=1) log(`${by.name} hits the door (${Math.max(0,d.hp).toFixed(2)} left)`, "#c0a080");
}
function updateDoors(dt){
  for(const d of world.doors){ if(d.broken) continue;
    if(Math.abs(d.ang-d.target)>0.001){
      const prev=d.ang; const step=d.speed*dt; d.ang += clamp(d.target-d.ang,-step,step);
      // don't close through someone
      const s=doorSeg(d); const bodies=[{p:player.pos,r:0.3}, ...enemies.filter(e=>!e.dead).map(e=>({p:e.pos,r:e.radius}))];
      for(const b of bodies){ const q=b.p.clone(); if(pushSeg(q,b.r,s)){ d.ang=prev; d.target=prev; break; } }
      if(d.target===0 && d.ang===0 && prev>0){ if(d.speed>5) SFX.slam(new THREE.Vector3(d.hx,1,d.hz)); }
    }
    d.shake=Math.max(0,d.shake-dt*4); applyDoor(d);
  }
}

// ================================================================ player
const player = {
  pos:new THREE.Vector3(0,0,8), vel:new THREE.Vector3(), yaw:Math.PI, hp:CFG.norah.hp, dead:false,
  rounds:CFG.rev.chambers, spare:CFG.rev.spare, hammer:0, reloading:0, reloadAdd:0, cockPending:false,
  aiming:false, aimT:0, aimHeight:0, aimTarget:null, dodge:0, dodgeDir:new THREE.Vector3(), stumble:0, shoveCd:0, shoveT:0, recoil:0, pushT:0,
  root:null, P:null, dodgeLog:null,
  grabbed:null,
  grab(by, o={}){
    if(this.dead) return false; if(this.grabbed) return joinGrab(by,o); const N=CFG.norah, S=CFG.across;
    if(this.dodge>0 && this.dodge > N.dodgeTime*(1-N.dodgeIframes)){ log(`Rolled out of ${by.name}'s grab`, "#bfe0ff"); if(run) run.saves++; return false; }
    if(this.vault){ this.vault=null; this.posY=0; collide(this.pos,0.3); }
    this.search=null; this.grabbed={by, dmg:o.dmg||S.grabDamage, how:o.how||"ankle grab"}; this.aiming=false; this.reloading=0; this.reloadAdd=0;
    startQte(this.grabbed, o.how==="bear hug");
    if(run) run.grabs++; this.bite(by, "grab", this.grabbed.dmg); if(this.dead) return true;
    log(`${by.name} ${o.how==="bear hug"?"has her in a bear hug":o.how==="clings"?"clings to her, wailing":o.how==="Louis's grip"?"has her by the collar":"has her ankle"}: ${o.how==="bear hug"&&CFG.across.hugMash?"mash to break it":"hit the prompts to push it off"}`, "#ff7070"); return true;
  },
  dazed:0,
  bite(by, how, dmgOverride){ const N=CFG.norah, d=dmgOverride||CFG.across.grabDamage; if(!N.god) this.hp-=d; if(run){ run.dmgTaken+=N.god?0:d; run.hitsTaken++; } flashRed(); SFX.hurt(); shake=Math.max(shake,0.3);
    if(how!=="grab") log(`${by.name} bites: −${d}`,"#ff7070");
    if(this.hp<=0){ this.hp=0; this.grabbed=null; this.dead=true; document.getElementById("dead").style.display="flex"; try{ document.exitPointerLock(); }catch(e){} endRun("DIED"); } },
  hurt(dmg, from, how){
    if(this.dead) return;
    const N=CFG.norah;
    if(this.dodge>0 && this.dodge > N.dodgeTime*(1-N.dodgeIframes)){ log(`Dodged ${from.name}'s ${how}`, "#bfe0ff"); if(run) run.saves++; if(this.dodgeLog) this.dodgeLog.ticks.push({at:1-this.dodge/N.dodgeTime, ok:true}); return; }
    if(this.dodge>0 && this.dodgeLog) this.dodgeLog.ticks.push({at:1-this.dodge/N.dodgeTime, ok:false});
    if(!N.god) this.hp -= dmg;
    if(run){ run.dmgTaken += N.god?0:dmg; run.hitsTaken++; }
    this.stumble = N.stumble; this.search=null; this.aiming=false; this.reloading=0; this.reloadAdd=0;
    const d = new THREE.Vector3(this.pos.x-from.pos.x,0,this.pos.z-from.pos.z).normalize();
    const J = how==="haymaker"?CFG.phys.haymakerPush : how==="lunge"?CFG.phys.lungePush : how==="rake"?CFG.phys.haymakerPush*0.45 : CFG.phys.swipePush;
    this.vel.addScaledVector(d, J/CFG.phys.norahMass);
    flashRed(); shake = Math.max(shake, how==="haymaker"?0.6:0.3); SFX.hurt();
    log(`Norah hit by ${from.name}'s ${how}: −${dmg}${N.god?" (god mode)":""}`, "#ff7070");
    if(this.hp<=0){ this.hp=0; this.dead=true; document.getElementById("dead").style.display="flex"; try{ document.exitPointerLock(); }catch(e){} endRun("DIED"); }
  }
};
player.root = buildBody("norah", null); player.P = player.root.userData.parts;

// ================================================================ input
const keys = {}; let mouseAim=false;
let camYaw = Math.PI, camPitch = -0.08;
const pad = {move:{x:0,y:0}, look:{x:0,y:0}, aim:false, run:false, prev:[], connected:false};
const touch = {move:{x:0,y:0}, aim:false, run:false, stickId:null, lookId:null, lx:0, ly:0, ox:0, oy:0};
function onKey(e){
  if(MODE!=="play") return;
  if(SB.simMenu){ if((e.code==="Escape"||e.code==="KeyP")&&!e.repeat) closeSimMenu(); e.preventDefault(); return; }
  if(e.target.tagName==="INPUT"||e.target.tagName==="SELECT"||e.target.tagName==="TEXTAREA") return;
  if(invOpen()){ if(["KeyI","Tab","Escape"].includes(e.code)&&!e.repeat){ closeInv(); } e.preventDefault(); return; }
  audio();
  const rep = e.repeat; keys[e.code]=true;
  if(rep && !["KeyW","KeyA","KeyS","KeyD","Period"].includes(e.code)) return;
  if(replay.on){ if(e.code==="KeyY") exitReplay(); if(e.code==="Space"){ replay.playing=!replay.playing; e.preventDefault(); } return; }
  if((e.code==="KeyI"||e.code==="Tab") && !rep && !player.grabbed){ e.preventDefault(); openInv(); return; }
  
  if(e.code==="KeyL" && !rep && !player.grabbed){ toggleFlash(); }
  if(e.code==="Space" && !player.grabbed && !rep){ e.preventDefault(); tryVault(keys.ShiftLeft||keys.ShiftRight); return; }
  if(player.grabbed && ["KeyE","KeyQ","Space","KeyR","KeyF","KeyV","KeyW","KeyA","KeyS","KeyD"].includes(e.code) && !rep){ if(["KeyE","KeyQ","Space"].includes(e.code)) qtePress(e.code); e.preventDefault(); return; }
  if(e.code==="KeyF") fire();
  if(e.code==="KeyR") startReload();
  if(e.code==="KeyV") shove();
  if(e.code==="KeyE") use();
  if(e.code==="KeyN") loadScenario(scenarioKey);
  if((e.code==="KeyQ"||e.code==="KeyX") && !player.dead && !player.grabbed && !player.vault){ player.crouch=!player.crouch; log(player.crouch?"Crouching (Q to stand)":"Standing","#9ab0c8"); }
  if(e.code==="Digit1") spawn("across");
  if(e.code==="Digit2") spawn("brute");
  if(e.code==="Digit3") spawn("dummy");
  if(e.code==="Digit4") spawn("across_stand");
  if(e.code==="Digit5") spawn("across_crawl");
  if(e.code==="Digit0") clearAll();
  if(e.code==="KeyH"){ CFG.world.showZones=!CFG.world.showZones; setZoneView(CFG.world.showZones); refreshPanel(); }
  if(e.code==="KeyT"){ CFG.world.timeScale = CFG.world.timeScale<1?1:0.25; refreshPanel(); }
  if(e.code==="KeyG"){ const on=!(CFG.debug.rings&&CFG.debug.cone); CFG.debug.rings=CFG.debug.cone=CFG.debug.attackLog=on; refreshPanel(); log(`Overlays ${on?"on":"off"}`,"#9a9283"); }
  if(e.code==="KeyP"||e.code==="Escape") openSimMenu();
  if(e.code==="Period" && paused) stepFrames++;
  if(e.code==="KeyY") enterReplay();
  if(e.code==="Backquote") togglePanel();
  if(e.code==="Enter" && player.dead) respawn();
  if(e.code==="ShiftLeft"||e.code==="ShiftRight") { if(isAiming()) tryDodge(); }
  if(player.aiming && isFixed()){ if(e.code==="ArrowUp") player.aimHeight=1; if(e.code==="ArrowDown") player.aimHeight=-1; }
  if(["Space","ArrowUp","ArrowDown","Tab"].includes(e.code)) e.preventDefault();
}
addEventListener("keydown", onKey);
addEventListener("keyup", e=>{ keys[e.code]=false; if(player.aiming && isFixed() && (e.code==="ArrowUp"||e.code==="ArrowDown")) player.aimHeight=0; });
canvas.addEventListener("contextmenu", e=>e.preventDefault());
let dragLook=null;
canvas.addEventListener("mousedown", e=>{
  if(MODE!=="play"||invOpen()||SB.simMenu) return;
  audio();
  if(replay.on){ dragLook={x:e.clientX,y:e.clientY}; return; }
  if(document.pointerLockElement!==canvas){ try{ const p=canvas.requestPointerLock(); if(p&&p.catch) p.catch(()=>{}); }catch(err){} }
  if(e.button===2) mouseAim=true;
  if(e.button===0) fire();
  if(e.button===1){ e.preventDefault(); shove(); }
});
addEventListener("mouseup", e=>{ if(e.button===2) mouseAim=false; dragLook=null; });
addEventListener("mousemove", e=>{
  if(replay.on && dragLook){ replay.yaw -= (e.clientX-dragLook.x)*0.005; replay.pitch=clamp(replay.pitch-(e.clientY-dragLook.y)*0.005,-1.5,1.5); dragLook={x:e.clientX,y:e.clientY}; return; }
  if(document.pointerLockElement!==canvas) return;
  const s = 0.0025*CFG.ctrl.mouseSens*(player.aiming&&SB.aimOver?CFG.rev.aimFriction:1); const dy = (CFG.ctrl.invertY?-1:1)*e.movementY;
  if(replay.on){ replay.yaw -= e.movementX*s; replay.pitch=clamp(replay.pitch-dy*s,-1.5,1.5); return; }
  if(isFixed()){ player.yaw -= e.movementX*s; }
  else { camYaw -= e.movementX*s; camPitch = clamp(camPitch - dy*s, -0.9, 0.7); }
});
function isFixed(){ return CFG.ctrl.cam!=="ots"; }
function isAiming(){ return (mouseAim || keys.KeyC || pad.aim || touch.aim) && !player.dead && player.stumble<=0 && player.dodge<=0; }
function isRunning(){ return keys.ShiftLeft||keys.ShiftRight||pad.run||touch.run; }
function rawMove(){ // x = strafe right, y = forward
  let x=0,y=0; if(keys.KeyW) y+=1; if(keys.KeyS) y-=1; if(keys.KeyD) x+=1; if(keys.KeyA) x-=1;
  x+=pad.move.x+touch.move.x; y+=pad.move.y+touch.move.y; const l=Math.hypot(x,y); if(l>1){ x/=l; y/=l; } return {x,y};
}
function relMove(yaw){ const m=rawMove(); return new THREE.Vector3(Math.sin(yaw)*m.y - Math.cos(yaw)*m.x, 0, Math.cos(yaw)*m.y + Math.sin(yaw)*m.x); }

// gamepad
function pollPad(){
  let gp=null; try{ const all=navigator.getGamepads?navigator.getGamepads():[]; for(const g of all) if(g){ gp=g; break; } }catch(e){}
  if(!gp){ pad.connected=false; pad.move={x:0,y:0}; pad.look={x:0,y:0}; pad.aim=false; pad.run=false; return; }
  if(!pad.connected){ pad.connected=true; log("Controller connected","#9a9283"); }
  const dz=v=>Math.abs(v)<0.18?0:v; const ax=gp.axes;
  pad.move={x:dz(ax[0]||0), y:-dz(ax[1]||0)}; pad.look={x:dz(ax[2]||0), y:dz(ax[3]||0)};
  const b=i=>gp.buttons[i]&&(gp.buttons[i].pressed||gp.buttons[i].value>0.3);
  const edge=i=>b(i)&&!pad.prev[i];
  pad.aim=b(6); pad.run=b(1)&&!pad.aim;
  if(replay.on){ if(edge(8)||edge(1)) exitReplay(); if(edge(0)) replay.playing=!replay.playing; }
  else if(player.grabbed){ for(const i of [0,2,3]) if(edge(i)) qtePress("pad"+i); }
  else {
    if(edge(7)) fire(); if(edge(2)) startReload(); if(edge(3)) shove(); if(edge(0)){ if(player.dead) respawn(); else use(); }
    if(edge(1)&&isAiming()) tryDodge(); if(edge(9)) openSimMenu(); if(edge(8)) enterReplay();
    if(edge(4)) tryVault(b(1));
    if(edge(10) && !player.grabbed) player.crouch=!player.crouch;
    if(edge(12)) loadScenario(scenarioKey); if(edge(13)&&paused) stepFrames++; if(edge(14)) spawn("across"); if(edge(15)) spawn("brute");
    if(player.aiming&&isFixed()) player.aimHeight = pad.look.y<-0.5?1:pad.look.y>0.5?-1:(keys.ArrowUp||keys.ArrowDown?player.aimHeight:0);
  }
  pad.prev = gp.buttons.map((_,i)=>b(i));
}

// touch
document.getElementById("grabmsg").addEventListener("pointerdown",e=>{ e.preventDefault(); qtePress("touch"); });
const touchEl=document.getElementById("touch"), stickBase=document.getElementById("stickbase"), stickKnob=document.getElementById("stickknob");
function showTouch(on){ touchEl.style.display=on&&MODE==="play"?"block":"none"; }
addEventListener("touchstart", ()=>{ if(!CFG.ctrl.touch){ CFG.ctrl.touch=true; saveCfg(); showTouch(true); refreshPanel(); } }, {passive:true, once:true});
canvas.addEventListener("touchstart", e=>{ if(MODE!=="play") return; audio(); e.preventDefault();
  for(const t of e.changedTouches){
    if(replay.on){ touch.lookId=t.identifier; touch.lx=t.clientX; touch.ly=t.clientY; continue; }
    if(t.clientX<innerWidth*0.45 && touch.stickId===null){ touch.stickId=t.identifier; touch.ox=t.clientX; touch.oy=t.clientY;
      stickBase.style.display=stickKnob.style.display="block"; stickBase.style.left=(t.clientX-55)+"px"; stickBase.style.top=(t.clientY-55)+"px"; stickKnob.style.left=(t.clientX-22)+"px"; stickKnob.style.top=(t.clientY-22)+"px"; }
    else if(touch.lookId===null){ touch.lookId=t.identifier; touch.lx=t.clientX; touch.ly=t.clientY; }
  } }, {passive:false});
canvas.addEventListener("touchmove", e=>{ if(MODE!=="play") return; e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier===touch.stickId){ let dx=t.clientX-touch.ox, dy=t.clientY-touch.oy; const l=Math.hypot(dx,dy), mx=50; if(l>mx){ dx*=mx/l; dy*=mx/l; }
      touch.move={x:dx/mx, y:-dy/mx}; stickKnob.style.left=(touch.ox+dx-22)+"px"; stickKnob.style.top=(touch.oy+dy-22)+"px"; }
    if(t.identifier===touch.lookId){ const dx=t.clientX-touch.lx, dy=t.clientY-touch.ly; touch.lx=t.clientX; touch.ly=t.clientY; const s=0.006*CFG.ctrl.mouseSens;
      if(replay.on){ replay.yaw-=dx*s; replay.pitch=clamp(replay.pitch-dy*s,-1.5,1.5); }
      else if(isFixed()) player.yaw-=dx*s; else { camYaw-=dx*s; camPitch=clamp(camPitch-dy*s,-0.9,0.7); } }
  } }, {passive:false});
const endTouch=e=>{ for(const t of e.changedTouches){ if(t.identifier===touch.stickId){ touch.stickId=null; touch.move={x:0,y:0}; stickBase.style.display=stickKnob.style.display="none"; } if(t.identifier===touch.lookId) touch.lookId=null; } };
canvas.addEventListener("touchend", endTouch); canvas.addEventListener("touchcancel", endTouch);
for(const b of document.querySelectorAll("#touch .tb")){
  b.addEventListener("touchstart", e=>{ e.preventDefault(); audio(); const t=b.dataset.t;
    if(t==="aim"){ touch.aim=!touch.aim; b.classList.toggle("on",touch.aim); }
    else if(t==="run"){ touch.run=!touch.run; b.classList.toggle("on",touch.run); }
    else if(t==="vault") tryVault(touch.run);
    else if(t==="crouch"){ player.crouch=!player.crouch; b.classList.toggle("on",player.crouch); }
    else if(t==="bag") openInv(); else if(t==="light") toggleFlash();
    else if(t==="fire") fire(); else if(t==="reload") startReload(); else if(t==="shove") shove(); else if(t==="dodge") tryDodge(true); else if(t==="use"){ if(player.dead) respawn(); else use(); }
  }, {passive:false});
}

// ================================================================ actions
const ray = new THREE.Raycaster();
function enemyMeshes(){ const t=[]; for(const e of enemies) if(!e.dead) e.root.traverse(o=>{ if(o.isMesh && o.userData.enemy) t.push(o); }); return t; }
function fire(){
  if(!player.aiming || player.dead || paused) return;
  if(player.hammer>0 || player.reloading>0) return;
  if(player.rounds<=0){ log("*click* empty. R to reload","#9a9283"); SFX.empty(); player.hammer=0.3; return; }
  if(!CFG.rev.infinite) player.rounds--;
  if(run) run.shots++;
  makeNoise(player.pos.x,player.pos.z,CFG.stealth.gunNoise,"gunshot",true);
  player.hammer = CFG.rev.hammer; player.cockPending=true; player.recoil = 1; shake = Math.max(shake, CFG.rev.shake);
  SFX.shot();
  if(CFG.phys.on){ const fw=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)); player.vel.addScaledVector(fw,-CFG.phys.recoilPush); }
  const hp = new THREE.Vector3(); player.P.gun.getWorldPosition(hp); muzzle.position.copy(hp); muzzle.intensity = 4;
  const targets = world.blockers.concat(enemyMeshes());
  let skip=0;
  if(isFixed()){
    const origin = new THREE.Vector3(player.pos.x,1.4+groundY(player.pos.x,player.pos.z),player.pos.z); let dir;
    const tg = player.aimTarget && !player.aimTarget.dead ? player.aimTarget : null;
    if(tg){ const P=tg.P; const m = player.aimHeight>0 ? P.headMesh : player.aimHeight<0 ? (tg.lost.legL?(tg.lost.legR?P.torsoMesh:P.legRLo):P.legLLo) : P.torsoMesh;
      const tp=new THREE.Vector3(); (m.parent?m:P.torsoMesh).getWorldPosition(tp); dir=tp.sub(origin).normalize(); }
    else dir=new THREE.Vector3(Math.sin(player.yaw), -0.05*player.aimHeight*0+(player.aimHeight*0.15), Math.cos(player.yaw)).normalize();
    ray.set(origin, dir);
  } else {
    ray.setFromCamera({x:0,y:0}, camera);
    skip = camera.position.distanceTo(new THREE.Vector3(player.pos.x,1.5,player.pos.z))*0.6;
  }
  ray.far = 60;
  const hits = ray.intersectObjects(targets, false); const h = hits.find(x=>x.distance>skip);
  if(!h){ log("Miss","#7d7668"); return; }
  if(h.object.userData.enemy){ h.object.userData.enemy.hit(h.object, h.point, ray.ray.direction); hitstop = Math.max(hitstop, CFG.rev.hitstop); }
  else { log("Hit cover","#7d7668"); SFX.cover(h.point); spray(h.point, ray.ray.direction.clone().negate(), 0x8a7a60); }
}
function startReload(){
  if(player.dead||player.reloading>0||paused) return;
  const need = CFG.rev.chambers - player.rounds; const n = CFG.rev.infinite? need : Math.min(need, player.spare);
  if(n<=0) return;
  player.reloadAdd = n; player.reloadTotal = player.reloading = CFG.rev.reloadBase + CFG.rev.reloadPerRound*n; player.reloadClicks=0;
  SFX.cylinder(); makeNoise(player.pos.x,player.pos.z,CFG.stealth.reloadNoise,"reload");
  log(`Reloading ${n} (${player.reloading.toFixed(2)}s)`, "#9a9283");
}
function shove(){
  if(mash()) return;
  if(player.dead||player.shoveCd>0||player.dodge>0||player.stumble>0||paused) return;
  player.shoveCd = CFG.norah.shoveCooldown; player.shoveT = 0.3; if(run) run.shoves++; SFX.shove(); makeNoise(player.pos.x,player.pos.z,CFG.stealth.shoveNoise,"shove");
  const f = new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)); let any=false;
  for(const e of enemies){ if(e.dead) continue;
    const d = new THREE.Vector3(e.pos.x-player.pos.x,0,e.pos.z-player.pos.z); const dist=d.length();
    if(dist < CFG.norah.shoveRange+e.radius && d.normalize().dot(f)>0.5){
      any=true; const big = e.kind==="brute";
      if(big) e.hp = Math.max(Math.min(0.5,e.hp), e.hp - CFG.norah.shoveDamage); else e.hp -= CFG.norah.shoveDamage;
      if(e.hp<=0){ e.die(f); log(`${e.name} shoved down for good`,"#ff6a5a"); continue; }
      e.push(f, CFG.phys.shovePush); if(e.kind==="across") e.alert("is shoved",true);
      const wt = CFG.phys.on ? clamp(65/e.mass,0.25,1.2) : 1;
      if(!big && e.legsLost()===0 && e.gait && rng()<e.S.shoveFall*wt){ const note=e.knockDown(f,"shove"); e.swCool=Math.max(e.swCool||0,0.8); e.flinch=1; e.door=null; log(`Shove → ${e.name}: ${note}, −${CFG.norah.shoveDamage} (body ${e.hp.toFixed(2)})`, "#d0c0ff"); continue; }
      e.stagger = (big?CFG.norah.shoveStunBig:CFG.norah.shoveStunSmall)*(e.variant==="matron"?CFG.across.matronStagger:1); e.state="stagger"; e.t=0; e.flinch=1; e.door=null;
      log(`Shove → ${e.name}: stun ${e.stagger.toFixed(2)}s, −${CFG.norah.shoveDamage} (body ${e.hp.toFixed(2)})`, "#d0c0ff");
    }
  }
  if(!any) log("Shove whiffs","#7d7668");
}
// struggling free of a grab: each press counts
// grabs are broken with a quick time event: hit each prompt in time and Norah pushes it off
const QTE_KEYS=[{key:"KeyE",label:"E",pad:0,padLabel:"A"},{key:"KeyQ",label:"Q",pad:2,padLabel:"X"},{key:"Space",label:"SPACE",pad:3,padLabel:"Y"}];
function mash(){ return !!player.grabbed; } // other actions are swallowed while grabbed
// grabs: a sequence of prompts (ankle grabs), or mash one key to fill a meter (bear hugs)
function startQte(g, hug){
  const S=CFG.across;
  if(hug && S.hugMash){ g.qte={mode:"mash", key:QTE_KEYS[0], fill:0.12, win:S.hugTime, t:S.hugTime, pulse:0, wrong:0}; return; }
  const n=Math.round(hug?S.hugSteps:g.by.kind==="brute"?CFG.brute.grabSteps:S.qteSteps); const seq=[]; let prev=-1;
  for(let i=0;i<n;i++){ let k; do{ k=Math.floor(Math.random()*QTE_KEYS.length); }while(k===prev && QTE_KEYS.length>1); prev=k; seq.push(QTE_KEYS[k]); }
  const w=S.qteWindow*(hug?0.85:1); g.qte={mode:"seq", seq, i:0, win:w, t:w, pulse:0, wrong:0};
}
const qteMatch=(code,k)=> code===k.key || code==="pad"+k.pad || code==="touch";
function qtePress(code){
  const g=player.grabbed; if(!g||!g.qte) return false; const q=g.qte;
  if(q.mode==="mash"){
    if(qteMatch(code,q.key)){ q.fill+=CFG.across.mashPer; q.pulse=0.12; SFX.shove(); shake=Math.max(shake,0.08); if(q.fill>=1) pushOff(g); }
    else q.wrong=0.3;
    return true; }
  const want=q.seq[q.i];
  if(qteMatch(code,want)){ q.i++; q.pulse=0.18; SFX.shove(); shake=Math.max(shake,0.15); if(q.i>=q.seq.length) pushOff(g); else q.t=q.win; }
  else qteFail(g,"wrong key");
  return true;
}
function qteTick(rdt){
  const g=player.grabbed; if(!g||!g.qte) return; const q=g.qte;
  q.pulse=Math.max(0,q.pulse-rdt); q.wrong=Math.max(0,q.wrong-rdt);
  if(q.mode==="mash") q.fill=Math.max(0,q.fill-CFG.across.mashDecay*rdt);
  q.t-=rdt; if(q.t<=0) qteFail(g,"too slow");
}
function pushOff(g){
  player.grabbed=null; const e=g.by; if(run) run.escapes++;
  const dir=new THREE.Vector3(e.pos.x-player.pos.x,0,e.pos.z-player.pos.z).normalize();
  if(!e.dead){ e.cool=1.5; e.swCool=1.2; e.door=null;
    if(e.kind==="runner") e.runnerFreed(dir);
    else if(e.kind==="across" && e.legsLost()===0 && e.gait && e.variant!=="matron") e.knockDown(dir,"push");
    else { e.state="stagger"; e.stagger=0.8; e.t=0; e.flinch=1; }
    e.kb.addScaledVector(dir, 1.2); }
  joinedRelease(g,false); player.shoveT=0.3; SFX.shove(); log(`Norah pushes ${e.name} off`,"#9ed08a"); qteBanner("BROKE FREE","ok");
}
function qteFail(g, why){
  player.grabbed=null; const e=g.by;
  if(e.kind==="brute"){ e.state="recover"; e.t=0; e.cool=1.0; louisThrowPlayer(e); qteBanner("","bad"); return; }
  if(e.kind==="runner"){ joinedRelease(g,true); e.runnerCrush(); qteBanner("CRUSHED","bad"); return; }
  player.bite(e,"bite",g.dmg); joinedRelease(g,true);
  if(!e.dead){ e.state="recover"; e.t=0; e.cool=1.5; e.swCool=1.0; }
  player.stumble=0.35; log(`${why==="wrong key"?"Wrong key":"Too slow"}: ${e.name} bites`,"#ff7070");
  qteBanner(`${why==="wrong key"?"WRONG KEY":"TOO SLOW"} · BITTEN −${Math.round(g.dmg)}`,"bad");
}

function use(){
  if(mash()) return;
  if(player.dead||player.dodge>0||player.stumble>0||player.aiming||paused) return;
  if(player.search) return;
  if(interactFirst()) return;
  const f = new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw));
  // push furniture: each press shoves it a step, like the game's mash
  let best=null, bd=1e9;
  for(const b of world.boxes){ if(!b.push) continue; const cx=clamp(player.pos.x,b.x0,b.x1), cz=clamp(player.pos.z,b.z0,b.z1); const dx=cx-player.pos.x, dz=cz-player.pos.z, d=Math.hypot(dx,dz);
    if(d<0.9 && (dx*f.x+dz*f.z)>d*0.5 && d<bd){ bd=d; best=b; } }
  if(best){
    const ax = Math.abs(f.x)>Math.abs(f.z) ? new THREE.Vector3(Math.sign(f.x),0,0) : new THREE.Vector3(0,0,Math.sign(f.z));
    const step=CFG.norah.pushStep; const oldx=best.x, oldz=best.z; best.x+=ax.x*step; best.z+=ax.z*step;
    const r=Math.min(best.w,best.d)/2*0.95; const probe=new THREE.Vector3(best.x,0,best.z); collide(probe,r,best);
    const blocked = Math.hypot(probe.x-best.x,probe.z-best.z)>0.02 || enemies.some(e=>!e.dead && e.pos.x>best.x0-e.radius && e.pos.x<best.x1+e.radius && e.pos.z>best.z0-e.radius && e.pos.z<best.z1+e.radius);
    if(blocked){ best.x=oldx; best.z=oldz; log(`The ${best.name||"crate"} won't go further`,"#7d7668"); }
    else { placeBoxMesh(best); player.pos.addScaledVector(ax,step); player.pushT=0.25; SFX.drag(); makeNoise(best.x,best.z,CFG.stealth.pushNoise,"furniture"); }
    return;
  }
  // doors
  let door=null; bd=1e9;
  for(const d of world.doors){ if(d.broken) continue; const s=doorSeg(d); const mx=(s.ax+s.bx)/2, mz=(s.az+s.bz)/2; const dd=Math.hypot(mx-player.pos.x,mz-player.pos.z); if(dd<1.4&&dd<bd){ bd=dd; door=d; } }
  if(door){
    if(door.locked && !tryUnlock(door)) return;
    if(door.target>0.01){ door.target=0; door.speed=9; log("Door slammed","#9a9283"); makeNoise(door.hx,door.hz,CFG.stealth.slamNoise,"slam",true); }
    else { // open away from Norah
      const e=doorEnd(door); const nx=-(e.z-door.hz), nz=(e.x-door.hx); const toP=(player.pos.x-door.hx)*nx+(player.pos.z-door.hz)*nz;
      door.side = toP>0 ? -1 : 1; door.ang=0;
      door.target=1.45; door.speed=2.5; SFX.creak(new THREE.Vector3(door.hx,1,door.hz)); makeNoise(door.hx,door.hz,CFG.stealth.doorNoise,"door"); }
  }
}
function tryDodge(fromTouch){
  if(player.dodge>0||player.dead||paused) return; if(fromTouch && !isAiming()) return;
  let d = isFixed() && CFG.ctrl.cam==="tank" ? relMove(player.yaw) : isFixed() ? relMove(activeCamYaw()) : relMove(camYaw);
  if(d.lengthSq()<0.01) d = new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
  player.dodgeDir.copy(d.normalize()); player.dodge = CFG.norah.dodgeTime; player.aiming=false; if(run) run.dodges++; SFX.dodge();
  player.dodgeLog={t:0, ticks:[], dur:CFG.norah.dodgeTime, share:CFG.norah.dodgeIframes, show:CFG.norah.dodgeTime+1.5};
}
function respawn(){
  player.dead=false; player.hp=CFG.norah.hp; player.stumble=0; player.pos.set(world.spawn.x,0,world.spawn.z);
  document.getElementById("dead").style.display="none";
  for(const e of enemies) if(!e.dead){ const d=Math.hypot(e.pos.x-player.pos.x, e.pos.z-player.pos.z); if(d<5){ e.pos.x+= (e.pos.x-player.pos.x)/Math.max(d,0.1)*4; e.pos.z+=(e.pos.z-player.pos.z)/Math.max(d,0.1)*4; collide(e.pos,e.radius); } }
}
function spawn(type, x, z, opts={}){
  let legless=false; if(type==="across_legless"){ type="across"; opts.variant="crawler"; legless=true; }
  if(type==="across_stand"){ type="across"; const st=VARIANTS.filter(v=>v.stance!=="crawl" && v.key!=="mourner"); opts.variant=st[Math.floor(rng()*st.length)].key; }
  else if(type==="across_crawl"){ type="across"; opts.variant="crawler"; }
  else if(type.startsWith("across:")){ opts.variant=type.slice(7); type="across"; }
  if(x===undefined){
    const sp = world.enemySpawns.length ? world.enemySpawns[(enemyCount)%world.enemySpawns.length] : null;
    if(sp){ x=sp.x; z=sp.z; }
    else { const a = player.yaw + (rng()-.5)*1.2, d = 7+rng()*2; x = player.pos.x+Math.sin(a)*d; z = player.pos.z+Math.cos(a)*d; }
  }
  const p=new THREE.Vector3(x,0,z); collide(p, type==="across"?0.4:0.45);
  const e = new Enemy(type,p.x,p.z,opts); if(legless){ e.lost.legL=e.lost.legR=true; e.P.legL.visible=e.P.legR.visible=false; e.P.legL.traverse(o=>{ if(o.isMesh) o.userData={}; }); e.P.legR.traverse(o=>{ if(o.isMesh) o.userData={}; }); } if(!QUIET_SPAWN) log(`Spawned ${e.name}`,"#9a9283"); return e;
}
function clearEnemies(){
  for(const e of enemies) e.remove(); enemies.length=0;
  for(const d of debris) scene.remove(d.o); debris.length=0;
  for(const p of pools) scene.remove(p.m); pools.length=0;
  for(const s of sprays) scene.remove(s.m); sprays.length=0;
  for(const q of smokes) scene.remove(q.m); smokes.length=0; player.grabbed=null;
}
function clearAll(){ clearEnemies(); log("Cleared","#9a9283"); scenarioKey="sandbox"; newRun("Sandbox"); refreshScenarioSel(); }

// ================================================================ feedback
let hitstop=0, killSlowmo=0, shake=0, paused=false, stepFrames=0;
const flashEl=document.getElementById("flash");
function flashRed(){ flashEl.style.transition="none"; flashEl.style.opacity=0.45; requestAnimationFrame(()=>{ flashEl.style.transition="opacity .35s"; flashEl.style.opacity=0; }); }
function togglePause(){ paused=!paused; document.getElementById("paused").style.display=paused?"block":"none"; }

// ================================================================ vaulting (Norah only)
// Space vaults over a low surface she's facing: slow and quiet, or with Shift fast and loud.
function findVault(){
  const N=CFG.norah, p=player.pos, fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); let best=null, bd=1e9;
  for(const b of world.boxes){
    if(b.h<N.vaultMinH || b.h>N.vaultMaxH) continue;
    const cx=clamp(p.x,b.x0,b.x1), cz=clamp(p.z,b.z0,b.z1), dx=p.x-cx, dz=p.z-cz, d=Math.hypot(dx,dz);
    if(d<1e-3 || d>N.vaultReach+0.3 || d>bd) continue;
    if(-(dx*fx+dz*fz)/d < 0.5) continue;                        // she has to be facing it
    const alongX=Math.abs(dx)>Math.abs(dz), dir=alongX?{x:-Math.sign(dx),z:0}:{x:0,z:-Math.sign(dz)};
    const depth=alongX?b.w:b.d; if(depth>2.3) continue;
    const land=new THREE.Vector3(alongX?(dir.x>0?b.x1:b.x0)+dir.x*0.42:clamp(p.x,b.x0+0.08,b.x1-0.08), 0, alongX?clamp(p.z,b.z0+0.08,b.z1-0.08):(dir.z>0?b.z1:b.z0)+dir.z*0.42);
    const probe=land.clone(); collide(probe,0.3); if(Math.hypot(probe.x-land.x,probe.z-land.z)>0.08) continue;   // no room to land
    let blocked=false; for(const sg of world.segs) if(segsCross(p.x,p.z,land.x,land.z,sg.ax,sg.az,sg.bx,sg.bz)){ blocked=true; break; }
    if(!blocked) for(const dd of world.doors){ if(dd.broken) continue; const sg=doorSeg(dd); if(segsCross(p.x,p.z,land.x,land.z,sg.ax,sg.az,sg.bx,sg.bz)){ blocked=true; break; } }
    if(blocked) continue;
    bd=d; best={box:b, land, h:b.h, depth};
  }
  return best;
}
function tryVault(fast){
  if(player.vault||player.dead||player.grabbed||player.dodge>0||player.stumble>0||paused) return false;
  const v=findVault(); if(!v) return false; const N=CFG.norah, SS=CFG.stealth;
  player.vault=Object.assign(v,{fast, t:0, from:player.pos.clone(), dur: fast?N.fastVault:N.slowVault*(0.75+0.25*Math.min(2,v.depth))});
  player.aiming=false; player.reloading=0; player.reloadAdd=0; player.vel.set(0,0,0); player.yaw=Math.atan2(v.land.x-player.pos.x,v.land.z-player.pos.z);
  if(fast){ makeNoise(player.pos.x,player.pos.z,SS.fastVaultNoise,"fast vault"); SFX.vaultFast(); } else { makeNoise(player.pos.x,player.pos.z,SS.slowVaultNoise,"vault"); SFX.vaultSlow(); }
  if(run) run.vaults=(run.vaults||0)+1; return true;
}
function updateVault(dt){
  const V=player.vault; V.t+=dt; const k=Math.min(1,V.t/V.dur), h=V.h+0.03;
  const sm=(a,b,x)=>{ const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
  let fwd, y;
  if(V.fast){ fwd=sm(0,1,k); y=(h+0.08)*Math.pow(Math.sin(Math.PI*Math.min(1,k*1.05)),0.7); }
  else { fwd = 0.18*sm(0.1,0.38,k) + 0.6*sm(0.38,0.75,k) + 0.22*sm(0.75,1,k); y = h*sm(0,0.35,k)*(1-sm(0.78,1,k)); }
  player.pos.set(lerp(V.from.x,V.land.x,fwd),0,lerp(V.from.z,V.land.z,fwd)); player.posY=y; player.vaultK=k;
  if(k>=1){ player.vault=null; player.posY=0; if(V.fast){ makeNoise(player.pos.x,player.pos.z,CFG.stealth.fastVaultNoise,"landing"); SFX.stomp(null); } collide(player.pos,0.3); }
}

// ================================================================ player update
function updatePlayer(dt){
  const N=CFG.norah, P=player.P;
  if(player.hammer>0){ player.hammer=Math.max(0,player.hammer-dt); if(player.hammer===0 && player.cockPending){ player.cockPending=false; SFX.hammer(); } }
  player.dazed=Math.max(0,player.dazed-dt);
  player.shoveCd=Math.max(0,player.shoveCd-dt); player.shoveT=Math.max(0,player.shoveT-dt); player.recoil=Math.max(0,player.recoil-dt*3); player.pushT=Math.max(0,player.pushT-dt);
  if(player.reloading>0){
    player.reloading-=dt;
    const done = player.reloadTotal-player.reloading - CFG.rev.reloadBase*0.5; const n=Math.floor(done/Math.max(0.01,CFG.rev.reloadPerRound));
    while(player.reloadClicks<Math.min(n,player.reloadAdd)){ player.reloadClicks++; SFX.roundIn(0); }
    if(player.reloading<=0){ player.rounds+=player.reloadAdd; if(!CFG.rev.infinite) player.spare-=player.reloadAdd; player.reloadAdd=0; SFX.cylinder(); log(`Loaded. ${player.rounds} / ${CFG.rev.chambers}`,"#9a9283"); }
  }
  const turnK = N.keyTurn*Math.PI/180*dt;
  const fixed = isFixed(), tank = CFG.ctrl.cam==="tank";
  // look (OTS camera / free turn)
  const fr=(player.aiming&&SB.aimOver?CFG.rev.aimFriction:1); const lookX = pad.look.x*CFG.ctrl.padLook*dt*fr, lookY = pad.look.y*CFG.ctrl.padLook*dt*fr*(CFG.ctrl.invertY?-1:1);
  if(!fixed){ if(keys.ArrowLeft) camYaw += turnK; if(keys.ArrowRight) camYaw -= turnK; if(keys.ArrowUp) camPitch=Math.min(0.7,camPitch+turnK*0.5); if(keys.ArrowDown) camPitch=Math.max(-0.9,camPitch-turnK*0.5);
    camYaw -= lookX; camPitch = clamp(camPitch - lookY, -0.9, 0.7); }
  else { if(keys.ArrowLeft) player.yaw += turnK; if(keys.ArrowRight) player.yaw -= turnK; player.yaw -= lookX; }
  const wasAiming = player.aiming;
  player.aiming = isAiming() && player.reloading<=0;
  if(player.aiming && !wasAiming){ player.aimT=0; if(fixed) fixedAutoAim(); else aimAssist(); }
  if(!player.aiming){ player.aimHeight=0; player.aimTarget=null; }
  let moving=0; const PH=CFG.phys; const pWant=new THREE.Vector3(); let pMode="walk";
  if(player.dead){ pMode="pin"; }
  else if(player.vault){ updateVault(dt); pMode="pin"; player.aiming=false; }
  else if(player.dodge>0){ player.dodge-=dt; player.vel.copy(player.dodgeDir).multiplyScalar(N.dodgeDist/N.dodgeTime); pMode="set"; }
  else if(player.grabbed){ const g=player.grabbed; player.aiming=false;
    if(g.by.dead || g.by.state!=="grab"){ player.grabbed=null; if(!g.by.dead||true) log(`${g.by.name} let go`,"#9ed08a"); if(run) run.escapes++; }
    else { player.yaw += wrapA(Math.atan2(g.by.pos.x-player.pos.x,g.by.pos.z-player.pos.z)-player.yaw)*Math.min(1,dt*6); } pMode="pin"; }
  else if(player.crushT>0||player.kneelT>0){ pMode="pin"; if(player.crushT>0) player.aiming=false; player.crushT=Math.max(0,player.crushT-dt); player.kneelT=Math.max(0,player.kneelT-dt); }
  else if(player.search){ updateSearch(dt); pMode="pin"; player.aiming=false; }
  else if(player.stumble>0){ player.stumble-=dt; pMode="skid"; }
  else if(player.aiming){
    if(!fixed) player.yaw = camYaw;
    else if(tank){ if(keys.KeyA) player.yaw+=turnK; if(keys.KeyD) player.yaw-=turnK; player.yaw -= (pad.move.x+touch.move.x)*turnK; }
    if(fixed && player.aimTarget && player.aimTarget.dead) player.aimTarget=null;
    // slow movement in any direction while aiming; she keeps facing where she aims
    let m;
    if(!fixed) m = relMove(camYaw);
    else if(tank){ const r=rawMove(); m = new THREE.Vector3(Math.sin(player.yaw)*r.y,0,Math.cos(player.yaw)*r.y); }
    else m = relMove(heldCamYaw());
    if(m.lengthSq()>0.01){ const mag=Math.min(1,m.length()); m.normalize();
      const justFired = player.hammer > CFG.rev.hammer - N.fireSlowTime;
      pWant.addScaledVector(m, N.aimWalk*mag*(justFired?N.fireSlow:1)*(player.dazed>0?0.6:1)*norahSpeedMul()*(player.crouch?0.8:1)); moving=1; }
    pMode="aim";
  }
  else {
    const run = isRunning();
    if(tank){
      const m=rawMove(); player.yaw -= m.x*turnK;
      if(Math.abs(m.y)>0.1){ const sp = (player.crouch ? CFG.stealth.crouchSpeed*m.y : m.y>0 ? (run?N.run:N.walk)*m.y : N.walk*N.backpedal*m.y)*(player.dazed>0?0.6:1)*norahSpeedMul(); pWant.set(Math.sin(player.yaw)*sp,0,Math.cos(player.yaw)*sp); moving = m.y>0?(run?2:1):1; }
    } else {
      let yawRef = fixed ? heldCamYaw() : camYaw;
      const m = relMove(yawRef);
      if(m.lengthSq()>0.01){ const mag=Math.min(1,m.length()); m.normalize(); const sp = (player.crouch?CFG.stealth.crouchSpeed:run?N.run:N.walk)*mag*(player.dazed>0?0.6:1)*norahSpeedMul();
        pWant.addScaledVector(m, sp); moving = run&&!player.crouch?2:1;
        const d=wrapA(Math.atan2(m.x,m.z)-player.yaw); player.yaw += d*Math.min(1,dt*10); }
    }
  }
  // momentum: she speeds up and slows down over a moment, and slides when something hits her
  const v=player.vel;
  if(pMode==="pin") v.set(0,0,0);
  else if(pMode!=="set"){ const ws=pWant.length(), vs=v.length();
    let a = pMode==="skid" ? PH.skid : pMode==="aim" ? PH.aimAccel : ws>vs ? PH.norahAccel : PH.norahDecel; if(!PH.on && pMode!=="skid") a=1e6;
    let dvx=pWant.x-v.x, dvz=pWant.z-v.z; const dl=Math.hypot(dvx,dvz), mx=a*dt; if(dl>mx){ dvx*=mx/dl; dvz*=mx/dl; } v.x+=dvx; v.z+=dvz; }
  player.pos.x+=v.x*dt; player.pos.z+=v.z*dt;
  if(!player.dead && !player.vault){ const px=player.pos.x, pz=player.pos.z; collide(player.pos, 0.3); const cx=player.pos.x-px, cz=player.pos.z-pz, cl=Math.hypot(cx,cz); if(cl>1e-4){ const nx=cx/cl, nz=cz/cl, vn=v.x*nx+v.z*nz; if(vn<0){ v.x-=nx*vn; v.z-=nz*vn; } } }
  // footsteps make noise: running carries, crouch-walking barely does
  { const spd=v.length(); if(spd>0.3 && !player.dead && player.dodge<=0){ player.stepT=(player.stepT||0)-dt; if(player.stepT<=0){ player.stepT=0.38; const SS=CFG.stealth;
      makeNoise(player.pos.x,player.pos.z, player.crouch?SS.crouchNoise : spd>2.6?SS.runNoise : player.aiming?SS.aimNoise : SS.walkNoise, "footsteps"); } } }
  if(player.dodgeLog){ player.dodgeLog.t+=dt; if(player.dodgeLog.t>player.dodgeLog.show) player.dodgeLog=null; }
  // pose
  const sw = norahGait(P, moving, Math.hypot(v.x,v.z), dt);
  const aimPitch = fixed ? player.aimHeight*0.35 : camPitch;
  if(player.aiming){ P.armR.rotation.set(-Math.PI/2 - aimPitch*0.9 - player.recoil*0.9,0,0.1); P.armL.rotation.set(-Math.PI/2.2 - aimPitch*0.9 - player.recoil*0.6,0,-0.35); }
  else if(player.shoveT>0){ const a=player.shoveT/0.3; P.armR.rotation.set(-1.5*(1-Math.abs(a-0.5)*2)-0.2,0,0); P.armL.rotation.set(-1.5*(1-Math.abs(a-0.5)*2)-0.2,0,0); }
  else if(player.pushT>0){ P.armR.rotation.set(-1.4,0,0); P.armL.rotation.set(-1.4,0,0); P.hips.rotation.x=0.3; }
  else if(player.reloading>0){ P.armR.rotation.set(-0.9,0,0.3); P.armL.rotation.set(-0.9,0,-0.3); }
  else norahArms(P);
  if(player.dodge>0){ const a=1-player.dodge/N.dodgeTime; P.hips.position.y=0.95-0.5*Math.sin(a*Math.PI); P.hips.rotation.x = a*Math.PI; }
  if(player.downT>0){ P.hips.position.y=0.22; P.hips.rotation.x=-1.45; P.legL.rotation.x=0.2; P.legR.rotation.x=-0.1; P.kneeL.rotation.x=0.3; P.armL.rotation.set(-0.4,0,-0.8); P.armR.rotation.set(-0.3,0,0.8); }
  else if(player.stumble>0) P.hips.rotation.x=-0.3;
  if(player.grabbed){ const k=performance.now()/1000; P.hips.rotation.x=-0.25; P.hips.position.y=0.85; P.armL.rotation.set(-0.8+Math.sin(k*20)*0.4,0,-0.4); P.armR.rotation.set(-0.6+Math.cos(k*23)*0.4,0,0.4); P.legL.rotation.x=0.3+Math.sin(k*18)*0.2; }
  runnerNorahPose(P);
  if(player.crouch && !player.dead && player.dodge<=0 && !player.grabbed && !(player.kneelT>0)){ P.hips.position.y=0.62; P.hips.rotation.x=0.35; P.legL.rotation.x=-1.35+sw*0.35; P.legR.rotation.x=-1.35-sw*0.35; P.kneeL.rotation.x=1.75; P.kneeR.rotation.x=1.75; }
  if(player.search){ const k=performance.now()/1000; P.hips.position.y=0.8; P.hips.rotation.x=0.4; P.armL.rotation.set(-1.2+Math.sin(k*9)*0.25,0,-0.2); P.armR.rotation.set(-1.1+Math.cos(k*11)*0.25,0,0.2); }
  if(player.dead){ P.hips.position.y=0.15; P.hips.rotation.x=-Math.PI/2; }
  if(player.vault){ const V=player.vault, k=player.vaultK||0, sw2=Math.sin(Math.PI*k);
    if(V.fast){ P.hips.position.y=0.95; P.hips.rotation.set(0.2*sw2,0,-0.9*sw2); P.armL.rotation.set(-1.2*sw2,0,-0.4*sw2); P.armR.rotation.set(-0.8,0,1.2*sw2); P.legL.rotation.x=-1.2*sw2; P.legR.rotation.x=-0.9*sw2; P.kneeL.rotation.x=1.0*sw2; P.kneeR.rotation.x=0.6*sw2; }
    else { const up=k<0.4?k/0.4:k<0.78?1:1-(k-0.78)/0.22; P.hips.position.y=0.95-0.3*up; P.hips.rotation.set(0.6*up,0,0); P.armL.rotation.set(-1.0-0.4*up,0,-0.15); P.armR.rotation.set(-1.0-0.4*up,0,0.15); P.legL.rotation.x=-1.5*up+(k>0.4&&k<0.78?Math.sin(k*30)*0.3:0); P.legR.rotation.x=-1.2*up; P.kneeL.rotation.x=1.8*up; P.kneeR.rotation.x=1.6*up; } }
  player.root.position.copy(player.pos); player.root.position.y=(player.posY||0)+groundY(player.pos.x,player.pos.z); player.root.rotation.y = player.yaw;
  itemsTick(dt); louisTick(dt);
}
function aimAssist(){
  if(!CFG.rev.assist) return;
  let best=null, bestA=CFG.rev.assistAngle*Math.PI/180;
  for(const e of enemies){ if(e.dead) continue;
    const dx=e.pos.x-player.pos.x, dz=e.pos.z-player.pos.z, d=Math.hypot(dx,dz); if(d>CFG.rev.assistRange) continue;
    const a=Math.abs(wrapA(Math.atan2(dx,dz)-camYaw)); if(a<bestA){ bestA=a; best=e; } }
  if(best){ // aim from the camera's shoulder pivot, so the crosshair lands on them rather than half a metre to the side
    const tp=new THREE.Vector3(); best.P.torsoMesh.getWorldPosition(tp); if(best.kind==="brute") tp.y+=0.15;
    for(let i=0;i<3;i++){ const r=new THREE.Vector3(-Math.cos(camYaw),0,Math.sin(camYaw)); const pv=new THREE.Vector3(player.pos.x,CFG.ctrl.aimHeight+groundY(player.pos.x,player.pos.z),player.pos.z).addScaledVector(r,CFG.ctrl.aimSide);
      camYaw=Math.atan2(tp.x-pv.x,tp.z-pv.z); camPitch=Math.atan2(tp.y-pv.y,Math.hypot(tp.x-pv.x,tp.z-pv.z)); }
    camSide=CFG.ctrl.aimSide; }
}
function fixedAutoAim(){
  let best=null, bd=1e9; const lim=CFG.rev.fixedAimAngle*Math.PI/180;
  for(const e of enemies){ if(e.dead) continue; const dx=e.pos.x-player.pos.x, dz=e.pos.z-player.pos.z, d=Math.hypot(dx,dz);
    if(d>CFG.rev.fixedAimRange) continue; const a=Math.abs(wrapA(Math.atan2(dx,dz)-player.yaw)); if(a>lim) continue;
    if(!lineOfSight(player.pos.x,player.pos.z,e.pos.x,e.pos.z,true)) continue;
    const score=d+a*3; if(score<bd){ bd=score; best=e; } }
  player.aimTarget=best; if(best) player.yaw=Math.atan2(best.pos.x-player.pos.x,best.pos.z-player.pos.z);
}

// ================================================================ cameras
const camPos = new THREE.Vector3(0,1.8,10.5); let camSide=0.55;
let activeCam=null, camCutT=0, heldYaw=null;
function activeCamYaw(){ if(!activeCam) return camYaw; const f=activeCam.look.clone().sub(activeCam.pos); return Math.atan2(f.x,f.z); }
function heldCamYaw(){ // camera-relative movement keeps its old heading through a cut until the stick/keys are released
  const m=rawMove(); if(Math.hypot(m.x,m.y)<0.1){ heldYaw=null; return activeCamYaw(); }
  if(heldYaw===null) heldYaw=activeCamYaw(); return heldYaw;
}
function pickFixedCam(){
  const p=player.pos; let best=null, bs=1e9;
  for(const c of world.cams){ const d=Math.hypot(c.pos.x-p.x,c.pos.z-p.z); if(!lineOfSight(c.pos.x,c.pos.z,p.x,p.z,true)) continue;
    // prefer cameras that see her from the front-ish and aren't right on top of her
    const s = d + (d<1.2?6:0); if(s<bs){ bs=s; best=c; } }
  if(!best) best = world.cams.reduce((a,c)=>!a||c.pos.distanceTo(p)<a.pos.distanceTo(p)?c:a,null);
  if(activeCam && best!==activeCam && lineOfSight(activeCam.pos.x,activeCam.pos.z,p.x,p.z,true)){
    const dCur=Math.hypot(activeCam.pos.x-p.x,activeCam.pos.z-p.z); if(dCur < bs+2.5) best=activeCam; // hysteresis: no flicker on seams
  }
  if(best!==activeCam){ activeCam=best; camCutT=0; }
}
function updateCamera(rdt){
  if(replay.on){ updateReplayCam(rdt); return; }
  if(isFixed() && world.cams.length){
    pickFixedCam(); const c=activeCam;
    camera.position.copy(c.pos); if(camera.fov!==c.fov){ camera.fov=c.fov; camera.updateProjectionMatrix(); }
    const look = c.track ? c.look.clone().lerp(new THREE.Vector3(player.pos.x,1.1+groundY(player.pos.x,player.pos.z),player.pos.z),0.65) : c.look;
    camera.lookAt(look);
    if(shake>0){ camera.position.x += (Math.random()-.5)*shake*0.1; shake=Math.max(0,shake-rdt*2.5); }
    return;
  }
  if(camera.fov!==60){ camera.fov=60; camera.updateProjectionMatrix(); }
  const aim = player.aiming; const C=CFG.ctrl, back = aim?C.aimDist:C.camDist, side = aim?C.aimSide:C.camSide, h = (aim?C.aimHeight:C.camHeight)-(player.crouch?0.4:0);
  const dz=player.dazed>0?Math.min(1,player.dazed)*0.08:0, tt=performance.now()/1000, cy=camYaw+Math.sin(tt*2.3)*dz, cp=camPitch+Math.sin(tt*3.1)*dz*0.6;
  const look = new THREE.Vector3(Math.sin(cy)*Math.cos(cp), Math.sin(cp), Math.cos(cy)*Math.cos(cp));
  const right = new THREE.Vector3(-Math.cos(camYaw),0,Math.sin(camYaw));
  camSide += (side-camSide)*Math.min(1,rdt*10);
  const pivot = new THREE.Vector3(player.pos.x, h+(player.posY||0)*0.8+groundY(player.pos.x,player.pos.z), player.pos.z).addScaledVector(right, camSide);
  // pull in if a wall is between her and the lens
  let want = back; const tgt = pivot.clone().addScaledVector(look,-back);
  if(!lineOfSight(player.pos.x,player.pos.z,tgt.x,tgt.z,true)){ for(let b=back;b>0.3;b-=0.15){ const q=pivot.clone().addScaledVector(look,-b); if(lineOfSight(player.pos.x,player.pos.z,q.x,q.z,true)){ want=b; break; } want=0.3; } }
  const target = pivot.clone().addScaledVector(look, -want); target.y=Math.max(target.y, groundY(target.x,target.z)+0.25);
  camPos.lerp(target, Math.min(1, rdt*14));
  camera.position.copy(camPos);
  if(shake>0){ camera.position.x += (Math.random()-.5)*shake*0.15; camera.position.y += (Math.random()-.5)*shake*0.15; shake=Math.max(0,shake-rdt*2.5); }
  camera.lookAt(camPos.clone().add(look));
}

// ================================================================ overlays
let cone=null, coneKey="";
function updateOverlays(){
  const show = CFG.debug.cone && !player.dead;
  const fixed=isFixed(); const ang=(fixed?CFG.rev.fixedAimAngle:CFG.rev.assistAngle)*Math.PI/180, rng_=fixed?CFG.rev.fixedAimRange:CFG.rev.assistRange;
  const key=ang.toFixed(3);
  if(show && (!cone||coneKey!==key)){ if(cone) scene.remove(cone); const g=new THREE.Group(); const m=new THREE.Mesh(new THREE.CircleGeometry(1,24,-Math.PI/2-ang,ang*2), new THREE.MeshBasicMaterial({color:0x60a0ff,transparent:true,opacity:0.18,depthWrite:false,side:THREE.DoubleSide})); m.rotation.x=-Math.PI/2; g.add(m); g.userData.m=m; scene.add(g); cone=g; coneKey=key; }
  if(cone){ cone.visible=show; if(show){ cone.position.set(player.pos.x,groundY(player.pos.x,player.pos.z)+0.04,player.pos.z); cone.rotation.y = fixed?player.yaw:camYaw; cone.scale.set(rng_,1,rng_); cone.userData.m.material.opacity = player.aiming?0.3:0.12; } }
  // dodge timeline
  const db=document.getElementById("dodgebar"); const L=player.dodgeLog;
  if(CFG.debug.dodgeBar && L){ db.style.display="block"; db.querySelector(".ifr").style.width=(L.share*100)+"%";
    db.querySelector(".cur").style.left=Math.min(100,L.t/L.dur*100)+"%";
    db.querySelectorAll(".tick").forEach(x=>x.remove());
    for(const tk of L.ticks){ const d=document.createElement("div"); d.className="tick"; d.style.left=(tk.at*100)+"%"; d.style.background=tk.ok?"#9ef08a":"#ff4040"; db.querySelector(".track").appendChild(d); }
    document.getElementById("dodgetxt").textContent = `${L.dur.toFixed(2)}s · invulnerable for the first ${(L.share*L.dur).toFixed(2)}s` + (L.ticks.length? ` · ${L.ticks.map(t=>t.ok?"saved":"hit").join(", ")}`:"");
  } else db.style.display="none";
}

// ================================================================ replay (last 10 s)
const replay = {on:false, frames:[], playing:false, idx:0, speed:1, yaw:0, pitch:0, pos:new THREE.Vector3(), hidden:[]};
function bodies(){ const b=[{key:"p",root:player.root,P:player.P}]; for(const e of enemies) b.push({key:"e"+e.id,root:e.root,P:e.P,e}); return b; }
function record(gt){
  const f={t:gt, b:{}, hp:player.hp};
  for(const B of bodies()){ const a=[B.root.position.x,B.root.position.y,B.root.position.z,B.root.rotation.x,B.root.rotation.y,B.P.hips.position.y];
    for(const k of PIV){ const o=B.P[k]; a.push(o.rotation.x,o.rotation.y,o.rotation.z); } f.b[B.key]=a; }
  replay.frames.push(f); while(replay.frames.length && gt-replay.frames[0].t>10) replay.frames.shift();
}
function applyFrame(f){
  for(const B of bodies()){ const a=f.b[B.key]; if(!a){ B.root.visible=false; continue; } B.root.visible=true;
    B.root.position.set(a[0],a[1],a[2]); B.root.rotation.x=a[3]; B.root.rotation.y=a[4]; B.P.hips.position.y=a[5];
    PIV.forEach((k,i)=>{ const o=B.P[k]; if(B.e && o.parent && !B.root.getObjectById(o.id)) return; o.rotation.set(a[6+i*3],a[7+i*3],a[8+i*3]); }); }
}
function enterReplay(){
  if(replay.on||replay.frames.length<10){ if(!replay.on) log("Nothing recorded yet","#9a9283"); return; }
  replay.on=true; replay.playing=false; replay.idx=replay.frames.length-1;
  replay.pos.copy(camera.position); const d=new THREE.Vector3(); camera.getWorldDirection(d); replay.yaw=Math.atan2(d.x,d.z); replay.pitch=Math.asin(clamp(d.y,-1,1));
  document.getElementById("replaybar").style.display="flex"; try{ document.exitPointerLock(); }catch(e){}
  for(const e of enemies) if(e.ring){ e.ring.visible=false; e.ring2.visible=false; }
  syncScrub(); applyFrame(replay.frames[replay.idx]);
}
function exitReplay(){
  replay.on=false; document.getElementById("replaybar").style.display="none";
  for(const B of bodies()) B.root.visible=true;
  for(const e of enemies) if(!e.dead){ e.pose(0); e.syncRoot(); } else e.syncRoot();
  player.root.position.copy(player.pos); player.root.rotation.x=0; player.root.rotation.y=player.yaw;
}
function syncScrub(){ const F=replay.frames; const s=document.getElementById("rpScrub"); s.value=Math.round(replay.idx/(F.length-1)*1000);
  document.getElementById("rpTime").textContent=`${(F[replay.idx].t-F[F.length-1].t).toFixed(2)}s`; document.getElementById("rpPlay").textContent=replay.playing?"Pause":"Play"; }
function updateReplay(rdt){
  const F=replay.frames; if(!F.length) return;
  if(replay.playing){ const tNow=F[replay.idx].t+rdt*replay.speed; while(replay.idx<F.length-1 && F[replay.idx+1].t<=tNow) replay.idx++; if(replay.idx>=F.length-1) replay.playing=false; }
  applyFrame(F[replay.idx]); syncScrub();
}
function updateReplayCam(rdt){
  const f=new THREE.Vector3(Math.sin(replay.yaw)*Math.cos(replay.pitch), Math.sin(replay.pitch), Math.cos(replay.yaw)*Math.cos(replay.pitch));
  const r=new THREE.Vector3(-Math.cos(replay.yaw),0,Math.sin(replay.yaw)); const sp=(keys.ShiftLeft||keys.ShiftRight?8:3)*rdt;
  const m=rawMove(); replay.pos.addScaledVector(f,m.y*sp).addScaledVector(r,m.x*sp);
  if(keys.KeyE) replay.pos.y+=sp; if(keys.KeyQ) replay.pos.y-=sp;
  replay.yaw -= pad.look.x*CFG.ctrl.padLook*rdt; replay.pitch=clamp(replay.pitch-pad.look.y*CFG.ctrl.padLook*rdt,-1.5,1.5);
  camera.position.copy(replay.pos); camera.lookAt(replay.pos.clone().add(f)); if(camera.fov!==60){ camera.fov=60; camera.updateProjectionMatrix(); }
}
document.getElementById("rpPlay").onclick=e=>{ if(replay.idx>=replay.frames.length-1) replay.idx=0; replay.playing=!replay.playing; e.target.blur(); };
document.getElementById("rpExit").onclick=e=>{ exitReplay(); e.target.blur(); };
document.getElementById("rpSpeed").onchange=e=>{ replay.speed=+e.target.value; e.target.blur(); };
document.getElementById("rpScrub").oninput=e=>{ replay.playing=false; replay.idx=Math.round(e.target.value/1000*(replay.frames.length-1)); };

// ================================================================ HUD
const $=id=>document.getElementById(id);
function updateHud(){
  const f=player.hp/CFG.norah.hp; $("hpfill").style.width=(f*100)+"%"; $("hpfill").style.background = f>0.6?"#7da35a":f>0.3?"#c9a24a":"#b03a2a";
  $("hptext").textContent = `${Math.ceil(player.hp)}  ${f>0.6?"FINE":f>0.3?"CAUTION":"DANGER"}`;
  let s=""; for(let i=0;i<CFG.rev.chambers;i++) s+=`<span class="${i<player.rounds?"full":""}"></span>`; $("chambers").innerHTML=s;
  $("spare").textContent = CFG.rev.infinite?" ∞":` +${player.spare}`;
  const bits=[]; if(player.reloading>0) bits.push(`reloading ${player.reloading.toFixed(1)}s`); if(player.hammer>0) bits.push(`hammer ${player.hammer.toFixed(2)}s`); if(player.shoveCd>0) bits.push(`shove ${player.shoveCd.toFixed(1)}s`);
  if(player.dodge>0) bits.push(player.dodge > CFG.norah.dodgeTime*(1-CFG.norah.dodgeIframes) ? "rolling (invulnerable)" : "rolling");
  if(CFG.world.timeScale<1) bits.push(`time ×${CFG.world.timeScale}`);
  if(player.dazed>0) bits.push("DAZED");
  $("cool").textContent = bits.join(" · ");
  renderQte();
  const fixed=isFixed();
  $("reticle").style.display = player.aiming && !fixed ?"block":"none"; $("reticle").className = "hud "+(player.hammer>0||player.reloading>0?"wait ":"")+(aimOverCheck(fixed)?"on":"");
  $("aimline").textContent = player.aiming && fixed ? (player.aimTarget?`Aiming at ${player.aimTarget.name} · ${player.aimHeight>0?"HIGH (head)":player.aimHeight<0?"LOW (legs)":"body"}`:"Aiming: no target in front") : "";
  { const vis=playerVis(), nr=Math.max(0,hudNoise.r*(1-(gameTime-hudNoise.t)/0.8));
    $("stealthline").textContent = `SEEN ${"▮".repeat(Math.round(vis*6))}${"▯".repeat(6-Math.round(vis*6))} ${Math.round(vis*100)}% · NOISE ${nr>0.05?nr.toFixed(1)+" m":"–"}${player.crouch?" · CROUCHED":""}`; }
  updateTags(); sbHud();
  { const v = !player.vault && !player.dead && !player.grabbed ? findVault() : null;
    $("vaultline").textContent = player.vault ? (player.vault.fast?"VAULTING (fast, loud)":"VAULTING (slow, quiet)") : v ? `${pad.connected?"LB":"SPACE"}: vault over the ${v.box.name||"obstacle"} · ${pad.connected?"B+LB":"SHIFT+SPACE"}: fast and loud` : ""; }
  $("runline").textContent = run ? `${run.name} · ${run.t.toFixed(1)}s · shots ${run.shots} · hits ${run.hits}${run.shots?` (${Math.round(run.hits/run.shots*100)}%)`:""} · dmg taken ${Math.round(run.dmgTaken)}` : "";
  const info=$("enemyinfo");
  if(info && !$("panel").classList.contains("hidden")) info.textContent = enemies.filter(e=>!e.dead).map(e=>`${e.name.padEnd(10)} body ${e.hp.toFixed(1)}/${e.maxHp}  ${e.state}${e.stagger>0?" "+e.stagger.toFixed(2):""}\n  ${Object.keys(e.limbHp).map(k=>e.lost[k]?k+":off":k+":"+Math.max(0,e.limbHp[k]).toFixed(1)).join(" ")}`).join("\n") || "(none alive)";
}

// ================================================================ awareness markers over their heads
const tagLayer=document.createElement("div"); document.body.appendChild(tagLayer);
function updateTags(){
  const r=canvas.getBoundingClientRect(), on=CFG.stealth.indicators && !replay.on;
  for(const e of enemies){
    if(e.kind!=="across"){ continue; }
    if(!e.tag){ e.tag=document.createElement("div"); e.tag.style.cssText="position:fixed;transform:translate(-50%,-100%);font:bold 16px 'Courier New';text-shadow:1px 1px 0 #000;pointer-events:none;text-align:center"; tagLayer.appendChild(e.tag); }
    const show = on && !e.dead; if(!show){ e.tag.style.display="none"; continue; }
    const v=new THREE.Vector3(e.pos.x,(e.height||1.8)*(e.stance==="crawling"?0.55:1)+0.15+groundY(e.pos.x,e.pos.z),e.pos.z).project(camera);
    if(v.z>1){ e.tag.style.display="none"; continue; }
    let html="";
    if(e.aware==="hunting" && e.huntFlash>0) html=`<span style="color:#ff4a3a">!</span>`;
    else if(e.aware==="suspicious") html=`<span style="color:#ffd040">?</span>`;
    else if(e.aware==="searching") html=`<span style="color:#ff9a40">?</span>`;
    if(e.aware!=="hunting" && e.awareness>0.04) html+=`<div style="width:26px;height:3px;background:#0008;margin:1px auto"><div style="height:100%;width:${Math.min(100,e.awareness*100)}%;background:#ffd040"></div></div>`;
    e.tag.style.display=html?"block":"none"; e.tag.innerHTML=html; e.tag.style.left=((v.x+1)/2*r.width)+"px"; e.tag.style.top=((1-v.y)/2*r.height)+"px";
  }
}

// ================================================================ panel
let spawnVariant="walker", spawnIdle="hunting";
let currentSlot = LS.get("crossed_playground_slotname", null);
const SCHEMA = [
  ["Run", "A map starts the same way every time (seeded randomness), so you can compare settings.", [["scenario"],["chk","world.budget","Ammo budget: Chapter One supply (5 loaded + 7)"],["results"]]],
  ["Spawn & world", "Quick spawns use the map's enemy markers in turn, or appear in front of Norah if it has none.", [["btns"],
    ["world.timeScale","Time scale",0.1,1,0.05],["world.res","Resolution (px wide)",240,960,40],["world.fog","Fog",0,0.12,0.005],
    ["world.doorHp","Door: Louis hits to break",1,10,1],["world.doorScratch","Door: ACROSS scratch damage",0,1,0.05],
    ["chk","world.freezeAI","Freeze AI"],["chk","world.showZones","Show hit zones (H)"],["info"]]],
  ["Camera & controls", null, [["cam"],["norah.keyTurn","Turn speed (°/s)",60,360,5],["ctrl.camDist","Shoulder cam: distance",0.6,4,0.05],["ctrl.camSide","Shoulder cam: to the side",0,1,0.02],["ctrl.camHeight","Shoulder cam: height",1.2,2.2,0.02],["ctrl.aimDist","Aiming cam: distance",0.4,2.5,0.05],["ctrl.aimSide","Aiming cam: to the side",0,1,0.02],["ctrl.aimHeight","Aiming cam: height",1.2,2,0.02],["ctrl.mouseSens","Mouse / touch speed",0.2,3,0.1],["ctrl.padLook","Controller look speed",0.5,6,0.1],
    ["chk","ctrl.invertY","Invert look"],["chk","ctrl.touch","Touch controls"],["ctrl.volume","Volume",0,1,0.05],["pad"]]],
  ["Physics", "Momentum and weight. Masses: Norah 60 kg, ACROSS about 45–75 kg by build, Louis 170 kg.", [
    ["chk","phys.on","Physics on (off = instant starts and stops, like before)"],["chk","phys.bodyCheck","Heavy bodies bowl lighter ones over"],
    ["phys.norahAccel","Norah: speed-up (m/s²)",2,40,0.5],["phys.norahDecel","Norah: slow-down (m/s²)",2,40,0.5],["phys.aimAccel","Norah: speed-up while aiming",1,30,0.5],
    ["phys.acrossAccel","ACROSS: speed-up",2,30,0.5],["phys.acrossDecel","ACROSS: slow-down",2,30,0.5],["phys.bruteAccel","Louis: speed-up",0.5,15,0.25],["phys.bruteDecel","Louis: slow-down",0.5,15,0.25],
    ["phys.skid","Skid friction (falls, missed lunges)",2,40,0.5],["phys.momentumTrip","Trips from turning at speed",0,3,0.05],
    ["phys.bulletPush","Bullet push (×zone knockback)",0,400,5],["phys.shovePush","Shove push",0,400,5],["phys.knockPush","Knockdown push",0,300,5],
    ["phys.haymakerPush","Haymaker push on Norah",0,800,10],["phys.lungePush","Lunge push on Norah",0,400,5],["phys.swipePush","Swipe push on Norah",0,300,5],["phys.recoilPush","Recoil push on Norah (m/s)",0,2,0.05],
    ["phys.norahMass","Norah's weight (kg)",30,120,1],["phys.acrossMass","ACROSS weight ×",0.3,3,0.05],["phys.bruteMass","Louis's weight (kg)",60,400,5],["phys.furnitureWeight","Furniture weight ×",0.2,5,0.1]]],
  ["Stealth", "Norah: crouch with Q (or X). ACROSS go unaware → suspicious (?) → hunting (!) → searching (?), then give up.", [
    ["chk","stealth.startUnaware","Spawned ACROSS start unaware (wandering)"],["chk","stealth.indicators","Show ? and ! over their heads"],["chk","stealth.showNoise","Show noise rings"],
    ["stealth.ambient","Darkness: ambient light",0,0.6,0.01],["stealth.crouchVis","Crouched: how visible ×",0.1,1,0.05],["stealth.crouchSpeed","Crouched: speed (m/s)",0.3,2,0.05],
    ["stealth.sightRange","Sight range in full light (m)",3,30,0.5],["stealth.sightCone","Sight cone (°)",30,240,5],["stealth.sightRate","How fast they notice",0.2,5,0.05],["stealth.decay","How fast they forget",0,2,0.05],
    ["stealth.loseTime","Lose her after out of sight (s)",1,15,0.5],["stealth.searchTime","Search for (s)",2,30,0.5],["stealth.wanderRadius","Wander radius (m)",1,10,0.5],["stealth.shareRange","Shriek alerts others within (m)",0,20,0.5],
    ["stealth.gunNoise","Noise: gunshot (m)",5,50,1],["stealth.runNoise","Noise: running",0,15,0.5],["stealth.walkNoise","Noise: walking",0,8,0.1],["stealth.crouchNoise","Noise: crouch-walking",0,4,0.1],["stealth.aimNoise","Noise: walking while aiming",0,6,0.1],
    ["stealth.reloadNoise","Noise: reloading",0,8,0.1],["stealth.doorNoise","Noise: opening a door",0,10,0.5],["stealth.slamNoise","Noise: slamming a door",0,25,0.5],["stealth.pushNoise","Noise: pushing furniture",0,15,0.5],["stealth.shoveNoise","Noise: shoving",0,10,0.5],["stealth.glassNoise","Noise: breaking glass",0,30,0.5],["stealth.slowVaultNoise","Noise: slow vault",0,6,0.1],["stealth.fastVaultNoise","Noise: fast vault (and landing)",0,20,0.5]]],
  ["See what's happening", "P pauses · . steps one frame · Y replays the last 10 s · G toggles the overlays", [
    ["chk","debug.rings","Attack reach rings (yellow = winding up, red = hit frame)"],["chk","debug.cone","Aim-assist cone"],["chk","debug.dodgeBar","Dodge timeline (green = invulnerable)"],["chk","debug.attackLog","Log every attack check"],["dbgbtns"]]],
  ["Revolver", null, [
    ["rev.damage","Damage per shot",0.25,4,0.25],["rev.chambers","Chambers",1,8,1],["rev.spare","Spare rounds (scenarios)",0,60,1],["rev.hammer","Hammer delay (s)",0.1,2.5,0.05],
    ["rev.reloadBase","Reload: open+close",0,2,0.05],["rev.reloadPerRound","Reload: per round",0,1,0.05],
    ["rev.recoil","Recoil kick",0,0.3,0.01],["rev.shake","Screen shake",0,1,0.05],["rev.hitstop","Hit freeze (s)",0,0.25,0.01],["rev.killSlowmo","Kill slow-mo (s)",0,2,0.05],
    ["chk","rev.assist","Aim assist on aim press (shoulder camera)"],["rev.assistAngle","Assist angle (°)",0,90,1],["rev.assistRange","Assist range (m)",1,20,0.5],
    ["rev.aimFriction","Aim slows over a target ×",0.1,1,0.05],["rev.fixedAimAngle","Fixed-cam auto-aim angle",10,180,5],["rev.fixedAimRange","Fixed-cam auto-aim range",2,30,0.5],["chk","rev.infinite","Infinite ammo"]]],
  ["Norah", null, [
    ["norah.hp","Health",10,300,5],["norah.walk","Walk (m/s)",0.5,4,0.1],["norah.run","Run (m/s)",1,8,0.1],["norah.backpedal","Tank: backpedal ×",0.2,1,0.05],["norah.aimWalk","Move while aiming (m/s)",0,2,0.05],["norah.fireSlow","Speed × just after a shot",0,1,0.05],["norah.fireSlowTime","Slowdown after a shot (s)",0,1,0.05],
    ["norah.dodgeDist","Dodge distance",0.5,6,0.1],["norah.dodgeTime","Dodge time (s)",0.2,1.5,0.05],["norah.dodgeIframes","Dodge i-frames (share)",0,1,0.05],
    ["norah.stumble","Stumble when hit (s)",0,2,0.05],["norah.bleedAt","Bleeds a trail below (share of health)",0,1,0.05],["norah.dripGap","Blood drop every (m)",0.3,4,0.1],["norah.pushStep","Push per E press (m)",0.02,0.5,0.01],["norah.slowVault","Slow vault time (s)",0.5,3,0.05],["norah.fastVault","Fast vault time (s)",0.2,1.5,0.05],["norah.vaultReach","Vault reach (m)",0.3,1.5,0.05],["norah.vaultMaxH","Highest vaultable (m)",0.6,1.8,0.05],
    ["norah.shoveRange","Shove range",0.5,3,0.1],["norah.shoveCooldown","Shove cooldown",0.1,4,0.1],["norah.shoveStunSmall","Shove stun: small",0,3,0.05],["norah.shoveStunBig","Shove stun: Brute",0,2,0.05],["norah.shoveDamage","Shove damage",0,1,0.05],
    ["chk","norah.god","God mode"]]],
  ["Louis (Brute)", "Health and height apply to new spawns", [
    ["brute.hp","Body health",1,30,0.5],["brute.bigArm","Big arm health",1,10,0.5],["brute.limb","Other limbs health",1,10,0.5],["brute.height","Height (m)",1.8,3.5,0.05],
    ["brute.walk","Walk speed",0.3,3,0.05],["brute.turn","Turn rate (°/s)",20,360,5],["brute.reach","Haymaker reach",1,4,0.1],["brute.windup","Haymaker wind-up (tell)",0.2,2,0.05],
    ["brute.swing","Swing time",0.1,1,0.05],["brute.recover","Recovery",0.1,3,0.05],["brute.damage","Haymaker damage",0,100,1],
    ["brute.rakeReach","Rake reach",0.5,3,0.1],["brute.rakeWindup","Rake wind-up",0.1,1.5,0.05],["brute.rakeDamage","Rake damage",0,60,1],
    ["brute.dragSpeed","One leg: speed ×",0.1,1,0.05],["brute.crawlSpeed","No legs: speed ×",0.05,1,0.05],
    ["brute.hearing","Hunting: hearing ×",0.2,3,0.05],["brute.trailSense","Hunting: follows blood within (m)",0,25,0.5],["brute.doorDamage","Door damage per hit (doors take 3)",0.5,3,0.25],["brute.wallHp","Weak walls: hits to break",1,10,0.5],["brute.wallSense","Goes through weak walls toward her within (m)",0,20,0.5],
    ["brute.chargeWindup","Charge: tell (head down, s)",0.2,2,0.05],["brute.chargeSpeed","Charge: speed (m/s)",2,14,0.25],["brute.chargeTime","Charge: longest run (s)",0.3,4,0.1],["brute.chargeDamage","Charge: damage",0,80,1],["brute.chargeDown","Charge: time on the floor (s)",0,3,0.05],["brute.chargeStun","Charge: stagger after hitting a solid wall (s)",0,5,0.1],["brute.chargeCool","Charge: cooldown (s)",0,30,0.5],["brute.chargeMin","Charge: from at least (m)",1,10,0.25],["brute.chargeMax","Charge: from at most (m)",3,30,0.5],["brute.chargeMaxVol","Charge: furniture he can send flying (m³)",0,6,0.1],["brute.slamWindup","Ground slam: tell (arms up, s)",0.2,2,0.05],["brute.slamRadius","Ground slam: radius (m)",0.5,5,0.1],["brute.slamDamage","Ground slam: damage",0,60,1],["brute.slamDown","Ground slam: time on the floor (s)",0,3,0.05],["brute.slamCool","Ground slam: cooldown (s)",0,20,0.5],["brute.slamRecover","Ground slam: recovery (punish window, s)",0.2,4,0.05],
    ["brute.grabWindup","Grab: tell (s)",0.1,2,0.05],["brute.grabReach","Grab: reach (m)",0.5,3,0.05],["brute.grabSteps","Grab: prompts to break free",1,6,1],["brute.grabDamage","Grab: squeeze damage",0,40,1],["brute.grabCool","Grab: cooldown (s)",0,20,0.5],
    ["brute.throwSpeed","Throw: speed she flies (m/s)",2,16,0.5],["brute.throwDamage","Throw: damage",0,60,1],["brute.throwWallDamage","Throw: extra damage hitting a wall",0,60,1],["brute.throwDown","Throw: time on the floor (s)",0,3,0.05],
    ["brute.liftTime","Furniture: lift time (tell, s)",0.2,3,0.05],["brute.furnSpeed","Furniture: throw speed (m/s)",3,20,0.5],["brute.furnDamage","Furniture: damage",0,60,1],["brute.furnCool","Furniture: cooldown (s)",0,30,0.5],["brute.furnMin","Furniture: only when she's further than (m)",1,10,0.5],["brute.furnMaxVol","Furniture: biggest he lifts (m³)",0.1,3,0.05]]],
  ["ACROSS", "Nine subclasses, each with its own body, clothes and fighting rules on top of these sliders. Health applies to new spawns. 1 = random subclass, 4 = random upright one, 5 = Crawler.", [
    ["variants"],
    ["across.hp","Body health",0.5,10,0.5],["across.limb","Limb health",0.5,5,0.5],
    ["across.speed","Burst top speed",0.5,7,0.1],["across.crawlerSpeed","Crawler speed ×",0.2,1.5,0.05],["across.turn","Turn rate (°/s)",60,900,10],["across.erratic","Heading snaps",0,2,0.05],
    ["across.burstMin","Burst: shortest (s)",0.05,1.5,0.05],["across.burstMax","Burst: longest (s)",0.05,2,0.05],["across.stallMin","Stall: shortest (s)",0,1.5,0.05],["across.stallMax","Stall: longest (s)",0,2,0.05],
    ["across.tripChance","Trips per second at speed",0,3,0.05],["across.crawlTrip","Crawler trips ×",0,1.5,0.05],["across.landTrip","Falls after a lunge",0,1,0.05],["across.fallTime","Time on the floor (s)",0.2,3,0.05],["across.riseTime","Scramble up (s)",0.1,1.5,0.05],["across.jerk","Jerkiness",0,2,0.05],
    ["across.lungeRange","Lunge range",1,6,0.1],["across.lungeWindup","Lunge tell",0.05,1,0.05],["across.lungeSpeed","Lunge speed",2,16,0.5],["across.lungeTime","Lunge time",0.1,1,0.05],
    ["across.damage","Lunge damage",0,60,1],["across.recover","Recovery",0.1,3,0.05],
    ["across.jawShot","Head shot takes the jaw (chance)",0,1,0.05],["across.hitboxScale","Hitbox size × (new spawns)",0.6,1.6,0.05],["across.limbHitbox","Limb hitbox thickness × (new spawns)",0.5,2,0.05],
    ["across.tellGap","Swarm: time between attack tells (s)",0,1.5,0.05],["across.maxAttackers","Pack: attackers at once (99 = no cap)",1,99,1],["across.circleDist","Pack: circling distance",1.5,6,0.1],
    ["across.legShotFall","Knockdown: leg shot",0,1,0.05],["across.torsoFall","Knockdown: torso shot",0,1,0.05],["across.headFall","Knockdown: head shot",0,1,0.05],["across.shoveFall","Knockdown: shove",0,1,0.05],
    ["across.punish","Stagger × when shot while it recovers",1,4,0.1],["across.grabDamage","Grab: damage (grab and bite)",0,40,1],["chk","across.hugMash","Bear hug: mash one key instead of prompts"],["across.hugTime","Bear hug: time to break it (s)",0.8,6,0.1],["across.mashPer","Bear hug: fill per press",0.03,0.4,0.01],["across.mashDecay","Bear hug: meter drains per second",0,1.5,0.05],["across.qteSteps","Grab: prompts to push off",1,6,1],["across.hugSteps","Bear hug: prompts",1,8,1],["across.qteWindow","Grab: time per prompt (s)",0.3,2,0.05],["across.qteSlow","Grab: time speed during it",0.1,1,0.05],["chk","across.smoke","Brand smokes"],
    ["across.swipeRange","Swipe reach",0.5,2,0.05],["across.swipeWindup","Swipe tell",0.05,0.6,0.01],["across.swipeDamage","Swipe damage",0,40,1],["across.swipeCool","Swipe cooldown",0.2,3,0.05],["across.dragSpeed","One leg: speed ×",0.1,1,0.05],["across.crawlSpeed","No legs: speed ×",0.05,1,0.05]]],
  ["ACROSS · Walker", "The swarm. Shambles from afar; inside its close range it bursts, stalls and shambles. Bites Norah when she's down. Follows the crowd when it loses her. Each wound slows it.", [
    ["across.walkerShamble","Shamble speed (m/s)",0.2,3,0.05],["across.walkerClose","Bursts start within (m)",0,10,0.25],["across.walkerBurst","Burst speed (m/s)",0.5,5,0.05],
    ["across.walkerBurstMin","Burst: shortest (s)",0.05,2,0.05],["across.walkerBurstMax","Burst: longest (s)",0.05,2,0.05],["across.walkerStallMin","Stall: shortest (s)",0,2,0.05],["across.walkerStallMax","Stall: longest (s)",0,2,0.05],
    ["across.walkerGapMin","Shamble between bursts: shortest (s)",0,3,0.05],["across.walkerGapMax","Shamble between bursts: longest (s)",0,3,0.05],
    ["across.walkerBiteTell","Bite: tell (s)",0.05,1,0.05],["across.walkerBiteDamage","Bite: damage",0,40,1],["across.walkerBiteRange","Bite: reach (m)",0.5,2.5,0.05],
    ["across.walkerWoundSlow","Each wound: speed ×",0.5,1,0.01],["across.walkerMinSpeed","Wounds: slowest it gets ×",0.1,1,0.05],
    ["across.walkerMob","Mob: pull toward other Walkers",0,1,0.05],["across.walkerMobRange","Mob: counts Walkers within (m)",1,15,0.5]]],
  ["ACROSS · Crawler", "The ambusher. Slow and weak in the open. Moves cover to cover toward Norah, then holds a hiding spot and grabs her ankle as she passes. Caught in the open it flees, or swipes if cornered. Hurt, it retreats and comes back from another side.", [
    ["across.crawlerHp","Health",0.5,10,0.5],["across.crawlerSpeed","Speed in the open (m/s)",0.2,3,0.05],["across.crawlerFlee","Flee speed (m/s)",0.5,5,0.1],
    ["across.crawlerHold","Stops advancing within (m)",1,15,0.5],["across.crawlerAmbush","Ambush range (m)",0.5,4,0.1],["across.crawlerAmbushTell","Ambush tell (s)",0,1,0.05],
    ["across.crawlerPauseMin","Pause at each hiding spot: shortest (s)",0,5,0.1],["across.crawlerPauseMax","Pause at each hiding spot: longest (s)",0,8,0.1],
    ["across.crawlerCornered","Fights back when she's within (m)",0,4,0.1],["across.crawlerSwipeDamage","Cornered swipe damage",0,40,1],
    ["across.crawlerRetreatMin","Hides after a hit: shortest (s)",0,20,0.5],["across.crawlerRetreatMax","Hides after a hit: longest (s)",0,30,0.5],["across.crawlerNewSide","Comes back from a side at least (°) off",0,180,5],
    ["across.crawlerDark","Dark enough to hide in (light level)",0,0.6,0.01]]],
  ["ACROSS · Matron", "The holder. Slow, steady and hard to stop. Bear hugs Norah (mash to escape), shoves her down when she's too close for a hug, swipes while the hug is on cooldown. Batters a door between her and Norah; otherwise guards the last spot she saw her.", [
    ["across.matronHp","Health",0.5,15,0.5],["across.matronSpeed","Walk speed (m/s)",0.2,3,0.05],["across.matronStagger","Staggers ×",0,1,0.05],["across.matronKnock","Knockdown chance ×",0,1,0.05],
    ["across.matronHugRange","Bear hug: reach (m)",0.5,3,0.05],["across.matronHugTell","Bear hug: tell (arms open, s)",0.1,1.5,0.05],["across.matronHugDamage","Bear hug: squeeze damage",0,40,1],["across.matronHugCool","Bear hug: cooldown (s)",0,15,0.5],
    ["across.matronShoveRange","Shove: when she's closer than (m)",0.3,2,0.05],["across.matronShoveTell","Shove: tell (s)",0.1,1.5,0.05],["across.matronShoveDamage","Shove: damage",0,40,1],["across.matronShoveDown","Shove: time on the floor (s)",0,3,0.05],["across.matronShoveCool","Shove: cooldown (s)",0,15,0.5],
    ["across.matronDoorDamage","Battering a door: damage per hit (doors take 3)",0.1,3,0.05],["across.matronBatterRate","Battering a door: seconds between hits",0.3,4,0.1],
    ["across.joinKeys","Second grab: extra keys",0,6,1],["across.joinDrain","Second grab: hug bar drops by",0,1,0.05]]],
  ["ACROSS · Mourner", "The stationary mourner. Kneels over a body and ignores Norah until she comes too close, hits it, or holds the flashlight on it. Then it wails, calling the others. Every hit pushes it up a stage: 1 stands and wails, 2 lunges, 3 sprints in a frenzy and its wail reaches the whole map. Up close it screams in her face (a stun) or clings to her. If it loses her it goes back to the body and calms down fully. 3 headshots kill it.", [
    ["across.mournerHp","Health (a headshot does 2)",1,20,0.5],["across.mournerNear","Wakes when she's closer than (m)",0.5,10,0.25],["across.mournerCrouch","…crouched, that distance ×",0,1,0.05],
    ["across.mournerLight","Wakes after the flashlight is on it for (s)",0.1,5,0.1],["across.mournerLightRange","Flashlight: reach (m)",1,20,0.5],["across.mournerLightCone","Flashlight: beam width (°)",5,90,1],["across.mournerCalm","Calms down after losing her for (s)",1,30,0.5],
    ["across.mournerCall1","Wail reach, stage 1 (m)",0,99,1],["across.mournerCall2","Wail reach, stage 2 (m)",0,99,1],["across.mournerCall3","Wail reach, stage 3 (m, 99 = whole map)",0,99,1],
    ["across.mournerWailGap1","Seconds between wails, stage 1",0.5,15,0.5],["across.mournerWailGap2","Seconds between wails, stage 2",0.5,15,0.5],["across.mournerWailGap3","Seconds between wails, stage 3",0.5,15,0.5],["across.mournerClingWail","Seconds between wails while clinging",0.3,6,0.1],
    ["across.mournerLunge","Stage 2: lunge speed (m/s)",0.5,6,0.1],["across.mournerLungeTime","Stage 2: lunge length (s)",0.1,2,0.05],["across.mournerLungePause","Stage 2: pause between lunges (s)",0,3,0.05],["across.mournerSprint","Stage 3: sprint speed (m/s)",0.5,7,0.1],
    ["across.mournerScreamRange","Scream: range (m)",0.5,6,0.1],["across.mournerScreamTell","Scream: tell (s)",0.1,1.5,0.05],["across.mournerScreamCool","Scream: cooldown (s)",0.5,15,0.5],
    ["across.mournerStun1","Scream stun, stage 1 (s)",0,3,0.05],["across.mournerStun2","Scream stun, stage 2 (s)",0,3,0.05],["across.mournerStun3","Scream stun, stage 3 (s)",0,3,0.05],
    ["across.mournerClingRange","Cling: reach (m)",0.5,3,0.05],["across.mournerClingTell","Cling: tell (s)",0.05,1,0.05],["across.mournerClingCool","Cling: cooldown (s)",0.5,15,0.5],
    ["across.mournerClingDamage1","Cling damage, stage 1",0,40,1],["across.mournerClingDamage2","Cling damage, stage 2",0,40,1],["across.mournerClingDamage3","Cling damage, stage 3",0,40,1],
    ["across.mournerSwipe1","Swipe damage, stage 1",0,40,1],["across.mournerSwipe2","Swipe damage, stage 2",0,40,1],["across.mournerSwipe3","Swipe damage, stage 3",0,40,1],
    ["across.mournerStagger1","Staggers ×, stage 1",0,1.5,0.05],["across.mournerStagger2","Staggers ×, stage 2",0,1.5,0.05],["across.mournerStagger3","Staggers ×, stage 3",0,1.5,0.05]]],
  ["ACROSS · Animation", "How the new models move. Their own walk and run clips drive the legs while they hunt; the procedural puppet (lurches, stalls, twitches, attacks) drives everything else and takes over the legs for attacks, falls and crawling. Hits snap the struck part: the head back, the shoulder round, the leg out from under it.", [
    ["across.animClip","Leg clips: how much (0 = all procedural)",0,1,0.05],["across.animWalkRef","Walk clip matches (m/s)",0.3,3,0.05],["across.animRunRef","Run clip matches (m/s)",1,6,0.1],["across.animRunMix","How much of the run clip in a burst (lower = more of a jog)",0,1,0.05],
    ["across.animSnap","Puppet snap (0 = smooth)",0,3,0.05],["across.animFlinch","Hit flinch strength",0,3,0.05],["across.animFlinchTime","Hit flinch length (s)",0.1,1.2,0.05]]],
  ["Norah · Movement", "Her walk and a reluctant, short jog. Three states by health: fine (upright, wary, the odd glance back); hurt (bleeding: left hand clutching her side, and now and then a staggered step on the right leg, more often as she gets worse); critical (a full limp every step, hunched, dragging the right leg, lurching when it gives, heavy breathing). Only her jog slows down; her walk keeps its pace.", [
    ["norah.hurtAt","Hurt below (share of health)",0.1,1,0.05],["norah.critAt","Critical below (share of health)",0.05,0.9,0.05],["norah.hurtSpeed","Hurt: jog speed × (walk unchanged)",0.3,1,0.05],["norah.critSpeed","Critical: jog speed × (walk unchanged)",0.2,1,0.05],["norah.jogStride","Jog stride (leg swing)",0.2,1.2,0.05]]],
  ["ACROSS · Movement types", "Three ways an ACROSS moves, a ladder that wounds push it down. Marionette (the healthy default): upright, jerked along on strings, head lolling, arms dangling, feet dragging then kicking; quick heading snaps. Lurcher: a stiff right leg swung round, body tilted, heavy lurching steps with near-stops between. Puller: down on the floor, hauling itself at her arm over arm, flailing harder when she's close; it grabs ankles and slips under furniture. Some spawn lower on the ladder whatever their subclass (the Crawler keeps its own crawl; a Mourner never becomes a Puller). A map can force where each one starts.", [
    ["across.moveLurcherChance","Chance one spawns as a Lurcher",0,1,0.05],["across.movePullerChance","Chance one spawns as a Puller",0,1,0.05],
    ["across.moveDegLurch","Becomes a Lurcher below (share of health; a leg wound does it too)",0,1,0.05],["across.moveDegPull","Drops to a Puller below (share of health)",0,1,0.05],
    ["across.moveLurchSpeed","Lurcher speed ×",0.2,1.5,0.05],["across.movePullSpeed","Puller speed ×",0.1,1.5,0.05]]],
  ["Runner (BCROSS)", "The sprinter. Restless and watchful, stomps toward her, and from 3.5–15 m curls in and charges: a plain sprint into a kick, a shoulder butt, a sprint grab (break free and it reels back; fail and it crushes her and drops her to a knee) or, very rarely, a drop kick on an impact frame. Up close it kicks, or stamps through her knee when she's down. Shots barely move it while it charges.", [
    ["runner.hp","Health",1,40,0.5],["runner.walk","Walk speed (m/s)",0.5,4,0.05],["runner.sprint","Sprint speed (m/s)",3,14,0.25],["runner.homing","Sprint steering (°/s; lower = easier to sidestep)",0,300,5],
    ["runner.charge","Charge-up before a sprint (s)",0.1,1.5,0.05],["runner.sprintMin","Sprints from at least (m)",1.5,10,0.25],["runner.sprintMax","…and at most (m)",4,30,0.5],["runner.sprintCool","Seconds between sprints",0.5,15,0.25],
    ["runner.buttChance","Sprint: shoulder butt chance",0,1,0.05],["runner.grabChance","Sprint: grab chance",0,1,0.05],["runner.dropChance","Sprint: drop kick chance (rare)",0,1,0.01],
    ["runner.buttDamage","Shoulder butt damage",0,80,1],["runner.grabDamage","Grab damage (on the grab)",0,40,1],["runner.crushDamage","Crush damage (failed escape)",0,100,1],["runner.crushTime","Crush length (s)",0.3,4,0.1],["runner.kneel","On a knee after the crush or a stomp (s)",0,4,0.1],
    ["runner.dropDamage","Drop kick damage",0,150,1],["runner.dropThrow","Drop kick throw speed (m/s)",2,16,0.5],["runner.impactFreeze","Impact frame length (s)",0,0.6,0.02],
    ["runner.kickDamage","Forward kick damage",0,80,1],["runner.stompDamage","Stomp kick damage",0,80,1],["runner.stompChance","Kick: stomp chance (always when she's down)",0,1,0.05],["runner.chamber","Kick windup (s)",0.1,1,0.02],["runner.chamberHold","Kick: held charge (s)",0,0.8,0.02],["runner.kickCool","Seconds between kicks",0.3,8,0.1],
    ["runner.stunTime","Stunned after she breaks free (s)",0.2,3,0.1],["runner.stagger","Staggers ×",0,1.5,0.05],["chk","runner.afterimages","Afterimages"]]],
  ["Hit zones", "Damage × · knockback (m) · stagger (s)", [
    ["zones.headMult","Head ×",0,5,0.1],["zones.headKb","Head knockback",0,2,0.05],["zones.headStag","Head stagger",0,3,0.05],
    ["zones.torsoMult","Torso ×",0,5,0.1],["zones.torsoKb","Torso knockback",0,2,0.05],["zones.torsoStag","Torso stagger",0,3,0.05],
    ["zones.armMult","Arm ×",0,5,0.1],["zones.armKb","Arm knockback",0,2,0.05],["zones.armStag","Arm stagger",0,3,0.05],
    ["zones.legMult","Leg ×",0,5,0.1],["zones.legKb","Leg knockback",0,2,0.05],["zones.legStag","Leg stagger",0,3,0.05]]],
  ["Items & searching", "Containers you fill in the builder glint until searched. Searching pins Norah in place and makes noise.", [
    ["items.searchTime","Search time (s)",0.2,6,0.1],["items.searchNoise","Noise while searching (m)",0,10,0.25],["items.pickupRange","Pick-up reach (m)",0.5,3,0.05],
    ["items.pillHeal","Pills heal",0,100,1],["items.bandageHeal","Bandage heals",0,100,1],["items.kitHeal","First aid kit heals",0,100,1],
    ["items.flashDrain","Flashlight drain (charge/s)",0,0.05,0.001],["items.flashRange","Flashlight reach (m)",3,30,0.5],["items.flashAngle","Flashlight beam (°)",8,60,1],["items.flashVis","Flashlight: how visible it makes her",0,1,0.05],["chk","items.glints","Unsearched containers glint"]]],
  ["Saved settings", "Save the whole panel under a name and switch between versions.", [["slots"]]]
];
function getP(path){ const [a,b]=path.split("."); return CFG[a][b]; }
function setP(path,v){ const [a,b]=path.split("."); CFG[a][b]=v; }
function defP(path){ const [a,b]=path.split("."); return DEFAULTS[a][b]; }
const panel=$("panel"); const bound=[];
function el(tag, attrs={}, kids=[]){ const e=document.createElement(tag); for(const k in attrs){ if(k==="style") e.style.cssText=attrs[k]; else if(k.startsWith("on")) e[k]=attrs[k]; else if(k==="text") e.textContent=attrs[k]; else e.setAttribute(k,attrs[k]); } for(const c of kids) e.appendChild(c); return e; }
function button(t,f){ return el("button",{text:t,onclick:(ev)=>{ f(ev); ev.target.blur(); }}); }
function selectRow(label, options, value, onchange){
  const s=el("select"); for(const [v,t] of options){ const o=el("option",{value:v,text:t}); if(v===value) o.selected=true; s.appendChild(o); }
  s.onchange=()=>{ onchange(s.value); s.blur(); }; return el("div",{class:"sel"},[el("span",{text:label}), s]);
}
function buildPanel(){
  panel.innerHTML=""; bound.length=0;
  for(const [title,sub,rows] of SCHEMA){
    const h=el("h3",{text:title}); panel.appendChild(h); const box=el("div"); panel.appendChild(box);
    h.onclick=()=>{ h.classList.toggle("closed"); box.style.display=h.classList.contains("closed")?"none":""; };
    if(sub) box.appendChild(el("div",{class:"sub",text:sub}));
    for(const r of rows){
      const kind=r[0];
      if(kind==="scenario"){
        box.appendChild(el("div",{class:"sub",id:"mapnameline",text:"Map: "+(ED.doc?ED.doc.name:"")}));
        box.appendChild(el("div",{class:"btns"},[button("Restart map (N)",()=>loadScenario(scenarioKey)), button("Back to builder (B)",toBuild), button("Copy results",copyResults), button("Clear results",()=>{ results=[]; LS.set("crossed_playground_results",results); renderResults(); })]));
        continue; }
      if(kind==="results"){ box.appendChild(el("div",{id:"results"})); continue; }
      if(kind==="arena"){
        const opts=Object.entries(ARENAS).map(([k,a])=>[k,a.name]); if(importedMap) opts.push(["imported","Imported map"]);
        box.appendChild(selectRow("Arena", opts, CFG.world.arena||"open", v=>{ CFG.world.arena=v; saveCfg(); scenarioKey="sandbox"; clearEnemies(); buildArena(v); player.pos.set(world.spawn.x,0,world.spawn.z); player.yaw=camYaw=world.spawn.yaw; newRun("Sandbox · "+(ARENAS[v]?ARENAS[v].name:"Imported map")); refreshScenarioSel(); }));
        if(importedMap){ const lv=mapLevels(importedMap); if(lv.length>1) box.appendChild(selectRow("Map level", lv.map(l=>[String(l.id),l.name]), String(importLevel??lv[0].id), v=>{ importLevel=lv.find(l=>String(l.id)===v).id; LS.set("crossed_playground_maplevel",importLevel); if(world.name==="imported") loadScenario(scenarioKey==="imported"?"imported":"sandbox"); })); }
        continue; }
      if(kind==="import"){
        const msg=el("div",{class:"sub"}); const ta=el("textarea",{placeholder:"…or paste the Map Designer export JSON here"});
        const fi=el("input",{type:"file",accept:".json,application/json"}); fi.style.maxWidth="100%";
        const done=t=>{ msg.textContent=importMapText(t); if(importedMap){ CFG.world.arena="imported"; saveCfg(); buildPanel(); loadScenario("imported"); } };
        fi.onchange=()=>{ const f=fi.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=()=>done(String(rd.result)); rd.readAsText(f); };
        box.appendChild(el("div",{class:"sub",text:"Import a Map Designer export (.json). Walls, doors, windows, floors, stages, furniture-sized props, cameras, lights and spawn/enemy markers come across."}));
        box.appendChild(fi); box.appendChild(ta); box.appendChild(el("div",{class:"btns"},[button("Import pasted map",()=>done(ta.value))])); box.appendChild(el("label",{class:"chk"},[(()=>{ const c=el("input",{type:"checkbox"}); c.checked=CFG.world.propBlock; c.onchange=()=>{ CFG.world.propBlock=c.checked; saveCfg(); if(world.name==="imported"){ buildArena("imported"); } }; return c; })(), document.createTextNode("Furniture props block movement")])); box.appendChild(msg);
        continue; }
      if(kind==="btns"){ box.appendChild(el("div",{class:"btns"},[button("ACROSS (1)",()=>spawn("across")),button("Standing (4)",()=>spawn("across_stand")),button("Crawler (5)",()=>spawn("across_crawl")),button("Louis (2)",()=>spawn("brute")),button("Dummy (3)",()=>spawn("dummy")),button("3 ACROSS",()=>{spawn("across");spawn("across");spawn("across");}),button("Clear (0)",clearAll),
        button("Heal + refill",()=>{player.hp=CFG.norah.hp;player.rounds=CFG.rev.chambers;player.spare=CFG.rev.spare;if(player.dead)respawn();})])); continue; }
      if(kind==="info"){ box.appendChild(el("div",{id:"enemyinfo"})); continue; }
      if(kind==="variants"){ const desc=el("div",{class:"sub"}); const sel=selectRow("Subclass", VARIANTS.map(v=>[v.key,v.name]), spawnVariant, v=>{ spawnVariant=v; desc.textContent=VMAP[v].fights; });
        box.appendChild(sel); desc.textContent=VMAP[spawnVariant].fights; box.appendChild(desc);
        box.appendChild(selectRow("Starts", [["hunting","Hunting Norah"],["wander","Wandering (unaware)"],["stand","Standing still"],["feed","Feeding"],["playdead","Playing dead"],["lurk","Lurking"]], spawnIdle, v=>{ spawnIdle=v; }));
        box.appendChild(el("div",{class:"btns"},[button("Spawn it",()=>spawn("across:"+spawnVariant,undefined,undefined,spawnIdle==="hunting"?{aware:"hunting"}:{aware:"unaware",idle:spawnIdle})), button("One of each",()=>loadScenario("variety"))])); continue; }
      if(kind==="cam"){ box.appendChild(selectRow("Camera / controls", [["ots","Over the shoulder (default)"],["tank","Fixed cameras · tank controls"],["relative","Fixed cameras · camera-relative"]], CFG.ctrl.cam, v=>{ CFG.ctrl.cam=v; saveCfg(); activeCam=null; heldYaw=null; if(v==="ots"){ camYaw=player.yaw; } }));
        box.appendChild(el("div",{class:"sub",text:"Fixed cameras: aiming auto-targets the nearest threat in front; ↑/↓ (or the right stick) aims high or low, and WASD walks slowly while aiming. Camera-relative keeps your heading through a cut until you let go."})); continue; }
      if(kind==="pad"){ box.appendChild(el("div",{class:"sub",id:"padinfo",text:"No controller detected. Press a button on it to wake it up."})); continue; }
      if(kind==="dbgbtns"){ box.appendChild(el("div",{class:"btns"},[button("Pause (P)",togglePause),button("Step frame (.)",()=>{ if(!paused) togglePause(); stepFrames++; }),button("Replay last 10 s (Y)",enterReplay)])); continue; }
      if(kind==="slots"){ box.appendChild(el("div",{id:"slots"})); continue; }
      if(kind==="chk"){ const [,path,label]=r; const c=el("input",{type:"checkbox"}); c.checked=getP(path);
        c.onchange=()=>{ setP(path,c.checked); if(path==="world.showZones") setZoneView(c.checked); if(path==="ctrl.touch") showTouch(c.checked); saveCfg(); c.blur(); };
        box.appendChild(el("label",{class:"chk"},[c, document.createTextNode(label)])); bound.push({path,el:c,chk:true}); continue; }
      const [path,label,min,max,step]=r; const def=defP(path);
      const inp=el("input",{type:"range",min,max,step}); inp.value=getP(path);
      const v=el("span",{class:"v",text:fmt(getP(path))}); const lab=el("span",{text:label,title:"Default: "+def});
      const paint=()=>{ v.style.color = getP(path)!==def?"#e8c77a":"#cfc6b2"; };
      inp.oninput=()=>{ const x=parseFloat(inp.value); setP(path,x); v.textContent=fmt(x); paint(); if(path==="world.res") resize(); if(path==="world.fog") scene.fog.density=x; if(path==="rev.chambers") player.rounds=Math.min(player.rounds,x); saveCfg(); };
      inp.onchange=()=>inp.blur(); paint();
      box.appendChild(el("div",{class:"row"},[lab,inp,v])); bound.push({path,el:inp,v,paint});
    }
  }
  renderResults(); renderSlots();
}
function fmt(x){ return Number.isInteger(x)?String(x):x.toFixed(2); }
function refreshPanel(){ for(const b of bound){ if(b.chk) b.el.checked=getP(b.path); else { b.el.value=getP(b.path); b.v.textContent=fmt(getP(b.path)); b.paint(); } } saveCfg(); }
function refreshScenarioSel(){ const s=$("scenSel"); if(s) s.value=scenarioKey; }
function diffCfg(){ const o={}; for(const a in CFG) for(const b in CFG[a]) if(DEFAULTS[a] && CFG[a][b]!==DEFAULTS[a][b] && !["ctrl","debug"].includes(a) && !["res","fog","showZones","freezeAI","timeScale","arena"].includes(b)) (o[a]=o[a]||{})[b]=CFG[a][b]; return Object.keys(o).length?o:{note:"all defaults"}; }
function renderResults(){
  const d=$("results"); if(!d) return;
  if(!results.length){ d.innerHTML=`<div class="sub">No finished runs yet. A run ends when every enemy is down or Norah dies.</div>`; return; }
  d.innerHTML = `<table class="res"><tr><th>Run</th><th>Res</th><th>Time</th><th>Acc</th><th>Hd</th><th>Dmg</th><th>Ammo</th></tr>` +
    results.slice(0,12).map(r=>`<tr title="${r.when} · settings: ${r.slot} · shots ${r.shots} · limbs ${r.limbs} · dodges ${r.dodges} (${r.saves} saved) · shoves ${r.shoves}"><td>${r.name.slice(0,22)}<br><span style="color:#857c6b">${r.slot}</span></td><td style="color:${r.result!=="DIED"?"#9ed08a":"#e06a5a"}">${r.result==="WON"?"won":r.result==="ESCAPED"?"out":"died"}</td><td>${r.time}</td><td>${r.acc}%</td><td>${r.head}</td><td>${r.dmg}</td><td>${r.ammoLeft}</td></tr>`).join("") + `</table><div class="sub">Hover a row for more. Time is game time.</div>`;
}
function copyText(t, where){
  const msg=$("copymsg")||el("div",{id:"copymsg",class:"sub"}); where.appendChild(msg);
  const fallback=()=>{ msg.innerHTML="Couldn't reach the clipboard. Select and copy this:"; const ta=el("textarea"); ta.value=t; msg.appendChild(ta); };
  try{ navigator.clipboard.writeText(t).then(()=>msg.textContent="Copied. Paste it to Claude.",fallback); }catch(e){ fallback(); }
}
function copyResults(){ copyText(JSON.stringify({results:results.slice(0,12), settings:diffCfg()},null,1), $("results")); }
function renderSlots(){
  const d=$("slots"); if(!d) return; d.innerHTML=""; const slots=LS.get("crossed_playground_slots",{});
  const name=el("input",{type:"text",placeholder:"Name, e.g. Louis — hard"}); name.style.width="100%"; if(currentSlot) name.value=currentSlot;
  d.appendChild(name);
  d.appendChild(el("div",{class:"btns"},[button("Save",()=>{ const n=name.value.trim(); if(!n) return; slots[n]=clone(CFG); LS.set("crossed_playground_slots",slots); currentSlot=n; LS.set("crossed_playground_slotname",n); renderSlots(); }),
    button("Copy changed values",()=>copyText(JSON.stringify(diffCfg(),null,1), d)),
    button("Reset all to defaults",()=>{ const keep=clone(CFG.ctrl); CFG=clone(DEFAULTS); CFG.ctrl=keep; currentSlot=null; LS.set("crossed_playground_slotname",null); saveCfg(); resize(); setZoneView(false); scene.fog.density=CFG.world.fog; buildPanel(); })]));
  if(currentSlot) d.appendChild(el("div",{class:"sub",text:`Using: ${currentSlot}${slots[currentSlot]&&JSON.stringify(slots[currentSlot])!==JSON.stringify(CFG)?" (changed since saved)":""}`}));
  for(const n of Object.keys(slots)){
    d.appendChild(el("div",{class:"btns"},[el("span",{text:n,style:"flex:1;align-self:center"}), button("Load",()=>{ const keep=clone(CFG.ctrl); CFG=clone(DEFAULTS); deepMerge(CFG,slots[n]); CFG.ctrl=keep; currentSlot=n; LS.set("crossed_playground_slotname",n); saveCfg(); resize(); scene.fog.density=CFG.world.fog; setZoneView(CFG.world.showZones); buildPanel(); log(`Loaded settings: ${n}`,"#e8c77a"); }),
      button("Delete",()=>{ delete slots[n]; LS.set("crossed_playground_slots",slots); if(currentSlot===n){ currentSlot=null; LS.set("crossed_playground_slotname",null); } renderSlots(); })]));
  }
  d.appendChild(el("div",{class:"sub",text:"Saved in this browser. Controls and volume stay as they are when you load."}));
}
function togglePanel(){ panel.classList.toggle("hidden"); }
$("toggle").onclick=(e)=>{ togglePanel(); e.target.blur(); };
$("helpok").onclick=()=>{ audio(); $("help").style.display="none"; try{ const p=canvas.requestPointerLock(); if(p&&p.catch)p.catch(()=>{}); }catch(e){} };

// ================================================================ loop
let last = performance.now(), gameTime=0, frameNo=0;

function step(dt, rdt){
  updatePlayer(dt);
  for(const e of enemies) e.update(dt);
  updateDoors(dt);
  for(const d of debris){ if(d.rest) continue; d.v.y-=9.8*dt; d.o.position.addScaledVector(d.v,dt); d.cut.rotation.x+=d.spin.x*dt; d.cut.rotation.z+=d.spin.z*dt;
    const wp=new THREE.Vector3(); d.cut.getWorldPosition(wp); if(wp.y<groundY(wp.x,wp.z)+0.12 && d.v.y<0){ d.rest=true; d.cut.rotation.x=Math.PI/2; bloodPool(wp.x,wp.z,0.35); } }
  for(const p of pools){ if(p.t<1){ p.t=Math.min(1,p.t+dt*0.5); p.m.scale.setScalar(Math.max(0.05,p.max*p.t)); } }
  for(let i=sprays.length-1;i>=0;i--){ const s=sprays[i]; s.t-=dt; s.v.y-=9.8*dt; s.m.position.addScaledVector(s.v,dt); if(s.t<=0||s.m.position.y<groundY(s.m.position.x,s.m.position.z)){ scene.remove(s.m); sprays.splice(i,1); } }
  for(let i=smokes.length-1;i>=0;i--){ const q=smokes[i]; q.t+=dt; q.m.position.addScaledVector(q.v,dt); q.v.x+=(Math.random()-.5)*0.4*dt; q.m.scale.setScalar(1+q.t*2.2); q.m.material.opacity=0.45*(1-q.t/q.life); if(q.t>=q.life){ scene.remove(q.m); smokes.splice(i,1); } }
  for(let i=noiseRings.length-1;i>=0;i--){ const q=noiseRings[i]; q.t+=dt; const k=Math.min(1,q.t/0.5); q.m.scale.set(q.r*k,q.r*k,1); q.m.material.opacity=0.6*(1-k); if(q.t>=0.5){ scene.remove(q.m); noiseRings.splice(i,1); } }
  checkExits();
  if(run && !run.over && !player.dead) run.t += dt;
  if(dt>0){ gameTime+=dt; record(gameTime); }
}
function frame(now){
  frameNo++;
  const rdt = Math.min(0.05,(now-last)/1000); last=now;
  if(MODE!=="play"){ edFrame(rdt); requestAnimationFrame(frame); return; }
  if(MODE==="play") pollPad();
  const pi=$("padinfo"); if(pi) pi.textContent = pad.connected?"Controller connected.":"No controller detected. Press a button on it to wake it up.";
  if(replay.on){ updateReplay(rdt); }
  else {
    let dt = rdt*CFG.world.timeScale;
    if(paused){ dt = stepFrames>0 ? (stepFrames--, CFG.world.timeScale/60) : 0; }
    else if(invOpen()||SB.simMenu){ dt=0; }
    else if(hitstop>0){ hitstop-=rdt; dt=0; }
    else if(player.grabbed){ dt*=CFG.across.qteSlow; qteTick(rdt); }
    else if(killSlowmo>0){ killSlowmo-=rdt; dt*=0.3; }
    if(dt>0 || paused) step(dt, rdt);
    if(dt===0 && !paused) for(const e of enemies) e.updateRings();
  }
  muzzle.intensity = Math.max(0, muzzle.intensity - rdt*30);
  updateCamera(rdt);
  if(!replay.on) updateOverlays();
  updateHud();
  skinSyncAll();
  runnerRender();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__pg = {player, enemies, spawn, fire, CFG, setAim:(v)=>{mouseAim=v;}, aimAssist, loadScenario, use, enterReplay, exitReplay, replay, get world(){return world;}, get run(){return run;}, results:()=>results, importMapText, tryDodge, tryVault, findVault, togglePause, keys, step:()=>{stepFrames++;}, buildArena};
// ================================================================ sandbox runtime: maps → worlds, terrain, items, play/build
const D2R=Math.PI/180, R2D=180/Math.PI;
const SB = {ready:false, helpSeen:false, inv:false, toastT:0};
const sbUid = p => p + Math.random().toString(36).slice(2,8);
const sbClone = o => JSON.parse(JSON.stringify(o));
tagLayer.id = "tags";

// ---------------------------------------------------------------- textures (the Map Designer's library)
const SBTEX = {};
const sbTexBase = {};
function sbInitTextures(){
  const gen = SB_GEN_TEXTURES();
  for(const [id,t] of Object.entries(gen)) SBTEX[id] = {id, name:t.name, src:t.canvas, m:[1,1], ready:true};
  const jobs=[];
  for(const [k,info] of Object.entries(LIB_TEXTURES)){
    const id="b:"+k, t=SBTEX[id]||(SBTEX[id]={id, name:k.replace(/_/g," "), m:[1,1], ready:false});
    if(info.m) t.m=info.m; t.set=info.set;
    jobs.push(new Promise(res=>{ const im=new Image(); im.onload=()=>{ t.src=im; t.ready=true; res(); }; im.onerror=()=>res(); im.src=info.src; }));
  }
  return Promise.all(jobs).then(()=>{ for(const t of Object.values(SBTEX)) if(t.ready) t.avg=sbAvg(t.src); });
}
function sbAvg(src){ try{ const c=document.createElement("canvas"); c.width=c.height=4; const g=c.getContext("2d"); g.drawImage(src,0,0,4,4); const d=g.getImageData(0,0,4,4).data; let r=0,gg=0,b=0; for(let i=0;i<d.length;i+=4){ r+=d[i]; gg+=d[i+1]; b+=d[i+2]; } const n=d.length/4; return "#"+[r,gg,b].map(v=>Math.round(v/n).toString(16).padStart(2,"0")).join(""); }catch(e){ return "#777777"; } }
function sbAddDocTextures(doc){
  const jobs=[];
  for(const t of doc.textures||[]){ if(!t||!t.id||!t.data) continue; if(SBTEX[t.id]&&SBTEX[t.id].data===t.data) continue;
    const rec=SBTEX[t.id]={id:t.id, name:"★ "+(t.name||t.id), m:t.m||[1,1], ready:false, data:t.data}; delete sbTexBase[t.id];
    jobs.push(new Promise(res=>{ const im=new Image(); im.onload=()=>{ rec.src=im; rec.ready=true; rec.avg=sbAvg(im); res(); }; im.onerror=()=>res(); im.src=t.data; })); }
  return Promise.all(jobs);
}
function sbTex(id, rx, ry){
  const t=SBTEX[id]; if(!t||!t.ready) return null;
  let b=sbTexBase[id]; if(!b){ b = t.src instanceof HTMLCanvasElement ? new THREE.CanvasTexture(t.src) : new THREE.Texture(t.src); b.magFilter=b.minFilter=THREE.NearestFilter; b.wrapS=b.wrapT=THREE.RepeatWrapping; b.needsUpdate=true; sbTexBase[id]=b; }
  const c=b.clone(); c.needsUpdate=true; const m=t.m||[1,1]; c.repeat.set(Math.max(0.05,rx/m[0]), Math.max(0.05,ry/m[1])); return c;
}
const sbMatCache = new Map();
function sbGrey(c){ const x=new THREE.Color(hexStr(c||"#888888")); const l=0.299*x.r+0.587*x.g+0.114*x.b; return 0.3+l*0.45; }
function texMat(id, rx, ry, color){ const g=Math.round(sbGrey(color)*40)/40; const key="grey|"+g; let m=sbMatCache.get(key); if(!m){ m=new THREE.MeshLambertMaterial({color:new THREE.Color(g,g,g)}); sbMatCache.set(key,m); } return m; }
function texMatOld(id, rx, ry, color){
  const key=id+"|"+(Math.round(rx*20)/20)+"|"+(Math.round(ry*20)/20)+"|"+color;
  let m=sbMatCache.get(key); if(m) return m;
  const tx=id?sbTex(id,rx,ry):null; m=new THREE.MeshLambertMaterial({color: tx?0xffffff:hexNum(color||"#888888"), map:tx});
  sbMatCache.set(key,m); return m;
}
function sbTexAvg(id, fallback){ const t=SBTEX[id]; return t&&t.avg ? t.avg : fallback; }
function sbTexOptions(none){ const o=[["",none||"(plain colour)"]]; for(const t of Object.values(SBTEX)) if(t.ready) o.push([t.id, t.name]); return o; }

// ---------------------------------------------------------------- assets (the Map Designer's model library)
function sbAsset(id){ return LIB_ASSETS[id] || ((ED.doc&&ED.doc.assets)||[]).find(a=>a.id===id) || null; }
function sbAssetList(){ const out=Object.entries(LIB_ASSETS).map(([id,a])=>Object.assign({id},a)); for(const a of (ED.doc&&ED.doc.assets)||[]) out.push(Object.assign({cat:"custom"},a)); return out; }
function sbPartMesh(p){
  let geo; const [w,h,d]=p.d; const sg=clamp(p.seg||8,3,24);
  if(p.s==="box") geo=new THREE.BoxGeometry(w,h,d);
  else if(p.s==="cyl"){ geo=new THREE.CylinderGeometry(w/2,w/2,h,sg); if(w>0&&Math.abs(d-w)>1e-4) geo.scale(1,1,d/w); }
  else if(p.s==="cone"){ geo=new THREE.ConeGeometry(w/2,h,sg); if(w>0&&Math.abs(d-w)>1e-4) geo.scale(1,1,d/w); }
  else if(p.s==="sphere"){ geo=new THREE.SphereGeometry(0.5,sg,Math.max(4,Math.round(sg*0.66))); geo.scale(w,h,d); }
  else if(p.s==="wedge"){ geo=new THREE.BufferGeometry(); const x=w/2,y=h/2,z=d/2; const v=[-x,-y,-z,x,-y,-z,x,-y,z,-x,-y,z,-x,y,z,x,y,z]; geo.setAttribute("position",new THREE.Float32BufferAttribute(v,3)); geo.setIndex([0,1,2,0,2,3,3,2,5,3,5,4,0,4,5,0,5,1,0,3,4,1,5,2]); geo.computeVertexNormals(); }
  else geo=new THREE.BoxGeometry(w,h,d);
  const rep=p.tr||Math.max(1,Math.round(Math.max(w,h,d)/0.7));
  const m=new THREE.Mesh(geo, texMat(p.t||"", rep, rep, p.c||"#888888"));
  m.position.set(...p.p); m.rotation.set((p.r[0]||0)*D2R,(p.r[1]||0)*D2R,(p.r[2]||0)*D2R); return m;
}
// furniture is one grey box the size of the real model (trees: a trunk and a cone); searchable things get a gold strip on top
const SB_GOLD=new THREE.MeshBasicMaterial({color:0xc9a24a});
function sbAssetGroup(id, opts={}){
  const g=new THREE.Group(), a=sbAsset(id); if(!a) return g;
  if(a.parts){ for(const p of a.parts) g.add(sbPartMesh(p)); return g; }
  const [x0,x1,y0,y1,z0,z1]=a.bb, w=Math.max(0.05,x1-x0), h=Math.max(0.03,y1-y0), d=Math.max(0.05,z1-z0);
  if(/^tree/.test(id)){ const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.14,h*0.55,6),texMat("",1,1,"#5a5550")); tr.position.y=h*0.275; g.add(tr);
    const cn=new THREE.Mesh(new THREE.ConeGeometry(Math.min(w,d)*0.45,h*0.7,6),texMat("",1,1,"#3e423c")); cn.position.y=h*0.62; g.add(cn); return g; }
  const gr=Math.round((a.g||0.55)*40)/40*(opts.push?1.18:1), m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:new THREE.Color(gr,gr,gr)}));
  m.position.set((x0+x1)/2,y0+h/2,(z0+z1)/2); g.add(m);
  if(opts.search){ const s=new THREE.Mesh(new THREE.BoxGeometry(w*0.9,0.02,Math.min(0.08,d*0.4)),SB_GOLD); s.position.set((x0+x1)/2,y0+h+0.011,(z0+z1)/2); s.userData.glint=true; g.add(s); }
  return g; }
const sbBoundsCache={};
function sbAssetBounds(id){
  if(sbBoundsCache[id]) return sbBoundsCache[id];
  const la=LIB_ASSETS[id]; if(la&&la.bb){ const b=la.bb; return sbBoundsCache[id]={minX:b[0],maxX:b[1],minY:b[2],maxY:b[3],minZ:b[4],maxZ:b[5]}; }
  const g=sbAssetGroup(id); g.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(g);
  const r = b.isEmpty() ? {minX:-.3,maxX:.3,minY:0,maxY:.6,minZ:-.3,maxZ:.3} : {minX:b.min.x,maxX:b.max.x,minY:b.min.y,maxY:b.max.y,minZ:b.min.z,maxZ:b.max.z};
  g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); return sbBoundsCache[id]=r;
}
// where a prop's footprint lands in the world (axis-aligned box around the turned model)
function sbPropFoot(o){
  const a=sbAsset(o.asset), B=a?sbAssetBounds(o.asset):{minX:-.3,maxX:.3,minY:0,maxY:.6,minZ:-.3,maxZ:.3};
  const s=+o.scale||1, sx=s*(o.sx||1), sy=s*(o.sy||1), sz=s*(o.sz||1), th=(o.rot||0)*D2R, c=Math.cos(th), sn=Math.sin(th);
  const pts=[[B.minX,B.minZ],[B.maxX,B.minZ],[B.maxX,B.maxZ],[B.minX,B.maxZ]].map(([x,z])=>{ x*=sx; z*=sz; return [o.x+x*c+z*sn, o.z-x*sn+z*c]; });
  const xs=pts.map(p=>p[0]), zs=pts.map(p=>p[1]);
  return {pts, x0:Math.min(...xs), x1:Math.max(...xs), z0:Math.min(...zs), z1:Math.max(...zs), h:B.maxY*sy, a};
}
const PUSH_RE=/wardrobe|shelf|dresser|cabinet|crate|box|desk|table|couch|sofa|chair|chest|trunk|locker|barrel|nightstand|armoire|hutch|sideboard|bookcase|cooler|trash|wheelbarrow|toolchest/;
function sbBox(f){ Object.defineProperties(f,{x0:{get(){return this.x-this.w/2}},x1:{get(){return this.x+this.w/2}},z0:{get(){return this.z-this.d/2}},z1:{get(){return this.z+this.d/2}}}); return f; }
function placeBoxMesh(b){ if(b.place) b.place(b); else b.mesh.position.set(b.x,(b.y0||0)+b.h/2,b.z); }

// ---------------------------------------------------------------- terrain
const GROUND=[{name:"Packed earth",c:"#4a3f33"},{name:"Grass",c:"#3e4a2e"},{name:"Dry grass",c:"#6a6440"},{name:"Mud",c:"#33281f"},{name:"Gravel",c:"#66625a"},{name:"Sand",c:"#9a8a68"},{name:"Snow",c:"#c4c8cc"},{name:"Asphalt",c:"#2e3033"},{name:"Concrete",c:"#6e6e68"},{name:"Leaf litter",c:"#5a3e22"},{name:"Moss",c:"#3a4a28"},{name:"Ash",c:"#3a3836"}];
function terrainMake(x0,z0,w,d,cell=1,paint=1){ const nx=Math.round(w/cell)+1, nz=Math.round(d/cell)+1; return {on:true,x0,z0,cell,nx,nz,h:new Array(nx*nz).fill(0),p:new Array(nx*nz).fill(paint)}; }
function terrainFix(T){ if(!T) return null; const n=T.nx*T.nz; if(!Array.isArray(T.h)||T.h.length!==n) T.h=new Array(n).fill(0); if(!Array.isArray(T.p)||T.p.length!==n) T.p=new Array(n).fill(1); return T; }
function tSample(T,x,z){ const fx=clamp((x-T.x0)/T.cell,0,T.nx-1), fz=clamp((z-T.z0)/T.cell,0,T.nz-1); const i=Math.min(T.nx-2,Math.floor(fx)), j=Math.min(T.nz-2,Math.floor(fz)), u=fx-i, v=fz-j, H=T.h, n=T.nx; return (H[j*n+i]*(1-u)+H[j*n+i+1]*u)*(1-v)+(H[(j+1)*n+i]*(1-u)+H[(j+1)*n+i+1]*u)*v; }
function tEach(T,cx,cz,r,fn){ const i0=Math.max(0,Math.floor((cx-r-T.x0)/T.cell)), i1=Math.min(T.nx-1,Math.ceil((cx+r-T.x0)/T.cell)), j0=Math.max(0,Math.floor((cz-r-T.z0)/T.cell)), j1=Math.min(T.nz-1,Math.ceil((cz+r-T.z0)/T.cell));
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const x=T.x0+i*T.cell, z=T.z0+j*T.cell, d=Math.hypot(x-cx,z-cz); if(d<=r) fn(j*T.nx+i,d,x,z); } }
const vhash = i => { let x=Math.imul(i^0x9e3779b9, 0x85ebca6b); x^=x>>>13; x=Math.imul(x,0xc2b2ae35); x^=x>>>16; return (x>>>0)/4294967296; };
let sbGreyTex=null;
function terrainMesh(T){
  const n=T.nx*T.nz, pos=new Float32Array(n*3), col=new Float32Array(n*3), uv=new Float32Array(n*2), idx=[];
  for(let j=0;j<T.nz;j++) for(let i=0;i<T.nx;i++){ const k=j*T.nx+i; pos[k*3]=T.x0+i*T.cell; pos[k*3+2]=T.z0+j*T.cell; uv[k*2]=pos[k*3]/2; uv[k*2+1]=pos[k*3+2]/2; }
  for(let j=0;j<T.nz-1;j++) for(let i=0;i<T.nx-1;i++){ const a=j*T.nx+i, b=a+1, c=a+T.nx, d=c+1; idx.push(a,c,b,b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.BufferAttribute(pos,3)); g.setAttribute("color",new THREE.BufferAttribute(col,3)); g.setAttribute("uv",new THREE.BufferAttribute(uv,2)); g.setIndex(idx);
  if(!sbGreyTex){ sbGreyTex=noiseTex("#9a9a9a","#8a8a8a",4,1); }
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true, map:sbGreyTex, flatShading:true}));
  m.userData.terrain=true; terrainRefresh(T,m); return m;
}
function terrainRefresh(T,m){
  m=m||T.mesh; if(!m) return; const pos=m.geometry.attributes.position, col=m.geometry.attributes.color, c=new THREE.Color();
  for(let k=0;k<T.nx*T.nz;k++){ pos.array[k*3+1]=T.h[k]-0.015;
    const i=k%T.nx, j=(k/T.nx)|0, hx=T.h[j*T.nx+Math.min(T.nx-1,i+1)]-T.h[j*T.nx+Math.max(0,i-1)], hz=T.h[Math.min(T.nz-1,j+1)*T.nx+i]-T.h[Math.max(0,j-1)*T.nx+i];
    const slope=Math.hypot(hx,hz)/(2*T.cell); const sh=clamp(1.05-slope*0.35+(hx+hz)*0.08,0.55,1.25)*(0.86+vhash(k)*0.28);
    const gy=0.3*sh; col.array[k*3]=gy; col.array[k*3+1]=gy; col.array[k*3+2]=gy*1.04; }
  pos.needsUpdate=true; col.needsUpdate=true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); m.geometry.computeBoundingBox();
}
function buildTerrain(T){
  world.terrain=null; if(!T||!T.on) return; terrainFix(T);
  world.terrain={x0:T.x0,z0:T.z0,cell:T.cell,nx:T.nx,nz:T.nz,h:T.h,p:T.p};
  const m=terrainMesh(world.terrain); world.terrain.mesh=m; world.group.add(m); world.blockers.push(m);
}
function terrainHills(T, amount=1.5, seed=Math.random()*1000){
  const r=mulberry(seed*1000|0), ph=[r()*6,r()*6,r()*6,r()*6], f=[0.09+r()*0.05,0.17+r()*0.08,0.33+r()*0.1];
  for(let j=0;j<T.nz;j++) for(let i=0;i<T.nx;i++){ const x=T.x0+i*T.cell, z=T.z0+j*T.cell;
    T.h[j*T.nx+i]+= amount*(Math.sin(x*f[0]+ph[0])*Math.cos(z*f[0]*0.9+ph[1]) + 0.45*Math.sin(x*f[1]+z*f[1]*0.7+ph[2]) + 0.2*Math.cos(z*f[2]-x*f[2]*0.6+ph[3])); }
}

// ---------------------------------------------------------------- the item catalog (the Item Modeler's items, plus a few)
const ITEMS = {
  ammo:{name:".38 rounds", cat:"ammo", col:"#c09040", qty:6, desc:"Loose .38 cartridges. They go straight into Norah's pocket for reloading."},
  pills:{name:"Pills", cat:"health", col:"#d8701c", heal:"pillHeal", desc:"An orange prescription bottle, a few left. Takes the edge off. (Heals a little.)"},
  bandage:{name:"Bandage", cat:"health", col:"#e8e2d4", heal:"bandageHeal", desc:"A roll of gauze and tape. (Heals a little.)"},
  firstaid:{name:"First aid kit", cat:"health", col:"#b03a2a", heal:"kitHeal", desc:"A dented tin first aid kit. (Heals a lot.)"},
  flashlight:{name:"Flashlight", cat:"tool", col:"#3a3c40", light:1, desc:"A heavy metal flashlight. The beam is yellow and doesn't reach far. L turns it on and off. Its light makes Norah easier to see."},
  flashlight_dead:{name:"Flashlight (no batteries)", cat:"tool", col:"#3a3c40", light:0, desc:"A heavy metal flashlight. Clicks. Nothing."},
  batteries:{name:"D batteries", cat:"tool", col:"#c9922a", charge:1, desc:"Two D batteries. A full charge for the flashlight."},
  battery_half:{name:"Battery (half charge)", cat:"tool", col:"#8a8a8a", charge:0.5, desc:"Half a charge, maybe."},
  key:{name:"Key", cat:"key", col:"#b0b4ba", desc:"A key. A locked door or exit that names this key opens with it."},
  house_keys:{name:"House keys", cat:"key", col:"#c09a48", desc:"Front door and back door. The brass one sticks."},
  truck_keys:{name:"Truck keys", cat:"key", col:"#9a1e1a", desc:"A ring of keys on a red fob."},
  note:{name:"Note", cat:"document", col:"#e6dfcc", desc:"A folded note."},
  journal:{name:"Norah's journal", cat:"document", col:"#5a3424", desc:"Addie's week, Pickle, work, Louis and the porch step."},
  photo:{name:"Photo", cat:"document", col:"#f0ece0", desc:"An instant photo, a little curled."},
  rosary:{name:"Louis's Rosary", cat:"keepsake", col:"#6a4630", desc:"Worn smooth. A paper tag: \"Rose's. For keeping.\""},
  custom:{name:"Item", cat:"misc", col:"#8a8478", desc:"Something worth keeping."}
};
const LOOT = [["ammo",5],["ammo",3],["pills",1],["bandage",1],["batteries",1],["battery_half",1],["firstaid",1],["ammo",8]];
function itemDef(key){
  if(ITEMS[key]) return ITEMS[key];
  const c=((ED.doc&&ED.doc.customItems)||[]).find(c=>c.key===key);
  if(c) return {name:c.name||key, cat:c.cat||"misc", col:c.col||"#8a8478", desc:c.desc||""};
  return {name:key, cat:"misc", col:"#8a8478", desc:""};
}
function itemOptions(){ const o=Object.entries(ITEMS).map(([k,d])=>[k,d.name]); for(const c of (ED.doc&&ED.doc.customItems)||[]) o.push([c.key,"★ "+(c.name||c.key)]); return o; }
function entryName(e){ const d=itemDef(e.item); return (e.name&&String(e.name).trim()) || d.name; }
function entryLabel(e){ const n=entryName(e); return (e.qty||1)>1 ? `${n} ×${e.qty}` : n; }

// ---------------------------------------------------------------- building a world from a map
const SB_MAXLIGHTS = 20;
const ENV_DEF = {sky:"#07080a", fogColor:"", fog:0.045, hemi:0.55, moon:0.5, dark:"", fill:false, fillI:0.8};
function sbEnv(doc){ const E=Object.assign({},ENV_DEF,doc.env||{}); if(!E.fogColor) E.fogColor=E.sky; return E; }
function sbTagged(o, fn){ const n0=world.group.children.length; const r=fn(); const ch=world.group.children; for(let i=n0;i<ch.length;i++) ch[i].traverse(c=>{ c.userData.oid=o.id; }); return r; }
function docBounds(doc){
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; const g=(x,z)=>{ if(!isFinite(x)||!isFinite(z)) return; x0=Math.min(x0,x); x1=Math.max(x1,x); z0=Math.min(z0,z); z1=Math.max(z1,z); };
  for(const o of doc.objects){
    if(o.type==="wall"){ g(o.a[0],o.a[1]); g(o.b[0],o.b[1]); }
    else if(o.type==="floor"){ g(o.x,o.z); g(o.x+o.w,o.z+o.d); }
    else if(o.type==="block"){ g(o.x-o.w/2,o.z-o.d/2); g(o.x+o.w/2,o.z+o.d/2); }
    else if(o.type==="path") for(const p of o.points||[]) g(p[0],p[1]);
    else if(typeof o.x==="number") g(o.x,o.z);
  }
  const T=doc.terrain; if(T&&T.on){ g(T.x0,T.z0); g(T.x0+(T.nx-1)*T.cell, T.z0+(T.nz-1)*T.cell); }
  if(x0>x1){ x0=-10;x1=10;z0=-10;z1=10; }
  return {x0,x1,z0,z1};
}
function buildFromDoc(doc, forEditor){
  newWorld(); world.name="doc"; activeCam=null; sbLights=0;
  const E=sbEnv(doc);
  scene.background.set(E.sky); scene.fog.color.set(E.fogColor); scene.fog.density = forEditor ? (edPrefs.fog?E.fog:0) : E.fog;
  hemi.intensity=+E.hemi; moon.intensity=+E.moon; world.ambient = (E.dark===""||E.dark===null||E.dark===undefined) ? null : +E.dark;
  buildTerrain(doc.terrain);
  for(const o of doc.objects) if(o.type==="floor") sbTagged(o,()=>addFloor(o.x,o.z,o.x+o.w,o.z+o.d,"#3c3c3c","#444444",{y:+o.y||0}));
  const B=docBounds(doc); world.bounds={x0:B.x0-1,x1:B.x1+1,z0:B.z0-1,z1:B.z1+1};
  world.spawn={x:(B.x0+B.x1)/2, z:(B.z0+B.z1)/2, yaw:Math.PI};
  for(const o of doc.objects){ if(o.type==="floor") continue; try{ sbTagged(o,()=>sbBuildObj(o)); }catch(err){ console.warn("couldn't build",o,err); } }
  if(!world.cams.length){ const b=world.bounds, cx=(b.x0+b.x1)/2, cz=(b.z0+b.z1)/2; addCam(b.x0+0.6,3.6,b.z0+0.6,cx,0.6,cz); addCam(b.x1-0.6,3.6,b.z1-0.6,cx,0.6,cz); addCam(b.x1-0.6,3.6,b.z0+0.6,cx,0.6,cz); addCam(b.x0+0.6,3.6,b.z1-0.6,cx,0.6,cz); }
  if(E.fill){ const b=world.bounds; const l=new THREE.PointLight(0xffc080,+E.fillI||0.8,Math.max(30,(b.x1-b.x0+b.z1-b.z0))); l.position.set((b.x0+b.x1)/2,4,(b.z0+b.z1)/2); world.group.add(l); }
}
let sbLights=0;
function sbLight(x,y,z,col,i,r){ if(sbLights>=SB_MAXLIGHTS){ world.lightCapped=true; return null; } sbLights++; return addLight(x,y,z,col,i,r); }
function sbBuildObj(o){
  switch(o.type){
    case "wall": { const mx=(o.a[0]+o.b[0])/2, mz=(o.a[1]+o.b[1])/2;
      const ops=(o.openings||[]).map(op=>({kind:op.kind||"door",at:+op.at,width:+op.width||1,sill:op.sill,top:op.top,hinge:op.hinge,side:op.side===-1?-1:1,closed:!!op.closed,locked:!!op.locked,key:op.key||""}));
      addWall(o.a[0],o.a[1],o.b[0],o.b[1],+o.height||2.8,+o.thick||0.2,o.weak?0x8a7e6a:0x6a6a6a,ops,{tex:o.tex,texB:o.texB,scale:+o.scale||1,base:groundY(mx,mz),skirt:!!world.terrain,weak:!!o.weak}); break; }
    case "block": { const b=addBox(o.x,o.z,+o.w||1,+o.d||1,+o.h||1,o.push?0x8c8c8c:0x6e6e6e,!!o.push,o.name||"",{}); if(o.search) sbContainer(o,b,o.name||"crate"); break; }
    case "pillar": addPillar(o.x,o.z,+o.r||0.4,+o.h||3,0x707070); break;
    case "corpse": addCorpse(o.x,o.z,(o.yaw||0)*D2R); break;
    case "light": sbLight(o.x,o.y??2.6,o.z,hexNum(o.color||"#ffb060"),+(o.intensity??1),+(o.dist??8)); break;
    case "camera": { const L=o.look||[o.x,0.8,o.z-3]; addCam(o.x,o.y??2.8,o.z,L[0],L[1],L[2],o.track!==false,+o.fov||60); break; }
    case "prop": sbBuildProp(o); break;
    case "item": sbBuildPickup(o); break;
    case "exit": sbBuildExit(o); break;
    case "path": sbBuildPath(o); break;
    case "spawn": world.spawn={x:o.x,z:o.z,yaw:(o.yaw||0)*D2R}; break;
    case "enemy": world.enemySpawns.push({x:o.x,z:o.z,type:o.kind||"across",o}); break;
  }
}
function sbBuildProp(o){
  const F=sbPropFoot(o), a=F.a; const s=+o.scale||1;
  const pushPre=(o.push===undefined||o.push==="auto")?(PUSH_RE.test((o.asset||"")+" "+String(o.name||(a?a.name:"")).toLowerCase())&&F.h<2.3):!!o.push;
  let g; if(a) g=sbAssetGroup(o.asset,{push:pushPre,search:!!o.search}); else { g=new THREE.Group(); const m=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.6),M(0x8a8478)); m.position.y=0.3; g.add(m); }
  g.scale.set(s*(o.sx||1),s*(o.sy||1),s*(o.sz||1)); g.rotation.y=(o.rot||0)*D2R;
  const y0=groundY(o.x,o.z)+(+o.y||0); g.position.set(o.x,y0,o.z); world.group.add(g);
  if(a&&a.light&&o.light!==false){ const L=a.light, th=(o.rot||0)*D2R, lx=L.p[0]*s*(o.sx||1), lz=L.p[2]*s*(o.sz||1);
    sbLight(o.x+lx*Math.cos(th)+lz*Math.sin(th), y0+L.p[1]*s*(o.sy||1), o.z-lx*Math.sin(th)+lz*Math.cos(th), hexNum(L.color||"#ffd8a0"), (L.energy||1)*1.4, (L.range||4)*1.6*s); }
  const fw=F.x1-F.x0, fd=F.z1-F.z0, nm=String(o.name||(a?a.name:o.asset)||"thing").toLowerCase().split(/[,(]/)[0].trim();
  const auto=!(a&&a.solid===false) && F.h>0.2 && fw*fd>0.03;
  const solid=(o.solid===undefined||o.solid==="auto")?auto:!!o.solid;
  const push=(o.push===undefined||o.push==="auto")?(PUSH_RE.test((o.asset||"")+" "+nm)&&F.h<2.3):!!o.push;
  let b=null;
  if(solid && /^tree/.test(o.asset||"")){ // trees block with the trunk only, not the whole canopy
    const tw=0.45*s; g.traverse(m=>{ if(m.isMesh) world.blockers.push(m); }); world.circles.push({x:o.x,z:o.z,r:tw/2});
  } else if(solid){ g.traverse(m=>{ if(m.isMesh) world.blockers.push(m); });
    b=sbBox({x:(F.x0+F.x1)/2,z:(F.z0+F.z1)/2,w:fw,d:fd,h:F.h,y0,mesh:g,push,name:nm,under:/bed|table|desk|pew|gurney|bench/.test(nm)&&F.h>=0.5});
    b.ox=b.x-o.x; b.oz=b.z-o.z; b.place=bb=>g.position.set(bb.x-bb.ox,bb.y0,bb.z-bb.oz); world.boxes.push(b); }
  if(o.search) sbContainer(o, b||sbBox({x:(F.x0+F.x1)/2,z:(F.z0+F.z1)/2,w:fw,d:fd,h:F.h,y0,name:nm}), nm);
}
function sbGlint(){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.035,0), new THREE.MeshBasicMaterial({color:0xfff0c0,transparent:true,opacity:0.9,depthWrite:false})); m.userData.glint=true; return m; }
function sbContainer(o, box, name){
  const gl=sbGlint(); gl.visible=false; world.group.add(gl);
  world.containers.push({oid:o.id, name, items:sbClone(o.items||[]), searched:false, box, glint:gl});
}
function sbBuildPickup(o){
  const d=itemDef(o.item), g=new THREE.Group(); const y=groundY(o.x,o.z);
  const shape = d.cat==="health" ? new THREE.CylinderGeometry(0.045,0.045,0.11,8) : d.cat==="key" ? new THREE.TorusGeometry(0.04,0.012,4,10) : d.cat==="document" ? new THREE.BoxGeometry(0.16,0.012,0.21) : new THREE.BoxGeometry(0.12,0.07,0.09);
  const m=new THREE.Mesh(shape,M(hexNum(d.col||"#8a8478"))); m.position.y = d.cat==="key"?0.015:d.cat==="document"?0.008:0.05; if(d.cat==="key") m.rotation.x=Math.PI/2; m.rotation.y=(o.yaw||((o.x*7+o.z*3)%6)); g.add(m);
  const gl=sbGlint(); gl.position.y=0.3; g.add(gl); g.position.set(o.x,y,o.z); world.group.add(g);
  world.pickups.push({oid:o.id, x:o.x, z:o.z, g, glint:gl, entry:{item:o.item,qty:+o.qty||1,name:o.name||"",text:o.text||""}, taken:false});
}
function sbBuildExit(o){
  const y=groundY(o.x,o.z), r=+o.r||0.8;
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.9,1,40), new THREE.MeshBasicMaterial({color:0x60ff80,transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2; ring.position.set(o.x,y+0.03,o.z); ring.scale.set(r,r,1); world.group.add(ring);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1,24), new THREE.MeshBasicMaterial({color:0x2a6a34,transparent:true,opacity:0.25,depthWrite:false})); disc.rotation.x=-Math.PI/2; disc.position.set(o.x,y+0.02,o.z); disc.scale.set(r,r,1); world.group.add(disc);
  sbLight(o.x,y+1.6,o.z,0x60ff80,0.6,3.5);
  world.exits.push({x:o.x,z:o.z,r,needs:(o.needs||"").trim(),label:o.label||"the exit",warned:0});
}
function sbBuildPath(o){
  const P=o.points||[], w=+o.width||1.6;
  for(let i=0;i<P.length-1;i++){ const [ax,az]=P[i], [bx,bz]=P[i+1], L=Math.hypot(bx-ax,bz-az); if(L<0.01) continue;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(L+w*0.3,w), texMat("",1,1,"#3a3a3a"));
    m.rotation.order="YXZ"; m.rotation.y=-Math.atan2(bz-az,bx-ax); m.rotation.x=-Math.PI/2; const mx=(ax+bx)/2, mz=(az+bz)/2; m.position.set(mx,groundY(mx,mz)+0.006+i*0.0005,mz); world.group.add(m); }
}

// ---------------------------------------------------------------- items in play: pickups, searching, inventory, flashlight, keys, exits
player.inv=[]; player.flash={has:false,on:false,charge:0}; player.search=null;
const flashSpot=new THREE.SpotLight(0xfff0c8,0,13,0.5,0.45,1.2); const flashTgt=new THREE.Object3D(); flashSpot.target=flashTgt; scene.add(flashSpot); scene.add(flashTgt);
function flashVis(){ return player.flash.on&&player.flash.charge>0 ? CFG.items.flashVis : 0; }
function hasItem(name){ if(!name) return true; const n=String(name).trim().toLowerCase(); return player.inv.some(e=>entryName(e).toLowerCase()===n || e.item===n); }
function giveItem(e, silent){
  const d=itemDef(e.item), q=+e.qty||1;
  if(e.item==="ammo"){ player.spare+=q; if(!silent) log(`+${q} .38 rounds (${player.spare} spare)`,"#e8c77a"); return; }
  if(d.light!==undefined){ player.flash.has=true; player.flash.charge=Math.max(player.flash.charge,d.light); if(player.inv.some(x=>itemDef(x.item).light!==undefined)) { if(!silent) log(`Another flashlight. Took its batteries.`,"#e8c77a"); return; } }
  const same=player.inv.find(x=>x.item===e.item && entryName(x)===entryName(e) && !x.text && !e.text);
  if(same) same.qty=(same.qty||1)+q; else player.inv.push({item:e.item,qty:q,name:e.name||"",text:e.text||""});
  if(!silent) log(`Picked up: ${entryLabel(e)}`,"#e8c77a");
}
function findInteract(){
  if(player.dead||player.grabbed||player.vault) return null;
  const p=player.pos, fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); let best=null, bs=1e9;
  const facing=(dx,dz,d)=> d<0.55 || (dx*fx+dz*fz)/Math.max(d,1e-4)>0.25;
  for(const k of world.pickups){ if(k.taken) continue; const dx=k.x-p.x, dz=k.z-p.z, d=Math.hypot(dx,dz); if(d<CFG.items.pickupRange && facing(dx,dz,d) && d<bs){ bs=d; best={kind:"pickup",k,text:`E: pick up ${entryLabel(k.entry)}`}; } }
  for(const c of world.containers){ if(c.searched) continue; const b=c.box; const cx=clamp(p.x,b.x0,b.x1), cz=clamp(p.z,b.z0,b.z1), dx=cx-p.x, dz=cz-p.z, d=Math.hypot(dx,dz);
    if(d<0.95 && facing(b.x-p.x,b.z-p.z,d) && d+0.2<bs){ bs=d+0.2; best={kind:"search",c,text:`E: search the ${c.name}`}; } }
  if(best) return best;
  for(const d of world.doors){ if(d.broken) continue; const s=doorSeg(d); const mx=(s.ax+s.bx)/2, mz=(s.az+s.bz)/2; const dd=Math.hypot(mx-p.x,mz-p.z); if(dd<1.4&&dd<bs){ bs=dd; best={kind:"door",d,text:d.locked?`E: locked (needs ${d.key||"a key"})${hasItem(d.key)?" · you have it":""}`:d.target>0.01?"E: slam the door":"E: open the door"}; } }
  for(const b of world.boxes){ if(!b.push) continue; const cx=clamp(p.x,b.x0,b.x1), cz=clamp(p.z,b.z0,b.z1); const dx=cx-p.x, dz=cz-p.z, d=Math.hypot(dx,dz); if(d<0.9 && (dx*fx+dz*fz)>d*0.5 && d<bs){ bs=d; best={kind:"push",text:`E: push the ${b.name||"crate"}`}; } }
  return best;
}
function interactFirst(){
  const f=findInteract(); if(!f) return false;
  if(f.kind==="pickup"){ f.k.taken=true; f.k.g.visible=false; giveItem(f.k.entry); SFX.roundIn(0); makeNoise(player.pos.x,player.pos.z,1,"pickup"); return true; }
  if(f.kind==="search"){ player.search={c:f.c,t:0,dur:CFG.items.searchTime*(f.c.items.length?1:0.7),nt:0}; player.vel.set(0,0,0); return true; }
  return false;
}
function updateSearch(dt){
  const S=player.search; if(!S) return; if(isAiming()){ player.search=null; log("Stopped searching","#9a9283"); return; }
  S.t+=dt; S.nt-=dt; if(S.nt<=0){ S.nt=0.45; makeNoise(player.pos.x,player.pos.z,CFG.items.searchNoise,"rummaging"); noise(0.22,0.25,"bandpass",900+Math.random()*900,null,2); }
  if(S.t>=S.dur){ const c=S.c; c.searched=true; player.search=null;
    if(c.items.length){ const names=c.items.map(entryLabel); for(const e of c.items) giveItem(e,true); sbToast(`Found in the ${c.name}: ${names.join(", ")}`); log(`Found in the ${c.name}: ${names.join(", ")}`,"#e8c77a"); SFX.roundIn(0); c.items=[]; }
    else { log(`The ${c.name} is empty`,"#9a9283"); sbToast(`The ${c.name} is empty`); } }
}
function tryUnlock(door){
  if(hasItem(door.key)&&door.key){ door.locked=false; log(`Unlocked with the ${door.key}`,"#9ed08a"); SFX.cylinder(); return true; }
  log(`Locked. ${door.key?"Needs the "+door.key:"It won't budge"}.`,"#e0a070"); SFX.empty(); return false;
}
function toggleFlash(){
  if(!player.flash.has){ log("No flashlight","#7d7668"); return; }
  if(player.flash.charge<=0){ log("*click* The flashlight is dead. Find batteries.","#7d7668"); SFX.empty(); return; }
  player.flash.on=!player.flash.on; SFX.hammer();
}
function itemsTick(dt){
  const F=player.flash, I=CFG.items;
  if(F.on){ F.charge=Math.max(0,F.charge-I.flashDrain*dt); if(F.charge<=0){ F.on=false; log("The flashlight dies","#e0a070"); } }
  const lit=F.on&&F.charge>0&&MODE==="play";
  flashSpot.intensity = lit ? 2.4*Math.min(1,0.25+F.charge*2.5)*(F.charge<0.1&&Math.random()<0.15?0.2:1) : 0;
  if(lit){ const gy=groundY(player.pos.x,player.pos.z); const fixed=isFixed(); const yaw=fixed?player.yaw:camYaw, pit=fixed?-0.12+player.aimHeight*0.25:camPitch;
    const r=new THREE.Vector3(-Math.cos(yaw),0,Math.sin(yaw)); flashSpot.position.set(player.pos.x,1.3+gy+(player.posY||0),player.pos.z).addScaledVector(r,0.18);
    flashTgt.position.copy(flashSpot.position).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pit),Math.sin(pit),Math.cos(yaw)*Math.cos(pit)).multiplyScalar(5));
    flashSpot.distance=I.flashRange; flashSpot.angle=I.flashAngle*D2R; }
  const t=performance.now()/1000;
  for(const k of world.pickups){ if(k.taken) continue; k.glint.rotation.y=t*2; k.glint.position.y=0.28+Math.sin(t*3+k.x)*0.04; k.glint.material.opacity=0.5+0.4*Math.sin(t*5+k.z); }
  for(const c of world.containers){ const on=I.glints && !c.searched && c.items.length>0 && Math.hypot(c.box.x-player.pos.x,c.box.z-player.pos.z)<5; c.glint.visible=on;
    if(on){ c.glint.position.set(c.box.x,(c.box.y0||0)+(c.box.h||1)+0.18+Math.sin(t*3)*0.03,c.box.z); c.glint.rotation.y=t*2; c.glint.material.opacity=0.45+0.35*Math.sin(t*5); } }
}
function checkExits(){
  if(!run||run.over||player.dead) return;
  for(const ex of world.exits){ if(Math.hypot(player.pos.x-ex.x,player.pos.z-ex.z)>=ex.r) { ex.inside=false; continue; }
    if(ex.needs && !hasItem(ex.needs)){ if(!ex.inside){ ex.inside=true; log(`The way out is shut. You need the ${ex.needs}.`,"#e0a070"); sbToast(`Needs the ${ex.needs}`); } continue; }
    if(ED.doc.win!=="kill" && ED.doc.win!=="none") endRun("ESCAPED"); return; }
}
function clearWins(){ const w=ED.doc&&ED.doc.win; return w!=="exit" && w!=="none"; }
function sbToast(t){ const el=$("toast"); el.textContent=t; el.style.opacity=1; clearTimeout(SB.toastT); SB.toastT=setTimeout(()=>el.style.opacity=0,2600); }
function sbHud(){
  const f=findInteract(), pr=$("prompt");
  pr.textContent = player.search ? "" : f ? (pad.connected?f.text.replace(/^E:/,"A:"):f.text) : "";
  const sb=$("searchbar"); if(player.search){ sb.style.display="block"; sb.querySelector(".fill").style.width=Math.min(100,player.search.t/player.search.dur*100)+"%"; sb.querySelector(".lab").textContent=`SEARCHING THE ${player.search.c.name.toUpperCase()}…  (aim to stop)`; } else sb.style.display="none";
  const F=player.flash; $("flashline").textContent = F.has ? `FLASHLIGHT ${F.on?"ON":"off"} ${Math.round(F.charge*100)}% · L` : "";
  $("bagline").textContent = `BAG ${player.inv.reduce((a,e)=>a+(e.qty||1),0)} · I`;
}
// inventory screen
function invOpen(){ return SB.inv; }
let invSel=0;
function openInv(){ if(MODE!=="play"||player.dead) return; SB.inv=true; try{ document.exitPointerLock(); }catch(e){} invSel=Math.min(invSel,Math.max(0,player.inv.length-1)); renderInv(); $("inv").hidden=false; }
function closeInv(){ SB.inv=false; $("inv").hidden=true; try{ const p=canvas.requestPointerLock(); if(p&&p.catch)p.catch(()=>{}); }catch(e){} }
function renderInv(){
  const L=$("invList"), D=$("invDetail"); L.innerHTML="";
  const F=player.flash; $("invHead").textContent=`HEALTH ${Math.ceil(player.hp)} / ${CFG.norah.hp} · REVOLVER ${player.rounds} + ${player.spare}${F.has?` · FLASHLIGHT ${Math.round(F.charge*100)}%`:""}`;
  if(!player.inv.length){ L.innerHTML=`<p class="invEmpty">Nothing yet. Search furniture that glints (E) and pick up what's on the floor.</p>`; D.innerHTML=""; return; }
  player.inv.forEach((e,i)=>{ const d=itemDef(e.item); const b=document.createElement("button"); b.className="invItem"; b.setAttribute("aria-pressed",i===invSel?"true":"false");
    b.innerHTML=`<i style="background:${d.col}"></i><span>${entryLabel(e)}</span><small>${d.cat}</small>`; b.onclick=()=>{ invSel=i; renderInv(); }; L.appendChild(b); });
  const e=player.inv[invSel]; if(!e){ D.innerHTML=""; return; } const d=itemDef(e.item);
  D.innerHTML=`<h3>${entryName(e)}</h3><p>${(e.text||d.desc||"").replace(/</g,"&lt;").replace(/\n/g,"<br>")}</p>`;
  const acts=document.createElement("div"); acts.className="invActs";
  const act=(t,f)=>{ const b=document.createElement("button"); b.className="invBtn"; b.textContent=t; b.onclick=()=>{ f(); renderInv(); }; acts.appendChild(b); };
  const use1=()=>{ e.qty=(e.qty||1)-1; if(e.qty<=0){ player.inv.splice(invSel,1); invSel=Math.max(0,invSel-1); } };
  if(d.heal){ act(player.hp>=CFG.norah.hp?"Use (health is full)":"Use",()=>{ if(player.hp>=CFG.norah.hp) return; const h=CFG.items[d.heal]||20; player.hp=Math.min(CFG.norah.hp,player.hp+h); log(`${entryName(e)}: +${h} health`,"#9ed08a"); use1(); }); }
  if(d.charge){ act(F.has?"Put in the flashlight":"Use (no flashlight)",()=>{ if(!F.has) return; F.charge=Math.min(1,F.charge+d.charge); log(`Flashlight charged to ${Math.round(F.charge*100)}%`,"#9ed08a"); use1(); }); }
  if(d.light!==undefined){ act(F.on?"Turn off (L)":"Turn on (L)",()=>toggleFlash()); }
  if(d.cat==="key") acts.appendChild(Object.assign(document.createElement("span"),{className:"invNote",textContent:"Opens locked doors and exits that name it."}));
  act("Drop",()=>{ const q=e.qty||1; player.inv.splice(invSel,1); invSel=Math.max(0,invSel-1); if(d.light!==undefined){ F.has=false; F.on=false; }
    const o={id:sbUid("i"),type:"item",x:player.pos.x+Math.sin(player.yaw)*0.5,z:player.pos.z+Math.cos(player.yaw)*0.5,item:e.item,qty:q,name:e.name,text:e.text}; sbTagged(o,()=>sbBuildPickup(o)); });
  D.appendChild(acts);
}
$("invClose").onclick=closeInv;

// ---------------------------------------------------------------- play / build
let playFrom=null;
function playMap(from){
  if(!SB.ready) return;
  MODE="play"; document.body.classList.remove("build","menu"); document.body.classList.add("play"); $("mm").hidden=true; $("panel").classList.add("hidden"); edHideSide();
  playFrom=from||null; resize();
  startPlay();
  if(!SB.helpSeen){ SB.helpSeen=true; $("help").style.display="block"; } else { try{ const p=canvas.requestPointerLock(); if(p&&p.catch)p.catch(()=>{}); }catch(e){} }
}
function startPlay(){
  const d=ED.doc, st=d.start||{};
  mdlPreload(mdlPoolKeys());
  clearEnemies(); seed=1234567; buildFromDoc(d,false); ED.helpers.visible=false; ED.selBox.visible=false; player.root.visible=true;
  const sp = playFrom ? {x:playFrom.x,z:playFrom.z,yaw:world.spawn.yaw} : world.spawn;
  player.pos.set(sp.x,0,sp.z); player.yaw=sp.yaw; camYaw=sp.yaw; camPitch=-0.08; camPos.set(sp.x-Math.sin(sp.yaw)*2.7,1.75+groundY(sp.x,sp.z),sp.z-Math.cos(sp.yaw)*2.7);
  player.hp=st.hp?Math.min(+st.hp,CFG.norah.hp):CFG.norah.hp; player.dead=false; player.stumble=0; player.dodge=0; player.vel.set(0,0,0); player.crouch=false; player.grabbed=null; player.vault=null; player.posY=0; player.reloading=0; player.hammer=0; player.aiming=false; player.search=null;
  skinPlayer(); player.crushT=0; player.kneelT=0;
  $("dead").style.display="none"; $("result").style.display="none";
  let ammo=[st.rounds===""||st.rounds==null?CFG.rev.chambers:+st.rounds, st.spare===""||st.spare==null?CFG.rev.spare:+st.spare];
  if(CFG.world.budget) ammo=[Math.min(5,CFG.rev.chambers),7];
  player.rounds=Math.min(ammo[0],CFG.rev.chambers); player.spare=ammo[1];
  player.inv=[]; player.flash={has:false,on:false,charge:0};
  for(const e of st.items||[]) giveItem(e,true);
  if(st.flashOn&&player.flash.has&&player.flash.charge>0) player.flash.on=true;
  newRun(d.name+(CFG.world.budget?" · ammo budget":""));
  logLines.length=0; logEl.innerHTML="";
  SWARM.lastTell=-9;
  QUIET_SPAWN=true;
  for(const m of world.enemySpawns){ const o=m.o||{}; const start=o.start||"hunting", yaw=(o.yaw||0)*D2R;
    const st2 = SIM.startOverride&&SIM.startOverride!=="map" ? SIM.startOverride : start;
    const opts = st2==="hunting" ? {aware:"hunting",yaw} : {aware:"unaware",idle:st2,yaw,face:yaw}; if(o.move) opts.move=o.move;
    try{ const e=spawn(m.type||"across",m.x,m.z,opts); if(o.hpMul&&+o.hpMul!==1){ e.hpMul=+o.hpMul; e._sf=-1; e.maxHp=e.hp=e.kind==="brute"?CFG.brute.hp*e.hpMul:e.S.hp; } if(o.speedMul&&+o.speedMul!==1) e.speedMul=+o.speedMul; }catch(err){ console.warn(err); } }
  simExtras();
  for(const e of enemies){ const hm=(+SIM.hpMul||1)*(e.hpMul||1), sm=(+SIM.speedMul||1)*(e.speedMul||1); if(hm!==1){ e.hpMul=hm; e._sf=-1; e.maxHp=e.hp=e.kind==="brute"?CFG.brute.hp*hm:e.S.hp; } if(sm!==1) e.speedMul=sm; }
  QUIET_SPAWN=false; SB.simMenu=false; $("simMenu").hidden=true;
  if(d.note) log(d.note,"#e8c77a");
  log(`Map: ${d.name}${world.lightCapped?` · only the first ${SB_MAXLIGHTS} lights are on`:""}`,"#e8c77a");
  replay.frames.length=0; activeCam=null; heldYaw=null; paused=false; $("paused").style.display="none";
  showTouch(CFG.ctrl.touch); const ml=$("mapnameline"); if(ml) ml.textContent="Map: "+d.name;
}
function loadScenario(key){ if(MODE!=="play") return; if(key==="variety"){ for(const v of VARIANTS){ const a=Math.random()*Math.PI*2; spawn("across:"+v.key, player.pos.x+Math.sin(a)*7, player.pos.z+Math.cos(a)*7); } return; } startPlay(); }
function toBuild(){
  if(MODE==="build") return;
  if(replay.on) exitReplay();
  MODE="build"; document.body.classList.add("build"); document.body.classList.remove("play");
  try{ document.exitPointerLock(); }catch(e){}
  SB.inv=false; $("inv").hidden=true; $("help").style.display="none"; $("result").style.display="none"; $("dead").style.display="none"; paused=false; $("paused").style.display="none";
  clearEnemies(); player.search=null; player.flash.on=false; flashSpot.intensity=0; player.root.visible=false; showTouch(false);
  mouseAim=false; for(const k in keys) keys[k]=false;
  resize(); edRebuild(true);
}
$("toBuildBtn").onclick=e=>{ e.target.blur(); toBuild(); };

// ---------------------------------------------------------------- fight readability: crosshair on a body, grab prompts
SB.aimOver=false; let aimRayT=0; const aimRay=new THREE.Raycaster();
function aimOverCheck(fixed){
  if(!player.aiming||fixed){ SB.aimOver=false; return false; }
  const now=performance.now(); if(now-aimRayT<50) return SB.aimOver; aimRayT=now;
  aimRay.setFromCamera({x:0,y:0},camera); aimRay.far=40;
  const hits=aimRay.intersectObjects(world.blockers.concat(enemyMeshes()),false); const skip=camera.position.distanceTo(new THREE.Vector3(player.pos.x,1.5+groundY(player.pos.x,player.pos.z),player.pos.z))*0.6;
  const h=hits.find(x=>x.distance>skip); SB.aimOver=!!(h&&h.object.userData.enemy); return SB.aimOver;
}
let qteBannerT=0;
function qteBanner(text, cls){ return; const el=$("qteResult"); el.textContent=text; el.className="show "+cls; clearTimeout(qteBannerT); qteBannerT=setTimeout(()=>{ el.className=""; },950); }
function qteLabel(k){ return pad.connected?k.padLabel:(CFG.ctrl.touch?"TAP":k.label); }
function qteRing(frac, label, big){
  const r=big?27:20, c=2*Math.PI*r, s=(r+4)*2;
  return `<span class="qKey${big?" big":""}"><svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" aria-hidden="true"><circle cx="${s/2}" cy="${s/2}" r="${r}" class="trk"/><circle cx="${s/2}" cy="${s/2}" r="${r}" class="arc" style="stroke-dasharray:${c};stroke-dashoffset:${c*(1-frac)}" transform="rotate(-90 ${s/2} ${s/2})"/></svg><b>${label}</b></span>`;
}
function renderQte(){
  const gm=$("grabmsg"), g=player.grabbed, vig=$("grabVig");
  vig.style.opacity = g ? (0.55+0.2*Math.sin(performance.now()/140)).toFixed(2) : "0";
  if(!g||!g.qte){ gm.style.display="none"; return; }
  const q=g.qte, frac=clamp(q.t/q.win,0,1), who=g.by.name.replace(/\s\d+$/,"").replace(/^The /,"").toUpperCase();
  gm.style.display="block"; gm.className=(q.pulse>0?"pulse ":"")+(q.wrong>0?"wrong ":"")+(frac<0.35?"low":"");
  const k = q.mode==="mash" ? q.key : q.seq[q.i];
  gm.innerHTML = qteRing(frac,qteLabel(k),true) + (q.mode==="mash" ? `<div class="qMeter"><i style="width:${Math.min(100,q.fill*100).toFixed(1)}%"></i></div>` : "");
}
// ---------------------------------------------------------------- Louis and the map: weak walls, knockdowns, throws, flying furniture, Norah's blood trail
// the weak wall that is the only solid thing between two points (windows don't count), or null
function weakBlock(ax,az,bx,bz){ let w=null; for(const s of world.segs){ if(!segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) continue; if(s.weak){ w=w||s.weak; continue; } if(s.win) continue; return null; } return w; }
function weakNearest(rec,x,z){ let best=null, bd=1e9; for(const s of rec.segs){ const dx=s.bx-s.ax, dz=s.bz-s.az, L2=dx*dx+dz*dz||1, u=clamp(((x-s.ax)*dx+(z-s.az)*dz)/L2,0,1), px=s.ax+dx*u, pz=s.az+dz*u, d=Math.hypot(px-x,pz-z); if(d<bd){ bd=d; best={x:px,z:pz}; } } return best||{x:rec.ax,z:rec.az}; }
function hitWeak(rec, amount, by){
  if(rec.broken) return; rec.hp-=amount; const q=weakNearest(rec,by.pos.x,by.pos.z), p=new THREE.Vector3(q.x,1.2+groundY(q.x,q.z),q.z);
  spray(p,new THREE.Vector3(0,0,0),0xb8b2a2); SFX.doorHit(p); shake=Math.max(shake,0.25); makeNoise(q.x,q.z,10,"wall",true,undefined,undefined,by);
  if(rec.hp>0){ log(`${by.name} hammers the wall (${Math.max(0,rec.hp).toFixed(1)} left)`,"#c0a080"); return; }
  rec.broken=true; for(const sg of rec.segs){ const i=world.segs.indexOf(sg); if(i>=0) world.segs.splice(i,1); }
  for(const d of world.doors){ if(d.broken) continue; const dx=rec.bx-rec.ax, dz=rec.bz-rec.az, L2=dx*dx+dz*dz||1, u=clamp(((d.hx-rec.ax)*dx+(d.hz-rec.az)*dz)/L2,0,1); if(Math.hypot(rec.ax+dx*u-d.hx,rec.az+dz*u-d.hz)<0.2){ d.broken=true; d.pivot.visible=false; const i=world.blockers.indexOf(d.leaf); if(i>=0) world.blockers.splice(i,1); } }
  for(const m of rec.meshes){ m.visible=false; const i=world.blockers.indexOf(m); if(i>=0) world.blockers.splice(i,1); }
  for(let i=0;i<4;i++){ const r=p.clone(); r.x+=(Math.random()-.5)*1.2; r.z+=(Math.random()-.5)*1.2; spray(r,new THREE.Vector3(0,0,0),i%2?0x8a8478:0x5a554c); }
  SFX.doorBreak(p); shake=Math.max(shake,0.6); makeNoise(q.x,q.z,16,"wall",true,undefined,undefined,by); log(`${by.name} smashes through the wall`,"#ffb070");
}
function dodgeSaves(){ const N=CFG.norah; return player.dodge>0 && player.dodge > N.dodgeTime*(1-N.dodgeIframes); }
// hit that puts Norah on the floor for a moment
function knockNorah(dmg, from, how, down){
  if(player.dead) return; const saved=dodgeSaves(); player.hurt(dmg, from, how); if(saved||player.dead) return;
  const d=new THREE.Vector3(player.pos.x-from.pos.x,0,player.pos.z-from.pos.z); if(d.lengthSq()<1e-4) d.set(Math.sin(from.yaw),0,Math.cos(from.yaw)); d.normalize();
  player.vel.copy(d.multiplyScalar(3.5)); player.stumble=Math.max(player.stumble,down); player.downT=down; player.search=null;
}
// a failed escape from Louis's grip: he throws her, toward a wall if there's one close by
function louisThrowPlayer(e){
  const S=CFG.brute; let best=null, bd=1e9;
  for(let i=0;i<12;i++){ const a=e.yaw+(i-6)/6*Math.PI*0.7, dx=Math.sin(a), dz=Math.cos(a); const p=player.pos.clone().addScaledVector(new THREE.Vector3(dx,0,dz),3.5); const q=p.clone(); collide(q,0.3);
    const hit=Math.hypot(q.x-p.x,q.z-p.z)>0.2, score=(hit?0:2)+Math.abs(i-6)*0.15; if(score<bd){ bd=score; best=new THREE.Vector3(dx,0,dz); } }
  player.hurt(S.throwDamage, e, "throw"); if(player.dead) return;
  player.vel.copy(best.multiplyScalar(S.throwSpeed)); player.stumble=S.throwDown; player.downT=S.throwDown; player.thrown={t:0.8,last:S.throwSpeed,hit:false,by:e};
  shake=Math.max(shake,0.5); SFX.slam(null); log(`${e.name} throws her`,"#ff7070");
}
function louisPlaceAir(b,x,y,z){ b.x=x; b.z=z; b.y0=y; placeBoxMesh(b); }
function louisThrowBox(e,b){
  const S=CFG.brute, tgt=player.pos.clone().addScaledVector(player.vel,0.35), dx=tgt.x-b.x, dz=tgt.z-b.z, L=Math.max(0.5,Math.hypot(dx,dz)), T=L/S.furnSpeed;
  const ty=groundY(tgt.x,tgt.z)+1.0-b.h/2, vy=(ty-b.y0+0.5*9.8*T*T)/T;
  world.flying.push({b,e,vx:dx/L*S.furnSpeed,vz:dz/L*S.furnSpeed,vy,hit:false});
  SFX.grunt(e.pos,0.3); SFX.dodge(); makeNoise(e.pos.x,e.pos.z,8,"throw",false,undefined,undefined,e); log(`${e.name} throws the ${b.name||"crate"}`,"#ffb070");
}
function louisLand(b,f){
  b.mesh.rotation.x=0; b.mesh.rotation.z=0; const p=new THREE.Vector3(b.x,0,b.z); collide(p,Math.min(b.w,b.d)/2*0.95,b); b.x=p.x; b.z=p.z; b.y0=groundY(b.x,b.z);
  placeBoxMesh(b); b.flying=false; if(!world.boxes.includes(b)) world.boxes.push(b);
  const q=new THREE.Vector3(b.x,b.y0+0.2,b.z); SFX.slam(q); spray(q,new THREE.Vector3(0,0,0),0x6a4a30); makeNoise(b.x,b.z,10,"crash",true,undefined,undefined,f&&f.e);
}
function updateFlying(dt){
  const S=CFG.brute;
  for(let i=world.flying.length-1;i>=0;i--){ const f=world.flying[i], b=f.b, px=b.x, pz=b.z;
    b.x+=f.vx*dt; b.z+=f.vz*dt; f.vy-=9.8*dt; b.y0+=f.vy*dt;
    for(const s of world.segs){ if(segsCross(px,pz,b.x,b.z,s.ax,s.az,s.bx,s.bz)){ if(s.glass&&s.win){ smashWindow(s.win,f.e); break; } f.vx=f.vz=0; b.x=px; b.z=pz; break; } }
    for(const d of world.doors){ if(d.broken) continue; const s=doorSeg(d); if(segsCross(px,pz,b.x,b.z,s.ax,s.az,s.bx,s.bz)){ hitDoor(d,1,f.e); f.vx=f.vz=0; b.x=px; b.z=pz; } }
    placeBoxMesh(b); b.mesh.rotation.x+=6*dt;
    if(!f.hit && !player.dead && !(f.charge&&f.charge.chargeHurt)){ const cy=b.y0+b.h/2, py=groundY(player.pos.x,player.pos.z)+1.0; if(Math.hypot(b.x-player.pos.x,cy-py,b.z-player.pos.z)<0.55+Math.min(b.w,b.d)/2){ f.hit=true; if(f.charge) f.charge.chargeHurt=true; knockNorah(S.furnDamage, f.e, "thrown "+(b.name||"crate"), 0.8); } }
    if(b.y0<=groundY(b.x,b.z) && f.vy<0){ world.flying.splice(i,1); louisLand(b,f); }
  }
}
function louisTick(dt){
  const N=CFG.norah;
  if(player.downT>0) player.downT-=dt;
  const T=player.thrown;
  if(T){ T.t-=dt; const sp=Math.hypot(player.vel.x,player.vel.z);
    if(!T.hit && T.last>3 && sp<T.last*0.45){ T.hit=true; player.bite(T.by,"grab",CFG.brute.throwWallDamage); shake=Math.max(shake,0.7); SFX.slam(null); log(`Slammed into the wall: −${CFG.brute.throwWallDamage}`,"#ff7070"); }
    T.last=sp; if(T.t<=0) player.thrown=null; }
  // hurt badly, she bleeds: drops of blood that ACROSS and Louis can follow
  if(MODE==="play" && !player.dead && player.hp<N.hp*N.bleedAt){ const L=player.lastDrip;
    if(!L || Math.hypot(player.pos.x-L.x,player.pos.z-L.z)>N.dripGap){ player.lastDrip={x:player.pos.x,z:player.pos.z}; world.trail.push({x:player.pos.x,z:player.pos.z,t:gameTime}); if(world.trail.length>240) world.trail.shift();
      bloodPool(player.pos.x+(Math.random()-.5)*0.25,player.pos.z+(Math.random()-.5)*0.25,0.05+Math.random()*0.06); } }
  if(world.flying.length) updateFlying(dt);
}

// the charge lane is good if nothing solid is in the way: weak walls, windows and doors are fine, furniture gets shoved
function chargeLane(ax,az,bx,bz){ for(const s of world.segs){ if(s.weak||s.win) continue; if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) return false; }
  for(const c of world.circles){ const dx=bx-ax, dz=bz-az, L2=dx*dx+dz*dz||1, u=clamp(((c.x-ax)*dx+(c.z-az)*dz)/L2,0,1); if(Math.hypot(ax+dx*u-c.x,az+dz*u-c.z)<c.r+0.3) return false; } return true; }
// whatever is just ahead of a charging Louis gives way
function chargeSmash(e, D){
  const r=e.radius+0.45, ax=e.pos.x, az=e.pos.z, bx=ax+D.x*r, bz=az+D.z*r;
  for(const s of [...world.segs]){ if(!segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) continue; if(s.weak) hitWeak(s.weak,999,e); else if(s.win) smashWindow(s.win,e); }
  for(const d of world.doors){ if(d.broken) continue; const s=doorSeg(d); if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) hitDoor(d,99,e); }
  for(const b of [...world.boxes]){ if(b.flying) continue; const cx=clamp(e.pos.x+D.x*0.3,b.x0,b.x1), cz=clamp(e.pos.z+D.z*0.3,b.z0,b.z1); if(Math.hypot(cx-e.pos.x-D.x*0.3,cz-e.pos.z-D.z*0.3)>e.radius+0.15) continue;
    if(b.w*b.d*b.h>CFG.brute.chargeMaxVol) continue;            // too heavy: it stops him
    const side=((b.x-e.pos.x)*-D.z+(b.z-e.pos.z)*D.x)>=0?1:-1, i=world.boxes.indexOf(b); if(i>=0) world.boxes.splice(i,1);
    b.flying=true; world.flying.push({b,e,charge:e,vx:D.x*5.5+(-D.z)*side*2.5,vz:D.z*5.5+D.x*side*2.5,vy:2.2,hit:false});
    SFX.doorHit(new THREE.Vector3(b.x,(b.y0||0)+0.5,b.z)); log(`${e.name} sends the ${b.name||"furniture"} flying`,"#ffb070"); }
  for(const o of enemies){ if(o===e||o.dead||o.kind!=="across") continue; if(Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<e.radius+o.radius+0.1 && o.gait && o.legsLost()===0) o.knockDown(new THREE.Vector3(D.x,0,D.z),"charge"); }
}
// ---------------------------------------------------------------- ACROSS: swarm tells, the crowd, the Walker's mob
const SWARM={lastTell:-9};
function tellOk(){ return gameTime-SWARM.lastTell>=CFG.across.tellGap; }
function markTell(){ SWARM.lastTell=gameTime; }
// the newest thing any hunting ACROSS knows about where Norah is
function crowdNote(x,z,src){ if(!world.crowd||gameTime>=world.crowd.t) world.crowd={x,z,t:gameTime,src}; }
// where a Walker that has lost her should go: the crowd's point (sight, noise, or a fresh blood drop it finds), while it's still fresh
function walkerCrowd(e){
  const tr=world.trail; for(let i=tr.length-1;i>=0;i--){ const q=tr[i]; if(world.crowd&&q.t<=world.crowd.t) break; if(Math.hypot(q.x-e.pos.x,q.z-e.pos.z)<8){ crowdNote(q.x,q.z,"blood"); break; } }
  const C=world.crowd; return C && gameTime-C.t<CFG.stealth.searchTime ? C : null;
}
// lost Walkers drift together as a mob on their way to the crowd's point
function walkerMob(e, want){
  const A=CFG.across; let sx=0, sz=0, n=0;
  for(const o of enemies){ if(o===e||o.dead||o.variant!=="walker") continue; const d=Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z); if(d<A.walkerMobRange){ sx+=o.pos.x; sz+=o.pos.z; n++; } }
  if(!n) return want; sx/=n; sz/=n; if(Math.hypot(sx-e.pos.x,sz-e.pos.z)<1.5) return want;
  return want+wrapA(Math.atan2(sx-e.pos.x,sz-e.pos.z)-want)*A.walkerMob;
}

// ---------------------------------------------------------------- the Crawler: cover to cover, hold, ambush; flee in the open; retreat when hurt
function coverSpots(){
  if(world.coverSpots) return world.coverSpots; const A=CFG.across, out=[];
  for(const b of world.boxes) if(b.under) out.push({kind:"under",box:b,get x(){ return this.box.x; },get z(){ return this.box.z; }});
  const B=world.bounds;
  for(let x=B.x0+1;x<B.x1-0.5;x+=2) for(let z=B.z0+1;z<B.z1-0.5;z+=2){ if(lightAt(x,z)>=A.crawlerDark) continue; const p=new THREE.Vector3(x,0,z); if(collide(p,0.4)) continue; out.push({kind:"dark",x,z}); }
  return world.coverSpots=out;
}
function seenByNorah(e){
  const dx=e.pos.x-player.pos.x, dz=e.pos.z-player.pos.z, d=Math.hypot(dx,dz); if(d>10||player.dead) return false;
  const face=isFixed()?player.yaw:camYaw; if(Math.abs(wrapA(Math.atan2(dx,dz)-face))>35*D2R) return false;
  return lineOfSight(player.pos.x,player.pos.z,e.pos.x,e.pos.z,true);
}
const crPick2=(a,b)=>a+Math.random()*Math.max(0,b-a);
// can it crawl straight there? (windows count as walls, unlike wallsClear)
function walkClear(ax,az,bx,bz){ for(const s of world.segs) if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) return false; for(const d of world.doors){ if(d.broken||d.ang>0.6) continue; const s=doorSeg(d); if(segsCross(ax,az,bx,bz,s.ax,s.az,s.bx,s.bz)) return false; } return true; }
Enemy.prototype.crStill=function(){ this.desired={x:0,z:0}; this.gait.mode="stall"; };
Enemy.prototype.crMove=function(s,speed,dt){ const S=this.S, f=this.speedNow()/Math.max(0.05,S.speed*S.crawlerSpeed); this.gait.mode="burst"; this.gait.mul=1; this.moveTo(s.x,s.z,speed*f,dt,false); };
Enemy.prototype.crArrived=function(s){ return s && Math.hypot(s.x-this.pos.x,s.z-this.pos.z)<0.7; };
Enemy.prototype.crPick=function(kind,tgt,spots,wp){
  const A=CFG.across, me=this.pos, taken=new Set(enemies.filter(o=>o!==this&&o.cr&&o.cr.spot).map(o=>o.cr.spot)); let best=null, bs=1e9;
  for(const s of spots){ if(taken.has(s)||s===this.cr.spot) continue; const dMe=Math.hypot(s.x-me.x,s.z-me.z), dT=Math.hypot(s.x-tgt.x,s.z-tgt.z), dN=Math.hypot(s.x-player.pos.x,s.z-player.pos.z);
    if(!walkClear(me.x,me.z,s.x,s.z) && !(wp && !wp.direct && walkClear(wp.x,wp.z,s.x,s.z))) continue;   // same room, or the next room on the way
    let score;
    if(kind==="advance"){ const myT=Math.hypot(me.x-tgt.x,me.z-tgt.z); if(dT>myT-1||dMe>12||dN<1.6) continue;
      if(this.cr.avoidA!=null && Math.abs(wrapA(Math.atan2(s.x-tgt.x,s.z-tgt.z)-this.cr.avoidA))<A.crawlerNewSide*D2R) continue;
      score=dMe+(dT<=A.crawlerHold?-1.5:0)+(s.kind==="dark"?0.6:0); }   // the nearest hop that gets it closer; a spot within holding range is worth a little more
    else if(kind==="flee"){ if(dN<2.5||dMe>10) continue;
      const ux=s.x-me.x, uz=s.z-me.z, L2=ux*ux+uz*uz||1, u=clamp(((player.pos.x-me.x)*ux+(player.pos.z-me.z)*uz)/L2,0,1); if(Math.hypot(me.x+ux*u-player.pos.x,me.z+uz*u-player.pos.z)<1.2) continue;
      score=dMe; }
    else { if(dN<5||dMe>14) continue; score=dMe-0.5*dN; }
    if(score<bs){ bs=score; best=s; } }
  return best;
};
Enemy.prototype.crawlerHurt=function(dir){
  const A=CFG.across, cr=this.cr||(this.cr={mode:"advance"});
  cr.mode="retreat"; cr.spot=null; cr.playDead=false; cr.hide=crPick2(A.crawlerRetreatMin,A.crawlerRetreatMax); cr.avoidA=Math.atan2(this.pos.x-player.pos.x,this.pos.z-player.pos.z);
  this.attackLog(`${this.name} is hurt and scuttles off to hide`);
};
Enemy.prototype.crawlerBrain=function(dt,dist,want,toP){
  const A=CFG.across, S=this.S, cr=this.cr||(this.cr={mode:"advance",spot:null,pause:0}), pp=player.pos;
  const see=this.sees||dist<1.4; if(see) crowdNote(pp.x,pp.z,"sight");
  const tgt=see?{x:pp.x,z:pp.z}:(world.crowd||this.lastKnown||{x:pp.x,z:pp.z}), spots=coverSpots();
  const atCover=cr.playDead||this.crArrived(cr.spot);
  // the ambush: from hiding, near-instant ankle grab as she passes
  if(atCover && cr.mode!=="flee" && cr.mode!=="retreat" && dist<A.crawlerAmbush && (!player.grabbed||canJoinGrab(this)) && !player.dead && this.armsLeft()>0 && lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,true) && tellOk()){
    markTell(); cr.playDead=false; cr.mode="hold"; this.grabKind="ankle"; this.state="grab"; this.hitDone=false; this.grabReach=2.2; this.t=Math.max(0,0.3-A.crawlerAmbushTell); SFX.scratch(this.pos);
    this.attackLog(`${this.name} springs from hiding (Norah at ${dist.toFixed(2)} m)`); return; }
  // caught in the open: flee to cover, or fight if she's on top of it
  if(!atCover && cr.mode!=="flee" && cr.mode!=="retreat" && seenByNorah(this)){
    const c=this.crPick("flee",tgt,spots);
    if(dist<A.crawlerCornered||!c){ if(this.swCool<=0&&this.armsLeft()>0&&dist<S.swipeRange+0.3&&tellOk()){ markTell(); this.startSwipe(false); return; } this.turnTo(want,dt,A.turn); if(c){ cr.mode="flee"; cr.spot=c; cr.burst=1.3; } else this.crStill(); return; }
    cr.mode="flee"; cr.spot=c; cr.burst=1.3; this.attackLog(`${this.name} is caught in the open and scuttles for cover`); }
  if(cr.mode==="flee"){
    if(dist<A.crawlerCornered && this.swCool<=0 && this.armsLeft()>0 && tellOk()){ markTell(); this.startSwipe(false); return; }
    if(!cr.spot||this.crArrived(cr.spot)){ cr.mode="advance"; cr.arrivedAt=cr.spot; cr.pause=crPick2(A.crawlerPauseMin,A.crawlerPauseMax); this.crStill(); return; }
    cr.burst-=dt; if(cr.burst<=0) cr.burst=1.3; if(cr.burst>0.3) this.crMove(cr.spot,A.crawlerFlee,dt); else this.crStill(); return; }
  if(cr.mode==="retreat"){
    if(!cr.spot) cr.spot=this.crPick("retreat",tgt,spots)||this.crPick("flee",tgt,spots);
    if(cr.spot && !this.crArrived(cr.spot)){ this.crMove(cr.spot,A.crawlerFlee*0.8,dt); return; }
    this.crStill(); cr.hide-=dt; if(cr.hide<=0){ cr.mode="advance"; cr.arrivedAt=cr.spot; } return; }
  if(cr.mode==="hold"){
    this.crStill(); this.turnTo(want,dt,60); const s=cr.spot||this.pos;
    if(Math.hypot(tgt.x-s.x,tgt.z-s.z)>A.crawlerHold+4){ cr.mode="advance"; cr.playDead=false; cr.arrivedAt=cr.spot; } return; }
  // advance: cover to cover toward her, pausing at each, until close enough to hold
  if(cr.pause>0){ cr.pause-=dt; this.crStill(); return; }
  if(cr.spot && this.crArrived(cr.spot)){
    if(cr.arrivedAt!==cr.spot){ cr.arrivedAt=cr.spot; cr.pause=crPick2(A.crawlerPauseMin,A.crawlerPauseMax); if(cr.deadSpot){ cr.playDead=true; cr.mode="hold"; cr.deadSpot=false; } this.crStill(); return; }
    if(Math.hypot(tgt.x-cr.spot.x,tgt.z-cr.spot.z)<=A.crawlerHold){ cr.mode="hold"; cr.avoidA=null; this.crStill(); return; } }
  if(!cr.spot || this.crArrived(cr.spot)){
    const wp=route(this.pos.x,this.pos.z,tgt.x,tgt.z), n=this.crPick("advance",tgt,spots,wp);
    if(n){ cr.spot=n; }
    else if(!wp.direct || !walkClear(this.pos.x,this.pos.z,tgt.x,tgt.z)){ cr.spot={x:wp.x,z:wp.z,kind:"door"}; cr.arrivedAt=cr.spot; }   // through the doorway toward her, then find cover there
    else if(Math.hypot(tgt.x-this.pos.x,tgt.z-this.pos.z)<=A.crawlerHold && cr.spot){ cr.mode="hold"; this.crStill(); return; }
    else { // no cover between it and her: the darkest spot nearby in the same room, closer to her, and play dead there
      const myT=Math.hypot(tgt.x-this.pos.x,tgt.z-this.pos.z); let best=null, bl=9;
      for(let i=0;i<20;i++){ const p=this.randomPoint(this.pos.x,this.pos.z,8); if(!walkClear(this.pos.x,this.pos.z,p.x,p.z)) continue; const dT=Math.hypot(tgt.x-p.x,tgt.z-p.z); if(dT>myT||dT<1.6) continue; const l=lightAt(p.x,p.z); if(l<bl){ bl=l; best=p; } }
      if(!best && myT>A.crawlerHold){ const k=(myT-A.crawlerHold+0.5)/myT; best={x:this.pos.x+(tgt.x-this.pos.x)*k,z:this.pos.z+(tgt.z-this.pos.z)*k}; }   // nothing darker on the way: creep into holding range first
      cr.spot=best||{x:this.pos.x,z:this.pos.z}; cr.deadSpot=true; cr.arrivedAt=null; } }
  this.crMove(cr.spot,A.crawlerSpeed,dt);
};

// ---------------------------------------------------------------- the second grab: while she's held, one more ACROSS can join in
function canJoinGrab(e){ const g=player.grabbed; return !!g && g.by!==e && g.by.kind!=="brute" && e.kind!=="brute" && !(g.extra&&g.extra.length); }
function joinGrab(by,o){
  if(!canJoinGrab(by)) return false; const g=player.grabbed, A=CFG.across, q=g.qte; g.extra=[by]; by.joinDmg=o.dmg||A.grabDamage;
  if(q&&q.mode==="mash"){ q.fill=Math.max(0,q.fill-A.joinDrain); q.wrong=0.3; }
  else if(q){ for(let i=0;i<A.joinKeys;i++){ let k; do{ k=QTE_KEYS[Math.floor(Math.random()*QTE_KEYS.length)]; }while(q.seq.length&&k===q.seq[q.seq.length-1]&&QTE_KEYS.length>1); q.seq.push(k); } q.t=q.win; }
  SFX.scratch(by.pos); shake=Math.max(shake,0.25); log(`${by.name} grabs her too`,"#ff7070"); if(run) run.grabs++; return true;
}
function joinedRelease(g, bite){
  for(const x of g.extra||[]){ if(x.dead) continue; if(bite) player.bite(x,"bite",x.joinDmg||CFG.across.grabDamage); x.state="recover"; x.t=0; x.cool=1.5; x.swCool=1.0; if(!bite){ x.stagger=0.6; x.state="stagger"; x.flinch=1; } }
  g.extra=[];
}

// ---------------------------------------------------------------- the Matron: steady, hugs, shoves, batters doors, guards the spot
Enemy.prototype.matronBrain=function(dt,dist,want,toP){
  const A=CFG.across, S=this.S, G=this.gait, pp=player.pos, see=this.sees||dist<1.4, f=this.speedNow()/Math.max(0.1,S.speed);
  this.mc=this.mc||{hug:1,shove:1,bat:0}; for(const k of ["hug","shove","bat"]) this.mc[k]-=dt;
  G.mode="shamble"; G.near=false; G.mul=1;
  if(see) crowdNote(pp.x,pp.z,"sight");
  const clear=see && lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,false);
  if(clear && !player.dead){
    if(dist<A.matronShoveRange && this.mc.shove<=0 && this.armsLeft()===2 && !player.grabbed && tellOk()){ markTell(); this.state="mshove"; this.t=0; this.hitDone=false; this.mc.shove=A.matronShoveCool; SFX.grunt(this.pos,A.matronShoveTell); this.attackLog(`${this.name} braces to shove`); return; }
    if(dist<A.matronHugRange && this.mc.hug<=0 && this.armsLeft()===2 && (!player.grabbed||canJoinGrab(this)) && tellOk()){ markTell(); this.grabKind="hug"; this.state="grab"; this.hitDone=false; this.grabReach=A.matronHugRange+0.2; this.t=0.3-A.matronHugTell; this.mc.hug=A.matronHugCool; SFX.scratch(this.pos); this.attackLog(`${this.name} opens her arms`); return; }
    if(dist<S.swipeRange && this.swCool<=0 && this.armsLeft()>0 && !player.grabbed && tellOk()){ markTell(); this.startSwipe(false); return; }
  }
  // a door between her and where Norah is: batter it down
  const door=this.findDoor(dist);
  if(door){ this.turnTo(Math.atan2(door.mx-this.pos.x,door.mz-this.pos.z),dt,A.turn); this.desired={x:0,z:0}; G.mode="stall";
    if(this.mc.bat<=0){ this.mc.bat=A.matronBatterRate; hitDoor(door.d,A.matronDoorDamage,this); SFX.doorHit(new THREE.Vector3(door.mx,1,door.mz)); makeNoise(door.mx,door.mz,8,"battering",true,undefined,undefined,this); } return; }
  // lost her: go to where she was last seen and guard it
  if(!see && this.lastKnown && Math.hypot(this.lastKnown.x-this.pos.x,this.lastKnown.z-this.pos.z)<0.9){
    this.desired={x:0,z:0}; G.mode="stall"; this.guardT=(this.guardT||0)+dt; this.turnTo(this.yaw+Math.sin(this.guardT*0.7)*0.9,dt,35); return; }
  this.guardT=0;
  const g=this.goal(dt); this.steer(dt, Math.atan2(g.x-this.pos.x,g.z-this.pos.z), A.matronSpeed*f, A.turn*0.6);
};
Enemy.prototype.matronShove=function(dt,dist,want){
  const A=CFG.across; this.turnTo(want,dt,A.turn*0.6);
  if(!this.hitDone && this.t>=A.matronShoveTell){ this.hitDone=true; this.hitFlash=0.2; const ok=dist<A.matronShoveRange+0.35 && this.facing(new THREE.Vector3(player.pos.x-this.pos.x,0,player.pos.z-this.pos.z).normalize())>0.4;
    this.attackLog(`${this.name} shove: Norah ${dist.toFixed(2)} m → ${ok?"DOWN":"miss"}`); if(ok){ knockNorah(A.matronShoveDamage,this,"shove",A.matronShoveDown); SFX.shove(); } }
  if(this.t>=A.matronShoveTell+0.35){ this.state="chase"; this.t=0; }
};

// ---------------------------------------------------------------- the Mourner: kneels over a body; disturbed, it wails, and every hit makes it worse
function mStage(s){ return Math.max(1,Math.min(3,s||1)); }
Enemy.prototype.mournerWatch=function(dt,dist){
  const A=CFG.across, pp=player.pos; this.sees=false; if(player.dead) return;
  const los=()=>lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,true);
  if(dist<A.mournerNear*(player.crouch?A.mournerCrouch:1) && los()){ this.mournerWake("feels her come too close"); return; }
  const F=player.flash; let lit=false;
  if(F && F.on && F.charge>0 && dist<A.mournerLightRange){ const yaw=isFixed()?player.yaw:camYaw, a=Math.abs(wrapA(Math.atan2(this.pos.x-pp.x,this.pos.z-pp.z)-yaw)); lit = a<A.mournerLightCone*Math.PI/360 && los(); }
  this.lightT = lit ? (this.lightT||0)+dt : Math.max(0,(this.lightT||0)-dt*0.5);
  if(this.lightT>=A.mournerLight) this.mournerWake("lifts its head into the light");
};
Enemy.prototype.mournerWake=function(why){
  this.mstage=Math.max(this.mstage||0,1); this.lightT=0; this.state="chase"; this.t=0;
  this.mc={wail:0, scream:0.6, cling:0.6}; this.alert(why,true); };
Enemy.prototype.mournerHurt=function(){
  const st=Math.min(3,Math.max(1,this.mstage||0)+1), up=st>(this.mstage||0); this.mstage=st;
  this.mc=this.mc||{wail:0,scream:0.6,cling:0.6}; this.mc.wail=0; this.mlg=null;
  if(up) log(`${this.name} ${st===2?"rises, wailing louder":"breaks into a frenzy"} (stage ${st})`,"#ffb070"); };
Enemy.prototype.mournerCalm=function(){
  const I=this.idle; this.aware="unaware"; this.awareness=0; this.mstage=0; this.lightT=0; this.state="chase"; this.mlg=null; this.mwT=0;
  I.base="feed"; I.kind="return"; I.tx=null; log(`${this.name} goes back to the body and quiets`,"#9ed08a"); };
Enemy.prototype.mournerWail=function(){
  const A=CFG.across, st=mStage(this.mstage), r=A["mournerCall"+st], pp=player.pos; let n=0;
  for(const e of enemies){ if(e===this||e.dead||e.kind!=="across"||e.variant==="mourner") continue; if(r<99 && Math.hypot(e.pos.x-this.pos.x,e.pos.z-this.pos.z)>r) continue;
    e.lastKnown={x:pp.x,z:pp.z}; e.disguised=false; if(e.aware!=="hunting") e.alert("answers the wail",false); else e.lostT=0; n++; }
  crowdNote(pp.x,pp.z,"noise"); this.mwT=0.9; SFX.wail(this.pos); if(st>=3) SFX.shriek(this.pos);
  log(`${this.name} wails${st>=3?" across the whole map":` (${r} m)`}: ${n} answer`,"#ffb070"); };
Enemy.prototype.mournerScream=function(dt,dist,want){
  const A=CFG.across, st=mStage(this.mstage); this.turnTo(want,dt,A.turn);
  if(!this.hitDone && this.t>=A.mournerScreamTell){ this.hitDone=true; this.hitFlash=0.2; SFX.shriek(this.pos); SFX.wail(this.pos);
    const ok=dist<A.mournerScreamRange+0.5 && lineOfSight(this.pos.x,this.pos.z,player.pos.x,player.pos.z,true) && !player.dead;
    this.attackLog(`${this.name} scream: Norah ${dist.toFixed(2)} m → ${ok?"STUNNED":"miss"}`);
    if(ok){ const k=A["mournerStun"+st]; player.stumble=Math.max(player.stumble,k); player.aiming=false; player.dazed=Math.max(player.dazed,k*2); shake=Math.max(shake,0.5); log(`${this.name} screams in her face: stunned ${k.toFixed(1)} s`,"#ff7070"); } }
  if(this.t>=A.mournerScreamTell+0.45){ this.state="chase"; this.t=0; } };
Enemy.prototype.mournerBrain=function(dt,dist,want,toP){
  const A=CFG.across, S=this.S, G=this.gait, pp=player.pos, st=mStage(this.mstage), see=this.sees||dist<1.4, f=this.speedNow()/Math.max(0.1,S.speed);
  this.mstage=st; this.mc=this.mc||{wail:0,scream:0.6,cling:0.6}; for(const k of ["wail","scream","cling"]) this.mc[k]-=dt; this.mwT=Math.max(0,(this.mwT||0)-dt);
  G.near=false; G.mul=1; if(see) crowdNote(pp.x,pp.z,"sight");
  if(this.mc.wail<=0){ this.mc.wail=A["mournerWailGap"+st]; this.mournerWail(); }
  const clear=see && lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,false);
  if(clear && !player.dead){
    if(dist<A.mournerClingRange && this.mc.cling<=0 && this.armsLeft()>0 && (!player.grabbed||canJoinGrab(this)) && tellOk()){ markTell(); this.grabKind="cling"; this.state="grab"; this.hitDone=false; this.grabReach=A.mournerClingRange+0.2; this.t=0.3-A.mournerClingTell; this.mc.cling=A.mournerClingCool; this.mc.wail=A.mournerClingTell+A.mournerClingWail; SFX.scratch(this.pos); this.attackLog(`${this.name} reaches to cling`); return; }
    if(dist<A.mournerScreamRange && this.mc.scream<=0 && !player.grabbed && player.stumble<=0 && tellOk()){ markTell(); this.state="mscream"; this.t=0; this.hitDone=false; this.mc.scream=A.mournerScreamCool; this.attackLog(`${this.name} draws breath`); return; }
    if(st>=2 && dist<S.swipeRange && this.swCool<=0 && this.armsLeft()>0 && !player.grabbed && tellOk()){ markTell(); this.startSwipe(false); return; }
  }
  if(st===1){ G.mode="stall"; this.desired={x:0,z:0}; this.turnTo(want,dt,A.turn*0.5); return; }
  const g=this.goal(dt), head=Math.atan2(g.x-this.pos.x,g.z-this.pos.z);
  if(st===2){ const L=this.mlg||(this.mlg={on:false,t:0.2}); L.t-=dt; if(L.t<=0){ L.on=!L.on; L.t=L.on?A.mournerLungeTime:A.mournerLungePause; }
    if(L.on){ G.mode="burst"; this.steer(dt,head,A.mournerLunge*f,A.turn*0.8); } else { G.mode="stall"; this.desired={x:0,z:0}; this.turnTo(head,dt,A.turn*0.6); } return; }
  G.mode="burst"; this.steer(dt,head,A.mournerSprint*f,A.turn*1.2);
};
// ================================================================ the low-poly character models (photo-textured GLBs from the repo)
// Each GLB has the shared 16-bone skeleton. The engine's own procedural rig still does all the posing (it's what the AI,
// hit reactions and limb loss drive); it's hidden, and every frame the model's bones are turned to match it.
const MDL = { ready:{}, loading:{}, failed:{}, live:new Set() };
const MDL_EPS = 1e-4;
function mdlInfo(key){ return MODEL_LIB[key]||null; }
function mdlLoad(key){
  const I=mdlInfo(key); if(!I) return Promise.reject(new Error("no model "+key));
  if(MDL.ready[key]) return Promise.resolve(MDL.ready[key]);
  if(MDL.loading[key]) return MDL.loading[key];
  if(!THREE.GLTFLoader) return Promise.reject(new Error("GLTFLoader missing"));
  MDL.loading[key]=new Promise((res,rej)=>{ new THREE.GLTFLoader().load(I.f, g=>{
      g.scene.traverse(o=>{ if(o.isMesh){ const m=o.material, map=m.map; if(map){ map.encoding=THREE.LinearEncoding; map.anisotropy=1; }
        o.material=new THREE.MeshLambertMaterial({map, color:0xffffff, side:THREE.DoubleSide, skinning:!!o.isSkinnedMesh}); o.frustumCulled=false; o.castShadow=false; } });
      MDL.ready[key]=g; res(g); }, undefined, e=>{ MDL.failed[key]=String(e&&e.message||e); delete MDL.loading[key]; rej(e); }); });
  return MDL.loading[key];
}
function mdlPreload(keys){ return Promise.all([...new Set(keys.filter(k=>mdlInfo(k)))].map(k=>mdlLoad(k).catch(()=>null))); }
function mdlClone(key){ const g=MDL.ready[key]; if(!g) return null; const sc=THREE.SkeletonUtils.clone(g.scene); const B={};
  sc.traverse(o=>{ if(o.isBone) B[o.name]=o; if(o.isSkinnedMesh) o.frustumCulled=false; }); return {scene:sc, B, clips:g.animations}; }

// which model each body uses
const MDL_POOLS = {
  men:k=>MODEL_LIB[k].g==="across/men", women:k=>MODEL_LIB[k].g==="across/women", imposing:k=>MODEL_LIB[k].g==="across/imposing", uncanny:k=>MODEL_LIB[k].g==="across/uncanny" };
const MDL_POOL_OPTS = [["mixed","Men and women"],["men","Men"],["women","Women"],["imposing","Imposing (bigger, extra hits)"],["all","All ACROSS incl. imposing"],["uncanny","Uncanny faces (look test)"],["off","Old procedural body"]];
function mdlPool(name){ const ks=Object.keys(MODEL_LIB).filter(k=>MODEL_LIB[k].hip && !MODEL_LIB[k].end);
  if(name==="mixed") return ks.filter(k=>MDL_POOLS.men(k)||MDL_POOLS.women(k));
  if(name==="all") return ks.filter(k=>MDL_POOLS.men(k)||MDL_POOLS.women(k)||MDL_POOLS.imposing(k));
  if(MDL_POOLS[name]) return ks.filter(MDL_POOLS[name]); return []; }
function mdlSim(){ return (typeof SIM!=="undefined"&&SIM.models)||{}; }
function mdlOn(){ return mdlSim().on!==false; }
function pickModel(what){
  if(!mdlOn()) return null; const M=mdlSim();
  if(what==="norah") return mdlInfo(M.norah||"norah")?(M.norah||"norah"):"norah";
  if(what==="louis") return mdlInfo(M.louis||"louis_brute")?(M.louis||"louis_brute"):"louis_brute";
  const pool=mdlPool((M.pools||{})[what]||MDL_DEFAULT_POOL[what]||"mixed"); if(!pool.length) return null;
  return pool[Math.floor(Math.random()*pool.length)];
}
const MDL_DEFAULT_POOL={walker:"all", crawler:"mixed", matron:"women", mourner:"men"};
function mdlPoolKeys(){ const M=mdlSim(), out=[]; if(!mdlOn()) return out; out.push(pickModel("norah"), pickModel("louis"));
  for(const v of ["walker","crawler","matron","mourner","runner"]) out.push(...mdlPool((M.pools||{})[v]||MDL_DEFAULT_POOL[v])); return out; }

// the bone map: GLB bone ← procedural joint. "ori" copies the joint's world orientation; "dir" points the bone
// (whose rest axis runs toward its child) along a direction taken from the procedural rig.
const AX={L:new THREE.Vector3(1,0,0), R:new THREE.Vector3(-1,0,0), D:new THREE.Vector3(0,-1,0)};
function mdlMap(P, person){
  const m=[["hips","ori",P.hips]];
  if(person){ m.push(["chest","ori",P.chest],["neck","ori",P.neck],["head","ori",P.head]);
    for(const s of ["L","R"]) m.push(["upperarm_"+s,"pts",P["arm"+s],P["elbow"+s],AX[s],"arm"+s],["forearm_"+s,"pts",P["elbow"+s],P["wrist"+s],AX[s],"arm"+s],["hand_"+s,"axis",P["wrist"+s],AX.D,AX[s],"arm"+s]);
    for(const s of ["L","R"]) m.push(["thigh_"+s,"pts",P["leg"+s],P["knee"+s],AX.D,"leg"+s],["shin_"+s,"pts",P["knee"+s],P["ankle"+s],AX.D,"leg"+s],["foot_"+s,"ori",P["ankle"+s],null,null,"leg"+s]); }
  else { m.push(["chest","ori",P.torso],["neck","ori",P.neck],["head","ori",P.neck]);
    for(const s of ["L","R"]) m.push(...(P["elbow"+s] ? [["upperarm_"+s,"pts",P["arm"+s],P["elbow"+s],AX[s],"arm"+s],["forearm_"+s,"pts",P["elbow"+s],P["wrist"+s],AX[s],"arm"+s],["hand_"+s,"axis",P["wrist"+s],AX.D,AX[s],"arm"+s]]
        : [["upperarm_"+s,"axis",P["arm"+s],AX.D,AX[s],"arm"+s],["forearm_"+s,"axis",P["arm"+s],AX.D,AX[s],"arm"+s],["hand_"+s,"axis",P["arm"+s],AX.D,AX[s],"arm"+s]]));
    for(const s of ["L","R"]) m.push(["thigh_"+s,"pts",P["leg"+s],P["knee"+s],AX.D,"leg"+s], P["ankle"+s]?["shin_"+s,"pts",P["knee"+s],P["ankle"+s],AX.D,"leg"+s]:["shin_"+s,"axis",P["knee"+s],AX.D,AX.D,"leg"+s],["foot_"+s,"ori",P["ankle"+s]||P["knee"+s],null,null,"leg"+s]); }
  return m;
}
// fit the hidden rig to the model: scale it so its hips sit at the model's hip height, at the model's true size
function mdlFit(root, procHip, key, height){
  const I=mdlInfo(key); const H=height||I.h, ms=H/I.h; const k=(I.hip*ms)/procHip; root.scale.setScalar(k); return {k, ms, H}; }

// attach a model to a body. owner: the Enemy, or null for Norah. Returns the skin record (the model appears once loaded).
function skinBody(root, P, key, opts={}){
  const I=mdlInfo(key); if(!I||!I.hip) return null;
  const S={root, P, key, person:!!opts.person, owner:opts.owner||null, fit:opts.fit, model:null, B:null, map:null, hidden:[], collapsed:{}, on:true};
  const attach=()=>{ if(!S.on||S.model) return; const c=mdlClone(key); if(!c) return;
    S.model=c.scene; S.B=c.B; S.clips=c.clips; S.model.scale.setScalar(S.fit.ms/S.fit.k); root.add(S.model);
    S.map=mdlMap(P,S.person).filter(r=>S.B[r[0]] && r[2]);
    // hide the procedural body; keep its hitboxes (they still take the shots) and Norah's gun
    root.traverse(o=>{ if(!o.isMesh || o===P.gun || S.model===o || isUnder(o,S.model)) return;
      if(o.userData.hitbox) return;
      if(o.userData.zone){ o.material=o.material.clone(); o.material.transparent=true; o.material.opacity=0.35; o.material.depthWrite=false; o.material.visible=!!CFG.world.showZones; o.userData.hitbox=true; o.userData.baseCol=o.material.color.getHex(); return; }
      if(o.visible){ o.visible=false; S.hidden.push(o); } });
    if(P.gun && opts.gun){ const hb=S.B.hand_R; P.gun.userData.home={parent:P.gun.parent,pos:P.gun.position.clone(),rot:P.gun.rotation.clone(),scale:P.gun.scale.clone()};
      hb.add(P.gun); const u=1/S.fit.ms; P.gun.position.set(-0.07*u,-0.035*u,0.0); P.gun.rotation.set(0,-Math.PI/2,0); P.gun.scale.setScalar(u); }
    for(const l in (S.owner&&S.owner.lost)||{}) if(S.owner.lost[l]) mdlCollapse(S,l,S.owner.lostSeg&&S.owner.lostSeg[l]);
    MDL.live.add(S); skinSync(S); };
  if(MDL.ready[key]) attach(); else mdlLoad(key).then(attach).catch(()=>{});
  return S;
}
function isUnder(o,top){ while(o){ if(o===top) return true; o=o.parent; } return false; }
function skinDrop(S){ if(!S) return; S.on=false; const g=S.P&&S.P.gun, h=g&&g.userData.home; if(h){ h.parent.add(g); g.position.copy(h.pos); g.rotation.copy(h.rot); g.scale.copy(h.scale); g.userData.home=null; } MDL.live.delete(S); if(S.model&&S.model.parent) S.model.parent.remove(S.model); }

const _q1=new THREE.Quaternion(), _q2=new THREE.Quaternion(), _v1=new THREE.Vector3(), _v2=new THREE.Vector3(), _v3=new THREE.Vector3();
function skinSync(S){
  if(!S.model) return; const B=S.B; S.root.updateMatrixWorld(true);
  const hips=B.hips; S.P.hips.getWorldPosition(_v1); hips.parent.updateWorldMatrix(true,false); hips.parent.worldToLocal(_v1); hips.position.copy(_v1);
  for(const r of S.map){ const [name,kind,src,b,axis,limb]=r, bone=B[name];
    if(limb && S.collapsed[name]) continue;
    bone.parent.getWorldQuaternion(_q1); _q1.invert();
    if(kind==="ori"){ src.getWorldQuaternion(_q2); bone.quaternion.copy(_q1).multiply(_q2); }
    else { if(kind==="pts"){ src.getWorldPosition(_v2); b.getWorldPosition(_v3); _v3.sub(_v2); } else { src.getWorldQuaternion(_q2); _v3.copy(b).applyQuaternion(_q2); }
      if(_v3.lengthSq()<1e-10) continue; _v3.normalize().applyQuaternion(_q1); bone.quaternion.setFromUnitVectors(axis,_v3); }
    bone.updateMatrixWorld(true); }
  if(S.owner && S.person && (S.owner.clipW||0)>0.01 && !S.owner.dead) legsFromClip(S,S.owner);
}
// the model's own clips, sampled per bone (shared by every copy of a model)
MDL.samp={};
function mdlSamplers(key){ if(MDL.samp[key]) return MDL.samp[key]; const g=MDL.ready[key]; if(!g) return null; const out={};
  for(const c of g.animations){ const tr={}; for(const t of c.tracks){ const dot=t.name.lastIndexOf("."), node=t.name.slice(0,dot), prop=t.name.slice(dot+1); if(prop==="quaternion") tr[node]=t.createInterpolant(); } out[c.name]={tr,dur:c.duration}; }
  return MDL.samp[key]=out; }
const _cq=[new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion()];
function clipQ(sm,clip,bone,t,out){ const c=sm[clip], it=c&&c.tr[bone]; if(!it){ out.identity(); return false; } const r=it.evaluate(((t%c.dur)+c.dur)%c.dur); out.set(r[0],r[1],r[2],r[3]); return true; }
function clipBlend(sm,bone,t,run,out){ clipQ(sm,"walk",bone,t,out); if(run>0.01 && sm.run){ clipQ(sm,"run",bone,t,_cq[4]); out.slerp(_cq[4],run); } return out; }
// legs from the walk/run clip, under whatever the procedural hips are doing; blended over the puppet's legs by the clip weight
function legsFromClip(S,o){
  const sm=mdlSamplers(S.key); if(!sm||!sm.walk) return; const B=S.B, w=Math.min(1,o.clipW), t=o.clipT||0, run=o.clipRun||0;
  const hq=clipBlend(sm,"hips",t,run,_cq[0]); S.model.getWorldQuaternion(_cq[1]); _cq[1].multiply(hq);   // an upright clip hips, in the world
  B.hips.getWorldQuaternion(_cq[2]); _cq[2].invert();
  for(const s of ["L","R"]){ if(S.collapsed["thigh_"+s]) continue;
    const th=B["thigh_"+s]; clipBlend(sm,"thigh_"+s,t,run,_cq[3]); _cq[3].premultiply(_cq[1]).premultiply(_cq[2]); th.quaternion.slerp(_cq[3],w*(s==="R"?(o.clipLegR??1):1));
    for(const n of ["shin_"+s,"foot_"+s]){ if(S.collapsed[n]) continue; clipBlend(sm,n,t,run,_cq[3]); B[n].quaternion.slerp(_cq[3],w*(s==="R"?(o.clipLegR??1):1)); }
    th.updateMatrixWorld(true); }
}
function skinSyncAll(){ for(const S of MDL.live){ if(!S.root.parent){ MDL.live.delete(S); continue; } if(S.root.visible!==false) skinSync(S); } }

// limb loss: the model's limb folds away to nothing at the cut, and a copy of just that limb flies off
const LIMB_BONE={armL:["upperarm_L"], armR:["upperarm_R"], legL:["thigh_L","shin_L"], legR:["thigh_R","shin_R"]};
function mdlCollapse(S, limb, seg){
  if(!S||!S.model) return null; const bn=limb.startsWith("leg")&&seg==="lower"?LIMB_BONE[limb][1]:LIMB_BONE[limb][0], bone=S.B[bn]; if(!bone||S.collapsed[bn]) return null;
  // the flying piece: a clone posed like the body, with everything but this limb folded into the hips
  let piece=null; const c=mdlClone(S.key);
  if(c){ c.scene.scale.copy(S.model.scale); c.scene.position.copy(S.model.position); c.scene.quaternion.copy(S.model.quaternion);
    for(const k in S.B){ if(c.B[k]){ c.B[k].position.copy(S.B[k].position); c.B[k].quaternion.copy(S.B[k].quaternion); } }
    let depth=0; for(let o=c.B[bn].parent; o&&o.isBone; o=o.parent) depth++;
    c.B.hips.scale.setScalar(MDL_EPS); c.B[bn].scale.setScalar(1/MDL_EPS);
    piece=c.scene; }
  for(const k of Object.keys(S.B)){ let o=S.B[k]; while(o&&o.isBone){ if(o===bone){ S.collapsed[k]=true; break; } o=o.parent; } }
  bone.scale.setScalar(MDL_EPS); bone.updateMatrixWorld(true);
  return piece;
}

// ---------------------------------------------------------------- bodies
function skinEnemy(e){
  if(!e.mdl) return; const I=mdlInfo(e.mdl); if(!I) return;
  const person=e.kind!=="brute"; const procHip = person ? e.root.userData.person.hipY : 0.95;
  const H = e.kind==="brute" ? CFG.brute.height*I.h/MDL_LOUIS_H() : I.h;
  const fit=mdlFit(e.root, procHip, e.mdl, H); e.scale=fit.k; if(person) e.height=fit.H;
  e.skin=skinBody(e.root, e.P, e.mdl, {person, owner:e, fit});
}
function MDL_LOUIS_H(){ const I=mdlInfo(mdlSim().louis||"louis_brute"); return I?I.h:2.64; }
function skinPlayer(){
  skinDrop(player.skin); player.skin=null; player.root.scale.setScalar(1);
  for(const o of player.hiddenProc||[]) o.visible=true; player.hiddenProc=null;
  const key=pickModel("norah"); if(!key) return; const I=mdlInfo(key); if(!I||!I.hip) return;
  const fit=mdlFit(player.root, 0.95, key, I.h);
  player.skin=skinBody(player.root, player.P, key, {person:false, fit, gun:true});
  if(player.skin) player.hiddenProc=player.skin.hidden;
}
// ---------------------------------------------------------------- ACROSS animation layer: flinches, and the leg clip's weight and (snapping) time
Enemy.prototype.animLayer=function(v,dt,mv){
  const A=CFG.across, P=this.P;
  // per-zone flinch: snaps in, then lets go in jerky steps (a puppet dropped and caught on its wires)
  let tw=0; const F=this.hfx;
  if(F){ F.t+=dt; const T=A.animFlinchTime; if(F.t>=T) this.hfx=null; else {
    const raw=1-F.t/T, steps=A.animSnap>0?Math.max(2,Math.round(5/A.animSnap)):0, a=(steps?Math.ceil(raw*steps)/steps:raw)*A.animFlinch*(F.t<0.04?F.t/0.04:1);
    const s = F.limb && F.limb.endsWith("R") ? -1 : 1;
    if(F.z==="head"){ v.nX-=1.1*a; v.hp-=0.25*a; v.cH-=0.2*a; v.jaw=Math.max(v.jaw,0.7*a); v.nZ+=0.3*a*(this.id%2?1:-1); }
    else if(F.z==="torso"){ v.hp+=0.55*a; v.cH+=0.35*a; v.aLX+=0.5*a; v.aRX+=0.5*a; v.nX+=0.4*a; v.hy-=0.05*a; }
    else if(F.z==="arm"){ tw=0.75*a*s; if(s>0){ v.aLX-=1.3*a; v.aLZ+=0.7*a; v.eL*=1-a; } else { v.aRX-=1.3*a; v.aRZ-=0.7*a; v.eR*=1-a; } v.hr+=0.15*a*s; v.nZ+=0.25*a*s; }
    else if(F.z==="leg"){ if(s>0){ v.kL+=1.2*a; v.lLX-=0.35*a; } else { v.kR+=1.2*a; v.lRX-=0.35*a; } v.hy-=0.14*a; v.hr+=0.28*a*s; v.hp+=0.2*a; } } }
  this.twist=tw;
  // the leg clip: on while it walks upright toward her; the puppet takes the legs back for anything else
  const G=this.gait, sp=Math.hypot(this.vel.x,this.vel.z);
  const upright = this.stance!=="crawling" && this.legsLost()===0 && this.state==="chase" && G && G.mode!=="fallen" && G.mode!=="rising" && !this.disguised
    && !(this.aware==="unaware" && (this.idle.kind==="feed"||this.idle.kind==="playdead"||this.idle.kind==="lurk")) && !(this.cr&&this.cr.playDead) && sp>0.05;
  const want = upright ? A.animClip : 0; this.clipW=(this.clipW||0)+(want-(this.clipW||0))*Math.min(1,dt*8);
  this.clipRun=(this.clipRun||0)+((sp>(A.animWalkRef+A.animRunRef)/2?A.animRunMix:0)-(this.clipRun||0))*Math.min(1,dt*5);
  const rate = sp/(A.animWalkRef+(A.animRunRef-A.animWalkRef)*Math.min(1,(this.clipRun||0)/Math.max(0.05,A.animRunMix)));
  this.clipRaw=(this.clipRaw||0)+dt*rate; this.clipHold=(this.clipHold||0)-dt;
  if(A.animSnap<=0) this.clipT=this.clipRaw;
  else if(this.clipHold<=0 || this.clipT==null){ this.clipT=this.clipRaw; this.clipHold=(0.04+Math.random()*0.12)*A.animSnap*(G&&G.mode==="burst"?0.6:1); }
};
// ---------------------------------------------------------------- Norah's movement: a reluctant walk and jog, in three states by health
// fine: upright and wary · hurt (bleeding): a limp on the right, her left hand clutching her side · critical: hunched, dragging the right leg, lurching
// Her rig gets hidden elbows, wrists and ankles so the model bends at them.
(function(){ const P=player.P; for(const s of ["L","R"]){
  if(!P["elbow"+s]){ const e=new THREE.Object3D(); e.position.y=-0.34; P["arm"+s].add(e); P["elbow"+s]=e; const w=new THREE.Object3D(); w.position.y=-0.3; e.add(w); P["wrist"+s]=w; }
  if(!P["ankle"+s]){ const a=new THREE.Object3D(); a.position.y=-0.48; P["knee"+s].add(a); P["ankle"+s]=a; } } })();
function norahTier(){ const N=CFG.norah, f=player.hp/Math.max(1,N.hp); return f>N.hurtAt?0 : f>N.critAt?1 : 2; }
// only the jog slows down: her walk keeps its pace whatever her health
function norahSpeedMul(){ if(!isRunning()||player.crouch||player.aiming) return 1; const t=norahTier(); return t===0?1 : t===1?CFG.norah.hurtSpeed : CFG.norah.critSpeed; }
const NG={ph:0, blend:0, run:0, tier:0, lurch:0, lurchT:2, stag:0, stagT:2, arm:{L:{x:0,z:0,e:0.1},R:{x:0,z:0,e:0.1}}};
function norahGait(P, moving, spd, dt){
  const N=CFG.norah, tier=norahTier(); NG.tier += (tier-NG.tier)*Math.min(1,dt*2);           // eases between states
  const hurt=Math.min(1,Math.max(0,NG.tier)), crit=Math.min(1,Math.max(0,NG.tier-1));
  const run = moving===2 ? 1 : 0; NG.run += (run-NG.run)*Math.min(1,dt*5);
  const mv = moving ? Math.min(1, spd/Math.max(0.3,N.walk*0.8)) : 0; NG.blend += (mv-NG.blend)*Math.min(1,dt*6);
  const b=NG.blend, r=NG.run;
  // cadence: walk ~1.7 steps/s, jog ~2.5; slower and more uneven the worse she is
  // hurt: now and then a step goes wrong (more often the lower her health); critical: the limp takes every step
  const f=player.hp/Math.max(1,N.hp), sev=Math.min(1,Math.max(0,(N.hurtAt-f)/Math.max(0.01,N.hurtAt-N.critAt)));
  NG.stagT-=dt; if(hurt>0.5 && crit<0.5 && b>0.3 && NG.stagT<=0 && NG.stag<0.1){ NG.stag=1; NG.stagT=(3.4-2.2*sev)*(0.7+Math.random()*0.6)*(r>0.5?0.75:1); }
  NG.stag=Math.max(0,NG.stag-dt*2.0); const st=Math.sin(Math.min(1,NG.stag)*Math.PI*0.5)*(1-crit);
  const cad = (1.7 + 0.8*r) * (1-0.04*hurt-0.18*crit) * (1+0.06*Math.sin(gameTime*0.9)) * (1-0.55*st);
  NG.ph += dt*Math.PI*cad*Math.max(0.35,b);
  let p=NG.ph; if(crit>0) p += 0.5*crit*Math.sin(NG.ph);                                   // limp: hurries off the bad (right) leg
  const sL=Math.sin(p), cL=Math.cos(p);
  // critical: now and then the bad leg gives and she lurches
  NG.lurchT-=dt; if(crit>0.5 && b>0.3 && NG.lurchT<=0){ NG.lurch=1; NG.lurchT=1.6+Math.random()*2.5; } NG.lurch=Math.max(0,NG.lurch-dt*3.5);
  const strideW=0.38, strideJ=N.jogStride;                                                // the jog stays short: she doesn't want to go
  const A=(strideW+(strideJ-strideW)*r)*b*(1-0.25*crit);
  const lean = 0.04 + 0.1*r*b + 0.08*hurt + 0.14*crit + 0.04*(1-b)*crit;
  const breathe = Math.sin(gameTime*(2.2+2.5*hurt+2*crit))*(0.012+0.02*hurt+0.035*crit);
  // legs (positive x = back). The right leg is the hurt one: shorter, stiffer, dragging when critical
  const legAmpR = 1 - 0.6*crit - 0.3*st;
  const thL = -A*sL, thR = A*sL*legAmpR;
  const kneeK = (0.55+0.55*r)*b;
  const knL = 0.08 + kneeK*Math.pow(Math.max(0,Math.cos(p-0.35)),1.4) + 0.12*crit;
  const knR = 0.05 + kneeK*(1-0.85*crit)*Math.pow(Math.max(0,-Math.cos(p-0.35)),1.4) + 0.4*NG.lurch + 0.95*st;
  P.legL.rotation.set(thL,0,0.03); P.legR.rotation.set(thR,0,-0.03-0.05*crit);
  P.kneeL.rotation.x=knL; P.kneeR.rotation.x=knR;
  P.ankleL.rotation.x=-thL*0.6-knL*0.5; P.ankleR.rotation.x=-thR*0.6-knR*0.5 + 0.5*crit*b;   // drags the toe
  // hips and spine: bob, sway over the stance leg, counter-twist, a dip onto the bad leg
  const bob = (0.025+0.03*r)*b*(0.5-0.5*Math.cos(2*p)) + 0.13*crit*b*Math.max(0,-sL) + 0.14*st*b;
  P.hips.position.y = 0.95 - bob - 0.01*hurt - 0.07*crit - 0.12*NG.lurch + breathe*0.3;
  P.hips.rotation.set(0.04*crit, 0.12*sL*b*(1-0.4*crit), (0.05+0.01*hurt+0.15*crit)*cL*b - 0.06*crit - 0.12*NG.lurch - 0.2*st*b);
  P.torso.rotation.set(lean*1.15 + breathe*2 + 0.1*hurt*(1-b) + 0.22*st*b, -0.2*sL*b*(1-0.5*crit), 0.05*hurt+0.08*crit);
  // head: down and turned a little; a nervous glance back now and then when she's fine and moving
  const glance = (tier===0 && b>0.5) ? Math.max(0,Math.sin(gameTime*0.7))**8*0.6 : 0;
  P.neck.rotation.set(0.05*r*b + 0.08*hurt + 0.12*crit - breathe, glance*(Math.sin(gameTime*0.35)>0?1:-1), 0);
  // arms: bent and close at a jog, loose at a walk; left hand clutches her side when hurt
  const aA = (0.32+0.12*r)*b*(1-0.4*hurt-0.5*crit);
  NG.arm.L={x: aA*sL - 0.1*r*b, z:0.1+0.25*st, e:0.2+0.9*r*b};
  NG.arm.R={x:-aA*sL*(1-0.4*crit) - 0.1*r*b + 0.1*crit, z:-0.12, e:0.25+0.8*r*b*(1-0.5*crit)};
  if(hurt>0.01){ const h=Math.min(1,hurt*1.4); NG.arm.L={x:NG.arm.L.x*(1-h)+(-0.55)*h, z:NG.arm.L.z*(1-h)+(-0.55)*h, e:NG.arm.L.e*(1-h)+1.9*h}; }
  for(const s of ["L","R"]){ P["elbow"+s].rotation.set(-0.08,0,0); P["wrist"+s].rotation.set(0,0,0); }
  return sL*(0.45+0.35*r)*b;
}
function norahArms(P){ const a=NG.arm; P.armL.rotation.set(a.L.x,0,a.L.z); P.armR.rotation.set(a.R.x,0,a.R.z); P.elbowL.rotation.x=-a.L.e; P.elbowR.rotation.x=-a.R.e; }
// ---------------------------------------------------------------- ACROSS movement types: a ladder that wounds push them down
// 0 Marionette (healthy default): upright, jerked along on strings · 1 Lurcher: a stiff leg swung round, tilted, heavy lurching steps
// 2 Puller: down on the floor, dragging itself at her with its arms, flailing. Some spawn lower on the ladder, whatever their subclass.
const MOVES=["marionette","lurcher","puller"];
function pickMove(forced, variant){
  if(variant==="crawler"||variant==="runner") return null;
  if(MOVES.includes(forced)) return forced;
  const A=CFG.across, r=Math.random();
  if(r<A.movePullerChance) return variant==="mourner" ? "marionette" : "puller";
  if(r<A.movePullerChance+A.moveLurcherChance) return "lurcher";
  return "marionette";
}
Enemy.prototype.moveDegrade=function(dir){
  if(!this.move||this.dead) return; const A=CFG.across, f=this.hp/Math.max(0.01,this.maxHp);
  let lv = f<A.moveDegPull ? 2 : f<A.moveDegLurch ? 1 : 0;
  if(lv<1 && (this.hurtLimb("legL")||this.hurtLimb("legR"))) lv=1;
  if(this.variant==="mourner") lv=Math.min(lv,1);
  const cur=MOVES.indexOf(this.move); if(lv<=cur) return;
  this.move=MOVES[lv]; this.moveT=0;
  if(this.move==="puller"){ this.vel.multiplyScalar(0.3); this.flinch=1; this.state="chase"; this.t=0; this.gait.mode="stall"; SFX.scratch(this.pos); log(`${this.name} drops and drags itself on`,"#ffb070"); }
  else log(`${this.name} starts to lurch`,"#ffb070");
};
Enemy.prototype.moveSpeedMul=function(){
  const A=CFG.across, deg=1-Math.max(0,this.hp)/Math.max(0.01,this.maxHp);
  if(this.move==="lurcher") return A.moveLurchSpeed*(0.45+0.95*Math.max(0,Math.sin(this.lph||0)))*(1-0.3*deg);
  if(this.move==="puller") return (0.15+1.4*(this.pullK||0))*(1-0.35*deg);
  return 1;
};
// layered on the upright puppet pose (Marionette and Lurcher)
Enemy.prototype.moveLayer=function(v,dt,mv){
  const A=CFG.across, deg=Math.min(1,(1-Math.max(0,this.hp)/Math.max(0.01,this.maxHp))*1.3+(this.wounds||0)*0.04), m=Math.max(0.2,mv);
  this.clipLegR=1;
  if(this.move==="marionette"){ const k=1+deg;
    v.nZ += Math.sin(gameTime*1.3+this.id)*0.35*k + this.jn("mlz",0.25*k,dt); v.nX += 0.15+this.jn("mlx",0.3*k,dt);       // head lolls on a loose string
    v.aLX = v.aLX*0.35 + 0.08 + this.jn("mal",0.45*k*m,dt); v.aRX = v.aRX*0.35 + 0.08 + this.jn("mar",0.45*k*m,dt);       // arms dangle and get yanked
    v.aLZ = 0.12+Math.abs(this.jn("maz",0.25*k,dt)); v.aRZ = -0.12-Math.abs(this.jn("mbz",0.25*k,dt)); v.eL*=0.4; v.eR*=0.4;
    v.kL += Math.abs(this.jn("mkl",0.55*k*m,dt)); v.kR += Math.abs(this.jn("mkr",0.55*k*m,dt));                          // feet drag, then kick forward
    v.hy += Math.abs(this.jn("mhy",0.05*k*m,dt)); v.hr += this.jn("mhr",0.12*k,dt); }
  else if(this.move==="lurcher"){ const k=1+deg; this.lph=(this.lph||0)+dt*(2.6-0.8*deg)*(0.5+mv);
    const s=Math.max(0,Math.sin(this.lph)), c=Math.cos(this.lph);
    this.clipLegR=0.12;                                                                                                   // the right leg barely bends: it's swung, not stepped
    v.kR=0.04; v.lRX = 0.1*mv*c; v.lRZ = -(0.18+0.35*s*mv)*k;
    v.hr -= (0.2+0.15*deg) + 0.12*s*mv; v.nZ += 0.35*k; v.cH += 0.12*k; v.hp += 0.15+0.1*deg;
    v.hy -= (0.05+0.07*s*mv)*k; v.kL += 0.25*s*mv;                                                                         // drops onto the good leg each lurch
    v.aRX = 0.05+0.1*s; v.aRZ = -0.06; v.eR=0.1; v.aLX += 0.35*s*mv; v.aLZ += 0.2; }                                      // bad-side arm hangs; the other claws at the air
};
// the Puller: arm over arm along the floor, irregular, with sporadic flailing
Enemy.prototype.pullerPose=function(dt,moving,b){
  const deg=Math.min(1,1-Math.max(0,this.hp)/Math.max(0.01,this.maxHp));
  const near=Math.hypot(player.pos.x-this.pos.x,player.pos.z-this.pos.z)<2.2;
  this.pph=(this.pph||0)+dt*(moving?(2.2+(near?1.4:0))*(1-0.35*deg)*(0.6+0.8*Math.abs(Math.sin(gameTime*0.7+this.id))):0.4);
  const p=this.pph, sL=Math.sin(p), sR=Math.sin(p+Math.PI*(0.8+0.3*Math.sin(gameTime*1.1+this.id)));
  // reach (arm forward, high) → plant → haul (arm back under the shoulder)
  const arm = s=>1.35+0.95*Math.max(0,s)+0.35*Math.min(0,s);
  this.pullK = moving ? Math.max(0,-Math.cos(p))*0.6+Math.max(0,-Math.cos(p+Math.PI))*0.4 : 0;
  const fl = near?1.6:1;
  b.armLX = arm(sL)+this.jn("pal",0.5*fl,dt); b.armRX = arm(sR)+this.jn("par",0.5*fl,dt);
  b.hipY = 0.2 + 0.05*this.pullK + Math.abs(this.jn("phy",0.04*fl,dt));
  b.hipPitch = 1.42 - 0.18*this.pullK + this.jn("php",0.1*fl,dt);                                                          // chest heaves up on each haul
  b.neck = -1.0 - 0.35*this.pullK + this.jn("pnx",0.45*fl,dt);                                                            // head jerks up toward her
  b.legLX = -0.1+this.jn("pll",0.12,dt); b.legRX = -0.05+this.jn("plr",0.12,dt); b.kneeL=0.15+Math.abs(this.jn("pkl",0.4,dt)); b.kneeR=0.1+Math.abs(this.jn("pkr",0.4,dt));
  const P=this.P; P.armL.rotation.z=0.35+this.jn("paz",0.35*fl,dt); P.armR.rotation.z=-0.35+this.jn("pbz",0.35*fl,dt);    // elbows out, flailing
  if(P.elbowL){ P.elbowL.rotation.x=-0.4-0.8*Math.max(0,-sL); P.elbowR.rotation.x=-0.4-0.8*Math.max(0,-sR); }
  if(P.torso) P.torso.rotation.y=0.25*Math.sin(p)+this.jn("pty",0.15*fl,dt);
  return b;
};
// ================================================================ the Runner (BCROSS): restless, stomping, sprints in with a charge-up
// Animations come from the Runner preview, posed on the hidden rig and retargeted onto the runner model like every other body.
VMAP.runner={key:"runner",name:"Runner",stance:"stand",p:"walker",h:[2.0,2.1],fw:[1.0,1.08],skin:"grey",hair:[0,0.1],long:0,clothes:"tee",fight:{}};
MDL_POOLS.runner=k=>MODEL_LIB[k].g==="bcross/runner"; MDL_DEFAULT_POOL.runner="runner";
const RFX={ink:0, inkLen:0, last:performance.now(), burst:null, paper:new THREE.Color(0xefe6d6), inkMat:new THREE.MeshBasicMaterial({color:0x0e0b09,skinning:true})};
const RUN=(()=>{
  const sat=x=>Math.max(0,Math.min(1,x)), ss=t=>{ t=sat(t); return t*t*(3-2*t); }, easeIn=t=>{ t=sat(t); return t*t*t; }, easeOut=t=>{ t=sat(t); return 1-(1-t)**3; };
  const nz=(t,s)=>Math.sin(t*1.9+s)*0.5+Math.sin(t*3.7+s*1.7)*0.3+Math.sin(t*7.3+s*2.3)*0.2;
  const spring=(s,target,dt,w)=>{ const a=w*w*(target-s.x)-2*w*s.v; s.v+=a*dt; s.x+=s.v*dt; return s.x; };
  const P0=()=>({hd:0,hz:0,hx:0,hp:0,hyaw:0,hroll:0,sp:0,syaw:0,sroll:0,nx:0,ny:0,nz:0,hdx:0,hdy:0,aLx:0,aLy:0,aLz:0.08,eL:0.15,aRx:0,aRy:0,aRz:0.08,eR:0.15,lLx:0,lLz:0.02,kL:0,fL:0,lRx:0,lRz:0.02,kR:0,fR:0});
  const mix=(a,b,t)=>{ const o={}; for(const k in a) o[k]=a[k]+(b[k]-a[k])*t; return o; };
  function stride(ph,P){ const st=P.stance;
    if(ph<st){ const u=ph/st; return {lx:P.front+(P.back-P.front)*u, k:P.kStance*Math.sin(u*Math.PI)+(u<0.12?P.kImpact*(1-u/0.12):0), f:-0.1*u}; }
    const u=(ph-st)/(1-st);
    if(u<P.liftEnd){ const a=ss(u/P.liftEnd); return {lx:P.back+(P.high-P.back)*a, k:P.kLift*Math.sin(a*Math.PI*0.5)+0.3*(1-a), f:0.35*(1-a)+0.2}; }
    const a=easeIn((u-P.liftEnd)/(1-P.liftEnd)); return {lx:P.high+(P.front-P.high)*a, k:P.kLift*(1-a)+0.02, f:0.2*(1-a)-0.12*a}; }
  function restless(e,t,dt){ const S=e.rS||(e.rS={head:{x:0,v:0},headT:0,headTo:0,sx:{x:0,v:0},sz:{x:0,v:0},shufT:0,to:[0,0],ph:0,cT:2,cK:0,c:0});
    const J=P0(); J.hd=0.07+0.035*S.c; J.kL=J.kR=0.32+0.25*S.c; J.lLx=J.lRx=-0.12-0.1*S.c; J.fL=J.fR=-0.12;
    J.sp=0.16+0.04*Math.sin(t*6.2)+0.12*S.c; J.nx=-0.12-0.1*S.c; J.aLx=J.aRx=-0.3; J.aLz=J.aRz=0.22; J.eL=0.85+0.15*nz(t*2.4,1); J.eR=0.85+0.15*nz(t*2.6,4);
    S.headT-=dt; if(S.headT<=0){ S.headTo=Math.random()<0.25?0:(Math.random()*2-1)*1.05; S.headT=0.3+Math.random()*0.8; }
    const h=spring(S.head,S.headTo,dt,22); J.ny=h*0.62; J.hdy=h*0.3; J.syaw=h*0.22; J.hyaw=h*0.08; J.nz=-h*0.08;
    S.shufT-=dt; if(S.shufT<=0){ S.to=[(Math.random()*2-1)*0.22,(Math.random()*2-1)*0.18]; S.shufT=0.45+Math.random()*0.9; }
    spring(S.sx,S.to[0],dt,13); spring(S.sz,S.to[1],dt,13); const mv=Math.hypot(S.sx.v,S.sz.v); S.ph+=dt*mv*9; const lift=sat(mv*1.6);
    J.lLx+=-0.25*lift*Math.max(0,Math.sin(S.ph)); J.kL+=0.7*lift*Math.max(0,Math.sin(S.ph)); J.lRx+=-0.25*lift*Math.max(0,-Math.sin(S.ph)); J.kR+=0.7*lift*Math.max(0,-Math.sin(S.ph));
    J.hroll=0.06*Math.sin(S.ph)*lift; J.hp=S.sz.v*0.05; J.lLz+=0.06; J.lRz+=0.06; J.hx=S.sx.x; J.hz=S.sz.x;
    S.cT-=dt; if(S.cT<=0){ S.cT=2+Math.random()*3; S.cK=0.55; } if(S.cK>0){ S.cK-=dt; S.c=Math.sin(sat(1-S.cK/0.55)*Math.PI); } else S.c=0;
    return J; }
  const WALK={stance:0.56,front:-0.42,back:0.42,high:-0.95,kStance:0.12,kImpact:0.22,kLift:1.45,liftEnd:0.62};
  function walkPose(ph){ const J=P0(), a=stride(ph,WALK), b=stride((ph+0.5)%1,WALK); const s=Math.sin(ph*Math.PI*2);
    J.lLx=a.lx; J.kL=a.k; J.fL=a.f; J.lRx=b.lx; J.kR=b.k; J.fR=b.f; const imp=Math.max(0,1-(ph%0.5)/0.09);
    J.hd=0.035+0.05*imp+0.03*Math.abs(s); J.sp=0.22+0.06*imp; J.hp=0.04; J.hyaw=0.16*s; J.syaw=-0.28*s; J.hroll=0.06*Math.cos(ph*Math.PI*2);
    J.aLx=0.72*s; J.aRx=-0.72*s; J.eL=0.95+0.25*Math.max(0,-s); J.eR=0.95+0.25*Math.max(0,s); J.aLz=J.aRz=0.16; J.nx=0.06-0.08*imp; return J; }
  const RUNP={stance:0.36,front:-0.62,back:0.62,high:-1.25,kStance:0.25,kImpact:0.3,kLift:1.9,liftEnd:0.55};
  function sprintPose(ph,sh){ const J=P0(), a=stride(ph,RUNP), b=stride((ph+0.5)%1,RUNP), s=Math.sin(ph*Math.PI*2);
    J.lLx=a.lx+0.1; J.kL=a.k; J.fL=a.f; J.lRx=b.lx+0.1; J.kR=b.k; J.fR=b.f; const imp=Math.max(0,1-(ph%0.5)/0.1);
    J.hd=0.09+0.06*imp; J.hp=0.14; J.sp=0.42+0.05*imp; J.nx=-0.22; J.hyaw=0.12*s; J.syaw=-0.32*s;
    J.aLx=1.15*s-0.15; J.aRx=-1.15*s-0.15; J.eL=J.eR=1.55; J.aLz=J.aRz=0.1;
    if(sh){ J.syaw=J.syaw*(1-sh)+0.72*sh; J.sroll=0.38*sh; J.hyaw=J.hyaw*(1-sh)+0.3*sh; J.ny=-0.55*sh; J.nz=-0.2*sh; J.nx=-0.1*sh-0.22*(1-sh);
      J.aRx=J.aRx*(1-sh)-0.15*sh; J.aRz=J.aRz*(1-sh)-0.35*sh; J.eR=1.55*(1-sh)+2.05*sh; J.aLx=J.aLx*(1-sh)+(0.45+0.3*s)*sh; J.aLz=0.1*(1-sh)+0.4*sh; }
    return J; }
  function chargePose(c,t,sh){ const J=P0(), tr=c*c, k=s=>nz(t*38,s)*0.05*tr;
    J.hd=0.08+0.16*c; J.sp=0.18+0.5*c+k(1); J.hp=0.08+0.1*c; J.nx=0.05+0.32*c+k(2);
    J.lLx=-0.35*c; J.kL=0.3+0.55*c; J.fL=-0.1*c; J.lRx=0.45*c; J.kR=0.3+0.75*c; J.fR=-0.35*c;
    J.aLx=J.aRx=-0.2-0.45*c; J.aLz=J.aRz=0.15-0.7*c; J.eL=J.eR=0.8+1.35*c; J.aLx+=k(3); J.aRx+=k(4);
    if(sh){ J.syaw=0.55*c; J.sroll=0.32*c; J.ny=-0.45*c; J.aRz=-0.45*c; J.aRx=-0.15; J.eR=2.0*c+0.4; J.aLz=0.15+0.2*c; J.aLx=0.25*c; J.eL=0.9; }
    return J; }
  function kickPoses(stomp){ const CH=P0(); CH.hd=0.05; CH.lRx=-1.45; CH.kR=2.05; CH.fR=0.35; CH.kL=0.28; CH.lLx=-0.05; CH.fL=-0.1; CH.sp=-0.18; CH.hp=-0.08; CH.nx=0.12; CH.aLx=-0.35; CH.aLz=0.65; CH.aRx=0.25; CH.aRz=0.55; CH.eL=0.6; CH.eR=0.7; CH.hroll=-0.06;
    const ST=Object.assign({},CH); ST.lRx=-1.55; ST.kR=0; ST.fR=-0.35; ST.hz=0.32; ST.sp=-0.36; ST.hp=-0.12; ST.aLx=0.35; ST.aLz=0.5; ST.aRx=0.55; ST.aRz=0.35; ST.nx=0.05; ST.kL=0.34;
    if(stomp){ ST.lRx=-0.62; ST.kR=0.08; ST.fR=-0.05; ST.hd=0.17; ST.hz=0.34; ST.sp=0.36; ST.hp=0.14; ST.nx=0.4; ST.aLx=0.45; ST.aRx=0.4; ST.aLz=0.35; ST.aRz=0.35; ST.kL=0.55; }
    const DN=P0(); DN.lRx=stomp?-0.55:-0.45; DN.kR=0.1; DN.lLx=0.35; DN.kL=0.3; DN.hd=0.1; DN.hz=0.3; DN.sp=0.25; DN.aLx=0.3; DN.aRx=-0.3; DN.eL=DN.eR=0.9; DN.aLz=DN.aRz=0.2;
    return {CH,ST,DN}; }
  function grabPose(t,sq){ const lock=Math.min(1,sq/0.55), lift=sat((sq-0.55)/0.45), n=s=>nz(t*26,s)*0.04*sq;
    const J=P0(); J.hd=0.34+0.02*lift; J.hp=0.15; J.sp=0.2-0.06*lift+n(1); J.nx=0.32; J.ny=0.5;
    J.aLz=J.aRz=1.38; J.aLy=J.aRy=-1.0-0.3*lock-0.12*lift+n(2); J.aLx=J.aRx=0.5+0.12*lift; J.eL=J.eR=1.4+0.35*lock+0.3*lift+n(3);
    J.lLx=-0.6; J.kL=1.0-0.25*lift; J.lRx=0.35; J.kR=1.0-0.2*lift; J.fR=-0.4; J.lLz=J.lRz=0.2; return J; }
  function stunned(u){ const J=P0(); J.sp=-0.4*(1-u)+0.12*u; J.nx=-0.6*(1-u)+0.05; J.aLx=-0.9*(1-u)-0.25; J.aRx=-0.8*(1-u)-0.25; J.aLz=0.95*(1-u)+0.2; J.aRz=0.9*(1-u)+0.2; J.eL=J.eR=0.4+0.45*u; J.lLx=0.3*(1-u); J.kL=0.35; J.lRx=-0.1; J.kR=0.25; J.hd=0.08; return J; }
  function lying(e,t){ const J=P0(); J.hp=-1.5; J.hd=e.rHip0-0.2; J.sp=-0.05; J.nx=0.35+0.1*Math.sin(t*3); J.lLx=0.2; J.kL=0.5; J.lRx=0.05; J.kR=0.2; J.aLx=-0.4; J.aLz=1.0; J.aRx=-0.2; J.aRz=0.9; J.eL=J.eR=0.4; return J; }
  function crouch(){ const J=P0(); J.hd=0.38; J.hp=0.35; J.sp=0.35; J.lLx=-1.0; J.kL=1.9; J.lRx=-0.3; J.kR=2.1; J.fR=0.5; J.aLx=-0.6; J.aRx=0.2; J.aLz=0.4; J.aRz=0.3; J.eL=0.6; J.eR=0.3; J.nx=-0.1; return J; }
  function skidPose(td){ const J=P0(), k=Math.exp(-td*5); J.hp=-0.22*(1-k)+0.1; J.sp=0.1; J.hd=0.16; J.lLx=-0.75; J.kL=0.2; J.fL=0.2; J.lRx=0.55; J.kR=0.9; J.fR=-0.4; J.aLx=-0.6; J.aLz=0.55; J.aRx=0.3; J.aRz=0.5; J.eL=0.5; J.eR=0.7; J.nx=-0.15; return J; }
  function buttImpact(td){ const J=sprintPose(0.08,1); J.syaw=0.95; J.sroll=0.42; J.hz=0.18*Math.exp(-td*6); J.sp=0.5; J.lLx=-0.75; J.kL=0.45; J.lRx=0.6; J.kR=0.35; J.fR=-0.4; return J; }
  function leapPose(ta,hit){ const u=hit?1:ss(ta/0.2), J=P0(); J.hp=-1.35*u-(hit?0.05:0); J.hd=0.38*u; J.sp=0.25*u; J.nx=0.5*u; J.lLx=J.lRx=-0.15*u; J.kL=J.kR=hit?0.05:1.5*(1-ss((ta-0.14)/0.12))+0.05; J.lLz=J.lRz=0.06; J.aLx=J.aRx=-1.2*u-(hit?0.2:0); J.aLz=J.aRz=0.7*u+(hit?0.1:0); J.eL=J.eR=0.4; return J; }
  return {sat,ss,easeIn,easeOut,nz,P0,mix,restless,walkPose,sprintPose,chargePose,kickPoses,grabPose,stunned,lying,crouch,skidPose,buttImpact,leapPose};
})();

// the pose onto the hidden rig (sizes in metres of the model, so divided by the rig's scale)
Enemy.prototype.runnerApply=function(J){ const P=this.P, k=this.scale||1;
  P.hips.position.set(J.hx/k, this.hipY-J.hd/k, J.hz/k); P.hips.rotation.set(J.hp,J.hyaw,J.hroll); P.torso.rotation.set(0,0,0);
  P.chest.rotation.set(J.sp,J.syaw,J.sroll); P.neck.rotation.set(J.nx,J.ny,J.nz); P.head.rotation.set(J.hdx,J.hdy,0);
  P.armL.rotation.set(J.aLx,J.aLy,J.aLz); P.armR.rotation.set(J.aRx,-J.aRy,-J.aRz); P.elbowL.rotation.set(-J.eL,0,0); P.elbowR.rotation.set(-J.eR,0,0); P.wristL.rotation.set(0,0,0); P.wristR.rotation.set(0,0,0);
  P.legL.rotation.set(J.lLx,0,J.lLz); P.legR.rotation.set(J.lRx,0,-J.lRz); P.kneeL.rotation.x=J.kL; P.kneeR.rotation.x=J.kR; P.ankleL.rotation.x=J.fL; P.ankleR.rotation.x=J.fR; };

// ---------------------------------------------------------------- hits on Norah
function runnerHitNorah(e, dmg, how, push, down, extra={}){
  if(player.dead) return false; if(dodgeSaves()){ log(`Norah ducks ${e.name}'s ${how}`,"#bfe0ff"); if(run) run.saves++; return false; }
  player.hurt(dmg, e, how); if(player.dead) return true;
  const d=new THREE.Vector3(player.pos.x-e.pos.x,0,player.pos.z-e.pos.z); if(d.lengthSq()<1e-4) d.set(Math.sin(e.yaw),0,Math.cos(e.yaw)); d.normalize();
  if(push){ player.vel.copy(d.multiplyScalar(push)); } if(down){ player.stumble=Math.max(player.stumble,down); player.downT=down; player.search=null; }
  if(extra.thrown) player.thrown={t:0.9,last:push,hit:false,by:e};
  if(extra.kneel){ player.vel.set(0,0,0); player.kneelT=Math.max(player.kneelT||0,extra.kneel); }
  return true; }
function runnerPuff(p,s){ for(let i=0;i<4;i++) spray(new THREE.Vector3(p.x,groundY(p.x,p.z)+0.05,p.z), new THREE.Vector3((Math.random()-.5)*0.6,0.4,(Math.random()-.5)*0.6), 0x8a7a66); if(s>0.8) SFX.stomp(p); }

// ---------------------------------------------------------------- the brain
Enemy.prototype.brainRunner=function(dt,dist,want,toP){
  const C=CFG.runner, pp=player.pos; this.rDirect=false; this.rSuper=false; this.rGhost=false; this.rNoPush=false;
  const los=lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,false);
  this.sees = !player.dead && los && dist<C.sight; if(this.sees){ this.lastKnown={x:pp.x,z:pp.z}; this.lostT=0; } else this.lostT=(this.lostT||0)+dt;
  const rc=this.rc||(this.rc={sprint:C.sprintCool*0.5,kick:0.5}); rc.sprint-=dt; rc.kick-=dt; this.rt=(this.rt||0)+dt;
  const go=s=>{ this.state=s; this.rt=0; this.t=0; this.rHit=false; }, legs=this.legsLost();
  const fwd=()=>new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw));
  if(this.state==="stagger"||this.state==="recover"){ this.desired={x:0,z:0}; if(this.state==="recover"&&this.rt>0.4) go("chase"); return; }
  switch(this.state){
  case "rcharge": { this.desired={x:0,z:0}; this.rSuper=true; this.turnTo(want,dt,C.turn*2);
    if(this.rt>=C.charge){ this.rDir=this.yaw; this.rV=0; go("rsprint"); SFX.grunt(this.pos,0.3); } return; }
  case "rsprint": { this.rDirect=true; this.rSuper=true; this.rGhost=true;
    const vmax=C.sprint*(this.rKind==="butt"?0.93:1); this.rV=Math.min(vmax, vmax*RUN.easeOut(this.rt/0.32)+1.5);
    const d=wrapA(want-this.rDir), turn=C.homing*Math.PI/180*dt; if(this.sees) this.rDir+=Math.max(-turn,Math.min(turn,d)); this.yaw=this.rDir;
    this.vel.set(Math.sin(this.rDir)*this.rV,0,Math.cos(this.rDir)*this.rV);
    const ahead=this.facing(toP);
    if(this.rKind==="butt" && dist<1.05 && ahead>0.4){ go("rbutt"); this.vel.multiplyScalar(0.15); SFX.slam(this.pos); shake=Math.max(shake,0.3); if(runnerHitNorah(this,C.buttDamage,"shoulder butt",C.buttPush,C.buttDown)) log(`${this.name} drives a shoulder into her`,"#ff7070"); return; }
    if(this.rKind==="grab" && dist<0.85 && ahead>0.4){ if(!player.grabbed && player.grab(this,{dmg:C.grabDamage,how:"bear hug"})){ go("grab"); this.state="grab"; this.rDrag=this.rV*0.42; this.hitDone=true; shake=Math.max(shake,0.25); } else go("rskid"); return; }
    if(this.rKind==="drop" && dist<3.4 && ahead>0.5){ go("rleap"); this.rVy=3.1; this.rY=0; runnerPuff(this.pos,1.4); return; }
    if(this.rKind==="sprint" && dist<1.4){ go("rskid"); rc.kick=Math.min(rc.kick,0.05); runnerPuff(this.pos,1.2); return; }
    if(this.rt>2.6 || (ahead<0 && dist<3) || (this.rt>0.4 && Math.hypot(this.vel.x,this.vel.z)<1)){ go("rskid"); runnerPuff(this.pos,1.2); log(`${this.name} overshoots and skids`,"#9ed08a"); }
    return; }
  case "rskid": { this.rDirect=true; this.rGhost=this.rt<0.1; this.vel.multiplyScalar(Math.exp(-5*dt)); if(this.rt>0.65) go("chase"); return; }
  case "rbutt": { this.rDirect=true; this.rGhost=this.rt<0.12; this.vel.multiplyScalar(Math.exp(-6*dt)); if(this.rt>0.95) go("chase"); return; }
  case "rleap": { this.rDirect=true; this.rSuper=true; this.rGhost=true; this.rVy-=9.8*dt; this.rY=Math.max(0,this.rY+this.rVy*dt);
    if(!this.rHit){ this.vel.set(Math.sin(this.rDir)*this.rV,0,Math.cos(this.rDir)*this.rV);
      if(dist<1.5 && this.facing(toP)>0.3){ this.rHit=true; this.rHitT=this.rt; this.vel.multiplyScalar(0.15); this.rVy=Math.min(this.rVy,0.5);
        if(runnerHitNorah(this,C.dropDamage,"drop kick",C.dropThrow,C.dropDown,{thrown:true})){ log(`${this.name}'s drop kick throws her`,"#ff5050"); runnerImpactFrame(new THREE.Vector3(pp.x,groundY(pp.x,pp.z)+1.2,pp.z)); } } }
    else this.vel.multiplyScalar(Math.exp(-2*dt));
    if(this.rY<=0 && this.rt>0.15){ go("rdown"); this.rY=0; runnerPuff(this.pos,1.6); shake=Math.max(shake,0.15); } return; }
  case "rdown": { this.rDirect=true; this.vel.multiplyScalar(Math.exp(-6*dt)); if(this.rt>C.downTime) go("rgetup"); return; }
  case "rgetup": { this.desired={x:0,z:0}; if(this.rt>0.75){ go("chase"); rc.sprint=Math.max(rc.sprint,C.sprintCool*0.6); } return; }
  case "rkick": { this.desired={x:0,z:0}; this.turnTo(want,dt,C.turn*(this.rt<C.chamber?1:0.2));
    const ts=this.rt-C.chamber-C.chamberHold;
    if(ts>=0.09 && !this.rHit){ this.rHit=true; this.rGhost=true;
      if(this.rKind==="stomp"){ if(dist<C.stompReach && this.facing(toP)>0.5 && runnerHitNorah(this,C.stompDamage,"stomp kick",0,0,{kneel:C.kneel})){ shake=Math.max(shake,0.3); SFX.slam(this.pos); log(`${this.name} stamps through her knee`,"#ff7070"); } }
      else if(dist<C.kickReach && this.facing(toP)>0.6 && runnerHitNorah(this,C.kickDamage,"forward kick",C.kickPush,C.kickDown)){ shake=Math.max(shake,0.3); SFX.slam(this.pos); log(`${this.name}'s kick sends her back`,"#ff7070"); } }
    if(ts>=0 && ts<0.18) this.rGhost=true;
    if(ts>=0.09+0.2 && !this.rStompT){ this.rStompT=1; runnerPuff(this.pos,1); }
    if(ts>0.09+0.2+0.45+0.2){ this.rStompT=0; go("chase"); } return; }
  case "grab": { this.rNoPush=true; this.desired={x:0,z:0}; this.vel.set(0,0,0);
    const f=new THREE.Vector3(pp.x-this.pos.x,0,pp.z-this.pos.z); if(f.lengthSq()<1e-4) f.copy(fwd()); f.normalize(); this.yaw=Math.atan2(f.x,f.z);
    if(this.rDrag>0){ player.pos.addScaledVector(f,this.rDrag*dt); collide(player.pos,0.3); this.rDrag=Math.max(0,this.rDrag-6*dt); }      // its momentum drags them both back
    this.pos.set(player.pos.x-f.x*C.hugGap, 0, player.pos.z-f.z*C.hugGap);
    if(!(player.grabbed && player.grabbed.by===this)) go("chase"); return; }
  case "rcrush": { this.rNoPush=true; this.desired={x:0,z:0}; this.vel.set(0,0,0); player.crushT=Math.max(player.crushT||0,0.05); player.vel.set(0,0,0);
    const f=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)); this.pos.set(player.pos.x-f.x*C.hugGap,0,player.pos.z-f.z*C.hugGap);
    const pulse=Math.floor(this.rt/(C.crushTime/4)); if(!player.dead && pulse>(this.rPulse??-1) && pulse<4){ this.rPulse=pulse; player.hurt(Math.round(C.crushDamage/4), this, "crushing hug"); shake=Math.max(shake,0.18); } shake=Math.max(shake,0.04);
    if(this.rt>=C.crushTime || player.dead){ player.crushT=0; player.kneelT=C.kneel; go("rrelease"); log(`${this.name} drops her`,"#ff9a6a"); } return; }
  case "rrelease": { this.desired={x:0,z:0}; if(this.rt>0.7){ go("chase"); rc.sprint=Math.max(rc.sprint,C.sprintCool); rc.kick=Math.min(rc.kick,0.3); } return; }
  case "rstun": { const b=fwd().multiplyScalar(this.rt<0.5?-C.stunStep:0); this.desired={x:b.x,z:b.z}; if(this.rt>C.stunTime){ go("chase"); rc.sprint=Math.max(rc.sprint,1.5); } return; }
  default: { if(this.state!=="chase") go("chase");
    if(player.dead){ this.desired={x:0,z:0}; this.rAnim="neutral"; return; }
    if(this.sees){ this.turnTo(want,dt,C.turn);
      const downed=(player.downT>0)||(player.kneelT>0);
      if(dist<C.kickRange && rc.kick<=0 && !player.grabbed && legs===0 && this.facing(toP)>0.7){ this.rKind = downed||Math.random()<C.stompChance ? "stomp":"kick"; go("rkick"); rc.kick=C.kickCool; SFX.grunt(this.pos,0.25); return; }
      if(legs===0 && dist>C.sprintMin && dist<C.sprintMax && rc.sprint<=0 && !player.grabbed && los){
        const r=Math.random(); this.rKind = (dist>5 && r<C.dropChance)?"drop" : r<C.dropChance+C.grabChance?"grab" : r<C.dropChance+C.grabChance+C.buttChance?"butt" : "sprint";
        go("rcharge"); rc.sprint=C.sprintCool; log(`${this.name} curls in, about to charge`,"#ffb070"); return; }
      if(dist<C.holdDist){ this.desired={x:0,z:0}; this.rAnim="neutral"; return; }
      const g=this.goal(dt); this.steer(dt,Math.atan2(g.x-this.pos.x,g.z-this.pos.z),C.walk*(legs?0.3:1),C.turn); this.rAnim="walk"; return; }
    if(this.lastKnown && Math.hypot(this.lastKnown.x-this.pos.x,this.lastKnown.z-this.pos.z)>0.8){ this.goalPt=null; this.steer(dt,Math.atan2(this.lastKnown.x-this.pos.x,this.lastKnown.z-this.pos.z),C.walk*(legs?0.3:1),C.turn); this.rAnim="walk"; return; }
    this.desired={x:0,z:0}; this.rAnim="neutral"; }
  }
};
// the escape and the failure (called from the grab prompts)
Enemy.prototype.runnerFreed=function(dir){ this.state="rstun"; this.rt=0; this.stagger=0; this.rc.sprint=Math.max(this.rc.sprint,1.5); log(`${this.name} reels back a step`,"#9ed08a"); };
Enemy.prototype.runnerCrush=function(){ this.state="rcrush"; this.rt=0; this.rPulse=-1; player.crushT=CFG.runner.crushTime; log(`${this.name} crushes her in its arms`,"#ff5050"); SFX.grunt(this.pos,0.6); };

// ---------------------------------------------------------------- the pose for each state
Enemy.prototype.poseRunner=function(dt){
  const C=CFG.runner, t=gameTime, st=this.state; let J;
  const sp=Math.hypot(this.vel.x,this.vel.z);
  const step=(T)=>{ const prev=this.rph||0; this.rph=((this.rph||0)+dt/T)%1; if((prev<0.5&&this.rph>=0.5)||this.rph<prev){ const s=this.rph<prev?"L":"R"; const P=this.P["ankle"+s], w=new THREE.Vector3(); P.getWorldPosition(w); runnerPuff(w,st==="rsprint"?1:0.6); if(st==="rsprint") shake=Math.max(shake,0.03); } };
  if(this.dead) return;
  if(st==="rcharge") J=RUN.chargePose(RUN.ss(this.rt/C.charge),t,this.rKind==="butt");
  else if(st==="rsprint"){ step(0.44*(8/Math.max(4,this.rV||8))); J=RUN.sprintPose(this.rph,this.rKind==="butt"?1:0); if(this.rt<0.12) J=RUN.mix(RUN.chargePose(1,t,this.rKind==="butt"),J,RUN.ss(this.rt/0.12)); }
  else if(st==="rskid") J=RUN.mix(RUN.skidPose(this.rt),RUN.restless(this,t,dt),RUN.ss((this.rt-0.45)/0.2));
  else if(st==="rbutt") J=this.rt<0.35?RUN.buttImpact(this.rt):RUN.mix(RUN.buttImpact(this.rt),RUN.restless(this,t,dt),RUN.ss((this.rt-0.35)/0.6));
  else if(st==="rleap") J=RUN.leapPose(this.rt,this.rHit);
  else if(st==="rdown") J=RUN.lying(this,t);
  else if(st==="rgetup") J=this.rt<0.45?RUN.mix(RUN.lying(this,t),RUN.crouch(),RUN.ss(this.rt/0.45)):RUN.mix(RUN.crouch(),RUN.restless(this,t,dt),RUN.ss((this.rt-0.45)/0.3));
  else if(st==="rkick"){ const K=RUN.kickPoses(this.rKind==="stomp"), ts=this.rt-C.chamber-C.chamberHold;
    if(ts<0){ J=RUN.mix(RUN.restless(this,t,dt),K.CH,RUN.ss(this.rt/C.chamber)); if(this.rt>=C.chamber){ const tr=RUN.nz(t*45,7)*0.06; J.lRx+=tr; J.kR+=tr*1.3; J.sp+=tr*0.4; } }
    else if(ts<0.09) J=RUN.mix(K.CH,K.ST,RUN.easeIn(ts/0.09));
    else if(ts<0.29){ J=Object.assign({},K.ST); J.lRx+=RUN.nz(t*40,3)*0.025; }
    else if(ts<0.51) J=RUN.mix(K.ST,K.DN,RUN.easeIn((ts-0.29)/0.22));
    else J=RUN.mix(K.DN,RUN.restless(this,t,dt),RUN.ss((ts-0.51)/0.45)); }
  else if(st==="grab") J=RUN.grabPose(t,Math.min(0.55,this.rt/0.4*0.55));
  else if(st==="rcrush") J=RUN.grabPose(t,0.55+0.45*RUN.ss(this.rt/0.35));
  else if(st==="rrelease"){ const o=RUN.stunned(1); o.sp=0.05; J=RUN.mix(RUN.grabPose(t,1),o,RUN.ss(this.rt/0.35)); }
  else if(st==="rstun"){ J=RUN.stunned(RUN.ss(this.rt/C.stunTime)); if(this.rt>0.15&&this.rt<0.65){ const a=Math.sin((this.rt-0.15)/0.5*Math.PI); J.lRx=0.55*a; J.kR=0.25+0.7*a; } }
  else if(st==="stagger"){ J=RUN.restless(this,t,dt); J.sp-=0.35*Math.min(1,this.stagger*3); J.nx-=0.4*this.flinch; }
  else if(this.rAnim==="walk" && sp>0.2){ step(1.05*1.85/Math.max(0.6,sp)); J=RUN.walkPose(this.rph); }
  else J=RUN.restless(this,t,dt);
  if(this.legsLost()){ J.kL+=this.lost.legL?0:0.6; J.kR+=this.lost.legR?0:0.6; J.hd+=0.25; J.sp+=0.3; }
  this.runnerApply(J);
  this.rootY = st==="rleap"?(this.rY||0):0;
  this.runnerFx(dt);
};
// afterimages and the layer the impact frame inks
Enemy.prototype.runnerFx=function(dt){
  const S=this.skin; if(!S||!S.model) return;
  if(!S.inkLayer){ S.inkLayer=1; S.model.traverse(o=>{ if(o.isMesh) o.layers.enable(1); }); }
  const G=this.rGhosts||(this.rGhosts=[]);
  if(this.rGhost && CFG.runner.afterimages){ this.rGhT=(this.rGhT||0)-dt; if(this.rGhT<=0){ this.rGhT=0.035;
    let g=G.find(x=>x.life<=0); if(!g && G.length<10){ const obj=THREE.SkeletonUtils.clone(S.model), B={}; obj.traverse(o=>{ if(o.isBone) B[o.name]=o; if(o.isMesh){ o.frustumCulled=false; o.material=new THREE.MeshBasicMaterial({map:o.material.map,color:0xff8a66,transparent:true,opacity:0,depthWrite:false,skinning:!!o.isSkinnedMesh}); } });
      const h=new THREE.Group(); h.add(obj); scene.add(h); g={h,obj,B,life:0}; G.push(g); }
    if(g){ g.life=0.2; g.h.visible=true; this.root.updateMatrixWorld(true); this.root.matrixWorld.decompose(g.h.position,g.h.quaternion,g.h.scale);
      for(const k in S.B){ const a=S.B[k], b=g.B[k]; if(b){ b.position.copy(a.position); b.quaternion.copy(a.quaternion); b.scale.copy(a.scale); } } } } }
  for(const g of G){ if(g.life<=0) continue; g.life-=dt; const o=Math.max(0,g.life/0.2)*0.42; g.obj.traverse(m=>{ if(m.isMesh) m.material.opacity=o; }); if(g.life<=0) g.h.visible=false; }
};
Enemy.prototype.runnerRemoveFx=function(){ for(const g of this.rGhosts||[]) scene.remove(g.h); this.rGhosts=[]; };

// ---------------------------------------------------------------- the impact frame: a hit-stop, bodies inked black on paper, speed lines from the hit
function runnerImpactFrame(p){
  hitstop=Math.max(hitstop,CFG.runner.impactFreeze); RFX.ink=RFX.inkLen=CFG.runner.impactFreeze; shake=Math.max(shake,0.6); SFX.slam(p);
  if(!RFX.burst){ const d=document.createElement("div"); d.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;background:repeating-conic-gradient(from 0deg at var(--bx,50%) var(--by,50%), rgba(20,16,12,.85) 0deg 2.2deg, transparent 2.2deg 9deg)"; document.body.appendChild(d); RFX.burst=d; }
  const v=p.clone().project(camera), r=renderer.domElement.getBoundingClientRect();
  RFX.burst.style.setProperty("--bx",`${r.left+(v.x*0.5+0.5)*r.width}px`); RFX.burst.style.setProperty("--by",`${r.top+(-v.y*0.5+0.5)*r.height}px`);
}
function runnerRender(){
  const now=performance.now(), rdt=Math.min(0.05,(now-RFX.last)/1000); RFX.last=now;
  if(RFX.ink>0){ RFX.ink-=rdt; const ink=RFX.ink>RFX.inkLen-0.08;
    if(RFX.burst){ RFX.burst.style.opacity = ink?1:Math.max(0,RFX.ink/Math.max(0.01,RFX.inkLen-0.08))*0.55; RFX.burst.style.mixBlendMode= ink?"normal":"multiply"; }
    if(ink){ if(player.skin&&player.skin.model&&!player.skin.inkLayer){ player.skin.inkLayer=1; player.skin.model.traverse(o=>{ if(o.isMesh) o.layers.enable(1); }); }
      const bg=scene.background, fog=scene.fog; scene.background=RFX.paper; scene.fog=null; scene.overrideMaterial=RFX.inkMat; camera.layers.set(1);
      renderer.render(scene,camera); camera.layers.set(0); scene.overrideMaterial=null; scene.background=bg; scene.fog=fog; return; } }
  else if(RFX.burst) RFX.burst.style.opacity=0;
  renderer.render(scene,camera);
}

// ---------------------------------------------------------------- Norah: held, crushed, down on a knee
function runnerNorahPose(P){
  const g=player.grabbed, k=performance.now()/1000;
  if(g && g.by && g.by.kind==="runner"){ const n=s=>Math.sin(k*14+s)*0.14;
    P.armL.rotation.set(0.05+n(1),0,0.0); P.armR.rotation.set(0.05+n(2),0,0.0); if(P.elbowL){ P.elbowL.rotation.x=-0.6; P.elbowR.rotation.x=-0.7; }
    P.torso.rotation.set(-0.15+n(3)*0.5,n(4),0); P.neck.rotation.set(-0.25+n(5),0,0); P.hips.position.y=0.92; P.hips.rotation.set(0,0,0); P.legL.rotation.x=-0.12; P.legR.rotation.x=0.18; P.kneeL.rotation.x=0.25; P.kneeR.rotation.x=0.15; }
  if(player.crushT>0){ const a=Math.min(1,(CFG.runner.crushTime-player.crushT)/0.35), n=s=>Math.sin(k*30+s)*0.06*(0.5+a);
    P.armL.rotation.set(0.1+n(1),0,0); P.armR.rotation.set(0.1+n(2),0,0); if(P.elbowL){ P.elbowL.rotation.x=-0.9; P.elbowR.rotation.x=-0.9; }
    P.torso.rotation.set(-0.25-0.35*a+n(3),0,0); P.hips.rotation.set(0.1+0.15*a,0,0); P.neck.rotation.set(-0.45-0.4*a+n(4),n(5),0);
    P.legL.rotation.x=-0.25; P.legR.rotation.x=0.05; P.kneeL.rotation.x=0.45; P.kneeR.rotation.x=0.35; P.hips.position.y=0.95; }
  if(player.kneelT>0 && !player.crushT){ P.hips.position.y=0.95-0.42; P.hips.rotation.set(0.05,0,0); P.legL.rotation.set(-1.25,0,0.02); P.kneeL.rotation.x=1.55; P.legR.rotation.set(0.25,0,-0.02); P.kneeR.rotation.x=1.8;
    if(P.ankleL){ P.ankleL.rotation.x=-0.25; P.ankleR.rotation.x=0.7; } P.torso.rotation.set(0.5+0.04*Math.sin(k*5),0,0); P.neck.rotation.set(0.45,0,0);
    P.armL.rotation.set(-0.75,0,-0.45); if(P.elbowL) P.elbowL.rotation.x=-1.9; if(!player.aiming){ P.armR.rotation.set(-0.35,0,0.15); if(P.elbowR) P.elbowR.rotation.x=-0.4; } }
}
// ================================================================ maps: new, presets (the playground's arenas and scenarios), import
function sbNewDoc(name="Untitled map"){
  return {app:"crossed-sandbox", version:1, name, note:"", win:"either", env:Object.assign({},ENV_DEF), start:{hp:"",rounds:"",spare:"",items:[],flashOn:false}, terrain:null, objects:[], customItems:[], textures:[], assets:[]};
}
function sbNormalize(d){
  const n=sbNewDoc(d.name||"Untitled map"); for(const k in n) if(d[k]===undefined) d[k]=n[k];
  d.env=Object.assign({},ENV_DEF,d.env||{}); d.start=Object.assign({hp:"",rounds:"",spare:"",items:[],flashOn:false},d.start||{});
  if(d.terrain) terrainFix(d.terrain);
  for(const o of d.objects){ if(!o.id) o.id=sbUid(o.type[0]); if(o.type==="wall"&&!o.openings) o.openings=[]; if(o.type==="wall") for(const op of o.openings) if(!op.id) op.id=sbUid("o"); if((o.type==="prop"||o.type==="block")&&o.search&&!o.items) o.items=[]; }
  return d;
}
// run one of the playground's arena builders in "record" mode and keep what it would have built
function recordArena(key){
  const keep=world; world={bounds:{},spawn:{x:0,z:0,yaw:0},enemySpawns:[],group:{add(){}},goal:null}; REC=[];
  try{ ARENAS[key].build(); } finally { var out={objects:REC,spawn:world.spawn,goal:world.goal,enemySpawns:world.enemySpawns}; world=keep; REC=null; }
  return out;
}
// the arenas' plain boxes become library furniture stretched to the same size, so layouts and push/vault tests stay identical
const BLOCK_ASSETS={wardrobe:"wardrobe",bed:"bed_double",couch:"couch","coffee table":"table",bookshelf:"bookshelf",desk:"desk",cabinet:"filing_cabinet",crate:"crate",shelf:"metal_shelving",table:"table",counter:"counter",pew:"pew",altar:"altar",chair:"chair"};
function blockToProp(o, rot){
  const asset=BLOCK_ASSETS[o.name]; if(!asset||!LIB_ASSETS[asset]) return o;
  const B=sbAssetBounds(asset); const q=(rot||0)%180!==0; const bw=B.maxX-B.minX, bd=B.maxZ-B.minZ, bh=B.maxY;
  const tw=q?o.d:o.w, td=q?o.w:o.d;
  return {id:o.id, type:"prop", asset, x:o.x, z:o.z, rot:rot||0, scale:1, sx:+(tw/bw).toFixed(3), sy:+(o.h/bh).toFixed(3), sz:+(td/bd).toFixed(3), push:o.push, name:o.name, solid:true};
}
function arenaDoc(key, name){
  const r=recordArena(key), d=sbNewDoc(name);
  d.objects=r.objects.map(o=>Object.assign({id:sbUid(o.type[0])},o));
  for(const o of d.objects) if(o.type==="wall") for(const op of o.openings) op.id=sbUid("o");
  d.objects.push({id:sbUid("s"),type:"spawn",x:r.spawn.x,z:r.spawn.z,yaw:Math.round(r.spawn.yaw*R2D)});
  if(r.goal) d.objects.push({id:sbUid("x"),type:"exit",x:r.goal.x,z:r.goal.z,r:r.goal.r,needs:""});
  d.env=Object.assign({},ENV_DEF,{fill:false});
  return d;
}
const findBlock=(d,name,x,z)=>d.objects.find(o=>o.type==="block"&&o.name===name&&(x===undefined||Math.abs(o.x-x)<0.05&&Math.abs(o.z-z)<0.05));
function propify(d,name,x,z,rot,search){ const o=findBlock(d,name,x,z); if(!o) return null; const p=blockToProp(o,rot); if(search){ p.search=true; p.items=search; } d.objects[d.objects.indexOf(o)]=p; return p; }
function setSpawn(d,x,z,yawRad){ const s=d.objects.find(o=>o.type==="spawn"); s.x=x; s.z=z; s.yaw=Math.round(yawRad*R2D); }
function addEnemies(d,list){ for(const [t,x,z,o] of list){ const op=o||{}; d.objects.push({id:sbUid("e"),type:"enemy",kind:t,x,z,yaw:Math.round((op.yaw??Math.PI)*R2D),start:op.aware==="unaware"?(op.idle||"wander"):"hunting",hpMul:1,speedMul:1}); } }
const IT=(item,qty=1,name="",text="")=>({item,qty,name,text});

const PRESETS=[
  {key:"clinic", name:"Abandoned clinic (stealth)", desc:"Dark rooms, eight ACROSS who haven't noticed her yet, a locked way out and a key somewhere in the office.", make(){
    const d=arenaDoc("clinic","Abandoned clinic"); d.win="exit";
    d.start={hp:"",rounds:2,spare:0,items:[IT("flashlight")],flashOn:false}; d.objects.find(o=>o.type==="spawn");
    const exitWall=d.objects.find(o=>o.type==="wall"&&o.a[1]===-12&&o.b[1]===-12); const door=exitWall.openings.find(op=>op.kind==="door"); door.closed=true; door.locked=true; door.key="Clinic key";
    propify(d,"cabinet",-8.7,-0.5,90,[IT("key",1,"Clinic key"),IT("note",1,"Duty roster","NIGHT SHIFT\nBack door key stays in the office cabinet.\nDo NOT prop the ward door open.")]);
    propify(d,"desk",-5,3.2,180,[IT("pills")]);
    propify(d,"crate",8.4,0.2,0,[IT("ammo",3)]); propify(d,"crate",4.6,-0.6,0,[]);
    propify(d,"shelf",4,4.2,180,[IT("batteries")]); propify(d,"shelf",7.4,4.2,180,[]);
    d.objects.push({id:sbUid("i"),type:"item",x:-3.4,z:-7.4,item:"bandage",qty:1,name:"",text:""});
    addEnemies(d,[["across:walker",0.3,-1.6,{aware:"unaware",idle:"playdead"}],["across:crawler",-7.2,-8.2,{aware:"unaware",idle:"lurk",yaw:Math.PI/2}],["across:matron",-5,1,{aware:"unaware",idle:"wander"}],["across:mourner",5.6,-6.6,{aware:"unaware",idle:"feed",yaw:Math.PI}],["across:walker",6,-3.4,{aware:"unaware",idle:"wander"}]]);
    d.note="Reach the green exit at the north end. Its door is locked: the key is in the office (west side, near the entrance). Crouch (Q) in the dark and don't run. The flashlight (L) helps you see but makes you easier to spot. Two bullets. That body in the hall may not be dead.";
    return d; }},
  {key:"house", name:"Norah's house: Louis in the bedroom", desc:"Chapter One's fight. Five loaded, seven spare. The wardrobe and the bookshelf can be searched.", make(){
    const d=arenaDoc("house","Norah's house"); d.win="kill"; setSpawn(d,-0.4,-1.2,Math.PI); d.start.rounds=5; d.start.spare=7;
    propify(d,"bed",-1.4,-3.4,0); propify(d,"couch",-1.8,2.6,90); propify(d,"coffee table",1.2,2.8,0);
    propify(d,"wardrobe",1.9,-4.15,0,[IT("pills")]); propify(d,"bookshelf",3.6,0.7,0,[IT("ammo",3),IT("photo")]);
    addEnemies(d,[["brute",1.2,-3.7]]); return d; }},
  {key:"houseDoor", name:"Hold the door: Louis outside the bedroom", desc:"Slam the bedroom door (E) and push the wardrobe in front of it.", make(){
    const d=arenaDoc("house","Hold the door"); d.win="kill"; setSpawn(d,-0.5,-2.5,0); d.start.rounds=5; d.start.spare=7;
    propify(d,"bed",-1.4,-3.4,0); propify(d,"couch",-1.8,2.6,90); propify(d,"coffee table",1.2,2.8,0); propify(d,"wardrobe",1.9,-4.15,0,[IT("bandage")]); propify(d,"bookshelf",3.6,0.7,0);
    addEnemies(d,[["brute",1.3,2.2]]); d.note="Slam the bedroom door (E) and push the wardrobe."; return d; }},
  {key:"corridor", name:"Corridor: 3 ACROSS", desc:"A hallway with side rooms. The desk and the cabinet have supplies.", make(){
    const d=arenaDoc("corridor","Corridor"); d.win="kill"; propify(d,"desk",-3.5,-2,90,[IT("ammo",5),IT("bandage")]); propify(d,"cabinet",3.4,-11,0,[IT("flashlight")]);
    addEnemies(d,[["across",0,-13.2],["across",-0.4,-12.2],["across",0.4,-11.3]]); return d; }},
  {key:"noAmmo", name:"No bullets: shove and run", desc:"Get past it and close a door behind you.", make(){
    const d=arenaDoc("corridor","No bullets"); d.win="none"; setSpawn(d,0,-3,Math.PI); d.start.rounds=0; d.start.spare=0; propify(d,"desk",-3.5,-2,90,[IT("ammo",2)]); propify(d,"cabinet",3.4,-11,0);
    addEnemies(d,[["across",0,-9]]); d.note="Get past it and close a door behind you. The desk in the west room might have something."; return d; }},
  {key:"open", name:"Open arena: Louis", desc:"The basic test. Pillars, cover, a corridor with a door, two crates to search.", make(){
    const d=arenaDoc("open","Open arena"); d.win="kill"; propify(d,"crate",-8,0,0,[IT("firstaid")]); propify(d,"crate",8,1,0,[IT("ammo",10)]);
    addEnemies(d,[["brute",0,0]]); return d; }},
  {key:"runner", name:"Open arena: the Runner", desc:"One Runner. Watch it curl in before it charges, then sidestep. Two crates to search.", make(){
    const d=arenaDoc("open","The Runner"); d.win="kill"; d.start.rounds=5; d.start.spare=20; propify(d,"crate",-8,0,0,[IT("firstaid")]); propify(d,"crate",8,1,0,[IT("ammo",10)]);
    addEnemies(d,[["runner",0,-4]]); return d; }},
  {key:"variety", name:"Open arena: one of each ACROSS", desc:"All four subclasses: Walker, Crawler, Matron and a kneeling Mourner (don't wake it).", make(){
    const d=arenaDoc("open","One of each"); d.win="kill"; setSpawn(d,0,9,Math.PI); d.start.rounds=5; d.start.spare=30; propify(d,"crate",-8,0,0,[IT("firstaid")]); propify(d,"crate",8,1,0,[IT("ammo",10)]);
    addEnemies(d,[["across:walker",-6,-6],["across:crawler",-2,-3],["across:matron",3,-6],["across:mourner",7,-8,{aware:"unaware",idle:"feed",yaw:Math.PI}]]); return d; }},
  {key:"pack", name:"Open arena: ACROSS pack of 6", desc:"Only a few attack at once; the rest circle.", make(){
    const d=arenaDoc("open","ACROSS pack"); d.win="kill"; d.start.rounds=5; d.start.spare=15; propify(d,"crate",-8,0,0); propify(d,"crate",8,1,0,[IT("ammo",6)]);
    addEnemies(d,[["across",-4,-2],["across",-2,-3],["across",0,-3.5],["across",2,-3],["across",4,-2],["across:crawler",0,-5]]); return d; }},
  {key:"crippled", name:"Legless crawlers (grab test)", desc:"They grab ankles. Hit the prompts in time to push them off.", make(){
    const d=arenaDoc("open","Legless crawlers"); d.win="kill"; setSpawn(d,0,4,Math.PI); d.start.rounds=5; d.start.spare=10; propify(d,"crate",-8,0,0); propify(d,"crate",8,1,0);
    addEnemies(d,[["across_legless",-1,1],["across_legless",1.2,0.5]]); return d; }},
  {key:"chapel", name:"Chapel: 5 ACROSS", desc:"Pews to vault, pillars, the altar holds something.", make(){
    const d=arenaDoc("chapel","Chapel"); d.win="kill"; d.start.rounds=5; d.start.spare=15;
    for(const o of d.objects.filter(o=>o.type==="block"&&o.name==="pew")) d.objects[d.objects.indexOf(o)]=blockToProp(o,0);
    propify(d,"altar",0,-10.3,0,[IT("rosary"),IT("ammo",5)]);
    addEnemies(d,[["across",-1.5,-7.8],["across",1.5,-7.8],["across",0,-6.5],["across",-0.6,-4],["across",0.7,-2.5]]); return d; }},
  {key:"hillside", name:"Hillside cabin (terrain)", desc:"Rolling ground, woods, a cabin and a car. Find the car keys and drive out. Shows terrain, paths and outdoor props.", make(){ return hillsideDoc(); }},
  {key:"blankIn", name:"New: empty room", desc:"A 12 × 12 m room with one light, Norah and nothing else.", make(){
    const d=sbNewDoc("New room"); d.win="either";
    d.objects.push({id:sbUid("f"),type:"floor",x:-6,z:-6,w:12,d:12,tex:"",colA:"#2e2a26",colB:"#36322c",y:0});
    for(const [a,b] of [[[-6,-6],[6,-6]],[[6,-6],[6,6]],[[6,6],[-6,6]],[[-6,6],[-6,-6]]]) d.objects.push({id:sbUid("w"),type:"wall",a,b,height:2.8,thick:0.2,color:"#5e594f",tex:"",openings:[]});
    d.objects.push({id:sbUid("l"),type:"light",x:0,y:2.6,z:0,color:"#ffc890",intensity:1,dist:12},{id:sbUid("s"),type:"spawn",x:0,z:4,yaw:180});
    return d; }},
  {key:"blankOut", name:"New: open ground (terrain)", desc:"40 × 40 m of flat grass to sculpt with the terrain brushes.", make(){
    const d=sbNewDoc("New outdoor map"); d.win="either"; d.terrain=terrainMake(-20,-20,40,40,1,1);
    d.env=Object.assign({},ENV_DEF,{sky:"#20262e",fog:0.03,hemi:0.7,moon:0.6});
    d.objects.push({id:sbUid("s"),type:"spawn",x:0,z:8,yaw:180}); return d; }}
];
function hillsideDoc(){
  const d=sbNewDoc("Hillside cabin"); d.win="exit";
  const T=d.terrain=terrainMake(-26,-26,52,52,1,1); terrainHills(T,1.4,7.3);
  const flat=(cx,cz,r,h,soft=3)=>tEach(T,cx,cz,r+soft,(k,dd)=>{ const t=clamp((dd-r)/soft,0,1), s=t*t*(3-2*t); T.h[k]=h*(1-s)+T.h[k]*s; });
  const paint=(cx,cz,r,p,ch=1)=>tEach(T,cx,cz,r,(k)=>{ if(vhash(k*7+p)<ch) T.p[k]=p; });
  const cab={x0:2,z0:-8,w:6,d:5}; const ccx=cab.x0+cab.w/2, ccz=cab.z0+cab.d/2; const ch=Math.round(tSample(T,ccx,ccz)*10)/10;
  flat(ccx,ccz,5.5,ch,4);
  const road=[[-26,14],[-10,12.5],[4,11],[14,11.5],[26,13]];
  for(let i=0;i<road.length-1;i++){ const [ax,az]=road[i],[bx,bz]=road[i+1]; for(let t=0;t<=1;t+=0.05){ const x=ax+(bx-ax)*t, z=az+(bz-az)*t; flat(x,z,2.2,tSample(T,x,z),2.5); } }
  for(let i=0;i<road.length-1;i++){ const [ax,az]=road[i],[bx,bz]=road[i+1]; for(let t=0;t<=1;t+=0.05) paint(ax+(bx-ax)*t,az+(bz-az)*t,2.6,4,0.8); }
  paint(ccx,ccz,5,0,0.7); paint(-12,-12,6,9,0.6); paint(14,-14,5,9,0.5); paint(-8,0,4,2,0.7); paint(16,2,5,2,0.6); paint(-14,20,5,3,0.6);
  const H=(x,z)=>Math.round(tSample(T,x,z)*100)/100;
  d.objects.push({id:sbUid("q"),type:"path",points:road,width:3.2,tex:"",color:"#3a3a38"});
  d.objects.push({id:sbUid("q"),type:"path",points:[[ccx,cab.z0+cab.d+0.1],[ccx,6],[6,10.5]],width:1.4,tex:"",color:"#5e5446"});
  d.objects.push({id:sbUid("f"),type:"floor",x:cab.x0,z:cab.z0,w:cab.w,d:cab.d,tex:"",colA:"#3a2e24",colB:"#43352a",y:ch});
  const W=(a,b,op)=>d.objects.push({id:sbUid("w"),type:"wall",a,b,height:2.6,thick:0.18,color:"#6a5a48",tex:"",openings:op||[]});
  W([cab.x0,cab.z0],[cab.x0+cab.w,cab.z0],[{id:sbUid("o"),kind:"window",at:3,width:1.2,sill:0.95,top:2.0}]);
  W([cab.x0+cab.w,cab.z0],[cab.x0+cab.w,cab.z0+cab.d],[{id:sbUid("o"),kind:"window",at:2.5,width:1.0,sill:0.95,top:2.0}]);
  W([cab.x0+cab.w,cab.z0+cab.d],[cab.x0,cab.z0+cab.d],[{id:sbUid("o"),kind:"door",at:3,width:1.0,side:1,closed:true}]);
  W([cab.x0,cab.z0+cab.d],[cab.x0,cab.z0]);
  const P=(asset,x,z,rot,extra)=>{ const o=Object.assign({id:sbUid("p"),type:"prop",asset,x,z,rot:rot||0,scale:1},extra||{}); d.objects.push(o); return o; };
  P("bed_twin",cab.x0+0.7,cab.z0+1.1,0); P("nightstand",cab.x0+1.6,cab.z0+0.35,0,{search:true,items:[IT("pills")]});
  P("dresser",cab.x0+3.4,cab.z0+0.35,0,{search:true,items:[IT("truck_keys",1,"Car keys"),IT("note",1,"Note on the dresser","Took the truck to town. Car keys are in the top drawer if you need to leave.\nDon't wait for me. — L")]});
  P("table",cab.x0+4.6,cab.z0+3.3,0); P("chair",cab.x0+4.0,cab.z0+3.3,90); P("stove",cab.x0+cab.w-0.45,cab.z0+1.8,-90,{search:true,items:[IT("ammo",4)]});
  P("rug",cab.x0+2.6,cab.z0+2.8,0); P("lamp",cab.x0+0.4,cab.z0+cab.d-0.4,0);
  d.objects.push({id:sbUid("l"),type:"light",x:ccx,y:ch+2.3,z:ccz,color:"#ffc070",intensity:0.6,dist:6});
  P("car",14,9.3,90,{search:true,items:[IT("firstaid")]}); P("streetlight",-4,9.8,0); P("mailbox",6.8,10,0); P("well",-6,-3,0); P("woodpile",cab.x0-0.8,cab.z0+2.5,90,{search:true,items:[IT("batteries")]});
  P("shed",16,-6,-90,{search:true,items:[IT("ammo",5),IT("bandage")]});
  for(let i=0;i<5;i++) P("fence",-1+i*2,-11,0);
  const trees=["tree","tree_pine","tree_pine","tree_birch","tree_bare","tree_dead"], R=mulberry(99);
  for(let i=0;i<46;i++){ const x=-24+R()*48, z=-24+R()*48; if(Math.hypot(x-ccx,z-ccz)<8||Math.abs(z-12)<4.5||Math.hypot(x-16,z+6)<4||Math.hypot(x+6,z+3)<3) continue; P(trees[Math.floor(R()*trees.length)],+x.toFixed(2),+z.toFixed(2),Math.round(R()*360),{scale:+(0.8+R()*0.5).toFixed(2)}); }
  for(let i=0;i<10;i++){ const x=-24+R()*48, z=-24+R()*48; if(Math.abs(z-12)<4||Math.hypot(x-ccx,z-ccz)<7) continue; P(R()<0.5?"rock":"boulder",+x.toFixed(2),+z.toFixed(2),Math.round(R()*360),{scale:+(0.7+R()*0.6).toFixed(2)}); }
  for(let i=0;i<14;i++){ const x=-24+R()*48, z=-24+R()*48; if(Math.abs(z-12)<4||Math.hypot(x-ccx,z-ccz)<6) continue; P("bush",+x.toFixed(2),+z.toFixed(2),Math.round(R()*360)); }
  P("stump",-10,4,0); P("log",-14,-6,30);
  d.objects.push({id:sbUid("i"),type:"item",x:-16,z:9.5,item:"ammo",qty:3,name:"",text:""});
  d.objects.push({id:sbUid("x"),type:"exit",x:14,z:12.2,r:1.2,needs:"Car keys",label:"the car"});
  d.objects.push({id:sbUid("s"),type:"spawn",x:-20,z:13,yaw:90});
  d.objects.push({id:sbUid("c"),type:"corpse",x:-2,z:5.5,yaw:40});
  addEnemies(d,[["across:walker",-8,2,{aware:"unaware",idle:"wander"}],["across:mourner",-6,-1.6,{aware:"unaware",idle:"feed",yaw:Math.PI}],["across:walker",18,2,{aware:"unaware",idle:"wander"}],["across:crawler",cab.x0+1.2,cab.z0+3.6,{aware:"unaware",idle:"lurk",yaw:Math.PI}]]);
  d.env=Object.assign({},ENV_DEF,{sky:"#1a1f27",fog:0.032,hemi:0.62,moon:0.55,dark:""});
  d.start={hp:"",rounds:5,spare:4,items:[],flashOn:false};
  d.note="Dusk. The car by the road won't start without its keys, and they're somewhere in the cabin. Something is lying in there. The woods are full of them.";
  return d;
}

// ---------------------------------------------------------------- import: the Map Designer's export, this sandbox's own maps, the Item Modeler's items
function sbFindDesignerMap(j){ if(!j||typeof j!=="object") return null; if(Array.isArray(j.objects)) return j; for(const k in j){ const r=sbFindDesignerMap(j[k]); if(r) return r; } return null; }
function sbFindItems(j){ if(!j||typeof j!=="object") return null; if(Array.isArray(j.items)&&j.items.length&&j.items[0]&&j.items[0].parts) return j.items; for(const k in j){ const r=sbFindItems(j[k]); if(r) return r; } return null; }
function fromDesigner(m, levelId){
  const levels=(Array.isArray(m.levels)&&m.levels.length)?m.levels:[{id:undefined,name:"Ground",elev:0}];
  const lvl=levels.find(l=>l.id===levelId)||levels.find(l=>(l.elev||0)===0)||levels[0], elev=lvl.elev||0;
  const objs=m.objects.filter(o=>o.level===undefined||lvl.id===undefined||o.level===lvl.id);
  const d=sbNewDoc(m.name||"Imported map"); d.env=Object.assign({},ENV_DEF,{fill:true,fillI:lvl.dark?0.2:0.8}); let skipped=0, hasSpawn=false;
  const yawFromDesigner=y=>Math.round(((y||0)+180)%360); const grounds=[];
  for(const o of objs){
    if(o.type==="floor"&&o.w&&o.d&&o.ground) grounds.push(o);
    else if(o.type==="floor"&&o.w&&o.d) d.objects.push({id:o.id||sbUid("f"),type:"floor",x:o.x,z:o.z,w:o.w,d:o.d,tex:o.tex||"",scale:o.scale||1,y:0});
    else if(o.type==="wall"&&o.a&&o.b) d.objects.push({id:o.id||sbUid("w"),type:"wall",a:o.a,b:o.b,height:o.height||2.8,thick:o.thick||0.2,color:"#5a554c",tex:o.texA||"",texB:o.texB||"",scale:o.scale||1,
      openings:(o.openings||[]).map(op=>({id:op.id||sbUid("o"),kind:op.kind==="window"?"window":op.kind==="door"?"door":"gap",at:op.at,width:op.width||1,sill:op.sill,top:op.top,hinge:op.hinge,side:op.side==="out"?1:-1,closed:op.ajar!==undefined&&op.ajar<10,locked:false,key:""}))});
    else if(o.type==="platform"&&o.w&&o.d) d.objects.push({id:o.id||sbUid("b"),type:"block",x:o.x+o.w/2,z:o.z+o.d/2,w:o.w,d:o.d,h:o.h||0.6,tex:o.tex||"",color:"#6a6258",name:"stage",push:false});
    else if(o.type==="prop"&&o.asset) d.objects.push({id:o.id||sbUid("p"),type:"prop",asset:o.asset,x:o.x,z:o.z,rot:o.rot||0,scale:o.scale||1,search:!!o.search,solid:o.solid===false?false:"auto",items:[]});
    else if(o.type==="light") d.objects.push({id:o.id||sbUid("l"),type:"light",x:o.x,y:(o.y??(elev+2.4))-elev,z:o.z,color:o.color||"#ffb060",intensity:+((o.energy||1)*1.2).toFixed(2),dist:+((o.range||8)*1.5).toFixed(2)});
    else if(o.type==="camera"){ const yaw=(o.yaw||0)*D2R, pit=(o.pitch||0)*D2R, y=(o.y??(elev+2.6))-elev; const fx=-Math.sin(yaw)*Math.cos(pit), fy=Math.sin(pit), fz=-Math.cos(yaw)*Math.cos(pit);
      d.objects.push({id:o.id||sbUid("c"),type:"camera",x:o.x,y,z:o.z,look:[+(o.x+fx*5).toFixed(2),+(y+fy*5).toFixed(2),+(o.z+fz*5).toFixed(2)],track:!!(o.mode&&o.mode!=="fixed"),fov:o.fov||60}); }
    else if(o.type==="marker"){ if(o.kind==="spawn"){ d.objects.push({id:sbUid("s"),type:"spawn",x:o.x,z:o.z,yaw:yawFromDesigner(o.rot)}); hasSpawn=true; }
      else if(o.kind==="enemy"){ const t=JSON.stringify(o).toLowerCase(); d.objects.push({id:sbUid("e"),type:"enemy",kind:/brute|louis/.test(t)?"brute":/dummy/.test(t)?"dummy":"across",x:o.x,z:o.z,yaw:yawFromDesigner(o.rot),start:"hunting",hpMul:1,speedMul:1}); }
      else if(o.label) d.objects.push({id:sbUid("i"),type:"item",x:o.x,z:o.z,item:"custom",qty:1,name:o.label,text:o.note||""}); else skipped++; }
    else if(o.type==="figure"){ if(o.who==="norah"||o.player){ if(!hasSpawn){ d.objects.push({id:sbUid("s"),type:"spawn",x:o.x,z:o.z,yaw:yawFromDesigner(o.rot)}); hasSpawn=true; } }
      else if(o.who==="louis"||o.who==="bellemood") d.objects.push({id:sbUid("e"),type:"enemy",kind:"brute",x:o.x,z:o.z,yaw:yawFromDesigner(o.rot),start:"hunting",hpMul:1,speedMul:1});
      else if(o.who==="across") d.objects.push({id:sbUid("e"),type:"enemy",kind:"across:crawler",x:o.x,z:o.z,yaw:yawFromDesigner(o.rot),start:"hunting",hpMul:1,speedMul:1}); else skipped++; }
    else if(o.type==="path"&&Array.isArray(o.points)) d.objects.push({id:o.id||sbUid("q"),type:"path",points:o.points,width:o.width||1.6,tex:o.tex||"",color:"#6a665e"});
    else skipped++;
  }
  if(grounds.length){ // the designer's big outdoor "ground" floors become painted terrain you can sculpt
    let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9; for(const g of grounds){ x0=Math.min(x0,g.x); z0=Math.min(z0,g.z); x1=Math.max(x1,g.x+g.w); z1=Math.max(z1,g.z+g.d); }
    const area=(x1-x0)*(z1-z0), cell=area>16000?2:1; const T=d.terrain=terrainMake(Math.floor(x0),Math.floor(z0),Math.ceil(x1-x0),Math.ceil(z1-z0),cell,0);
    const pick=t=>{ t=String(t||""); return /grass|lawn|moss/.test(t)?1:/dirt|mud|earth/.test(t)?0:/gravel/.test(t)?4:/asphalt|road/.test(t)?7:/concrete/.test(t)?8:/snow/.test(t)?6:/sand/.test(t)?5:/leaf|leaves/.test(t)?9:1; };
    for(let j=0;j<T.nz;j++) for(let i=0;i<T.nx;i++){ const x=T.x0+i*T.cell, z=T.z0+j*T.cell; for(const g of grounds) if(x>=g.x&&x<=g.x+g.w&&z>=g.z&&z<=g.z+g.d) T.p[j*T.nx+i]=pick(g.tex); } }
  if(!hasSpawn){ const B=docBounds(d); d.objects.push({id:sbUid("s"),type:"spawn",x:(B.x0+B.x1)/2,z:(B.z0+B.z1)/2,yaw:180}); }
  d.textures=(m.textures||[]).filter(t=>t&&t.data).map(t=>({id:t.id,name:t.name,data:t.data,m:t.m})); d.assets=(m.assets||[]).filter(a=>a&&a.id&&a.parts);
  return {doc:sbNormalize(d), skipped, level:lvl.name};
}

// ---------------------------------------------------------------- Chapter One: Norah's house, from the Godot blockout
// Coordinates copied from crossed/tools/build_norah_house.py (owarends-commits/Games): X east, Z south (north = −Z), 1 unit = 1 m.
//   Living room X 0..4, Z −5.33..0 · Kitchen X 4..8, Z −5.33..−3.17 · Hallway X 4..8, Z −3.17..−2.33 · Bathroom X 4..5.83, Z −2.33..0 · Bedroom X 5.83..8, Z −2.33..0
const GODOT_TREES=[[-15.87, -31.36, 8.6], [-29.94, -24.62, 7.46], [-30.75, -25.12, 6.15], [-9.72, -32.78, 6.36], [-10.23, -19.53, 6.5], [-21.5, -23.02, 9.79], [-1.68, -27.06, 9.91], [-31.39, -18.98, 7.16], [-25.92, -31.94, 7.23], [11.7, -30.84, 8.33], [1.78, -27.48, 8.19], [-30.48, -32.96, 6.82], [4.1, -26.52, 7.26], [-1.21, -26.07, 7.2], [10.49, -21.77, 6.98], [-1.83, -24.81, 9.5], [6.85, -28.96, 9.92], [-27.39, -26.68, 9.03], [-25.49, -25.44, 6.16], [3.42, -20.62, 8.29], [15.03, -28.51, 8.78], [-0.72, -23.85, 7.82], [13.04, -17.47, 7.9], [3.19, -32.94, 8.81], [2.24, -16.62, 9.29], [-18.06, -27.25, 8.67], [-32.74, -25.92, 6.67], [-27.44, -32.97, 9.07], [-26.76, -29.67, 7.56], [14.8, -32.59, 7.8], [-3.23, -18.54, 9.28], [14.38, -29.13, 7.66], [-13.91, -18.53, 9.83], [-25.55, -30.92, 6.93], [-20.93, -25.51, 8.36], [-19.29, -33.93, 7.68], [-13.32, -24.09, 9.81], [4.67, -24.98, 8.47], [3.87, -33.06, 9.6], [9.68, -18.7, 9.19], [-12.03, -27.02, 6.41], [1.52, -32.91, 6.27], [-22.31, -31.16, 7.36], [-31.06, -34.0, 6.61], [-28.32, -27.64, 6.1], [14.96, -23.25, 6.59], [-19.87, -27.92, 7.46], [-27.12, -19.14, 9.97], [-7.9, -25.53, 6.34], [-28.28, -28.0, 7.06], [12.42, -31.17, 6.09], [19.26, -24.76, 6.59], [-3.58, -33.53, 8.11], [20.8, -18.89, 8.78], [-19.38, -27.58, 6.67], [9.23, -24.68, 9.12], [-15.54, -30.1, 9.25], [21.16, -19.08, 9.22], [11.83, -21.05, 6.91], [-5.01, -27.78, 6.12], [-32.44, -29.11, 7.04], [4.78, -17.26, 7.79], [18.47, -16.71, 9.82], [-13.58, -30.14, 6.91], [-22.98, -30.42, 8.5], [16.42, -19.29, 7.92], [2.57, -20.01, 6.34], [2.99, -18.08, 9.13], [8.01, -25.63, 6.71], [10.19, -28.18, 9.2], [22.66, -4.12, 7.61], [22.36, 5.74, 6.68], [12.52, -11.47, 9.62], [20.68, -11.61, 9.31], [22.76, 3.72, 7.4], [17.58, -12.07, 6.06], [22.65, 3.49, 8.11], [22.2, -2.99, 9.49], [20.91, -9.67, 7.01], [14.52, -8.78, 8.35], [14.11, -3.43, 6.52], [21.92, -5.39, 7.83], [18.0, 11.13, 7.68], [22.01, -0.95, 8.13], [17.28, -15.44, 7.76], [13.2, -15.88, 9.2], [13.07, -1.8, 8.9], [17.68, -6.22, 8.07], [17.67, 7.53, 6.42], [17.72, -8.55, 7.11], [20.27, -0.77, 8.25], [20.12, 11.37, 7.77], [18.35, -0.83, 8.05], [19.31, -2.43, 8.13], [16.74, 12.25, 8.8], [21.52, 12.27, 7.04], [17.71, 12.3, 9.36], [12.65, -12.35, 7.77], [11.87, -8.78, 6.29], [19.03, 7.52, 9.59], [12.85, 5.48, 8.64], [12.72, 10.48, 9.87], [13.64, 12.58, 7.59], [16.85, 13.7, 9.33], [12.94, -3.05, 8.06], [15.07, -10.13, 7.27], [19.67, -15.42, 8.22], [16.29, -15.46, 7.33], [18.49, -0.63, 6.26], [22.82, 7.65, 9.89], [-7.4, -22.0, 8], [-3.9, -23.6, 9], [-11.6, -14.6, 8]];
function ch1HouseDoc(){
  const d=sbNewDoc("Chapter One: Norah's house"); d.win="kill";
  const CEIL=2.3, WT=0.12, ET=0.18, DH=2.0;
  const T=d.terrain=terrainMake(-40,-38,64,54,1,1);
  for(let k=0;k<T.p.length;k++){ const x=T.x0+(k%T.nx), z=T.z0+Math.floor(k/T.nx);
    if(x>=-34&&x<=-24&&z>=-14&&z<=8) T.p[k]=0;                       // the cul-de-sac's edge
    else if(z<-16||x>11) T.p[k]=vhash(k)<0.6?9:1;                    // woods floor
    else if(vhash(k*3)<0.2) T.p[k]=2; }
  const W=(a,b,o)=>d.objects.push(Object.assign({id:sbUid("w"),type:"wall",a,b,height:CEIL,thick:WT,color:"#7a7262",tex:"b:wallpaper",texB:"b:wallpaper",openings:[]},o||{}));
  const F=(x0,x1,z0,z1,tex,y=0)=>d.objects.push({id:sbUid("f"),type:"floor",x:x0,z:z0,w:x1-x0,d:z1-z0,tex:"b:"+tex,colA:"#3a2e24",colB:"#43352a",y});
  const op=(kind,a0,a1,extra)=>Object.assign({id:sbUid("o"),kind,at:+((a0+a1)/2).toFixed(3),width:+Math.abs(a1-a0).toFixed(3)},kind==="door"?{side:1,closed:false,top:DH}:kind==="gap"?{top:DH}:{},extra||{});
  // a library model stretched to fill one of the blockout's boxes exactly
  const fit=(asset,x0,x1,z0,z1,h,rot,extra)=>{ const B=sbAssetBounds(asset), q=(rot%180)!==0, bw=B.maxX-B.minX, bd=B.maxZ-B.minZ;
    const o=Object.assign({id:sbUid("p"),type:"prop",asset,x:+((x0+x1)/2).toFixed(3),z:+((z0+z1)/2).toFixed(3),rot,scale:1,sx:+((q?z1-z0:x1-x0)/bw).toFixed(3),sy:+(h/B.maxY).toFixed(3),sz:+((q?x1-x0:z1-z0)/bd).toFixed(3),solid:"auto",push:"auto"},extra||{}); d.objects.push(o); return o; };
  const blk=(x0,x1,z0,z1,h,color,name,extra)=>d.objects.push(Object.assign({id:sbUid("b"),type:"block",x:+((x0+x1)/2).toFixed(3),z:+((z0+z1)/2).toFixed(3),w:+(x1-x0).toFixed(3),d:+(z1-z0).toFixed(3),h,color,name,push:false,tex:""},extra||{}));
  const P=(asset,x,z,rot,extra)=>{ const o=Object.assign({id:sbUid("p"),type:"prop",asset,x,z,rot:rot||0,scale:1,solid:"auto",push:"auto"},extra||{}); d.objects.push(o); return o; };
  const L=(x,y,z,col,i,r)=>d.objects.push({id:sbUid("l"),type:"light",x,y,z,color:col,intensity:i,dist:r});
  // floors
  F(0,4,-5.33,0,"carpet_brown"); F(4,8,-5.33,-3.17,"lino_beige"); F(4,8,-3.17,-2.33,"carpet_brown"); F(4,5.83,-2.33,0,"tile_white_small"); F(5.83,8,-2.33,0,"carpet_brown");
  F(-1,0,-3.95,-1.35,"porch_boards",0.08); F(-1.45,-1,-3.3,-2.0,"pine_planks",0.04);
  // exterior walls, wallpaper inside and grey siding outside (each wall's first face points into the house)
  const ext={thick:ET,tex:"b:wallpaper",texB:"b:siding_gray_peel"};
  W([0,-5.33],[8,-5.33],Object.assign({},ext,{openings:[op("window",5.6,6.7,{sill:1.0,top:1.7})]}));                                   // north: kitchen window
  W([8,-5.33],[8,0],Object.assign({},ext,{openings:[op("door",-4.5+5.33,-3.83+5.33,{closed:true}),op("window",-1.67+5.33,-0.67+5.33,{sill:0.85,top:1.9})]}));   // east: back door, bedroom window
  W([8,0],[0,0],Object.assign({},ext));                                                                                                  // south
  W([0,0],[0,-5.33],Object.assign({},ext,{openings:[op("door",2.17,3.17,{closed:true}),op("window",0.5,1.6,{sill:0.9,top:1.8})]}));    // west: front door (a full metre), living window
  // interior walls. The thin ones Louis can smash through are marked weak.
  W([4,-5.33],[4,-3.17],{weak:true});                                                        // living | kitchen
  W([4,-2.33],[4,0],{weak:true});                                                            // living | bath
  W([4,-3.17],[8,-3.17],{weak:true,openings:[op("gap",0.5,1.3)]});                          // kitchen | hall: kitchen doorway
  W([4,-2.33],[8,-2.33],{weak:true,openings:[op("door",0.58,1.25,{side:-1}),op("door",2.17,2.83,{side:-1})]});   // hall | bath, bedroom
  W([5.83,-2.33],[5.83,0],{weak:true});                                                      // bath | bedroom
  // living room: the couch north of the front door (push it 1.15 m south to block the door), TV, radiator, side table, coat rack, plant
  fit("couch",0.35,1.35,-5.2,-3.1,0.85,90,{push:true,name:"couch"});
  fit("tvstand",3.05,3.6,-4.55,-3.65,0.98,-90);
  blk(0.05,0.2,-5.2,-4.4,0.6,"#4a4a4e","radiator"); blk(0.4,0.85,-1.2,-0.75,0.55,"#6a4a30","side table");
  P("coat_rack",0.28,-1.4,0); P("potted_plant_dead",3.72,-0.28,0);
  // kitchen: fridge, counter run with the junk drawer, table and mismatched chairs, the bookshelf by the back door
  fit("fridge",4.1,4.75,-5.25,-4.6,1.75,0);
  fit("counter",4.8,7.0,-5.25,-4.65,0.9,0,{search:true,name:"junk drawer",items:[IT("batteries")]});
  fit("table",6.3,7.1,-3.95,-3.3,0.72,0); fit("chair",6.0,6.3,-3.75,-3.45,0.9,90); fit("chair",7.1,7.4,-3.75,-3.45,0.9,-90);
  fit("bookshelf",7.55,7.95,-5.2,-4.6,1.7,-90,{push:true,name:"bookshelf"});
  // hallway: the lamp table (its drawer has the dead flashlight)
  blk(7.6,7.95,-3.1,-2.75,0.7,"#4a3424","hall table",{search:true,items:[IT("flashlight_dead")]});
  // bedroom: twin bed with its head on the south wall and the lockbox under it, nightstand, the wardrobe beside the window, laundry basket
  fit("bed_twin",6.6,7.4,-1.65,-0.02,0.95,180,{search:true,name:"bed",items:[IT("custom",1,"Lockbox","The grey metal lockbox from under the bed. Louis gave her the combination.")]});
  fit("nightstand",6.12,6.5,-0.45,-0.08,0.6,180,{search:true,name:"nightstand",items:[IT("photo",1,"Photo of Norah and Adaline","Adaline's birthday, cake on her nose.")]});
  fit("wardrobe",7.45,7.95,-2.25,-1.75,1.9,-90,{push:true,search:true,name:"wardrobe",items:[IT("ammo",7)]});
  blk(7.5,7.88,-0.5,-0.15,0.4,"#7a6a5a","laundry basket");
  // bathroom: clawfoot tub, sink with the mirror cabinet, toilet
  fit("tub",4.15,5.75,-0.65,-0.12,0.6,0); fit("sink",4.15,4.6,-1.9,-1.45,0.85,90);
  P("medicine_cabinet",4.13,-1.67,90,{y:1.05,solid:false,search:true,name:"mirror cabinet",items:[IT("pills")]});
  fit("toilet",5.3,5.75,-1.7,-1.3,0.45,-90);
  // porch: rails at the ends, posts, the bare bulb, the cracked plastic chair
  blk(-1.0,-0.94,-3.95,-3.5,0.95,"#b0aca0","porch rail"); blk(-1.0,-0.94,-1.8,-1.35,0.95,"#b0aca0","porch rail");
  d.objects.push({id:sbUid("p"),type:"pillar",x:-0.94,z:-3.88,r:0.05,h:2.3,color:"#6a5a48"},{id:sbUid("p"),type:"pillar",x:-0.94,z:-1.42,r:0.05,h:2.3,color:"#6a5a48"});
  P("chair",-0.55,-1.62,30,{scale:0.9,name:"plastic chair"});
  // yard: the gravel pull-in and the ~18 m path to the porch, the car nose toward the house, woodpile, trash cans, mailbox, power pole
  d.objects.push({id:sbUid("q"),type:"path",points:[[-24,-5],[-18.6,-5]],width:2.4,tex:"b:gravel",color:"#66625a"});
  d.objects.push({id:sbUid("q"),type:"path",points:[[-19.2,-2.65],[-1.4,-2.65]],width:1.3,tex:"b:gravel",color:"#66625a"});
  fit("car",-23.4,-19.4,-5.85,-4.15,1.25,90,{name:"car"});
  fit("woodpile",0.95,3.1,-6.0,-5.45,0.6,0); P("trashcan",-0.55,-5.95,0); P("trashcan",-0.05,-6.05,0);
  P("mailbox",-24.6,-2.2,90); P("pole",-25.2,-7.4,0);
  // the woods: same trees, same seed as the Godot build (70 north, 40 behind the house, 3 framing Louis's vantage points)
  for(const [x,z,h] of GODOT_TREES) P("tree_pine",x,z,Math.round(vhash((x*100+z*7)|0)*360),{scale:+(h/5.5).toFixed(2)});
  // lights: dim, one per room, warm and failing
  L(2.0,2.1,-2.7,"#ffd18c",1.0,5); L(5.8,2.1,-4.3,"#d9f2cc",0.8,4); L(6.0,2.1,-2.75,"#ffcc80",0.5,3); L(6.14,0.95,-0.35,"#ffbf73",0.7,3); L(4.9,2.1,-1.2,"#f2f2d9",0.7,3);
  L(-0.2,1.9,-2.35,"#ffd98c",1.3,6); L(-18.6,0.7,-5.0,"#fff2cc",1.1,8); L(-6.0,4.0,-4.0,"#808cb3",0.5,14);
  // gameplay cameras from the Godot scene (used by the fixed-camera modes)
  const C=(x,y,z,l,fov)=>d.objects.push({id:sbUid("c"),type:"camera",x,y,z,look:l,track:true,fov});
  C(-0.6,1.95,-1.3,[-14,0.9,-3.4],54); C(-7.5,2.4,1.5,[0,1,-2.6],52); C(8.6,1.7,-6.2,[13,1.2,-1],58); C(-0.6,0.55,-6.0,[8,1,-5.6],60);
  C(0.25,2.15,-5.1,[2.4,0.5,-2.3],72); C(4.85,0.95,-4.4,[7.8,1,-4.05],64); C(7.85,1.5,-2.75,[4,1.15,-2.75],62); C(4.15,1.65,-2.75,[8,1,-2.6],62);
  C(6.5,1.8,-2.18,[7.6,0.6,-0.9],66); C(6.15,0.95,-0.22,[8,1.3,-1.25],58); C(5.7,2.15,-0.15,[4.9,0.6,-2.3],72); C(6.0,0.25,-3.05,[4.9,0.6,-2.3],62);
  // Norah where she stops to look at the treeline; Louis where the figure stands
  d.objects.push({id:sbUid("s"),type:"spawn",x:-8.0,z:-3.2,yaw:150});
  d.objects.push({id:sbUid("e"),type:"enemy",kind:"brute",x:9.5,z:-14.5,yaw:-60,start:"hunting",hpMul:1,speedMul:1});
  d.env=Object.assign({},ENV_DEF,{sky:"#04050a",fogColor:"#05060a",fog:0.03,hemi:0.42,moon:0.32,dark:""});
  d.start={hp:"",rounds:5,spare:0,items:[],flashOn:false};
  d.note="Norah's house, from the Godot blockout. Louis comes out of the treeline where the figure stood. Five in the revolver; seven more on the wardrobe shelf. Doors and windows won't hold him, and he can charge straight through any inner wall. Step aside when his head goes down: if he hits an outside wall he staggers. Back off when both arms go up. If he grabs you, hit the keys or he throws you.";
  return d;
}
PRESETS.unshift({key:"ch1house", name:"Chapter One: Norah's house", desc:"Built from crossed/tools/build_norah_house.py: the house, porch, yard, gravel path, car and woods. Louis hunts her from the treeline.", make(){ return ch1HouseDoc(); }});
// ================================================================ the builder
const ED = {doc:null, sel:null, selOp:null, tool:"select", view:"3d", snap:0.25, draft:null, drag:null, undo:[], redo:[], cursor:{x:0,z:0,ok:false},
  pan:{x:0,z:0}, zoom:30, orbit:{tx:0,ty:0,tz:0,yaw:0.75,pitch:0.85,dist:26}, planDirty:true, terrainImg:null, terrainDirty:true,
  helpers:new THREE.Group(), selBox:null, rebuildT:0, saveT:0, tab:"inspect", assetQ:"", assetCat:"all", thumbs:{}, preview:null, lastPick:0,
  opts:{ wall:{height:2.8,thick:0.2,color:"#5e594f",tex:""}, floor:{tex:"",colA:"#2e2a26",colB:"#36322c"}, door:{width:1,closed:false,locked:false,key:""}, window:{width:1.2,sill:0.9,top:2.1}, gap:{width:1.2},
    block:{h:1,color:"#5b4128",tex:"",push:true,name:"crate",search:false}, pillar:{r:0.35,h:3,color:"#5a5246"}, prop:{asset:"wardrobe",rot:0,scale:1},
    terrain:{mode:"raise",radius:3,strength:0.5,paint:1}, enemy:{kind:"across",start:"hunting"}, item:{item:"ammo",qty:6,name:"",text:""}, exit:{r:0.9,needs:""},
    light:{color:"#ffb060",intensity:1,dist:8,height:2.6}, camera:{height:2.8,fov:60,track:true}, path:{width:1.6,tex:"",color:"#6a665e"}, spawn:{}, corpse:{} } };
scene.add(ED.helpers);
ED.selBox=new THREE.Box3Helper(new THREE.Box3(), 0xd07a44); ED.selBox.material.depthTest=false; ED.selBox.material.transparent=true; ED.selBox.renderOrder=999; ED.selBox.visible=false; scene.add(ED.selBox);
const edAmb=new THREE.AmbientLight(0xc0c8d8,0); scene.add(edAmb);
const planCv=$("edPlan"), planG=planCv.getContext("2d");

const IC = {
  select:'<path d="M5 3l12 8-5 1 3 6-2 1-3-6-4 4z"/>', wall:'<path d="M3 17h18M3 13h18M7 13v4M15 13v4M11 9v4M3 9h18M19 9v4M5 9V5h14v4"/>', room:'<rect x="4" y="5" width="16" height="14"/><path d="M4 9h16"/>',
  floor:'<path d="M3 16l9-5 9 5-9 5z"/>', door:'<path d="M6 21V3h10v18M6 21h12M13 12h1"/>', window:'<rect x="5" y="5" width="14" height="14"/><path d="M12 5v14M5 12h14"/>', gap:'<path d="M3 12h6M15 12h6M9 8v8M15 8v8"/>',
  block:'<path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/>', pillar:'<ellipse cx="12" cy="5" rx="5" ry="2"/><path d="M7 5v14M17 5v14"/><ellipse cx="12" cy="19" rx="5" ry="2"/>',
  prop:'<path d="M6 20V9h12v11M4 9h16M9 9V5h6v4M9 14h6"/>', terrain:'<path d="M2 19l6-9 4 5 3-4 7 8z"/>', spawn:'<circle cx="12" cy="6" r="3"/><path d="M12 9v7M8 12h8M12 16l-3 5M12 16l3 5"/>',
  enemy:'<circle cx="12" cy="7" r="3"/><path d="M12 10l-2 6M10 16l-3 5M10 16l4 5M11 12l-5 2M11 12l6-1"/>', item:'<path d="M12 3l7 9-7 9-7-9z"/>', exit:'<circle cx="12" cy="12" r="8"/><path d="M9 12h7M13 9l3 3-3 3"/>',
  light:'<circle cx="12" cy="10" r="5"/><path d="M10 17h4M10 20h4"/>', camera:'<rect x="3" y="8" width="13" height="9"/><path d="M16 11l5-3v9l-5-3"/>', corpse:'<path d="M3 16h16M5 13h6l3 3M17 13a2 2 0 1 0 0 .1"/>',
  path:'<path d="M5 21c2-6 10-4 12-10S17 4 19 3"/><path d="M8 21c2-5 9-4 11-9"/>'
};
const TOOLS=[["select","Select","V"],["wall","Wall","W"],["room","Room","R"],["floor","Floor","F"],["door","Door","D"],["window","Window","N"],["gap","Opening","G"],["block","Block","B"],["pillar","Pillar","O"],
  ["prop","Furniture","A"],["terrain","Terrain","T"],["path","Path","P"],["spawn","Norah","S"],["enemy","Enemy","Z"],["item","Item","I"],["exit","Exit","X"],["light","Light","L"],["camera","Camera","C"],["corpse","Body","K"]];
const HINTS={select:"Click to select · drag to move · Q/E turn · Del deletes · Ctrl+D duplicates · arrows nudge",
  wall:"Click, click, click to chain walls · double-click, right-click or Esc ends the chain", room:"Drag a rectangle: floor and four walls", floor:"Drag a rectangle of floor",
  door:"Click on a wall to cut a door into it", window:"Click on a wall to add a window", gap:"Click on a wall to cut an open doorway", block:"Drag a rectangle: a crate, a stage, a counter. Low ones can be vaulted",
  pillar:"Click to place a pillar", prop:"Click to place the chosen furniture (ASSETS tab) · Q/E turn it before placing", terrain:"Drag to sculpt. Pick raise, lower, smooth, flatten or paint in INSPECT",
  path:"Click points along a road or trail · double-click or Esc finishes", spawn:"Click where Norah starts, drag to face her", enemy:"Click to place, drag to face it", item:"Click to drop an item on the floor",
  exit:"Click to place a way out. It can require a key", light:"Click to place a light", camera:"Click to place a fixed camera, drag to aim it", corpse:"Click to lay a body on the floor"};

// ---------------------------------------------------------------- doc helpers
const obj = id => ED.doc.objects.find(o=>o.id===id);
const selObj = () => ED.sel ? obj(ED.sel) : null;
function snapV(v, ev){ return (ev&&ev.altKey)||!ED.snap ? +v.toFixed(3) : Math.round(v/ED.snap)*ED.snap; }
function snapP(p, ev){ return {x:snapV(p.x,ev), z:snapV(p.z,ev)}; }
function edSnapshot(){ const s=JSON.stringify(ED.doc); if(ED.undo[ED.undo.length-1]===s) return; ED.undo.push(s); if(ED.undo.length>60) ED.undo.shift(); ED.redo=[]; }
function edUndo(){ if(!ED.undo.length){ edStatusMsg("Nothing to undo"); return; } ED.redo.push(JSON.stringify(ED.doc)); ED.doc=JSON.parse(ED.undo.pop()); edAfterLoad(false); }
function edRedo(){ if(!ED.redo.length){ edStatusMsg("Nothing to redo"); return; } ED.undo.push(JSON.stringify(ED.doc)); ED.doc=JSON.parse(ED.redo.pop()); edAfterLoad(false); }
function edAfterLoad(frame){ if(ED.sel&&!obj(ED.sel)) ED.sel=null; ED.selOp=null; ED.draft=null; ED.terrainDirty=true; edRebuild(true); edRenderSide(); if(frame) edFrameAll(); edSave(); $("edName").value=ED.doc.name; }
function edChanged(o={}){ ED.dirty=true; edSave(); ED.planDirty=true; if(o.terrain) ED.terrainDirty=true; if(!o.noRebuild) edRebuild(o.now); if(o.inspector) edRenderInspector(); }
function edSave(){ clearTimeout(ED.saveT); ED.saveT=setTimeout(()=>{ try{ localStorage.setItem("crossed_sandbox_current", JSON.stringify(ED.doc)); ED.saveMsg="saved in this browser"; }catch(e){ ED.saveMsg="not saved: map too big for browser storage (copy it from FILES)"; } edStatus(); },400); }
function edRebuild(now){ clearTimeout(ED.rebuildT); if(now) edDoRebuild(); else ED.rebuildT=setTimeout(edDoRebuild,110); }
function edDoRebuild(){ if(!SB.ready||MODE==="play") return; buildFromDoc(ED.doc,true); edBuildHelpers(); edUpdateSelBox(); ED.planDirty=true; edAmb.intensity=edPrefs.work?0.55:0; player.root.visible=false; edStatus(); }

// ---------------------------------------------------------------- 3D helpers for things that have no body in the world while building
function edBuildHelpers(){
  for(const c of [...ED.helpers.children]){ ED.helpers.remove(c); }
  const H=ED.helpers; ED.helpers.visible=true;
  const tag=(g,o)=>{ g.traverse(c=>c.userData.oid=o.id); H.add(g); return g; };
  const ring=(o,col,r)=>{ const m=new THREE.Mesh(new THREE.RingGeometry(r*0.8,r,24),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.8,side:THREE.DoubleSide,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.set(o.x,groundY(o.x,o.z)+0.04,o.z); return m; };
  const arrow=(o,col)=>{ const g=new THREE.Group(); const m=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.4,4),new THREE.MeshBasicMaterial({color:col})); m.rotation.x=Math.PI/2; m.position.z=0.6; g.add(m); g.position.set(o.x,groundY(o.x,o.z)+0.06,o.z); g.rotation.y=(o.yaw||0)*D2R; return g; };
  for(const o of ED.doc.objects){
    if(o.type==="spawn"){ const r=buildBody("norah",null); r.position.set(o.x,groundY(o.x,o.z),o.z); r.rotation.y=(o.yaw||0)*D2R; tag(r,o); tag(ring(o,0x59a6c9,0.45),o); tag(arrow(o,0x59a6c9),o); }
    else if(o.type==="enemy"){ let r; const k=o.kind||"across";
      if(k==="brute"||k==="dummy"){ r=buildBody(k,null); r.scale.setScalar(CFG.brute.height/1.8); }
      else { const v=k.startsWith("across:")?k.slice(7):k==="across_legless"?"crawler":"walker"; r=buildPerson(VMAP[v]||VMAP.walker, (o.x*1000+o.z*37)|0).root; if(k==="across") r.traverse(c=>{ if(c.isMesh&&c.material&&c.material.color){ c.material=c.material.clone(); c.material.color.multiplyScalar(0.7); } }); }
      r.position.set(o.x,groundY(o.x,o.z),o.z); r.rotation.y=(o.yaw||0)*D2R; tag(r,o); tag(ring(o,o.start==="hunting"?0xd84040:0xd8b040,0.42),o); tag(arrow(o,0xd84040),o); }
    else if(o.type==="light"){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.14,0),new THREE.MeshBasicMaterial({color:hexNum(o.color||"#ffb060")})); m.position.set(o.x,o.y??2.6,o.z); tag(m,o);
      const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(o.x,o.y??2.6,o.z),new THREE.Vector3(o.x,groundY(o.x,o.z),o.z)]); tag(new THREE.Line(g,new THREE.LineBasicMaterial({color:0x6a5a30})),o); }
    else if(o.type==="camera"){ const L=o.look||[o.x,0.8,o.z-3]; const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.16,0.3),new THREE.MeshBasicMaterial({color:0x59a6c9})); g.add(b); g.position.set(o.x,o.y??2.8,o.z); g.lookAt(L[0],L[1],L[2]); tag(g,o);
      const lg=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(o.x,o.y??2.8,o.z),new THREE.Vector3(L[0],L[1],L[2])]); if(o.id===ED.sel) tag(new THREE.Line(lg,new THREE.LineDashedMaterial({color:0x59a6c9,dashSize:0.2,gapSize:0.15})).computeLineDistances(),o); }
    else if((o.type==="prop"||o.type==="block")&&o.search){ const n=(o.items||[]).length; const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.1,0),new THREE.MeshBasicMaterial({color:n?0xe8c77a:0x6a6458}));
      const c=world.containers.find(c=>c.oid===o.id); if(c){ m.position.set(c.box.x,(c.box.y0||0)+(c.box.h||1)+0.3,c.box.z); tag(m,o); } }
  }
}
function edTagged(id){ const out=[]; for(const c of world.group.children) if(c.userData.oid===id) out.push(c); for(const c of ED.helpers.children) if(c.userData.oid===id) out.push(c); return out; }
function edUpdateSelBox(){
  const o=selObj(); if(ED._helperSel!==ED.sel){ ED._helperSel=ED.sel; if(SB.ready&&MODE==="build") edBuildHelpers(); } if(!o||MODE!=="build"){ ED.selBox.visible=false; return; }
  const b=new THREE.Box3(); for(const c of edTagged(o.id)){ if(c.isLight) continue; c.updateMatrixWorld(true); b.expandByObject(c); }
  if(b.isEmpty()){ ED.selBox.visible=false; return; } b.expandByScalar(0.03); ED.selBox.box=b; ED.selBox.visible=true;
}

// ---------------------------------------------------------------- creating things
function edAdd(o){ o.id=o.id||sbUid(o.type[0]); ED.doc.objects.push(o); ED.sel=o.id; ED.selOp=null; return o; }
function edNearestWall(p, maxD=0.8){ let best=null, bd=maxD;
  for(const w of ED.doc.objects){ if(w.type!=="wall") continue; const dx=w.b[0]-w.a[0], dz=w.b[1]-w.a[1], L2=dx*dx+dz*dz; if(L2<1e-6) continue; const t=clamp(((p.x-w.a[0])*dx+(p.z-w.a[1])*dz)/L2,0,1);
    const d=Math.hypot(w.a[0]+dx*t-p.x, w.a[1]+dz*t-p.z); if(d<bd){ bd=d; best={w,t,L:Math.sqrt(L2)}; } } return best; }
function edPlacePoint(tool, p, ev){
  const O=ED.opts, s=snapP(p,ev), gy=groundY(s.x,s.z);
  switch(tool){
    case "pillar": return edAdd({type:"pillar",x:s.x,z:s.z,r:O.pillar.r,h:O.pillar.h,color:O.pillar.color});
    case "prop": { const a=sbAsset(O.prop.asset); return edAdd({type:"prop",asset:O.prop.asset,x:s.x,z:s.z,rot:O.prop.rot,scale:O.prop.scale,search:!!(a&&a.search),solid:"auto",push:"auto",items:[]}); }
    case "item": return edAdd({type:"item",x:s.x,z:s.z,item:O.item.item,qty:O.item.qty,name:O.item.name,text:O.item.text});
    case "exit": return edAdd({type:"exit",x:s.x,z:s.z,r:O.exit.r,needs:O.exit.needs,label:""});
    case "light": return edAdd({type:"light",x:s.x,y:+(gy+O.light.height).toFixed(2),z:s.z,color:O.light.color,intensity:O.light.intensity,dist:O.light.dist});
    case "corpse": return edAdd({type:"corpse",x:s.x,z:s.z,yaw:Math.round(Math.random()*360)});
    case "camera": return edAdd({type:"camera",x:s.x,y:+(gy+O.camera.height).toFixed(2),z:s.z,look:[s.x,+(gy+0.8).toFixed(2),s.z-3],track:O.camera.track,fov:O.camera.fov});
    case "enemy": return edAdd({type:"enemy",kind:O.enemy.kind,x:s.x,z:s.z,yaw:180,start:O.enemy.start,hpMul:1,speedMul:1});
    case "spawn": { let sp=ED.doc.objects.find(o=>o.type==="spawn"); if(sp){ sp.x=s.x; sp.z=s.z; ED.sel=sp.id; return sp; } return edAdd({type:"spawn",x:s.x,z:s.z,yaw:180}); }
  }
}
function edMakeRect(tool,a,b){
  const x0=Math.min(a.x,b.x), z0=Math.min(a.z,b.z), w=Math.abs(b.x-a.x), d=Math.abs(b.z-a.z); if(w<0.2||d<0.2) return null;
  const O=ED.opts, y=+(ED.doc.terrain&&ED.doc.terrain.on ? tSample(ED.doc.terrain,x0+w/2,z0+d/2) : 0).toFixed(2);
  if(tool==="block") return edAdd({type:"block",x:x0+w/2,z:z0+d/2,w,d,h:O.block.h,color:O.block.color,tex:O.block.tex,push:O.block.push,name:O.block.name,search:O.block.search,items:[]});
  const f=edAdd({type:"floor",x:x0,z:z0,w,d,tex:O.floor.tex,colA:O.floor.colA,colB:O.floor.colB,y});
  if(tool==="room"){ const c=[[x0,z0],[x0+w,z0],[x0+w,z0+d],[x0,z0+d]]; for(let i=0;i<4;i++) ED.doc.objects.push({id:sbUid("w"),type:"wall",a:c[i],b:c[(i+1)%4],height:O.wall.height,thick:O.wall.thick,color:O.wall.color,tex:O.wall.tex,openings:[]}); ED.sel=f.id; }
  return f;
}
function edAddOpening(tool,p){
  const nw=edNearestWall(p); if(!nw){ edStatusMsg("Click on (or next to) a wall"); return; }
  const O=ED.opts[tool], L=nw.L, wdt=Math.min(O.width,L-0.1); const at=clamp(snapV(nw.t*L),wdt/2+0.02,L-wdt/2-0.02);
  edSnapshot();
  const op = tool==="door" ? {id:sbUid("o"),kind:"door",at,width:wdt,side:1,closed:O.closed,locked:O.locked,key:O.key} : tool==="window" ? {id:sbUid("o"),kind:"window",at,width:wdt,sill:O.sill,top:O.top} : {id:sbUid("o"),kind:"gap",at,width:wdt};
  nw.w.openings.push(op); ED.sel=nw.w.id; ED.selOp=op.id; edChanged({inspector:true});
}

// ---------------------------------------------------------------- terrain brushes
function edEnsureTerrain(){ const d=ED.doc; if(d.terrain&&d.terrain.on) return d.terrain;
  const B=docBounds(d); const pad=6, x0=Math.floor(B.x0-pad), z0=Math.floor(B.z0-pad), w=Math.max(30,Math.ceil(B.x1+pad-x0)), dd=Math.max(30,Math.ceil(B.z1+pad-z0));
  d.terrain=terrainMake(x0,z0,w,dd,w*dd>6400?2:1,1); edStatusMsg("Terrain switched on for this map (MAP tab sets its size)"); ED.terrainDirty=true; edRebuild(true); return d.terrain; }
function edBrush(p, first){
  const T=ED.doc.terrain; if(!T||!T.on) return; const O=ED.opts.terrain, r=+O.radius, st=+O.strength;
  if(first) ED.flatTo = O.mode==="flatten" ? tSample(T,p.x,p.z) : 0;
  const fall=d=>{ const q=1-(d/r)**2; return q*q; };
  if(O.mode==="smooth"){ const nh=T.h.slice(); tEach(T,p.x,p.z,r,(k,d)=>{ const i=k%T.nx, j=(k/T.nx)|0; let s=0,n=0; for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ const ii=i+di, jj=j+dj; if(ii<0||jj<0||ii>=T.nx||jj>=T.nz) continue; s+=T.h[jj*T.nx+ii]; n++; } nh[k]=T.h[k]+(s/n-T.h[k])*Math.min(1,st*1.5)*fall(d); }); for(let k=0;k<nh.length;k++) T.h[k]=nh[k]; }
  else tEach(T,p.x,p.z,r,(k,d)=>{ const f=fall(d);
    if(O.mode==="raise") T.h[k]+=0.12*st*f; else if(O.mode==="lower") T.h[k]-=0.12*st*f;
    else if(O.mode==="flatten") T.h[k]+=(ED.flatTo-T.h[k])*Math.min(1,st*0.6)*f;
    else if(O.mode==="noise") T.h[k]+=(vhash(k+(Date.now()&1023))-0.5)*0.15*st*f;
    else if(O.mode==="paint"){ if(f>0.15 || vhash(k*31+(Date.now()&255))<f*3) T.p[k]=+O.paint; } });
  for(let k=0;k<T.h.length;k++) T.h[k]=Math.round(clamp(T.h[k],-20,30)*1000)/1000;
  if(world.terrain&&world.terrain.mesh) terrainRefresh(world.terrain); ED.terrainDirty=true; ED.planDirty=true;
}

// ---------------------------------------------------------------- pointer handling shared by the plan and the 3D view
function edToolDown(p, ev, pickId, from3d){
  const t=ED.tool; ED.cursor={x:p.x,z:p.z,ok:true};
  if(t==="select"){
    if(pickId){ const o=obj(pickId); const soft=from3d && o && ["floor","path"].includes(o.type);
      if(!soft){ if(ED.sel!==pickId){ ED.sel=pickId; ED.selOp=null; edRenderInspector(); edUpdateSelBox(); }
        let end=null; if(!from3d&&o.type==="wall"){ const tol=10/ED.zoom; if(Math.hypot(p.x-o.a[0],p.z-o.a[1])<tol) end="a"; else if(Math.hypot(p.x-o.b[0],p.z-o.b[1])<tol) end="b"; }
        ED.drag={kind:end?"end":"move", end, o, start:p, orig:sbClone(o), moved:false, sx:ev.clientX, sy:ev.clientY, meshes:from3d?edTagged(o.id).map(m=>({m,p:m.position.clone()})):null}; return true; }
      ED.drag={kind:"softpick", id:pickId, sx:ev.clientX, sy:ev.clientY}; return false; }
    ED.drag={kind:"softpick", id:null, sx:ev.clientX, sy:ev.clientY}; return false;
  }
  if(t==="wall"){ const s=snapP(p,ev); if(!ED.draft||ED.draft.kind!=="wall") ED.draft={kind:"wall",a:s,b:s}; else { if(Math.hypot(s.x-ED.draft.a.x,s.z-ED.draft.a.z)>0.05){ edSnapshot(); const O=ED.opts.wall; const w=edAdd({type:"wall",a:[ED.draft.a.x,ED.draft.a.z],b:[s.x,s.z],height:O.height,thick:O.thick,color:O.color,tex:O.tex,openings:[]}); ED.draft={kind:"wall",a:s,b:s}; edChanged({inspector:true}); } } ED.planDirty=true; return true; }
  if(t==="path"){ const s=snapP(p,ev); if(!ED.draft||ED.draft.kind!=="path") ED.draft={kind:"path",pts:[[s.x,s.z]],b:s}; else ED.draft.pts.push([s.x,s.z]); ED.planDirty=true; return true; }
  if(t==="room"||t==="floor"||t==="block"){ const s=snapP(p,ev); ED.draft={kind:"rect",tool:t,a:s,b:s}; ED.drag={kind:"rect"}; return true; }
  if(t==="door"||t==="window"||t==="gap"){ edAddOpening(t,p); return true; }
  if(t==="terrain"){ edSnapshot(); edEnsureTerrain(); edBrush(p,true); ED.drag={kind:"terrain",last:0}; return true; }
  if(["spawn","enemy","camera"].includes(t)){ edSnapshot(); const o=edPlacePoint(t,p,ev); ED.drag={kind:"aim",o,start:p}; edChanged({inspector:true}); return true; }
  edSnapshot(); edPlacePoint(t,p,ev); edChanged({inspector:true}); return true;
}
function edToolMove(p, ev){
  ED.cursor={x:p.x,z:p.z,ok:true}; const D=ED.drag;
  if(ED.draft&&(ED.draft.kind==="wall"||ED.draft.kind==="path")){ ED.draft.b=snapP(p,ev); ED.planDirty=true; }
  if(!D){ if(["prop","terrain"].includes(ED.tool)) ED.planDirty=true; return; }
  if(D.kind==="rect"){ ED.draft.b=snapP(p,ev); ED.planDirty=true; }
  else if(D.kind==="terrain"){ const now=performance.now(); if(now-D.last>35){ D.last=now; edBrush(p,false); } }
  else if(D.kind==="aim"){ const o=D.o, dx=p.x-o.x, dz=p.z-o.z; if(Math.hypot(dx,dz)<0.25) return;
    if(o.type==="camera") o.look=[+p.x.toFixed(2),+(groundY(p.x,p.z)+0.8).toFixed(2),+p.z.toFixed(2)]; else o.yaw=Math.round(Math.atan2(dx,dz)*R2D/15)*15;
    ED.planDirty=true; edBuildHelpers(); edUpdateSelBox(); }
  else if(D.kind==="move"||D.kind==="end"){
    if(!D.moved && Math.hypot(ev.clientX-D.sx,ev.clientY-D.sy)<4) return; if(!D.moved){ D.moved=true; edSnapshotFrom(D.orig); }
    const dx=snapV(p.x-D.start.x,ev), dz=snapV(p.z-D.start.z,ev), o=D.o, g=D.orig;
    if(D.kind==="end"){ o[D.end]=[snapV(g[D.end][0]+dx,ev), snapV(g[D.end][1]+dz,ev)]; }
    else edShift(o,g,dx,dz);
    ED.planDirty=true;
    if(D.meshes){ for(const q of D.meshes){ q.m.position.set(q.p.x+dx,q.p.y,q.p.z+dz); } edUpdateSelBox(); }
  }
}
function edSnapshotFrom(orig){ edSnapshot(); } // nothing has changed yet when the drag first moves, so this records the state before it
function edShift(o,g,dx,dz){
  if(o.type==="wall"){ o.a=[g.a[0]+dx,g.a[1]+dz]; o.b=[g.b[0]+dx,g.b[1]+dz]; }
  else if(o.type==="path"){ o.points=g.points.map(q=>[q[0]+dx,q[1]+dz]); }
  else { o.x=+(g.x+dx).toFixed(3); o.z=+(g.z+dz).toFixed(3); if(o.type==="camera"&&g.look) o.look=[g.look[0]+dx,g.look[1],g.look[2]+dz]; }
}
function edToolUp(p, ev){
  const D=ED.drag; ED.drag=null; if(!D) return;
  if(D.kind==="rect"){ edSnapshot(); const r=edMakeRect(ED.draft.tool,ED.draft.a,ED.draft.b); ED.draft=null; if(r) edChanged({inspector:true}); ED.planDirty=true; }
  else if(D.kind==="terrain"){ edChanged({terrain:true}); }
  else if(D.kind==="aim"){ edChanged({inspector:true}); }
  else if(D.kind==="move"||D.kind==="end"){ if(D.moved){ edChanged({inspector:true}); } }
  else if(D.kind==="softpick"){ if(Math.hypot(ev.clientX-D.sx,ev.clientY-D.sy)<5){ ED.sel=D.id; ED.selOp=null; edRenderInspector(); edUpdateSelBox(); ED.planDirty=true; } }
}
function edEndChain(){ const d=ED.draft; if(d&&d.kind==="path"&&d.pts.length>=2){ edSnapshot(); const O=ED.opts.path; edAdd({type:"path",points:d.pts,width:O.width,tex:O.tex,color:O.color}); edChanged({inspector:true}); } ED.draft=null; ED.planDirty=true; }

// ---------------------------------------------------------------- plan view
function planSize(){ let r=planCv.getBoundingClientRect(); if(!r.width) r=canvas.getBoundingClientRect(); return {w:r.width||innerWidth,h:r.height||innerHeight}; }
function toS(x,z){ const s=planSize(); return [(x-ED.pan.x)*ED.zoom+s.w/2,(z-ED.pan.z)*ED.zoom+s.h/2]; }
function toW(px,py){ const s=planSize(); return {x:(px-s.w/2)/ED.zoom+ED.pan.x, z:(py-s.h/2)/ED.zoom+ED.pan.z}; }
function planHit(p){
  const os=ED.doc.objects, tol=8/ED.zoom; let best=null, bd=1e9;
  for(const o of os){ if(!["spawn","enemy","item","exit","light","camera","corpse","pillar"].includes(o.type)) continue; const r=Math.max(o.type==="exit"?(+o.r||0.8)*0.6:o.type==="pillar"?(+o.r||0.4):0.32,tol); const d=Math.hypot(o.x-p.x,o.z-p.z); if(d<r&&d<bd){ bd=d; best=o.id; } }
  if(best) return best;
  let ba=1e9;
  for(const o of os){ if(o.type!=="prop") continue; const F=sbPropFoot(o); if(edInPoly(p.x,p.z,F.pts)){ const a=(F.x1-F.x0)*(F.z1-F.z0); if(a<ba){ ba=a; best=o.id; } } }
  if(best) return best;
  for(const o of os){ if(o.type!=="wall") continue; const dx=o.b[0]-o.a[0], dz=o.b[1]-o.a[1], L2=dx*dx+dz*dz||1, t=clamp(((p.x-o.a[0])*dx+(p.z-o.a[1])*dz)/L2,0,1), d=Math.hypot(o.a[0]+dx*t-p.x,o.a[1]+dz*t-p.z); if(d<(+o.thick||0.2)/2+tol&&d<bd){ bd=d; best=o.id; } }
  if(best) return best;
  for(const o of os){ if(o.type==="block"&&Math.abs(p.x-o.x)<=o.w/2&&Math.abs(p.z-o.z)<=o.d/2){ const a=o.w*o.d; if(a<ba){ ba=a; best=o.id; } } }
  if(best) return best;
  for(const o of os){ if(o.type!=="path") continue; const P=o.points||[]; for(let i=0;i<P.length-1;i++){ const [ax,az]=P[i],[bx,bz]=P[i+1], dx=bx-ax, dz=bz-az, L2=dx*dx+dz*dz||1, t=clamp(((p.x-ax)*dx+(p.z-az)*dz)/L2,0,1); if(Math.hypot(ax+dx*t-p.x,az+dz*t-p.z)<(+o.width||1.6)/2) return o.id; } }
  for(const o of os){ if(o.type==="floor"&&p.x>=o.x&&p.x<=o.x+o.w&&p.z>=o.z&&p.z<=o.z+o.d){ const a=o.w*o.d; if(a<ba){ ba=a; best=o.id; } } }
  return best;
}
function edInPoly(x,z,P){ let ins=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const [xi,zi]=P[i],[xj,zj]=P[j]; if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi) ins=!ins; } return ins; }
function edTerrainImage(){
  const T=ED.doc.terrain; if(!T||!T.on){ ED.terrainImg=null; return; }
  const c=ED.terrainImg&&ED.terrainImg.width===T.nx&&ED.terrainImg.height===T.nz?ED.terrainImg:document.createElement("canvas"); c.width=T.nx; c.height=T.nz;
  const g=c.getContext("2d"), im=g.createImageData(T.nx,T.nz), col=new THREE.Color();
  for(let j=0;j<T.nz;j++) for(let i=0;i<T.nx;i++){ const k=j*T.nx+i; col.set((GROUND[T.p[k]]||GROUND[0]).c);
    const hx=T.h[j*T.nx+Math.min(T.nx-1,i+1)]-T.h[j*T.nx+Math.max(0,i-1)], hz=T.h[Math.min(T.nz-1,j+1)*T.nx+i]-T.h[Math.max(0,j-1)*T.nx+i];
    const sh=clamp(1+(-hx-hz)*0.6/T.cell+T.h[k]*0.05,0.4,1.7);
    im.data[k*4]=clamp(col.r*255*sh,0,255); im.data[k*4+1]=clamp(col.g*255*sh,0,255); im.data[k*4+2]=clamp(col.b*255*sh,0,255); im.data[k*4+3]=255; }
  g.putImageData(im,0,0); ED.terrainImg=c; ED.terrainDirty=false;
}
function drawPlan(){
  ED.planDirty=false; const s=planSize(), dpr=Math.min(2,devicePixelRatio||1);
  if(planCv.width!==Math.round(s.w*dpr)||planCv.height!==Math.round(s.h*dpr)){ planCv.width=Math.round(s.w*dpr); planCv.height=Math.round(s.h*dpr); }
  const g=planG; g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle="#0a0c0b"; g.fillRect(0,0,s.w,s.h);
  const Z=ED.zoom, S=toS, os=ED.doc.objects, sel=ED.sel;
  const T=ED.doc.terrain; if(T&&T.on){ if(ED.terrainDirty||!ED.terrainImg) edTerrainImage(); const [x0,z0]=S(T.x0-T.cell/2,T.z0-T.cell/2); g.imageSmoothingEnabled=false; g.globalAlpha=0.85; g.drawImage(ED.terrainImg,x0,z0,T.nx*T.cell*Z,T.nz*T.cell*Z); g.globalAlpha=1; }
  if(edPrefs.grid){ const tl=toW(0,0), br=toW(s.w,s.h); const step=Z<8?5:Z<20?1:ED.snap>=1?1:0.5;
    g.lineWidth=1; for(let x=Math.floor(tl.x/step)*step;x<=br.x;x+=step){ const [px]=S(x,0); g.strokeStyle=Math.abs(x%5)<1e-6?"rgba(140,150,130,.22)":"rgba(140,150,130,.08)"; g.beginPath(); g.moveTo(Math.round(px)+.5,0); g.lineTo(Math.round(px)+.5,s.h); g.stroke(); }
    for(let z=Math.floor(tl.z/step)*step;z<=br.z;z+=step){ const [,py]=S(0,z); g.strokeStyle=Math.abs(z%5)<1e-6?"rgba(140,150,130,.22)":"rgba(140,150,130,.08)"; g.beginPath(); g.moveTo(0,Math.round(py)+.5); g.lineTo(s.w,Math.round(py)+.5); g.stroke(); }
    const [ox,oz]=S(0,0); g.strokeStyle="rgba(181,86,44,.45)"; g.beginPath(); g.moveTo(ox-6,oz); g.lineTo(ox+6,oz); g.moveTo(ox,oz-6); g.lineTo(ox,oz+6); g.stroke(); }
  const selCol="#ff9a50";
  for(const o of os) if(o.type==="floor"){ const [x,z]=S(o.x,o.z); g.fillStyle=sbTexAvg(o.tex,o.colA||"#2e2a26"); g.globalAlpha=0.9; g.fillRect(x,z,o.w*Z,o.d*Z); g.globalAlpha=1; g.strokeStyle=o.id===sel?selCol:"rgba(0,0,0,.4)"; g.lineWidth=o.id===sel?2:1; g.strokeRect(x,z,o.w*Z,o.d*Z); }
  for(const o of os) if(o.type==="path"){ g.strokeStyle=o.id===sel?selCol:sbTexAvg(o.tex,o.color||"#6a665e"); g.lineWidth=Math.max(2,(+o.width||1.6)*Z); g.lineCap="round"; g.lineJoin="round"; g.globalAlpha=0.85; g.beginPath(); (o.points||[]).forEach((q,i)=>{ const [x,z]=S(q[0],q[1]); i?g.lineTo(x,z):g.moveTo(x,z); }); g.stroke(); g.globalAlpha=1; g.lineCap="butt"; }
  for(const o of os){
    if(o.type==="block"){ const [x,z]=S(o.x-o.w/2,o.z-o.d/2); g.fillStyle=sbTexAvg(o.tex,o.color||"#5b4128"); g.fillRect(x,z,o.w*Z,o.d*Z); g.strokeStyle=o.id===sel?selCol:"#1a1410"; g.lineWidth=o.id===sel?2:1; g.strokeRect(x,z,o.w*Z,o.d*Z); if(o.search) edBadge(g,x+o.w*Z,z,(o.items||[]).length); if(Z>26&&o.name){ g.fillStyle="#e8dfc8"; g.font="10px 'IBM Plex Mono',monospace"; g.fillText(o.name,x+3,z+11); } }
    else if(o.type==="pillar"){ const [x,z]=S(o.x,o.z); g.fillStyle=hexStr(o.color||"#5a5246"); g.beginPath(); g.arc(x,z,Math.max(3,(+o.r||0.4)*Z),0,7); g.fill(); g.strokeStyle=o.id===sel?selCol:"#111"; g.lineWidth=o.id===sel?2:1; g.stroke(); }
    else if(o.type==="corpse"){ const [x,z]=S(o.x,o.z); g.save(); g.translate(x,z); g.rotate(-(o.yaw||0)*D2R); g.fillStyle="#4a2a24"; g.fillRect(-0.22*Z,-0.8*Z,0.44*Z,1.6*Z); g.strokeStyle=o.id===sel?selCol:"#200"; g.strokeRect(-0.22*Z,-0.8*Z,0.44*Z,1.6*Z); g.restore(); }
  }
  for(const o of os) if(o.type==="prop"){ const F=sbPropFoot(o); const a=F.a; let col="#6a5a48"; if(a&&a.parts&&a.parts[0]) col=sbTexAvg(a.parts[0].t,a.parts[0].c||col);
    g.beginPath(); F.pts.forEach((q,i)=>{ const [x,z]=S(q[0],q[1]); i?g.lineTo(x,z):g.moveTo(x,z); }); g.closePath(); g.fillStyle=col; g.globalAlpha=0.88; g.fill(); g.globalAlpha=1; g.strokeStyle=o.id===sel?selCol:"rgba(0,0,0,.6)"; g.lineWidth=o.id===sel?2:1; g.stroke();
    const [cx,cz]=S((F.x0+F.x1)/2,(F.z0+F.z1)/2);
    const th=(o.rot||0)*D2R; const [fx,fz]=S(o.x+Math.sin(th)*0.25*(o.scale||1),o.z+Math.cos(th)*0.25*(o.scale||1)); const [ox,oz]=S(o.x,o.z); if(Z>18){ g.strokeStyle="rgba(232,223,200,.55)"; g.beginPath(); g.moveTo(ox,oz); g.lineTo(fx,fz); g.stroke(); }
    if(o.search) edBadge(g,S(F.x1,F.z0)[0],S(F.x1,F.z0)[1],(o.items||[]).length);
    if(Z>34){ g.fillStyle="#e8dfc8"; g.font="10px 'IBM Plex Mono',monospace"; const nm=(a?a.name:o.asset).split(/[,(]/)[0]; g.fillText(nm,cx-g.measureText(nm).width/2,cz+3); } }
  for(const o of os) if(o.type==="wall"){ const [ax,az]=S(o.a[0],o.a[1]), [bx,bz]=S(o.b[0],o.b[1]); const L=Math.hypot(o.b[0]-o.a[0],o.b[1]-o.a[1])||1, ux=(bx-ax)/(L*Z), uz=(bz-az)/(L*Z);
    const lw=Math.max(2,(+o.thick||0.2)*Z); const segs=[]; let s0=0; for(const op of [...o.openings].sort((p,q)=>p.at-q.at)){ const a=Math.max(0,op.at-op.width/2), b=Math.min(L,op.at+op.width/2); if(a>s0) segs.push([s0,a]); s0=Math.max(s0,b); } if(s0<L) segs.push([s0,L]);
    g.strokeStyle=o.id===sel?selCol:sbTexAvg(o.tex,hexStr(o.color||"#5a554c")); g.lineWidth=lw; for(const [a,b] of segs){ g.beginPath(); g.moveTo(ax+ux*a*Z,az+uz*a*Z); g.lineTo(ax+ux*b*Z,az+uz*b*Z); g.stroke(); }
    if(o.id!==sel){ g.strokeStyle="rgba(0,0,0,.5)"; g.lineWidth=1; }
    for(const op of o.openings){ const a=op.at-op.width/2, b=op.at+op.width/2, p0=[ax+ux*a*Z,az+uz*a*Z], p1=[ax+ux*b*Z,az+uz*b*Z]; const on=op.id===ED.selOp;
      if(op.kind==="window"){ g.strokeStyle=on?selCol:"#7fb6d6"; g.lineWidth=Math.max(2,lw*0.45); g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); }
      else if(op.kind==="door"){ g.strokeStyle=on?selCol:op.locked?"#e0a070":"#c9a23a"; g.lineWidth=1.5; const r=op.width*Z; const nx=-uz*(op.side||1), nz=ux*(op.side||1);
        g.beginPath(); g.moveTo(...p0); g.lineTo(p0[0]+nx*r,p0[1]+nz*r); g.stroke(); g.setLineDash([3,3]); g.beginPath(); g.moveTo(p0[0]+nx*r,p0[1]+nz*r); g.quadraticCurveTo(p0[0]+(nx+ux)*r,p0[1]+(nz+uz)*r,p1[0],p1[1]); g.stroke(); g.setLineDash([]);
        if(op.locked){ g.fillStyle="#e0a070"; g.font="bold 11px 'IBM Plex Mono',monospace"; g.fillText("⊠",(p0[0]+p1[0])/2-4,(p0[1]+p1[1])/2+4); } if(op.closed){ g.strokeStyle="#8a6a40"; g.lineWidth=3; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); } }
      else { g.strokeStyle=on?selCol:"rgba(201,162,58,.6)"; g.setLineDash([2,3]); g.lineWidth=1; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); g.setLineDash([]); } }
    if(o.id===sel){ for(const [x,z] of [[ax,az],[bx,bz]]){ g.fillStyle=selCol; g.fillRect(x-4,z-4,8,8); } } }
  for(const o of os){ const [x,z]=typeof o.x==="number"?S(o.x,o.z):[0,0]; const on=o.id===sel;
    if(o.type==="light"){ g.fillStyle="rgba(255,200,100,.06)"; g.beginPath(); g.arc(x,z,(+o.dist||8)*Z*0.45,0,7); g.fill(); g.fillStyle=hexStr(o.color||"#ffb060"); g.beginPath(); g.arc(x,z,5,0,7); g.fill(); g.strokeStyle=on?selCol:"#000"; g.lineWidth=on?2:1; g.stroke(); }
    else if(o.type==="camera"){ const L=o.look||[o.x,0,o.z-3]; const [lx,lz]=S(L[0],L[2]); g.strokeStyle="rgba(89,166,201,.5)"; g.setLineDash([4,4]); g.lineWidth=1; g.beginPath(); g.moveTo(x,z); g.lineTo(lx,lz); g.stroke(); g.setLineDash([]);
      const an=Math.atan2(lz-z,lx-x), f=(+o.fov||60)*D2R/2; g.fillStyle="rgba(89,166,201,.18)"; g.beginPath(); g.moveTo(x,z); g.arc(x,z,40,an-f,an+f); g.closePath(); g.fill(); g.fillStyle="#59a6c9"; g.fillRect(x-5,z-4,10,8); if(on){ g.strokeStyle=selCol; g.lineWidth=2; g.strokeRect(x-6,z-5,12,10); } }
    else if(o.type==="item"){ const d=itemDef(o.item); g.fillStyle=d.col; g.strokeStyle=on?selCol:"#e8c77a"; g.lineWidth=on?2:1.5; g.beginPath(); g.moveTo(x,z-7); g.lineTo(x+6,z); g.lineTo(x,z+7); g.lineTo(x-6,z); g.closePath(); g.fill(); g.stroke(); if(Z>22){ g.fillStyle="#e8c77a"; g.font="10px 'IBM Plex Mono',monospace"; g.fillText(entryLabel(o),x+9,z+4); } }
    else if(o.type==="exit"){ g.strokeStyle=on?selCol:"#60ff80"; g.lineWidth=2; g.beginPath(); g.arc(x,z,Math.max(6,(+o.r||0.8)*Z),0,7); g.stroke(); g.fillStyle="#60ff80"; g.font="10px 'IBM Plex Mono',monospace"; g.fillText(o.needs?"EXIT ⊠ "+o.needs:"EXIT",x+Math.max(8,(+o.r||.8)*Z)+3,z+4); }
    else if(o.type==="spawn"||o.type==="enemy"){ const sp=o.type==="spawn", col=sp?"#59a6c9":o.start==="hunting"?"#d84040":"#d8b040", th=(o.yaw||0)*D2R, r=Math.max(6,0.32*Z);
      g.fillStyle=col; g.beginPath(); g.arc(x,z,r,0,7); g.fill(); g.strokeStyle=on?selCol:"#000"; g.lineWidth=on?2.5:1; g.stroke();
      g.strokeStyle="#fff"; g.lineWidth=2; g.beginPath(); g.moveTo(x,z); g.lineTo(x+Math.sin(th)*r*1.6,z+Math.cos(th)*r*1.6); g.stroke();
      g.fillStyle="#0b0d0c"; g.font="bold 10px 'IBM Plex Mono',monospace"; const lab=sp?"N":edEnemyShort(o.kind); g.fillText(lab,x-g.measureText(lab).width/2,z+3.5); }
  }
  // drafts and cursors
  const D=ED.draft;
  if(D&&D.kind==="wall"){ const [ax,az]=S(D.a.x,D.a.z), [bx,bz]=S(D.b.x,D.b.z); g.strokeStyle="#d07a44"; g.lineWidth=Math.max(2,ED.opts.wall.thick*Z); g.beginPath(); g.moveTo(ax,az); g.lineTo(bx,bz); g.stroke(); edLabel(g,(ax+bx)/2,(az+bz)/2,Math.hypot(D.b.x-D.a.x,D.b.z-D.a.z).toFixed(2)+" m"); }
  if(D&&D.kind==="path"){ g.strokeStyle="#d07a44"; g.lineWidth=2; g.beginPath(); D.pts.forEach((q,i)=>{ const [x,z]=S(q[0],q[1]); i?g.lineTo(x,z):g.moveTo(x,z); }); const [bx,bz]=S(D.b.x,D.b.z); g.lineTo(bx,bz); g.stroke(); }
  if(D&&D.kind==="rect"){ const [ax,az]=S(Math.min(D.a.x,D.b.x),Math.min(D.a.z,D.b.z)); const w=Math.abs(D.b.x-D.a.x), d=Math.abs(D.b.z-D.a.z); g.strokeStyle="#d07a44"; g.lineWidth=2; g.setLineDash([6,4]); g.strokeRect(ax,az,w*Z,d*Z); g.setLineDash([]); edLabel(g,ax+w*Z/2,az+d*Z/2,`${w.toFixed(2)} × ${d.toFixed(2)} m`); }
  if(ED.cursor.ok&&ED.view==="plan"){ const [cx,cz]=S(ED.cursor.x,ED.cursor.z);
    if(ED.tool==="terrain"){ g.strokeStyle="rgba(232,199,122,.8)"; g.lineWidth=1.5; g.beginPath(); g.arc(cx,cz,ED.opts.terrain.radius*Z,0,7); g.stroke(); }
    if(ED.tool==="prop"){ const F=sbPropFoot({asset:ED.opts.prop.asset,x:snapV(ED.cursor.x),z:snapV(ED.cursor.z),rot:ED.opts.prop.rot,scale:ED.opts.prop.scale}); g.strokeStyle="#d07a44"; g.setLineDash([4,3]); g.lineWidth=1.5; g.beginPath(); F.pts.forEach((q,i)=>{ const [x,z]=S(q[0],q[1]); i?g.lineTo(x,z):g.moveTo(x,z); }); g.closePath(); g.stroke(); g.setLineDash([]); } }
  // scale bar
  const m=Z<10?10:Z<30?5:Z<80?2:1; g.fillStyle="rgba(232,223,200,.8)"; g.fillRect(14,14,m*Z,3); g.font="10px 'IBM Plex Mono',monospace"; g.fillText(m+" m",14+m*Z+6,19);
}
function edBadge(g,x,z,n){ g.fillStyle=n?"#e8c77a":"#6a6458"; g.beginPath(); g.arc(x,z,6,0,7); g.fill(); g.fillStyle="#150b05"; g.font="bold 9px 'IBM Plex Mono',monospace"; const t=String(n); g.fillText(t,x-g.measureText(t).width/2,z+3); }
function edLabel(g,x,z,t){ g.font="11px 'IBM Plex Mono',monospace"; const w=g.measureText(t).width+8; g.fillStyle="rgba(7,9,8,.9)"; g.fillRect(x-w/2,z-20,w,15); g.fillStyle="#e8dfc8"; g.fillText(t,x-w/2+4,z-9); }
function edEnemyShort(k){ k=k||"across"; if(k==="brute") return "L"; if(k==="dummy") return "D"; if(k==="across") return "A"; if(k==="across_legless") return "c"; const v=k.slice(7); return (VMAP[v]?VMAP[v].name.replace("The ",""):"A")[0]; }

let planDrag=null, spaceDown=false;
planCv.addEventListener("pointerdown",e=>{
  if(MODE!=="build") return; planCv.focus(); const r=planCv.getBoundingClientRect(), p=toW(e.clientX-r.left,e.clientY-r.top); planCv.setPointerCapture(e.pointerId);
  if(e.button===2&&ED.draft&&(ED.draft.kind==="wall"||ED.draft.kind==="path")){ edEndChain(); return; }
  if(e.button===1||e.button===2||spaceDown){ planDrag={x:e.clientX,y:e.clientY,px:ED.pan.x,pz:ED.pan.z}; return; }
  const used=edToolDown(p,e,ED.tool==="select"?planHit(p):null,false);
  if(!used&&ED.tool==="select") planDrag={x:e.clientX,y:e.clientY,px:ED.pan.x,pz:ED.pan.z,click:true};
  ED.planDirty=true;
});
planCv.addEventListener("pointermove",e=>{
  if(MODE!=="build") return; const r=planCv.getBoundingClientRect(), p=toW(e.clientX-r.left,e.clientY-r.top);
  if(planDrag){ ED.pan.x=planDrag.px-(e.clientX-planDrag.x)/ED.zoom; ED.pan.z=planDrag.pz-(e.clientY-planDrag.y)/ED.zoom; ED.planDirty=true; ED.cursor={x:p.x,z:p.z,ok:true}; return; }
  edToolMove(p,e); edStatus();
});
planCv.addEventListener("pointerup",e=>{ if(MODE!=="build") return; const r=planCv.getBoundingClientRect(), p=toW(e.clientX-r.left,e.clientY-r.top);
  if(planDrag){ const moved=Math.hypot(e.clientX-planDrag.x,e.clientY-planDrag.y)>4; const wasClick=planDrag.click; planDrag=null; if(wasClick&&!moved&&ED.drag&&ED.drag.kind==="softpick"){ edToolUp(p,e); } else if(ED.drag&&ED.drag.kind==="softpick") ED.drag=null; ED.planDirty=true; return; }
  edToolUp(p,e); ED.planDirty=true; });
planCv.addEventListener("dblclick",()=>{ if(ED.draft&&(ED.draft.kind==="wall"||ED.draft.kind==="path")) edEndChain(); });
planCv.addEventListener("wheel",e=>{ e.preventDefault(); const r=planCv.getBoundingClientRect(), p=toW(e.clientX-r.left,e.clientY-r.top); ED.zoom=clamp(ED.zoom*Math.pow(1.0015,-e.deltaY),3,240); const q=toW(e.clientX-r.left,e.clientY-r.top); ED.pan.x+=p.x-q.x; ED.pan.z+=p.z-q.z; ED.planDirty=true; },{passive:false});
planCv.addEventListener("pointerleave",()=>{ ED.cursor.ok=false; ED.planDirty=true; });
planCv.addEventListener("contextmenu",e=>e.preventDefault());

// ---------------------------------------------------------------- 3D view
const edRay=new THREE.Raycaster();
function pick3(e, terrainOnly){
  const r=canvas.getBoundingClientRect(); edRay.setFromCamera({x:(e.clientX-r.left)/r.width*2-1, y:-((e.clientY-r.top)/r.height)*2+1}, camera);
  const targets = terrainOnly ? (world.terrain&&world.terrain.mesh?[world.terrain.mesh]:[]) : [world.group, ED.helpers];
  const hits=edRay.intersectObjects(targets,true).filter(h=>{ let o=h.object; while(o){ if(o.visible===false) return false; o=o.parent; } return !h.object.userData.glint && !(h.object.isLine); });
  let id=null; if(hits.length){ let o=hits[0].object; while(o&&o.userData.oid===undefined) o=o.parent; id=o?o.userData.oid:null; }
  let pt=hits.length?hits[0].point:null;
  if(!pt){ const pl=new THREE.Plane(new THREE.Vector3(0,1,0),0), v=new THREE.Vector3(); pt=edRay.ray.intersectPlane(pl,v); }
  return {id, pt:pt?{x:pt.x,z:pt.z,y:pt.y}:null};
}
let orbitDrag=null;
canvas.addEventListener("pointerdown",e=>{
  if(MODE!=="build"||ED.view!=="3d") return; canvas.setPointerCapture(e.pointerId); ED.preview=null;
  if(e.button===2||e.button===1||e.altKey){ orbitDrag={x:e.clientX,y:e.clientY,pan:e.button===1||e.shiftKey}; return; }
  const P=pick3(e, ED.tool==="terrain"); if(!P.pt) return;
  const used=edToolDown(P.pt,e,ED.tool==="select"?P.id:null,true);
  if(ED.drag&&ED.drag.kind==="move"){ const y=groundY(P.pt.x,P.pt.z); ED.drag.planeY=y; const q=edPlanePt(e,y); if(q) ED.drag.start=q; }
  if(!used) orbitDrag={x:e.clientX,y:e.clientY,pan:false,sx:e.clientX,sy:e.clientY};
});
canvas.addEventListener("pointermove",e=>{
  if(MODE!=="build"||ED.view!=="3d") return;
  if(orbitDrag){ const dx=e.clientX-orbitDrag.x, dy=e.clientY-orbitDrag.y; orbitDrag.x=e.clientX; orbitDrag.y=e.clientY; const O=ED.orbit;
    if(orbitDrag.pan){ const k=O.dist*0.0016; O.tx+=(-Math.cos(O.yaw)*dx - Math.sin(O.yaw)*dy)*k; O.tz+=(Math.sin(O.yaw)*dx - Math.cos(O.yaw)*dy)*k; }
    else { O.yaw-=dx*0.006; O.pitch=clamp(O.pitch+dy*0.005,0.05,1.52); } return; }
  const now=performance.now(); if(!ED.drag && now-ED.lastPick<45) return; ED.lastPick=now;
  const P=pick3(e, ED.tool==="terrain"||(ED.drag&&ED.drag.kind==="terrain")); if(!P.pt) return;
  if(ED.drag&&(ED.drag.kind==="move")){ // drag along a flat plane at the object's own height so it doesn't climb what it passes over
    const r=canvas.getBoundingClientRect(); edRay.setFromCamera({x:(e.clientX-r.left)/r.width*2-1, y:-((e.clientY-r.top)/r.height)*2+1}, camera);
    const v=new THREE.Vector3(); const hit=edRay.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-(ED.drag.planeY??(ED.drag.planeY=groundY(ED.drag.start.x,ED.drag.start.z)))),v); if(hit) P.pt={x:v.x,z:v.z,y:v.y}; }
  edToolMove(P.pt,e); edStatus();
});
canvas.addEventListener("pointerup",e=>{ if(MODE!=="build"||ED.view!=="3d") return;
  if(orbitDrag){ const click=orbitDrag.sx!==undefined && Math.hypot(e.clientX-orbitDrag.sx,e.clientY-orbitDrag.sy)<5; orbitDrag=null; if(ED.drag&&ED.drag.kind==="softpick"){ if(click) edToolUp(ED.cursor,e); else ED.drag=null; } return; }
  edToolUp(ED.cursor,e); });
canvas.addEventListener("dblclick",()=>{ if(MODE==="build"&&ED.draft&&(ED.draft.kind==="wall"||ED.draft.kind==="path")) edEndChain(); });
canvas.addEventListener("wheel",e=>{ if(MODE!=="build"||ED.view!=="3d") return; e.preventDefault(); ED.preview=null; ED.orbit.dist=clamp(ED.orbit.dist*Math.pow(1.0012,e.deltaY),1.5,160); },{passive:false});
canvas.addEventListener("pointerdown",e=>{ if(MODE==="build"&&ED.view==="3d"&&e.button===2&&ED.draft&&(ED.draft.kind==="wall"||ED.draft.kind==="path")){ edEndChain(); orbitDrag=null; } });
function edPlanePt(e,y){ const r=canvas.getBoundingClientRect(); edRay.setFromCamera({x:(e.clientX-r.left)/r.width*2-1, y:-((e.clientY-r.top)/r.height)*2+1}, camera); const v=new THREE.Vector3(); return edRay.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-y),v)?{x:v.x,z:v.z,y}:null; }
function edPan3(dx,dz){ ED.orbit.tx+=dx; ED.orbit.tz+=dz; }
function edOrbitCam(){
  const O=ED.orbit;
  if(ED.preview){ const o=obj(ED.preview); if(o){ const L=o.look||[o.x,0.8,o.z-3]; camera.position.set(o.x,o.y??2.8,o.z); if(camera.fov!==(+o.fov||60)){ camera.fov=+o.fov||60; camera.updateProjectionMatrix(); } camera.lookAt(L[0],L[1],L[2]); return; } ED.preview=null; }
  if(camera.fov!==55){ camera.fov=55; camera.updateProjectionMatrix(); }
  camera.position.set(O.tx+Math.cos(O.pitch)*Math.sin(O.yaw)*O.dist, O.ty+Math.sin(O.pitch)*O.dist, O.tz+Math.cos(O.pitch)*Math.cos(O.yaw)*O.dist);
  camera.lookAt(O.tx,O.ty,O.tz);
}
function edFrameAll(){
  const B=docBounds(ED.doc), cx=(B.x0+B.x1)/2, cz=(B.z0+B.z1)/2, w=Math.max(4,B.x1-B.x0), d=Math.max(4,B.z1-B.z0);
  ED.pan={x:cx,z:cz}; const s=planSize(); ED.zoom=clamp(Math.min(s.w/(w+3),s.h/(d+3)),3,120);
  Object.assign(ED.orbit,{tx:cx,ty:0,tz:cz,dist:Math.max(w,d)*1.05+4}); ED.planDirty=true;
}
function edFocusSel(){ const o=selObj(); if(!o) { edFrameAll(); return; } const p=o.type==="wall"?{x:(o.a[0]+o.b[0])/2,z:(o.a[1]+o.b[1])/2}:o.type==="floor"?{x:o.x+o.w/2,z:o.z+o.d/2}:o.type==="path"?{x:o.points[0][0],z:o.points[0][1]}:{x:o.x,z:o.z};
  ED.pan={x:p.x,z:p.z}; Object.assign(ED.orbit,{tx:p.x,tz:p.z,ty:groundY(p.x,p.z),dist:Math.min(ED.orbit.dist,9)}); ED.planDirty=true; }

// ---------------------------------------------------------------- keys while building
addEventListener("keydown",e=>{
  if(MODE!=="build"||!SB.ready) return;
  const tg=e.target.tagName; if(tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT"){ if(e.code==="Escape") e.target.blur(); return; }
  if(e.code==="Space"){ spaceDown=true; }
  const ctrl=e.ctrlKey||e.metaKey;
  if(ctrl&&e.code==="KeyZ"){ e.preventDefault(); e.shiftKey?edRedo():edUndo(); return; }
  if(ctrl&&e.code==="KeyY"){ e.preventDefault(); edRedo(); return; }
  if(ctrl&&e.code==="KeyD"){ e.preventDefault(); edDuplicate(); return; }
  if(ctrl) return;
  if(e.code==="Enter"){ e.preventDefault(); playMap(e.shiftKey&&ED.cursor.ok?{x:ED.cursor.x,z:ED.cursor.z}:null); return; }
  if(e.code==="Tab"){ e.preventDefault(); edSetView(ED.view==="3d"?"plan":"3d"); return; }
  if(e.code==="Escape"){ if(ED.draft){ if(ED.draft.kind==="path") edEndChain(); else ED.draft=null; } else if(ED.sel){ ED.sel=null; ED.selOp=null; edRenderInspector(); edUpdateSelBox(); } else edSetTool("select"); ED.planDirty=true; return; }
  if(e.code==="Delete"||e.code==="Backspace"){ e.preventDefault(); edDelete(); return; }
  if(e.code==="KeyQ"||e.code==="KeyE"){ edRotate((e.code==="KeyQ"?1:-1)*(e.shiftKey?90:15)); return; }
  if(e.code==="KeyH"&&!e.repeat){ edFocusSel(); return; }
  if(e.code.startsWith("Arrow")&&ED.sel){ e.preventDefault(); const o=selObj(); if(!o) return; edSnapshot(); const st=ED.snap||0.05, dx=e.code==="ArrowLeft"?-st:e.code==="ArrowRight"?st:0, dz=e.code==="ArrowUp"?-st:e.code==="ArrowDown"?st:0; edShift(o,sbClone(o),dx,dz); edChanged({inspector:true}); return; }
  const tl=TOOLS.find(t=>"Key"+t[2]===e.code); if(tl&&!e.repeat){ edSetTool(tl[0]); }
});
addEventListener("keyup",e=>{ if(e.code==="Space") spaceDown=false; });
function edDelete(){
  const o=selObj(); if(!o) return; edSnapshot();
  if(ED.selOp&&o.type==="wall"){ o.openings=o.openings.filter(op=>op.id!==ED.selOp); ED.selOp=null; edChanged({inspector:true}); return; }
  ED.doc.objects=ED.doc.objects.filter(x=>x!==o); ED.sel=null; edChanged({inspector:true}); edUpdateSelBox();
}
function edDuplicate(){ const o=selObj(); if(!o||o.type==="spawn") return; edSnapshot(); const c=sbClone(o); c.id=sbUid(o.type[0]); if(c.openings) for(const op of c.openings) op.id=sbUid("o"); edShift(c,sbClone(c),1,1); ED.doc.objects.push(c); ED.sel=c.id; edChanged({inspector:true}); }
function edRotate(deg){
  const o=selObj();
  if(!o){ if(ED.tool==="prop"){ ED.opts.prop.rot=((ED.opts.prop.rot+deg)%360+360)%360; ED.planDirty=true; edRenderInspector(); } return; }
  edSnapshot();
  if(o.type==="prop") o.rot=((o.rot||0)+deg+360)%360;
  else if(["spawn","enemy","corpse","item"].includes(o.type)) o.yaw=((o.yaw||0)+deg+360)%360;
  else if(o.type==="block"&&Math.abs(deg)>=90){ const t=o.w; o.w=o.d; o.d=t; }
  else if(o.type==="camera"&&o.look){ const a=Math.atan2(o.look[0]-o.x,o.look[2]-o.z)+deg*D2R, r=Math.hypot(o.look[0]-o.x,o.look[2]-o.z); o.look=[+(o.x+Math.sin(a)*r).toFixed(2),o.look[1],+(o.z+Math.cos(a)*r).toFixed(2)]; }
  else if(o.type==="wall"){ const mx=(o.a[0]+o.b[0])/2, mz=(o.a[1]+o.b[1])/2, c=Math.cos(deg*D2R), s=Math.sin(deg*D2R); const rot=q=>[+(mx+(q[0]-mx)*c-(q[1]-mz)*s).toFixed(3),+(mz+(q[0]-mx)*s+(q[1]-mz)*c).toFixed(3)]; o.a=rot(o.a); o.b=rot(o.b); }
  edChanged({inspector:true});
}

// ---------------------------------------------------------------- the side panel
const H=(tag,attrs={},kids=[])=>{ const e=document.createElement(tag); for(const k in attrs){ const v=attrs[k]; if(k==="text") e.textContent=v; else if(k==="html") e.innerHTML=v; else if(k.startsWith("on")) e[k]=v; else if(k==="class") e.className=v; else if(v!==false&&v!=null) e.setAttribute(k,v===true?"":v); } for(const c of [].concat(kids)) if(c) e.appendChild(typeof c==="string"?document.createTextNode(c):c); return e; };
let fid=0; const nid=()=>"f"+(++fid);
function fRow(label, input, hint){ if(/texture|Other side/i.test(label)) return H("div",{hidden:true}); const id=input.id||(input.id=nid()); return H("div",{class:"frow"},[H("label",{for:id,text:label}),input,hint?H("small",{class:"fhint",text:hint}):null]); }
function fNum(o,k,opt={}){ const i=H("input",{type:"number",step:opt.step??0.1,min:opt.min,max:opt.max,value:o[k]??""}); if(opt.ph) i.placeholder=opt.ph;
  i.oninput=()=>{ const v=i.value===""?(opt.blank??""):parseFloat(i.value); if(i.value!==""&&!isFinite(v)) return; o[k]=v; (opt.on||(()=>edChanged()))(v); }; return i; }
function fText(o,k,opt={}){ const i=H(opt.area?"textarea":"input",{type:"text",placeholder:opt.ph||""}); i.value=o[k]??""; if(opt.list) i.setAttribute("list",opt.list); i.oninput=()=>{ o[k]=i.value; (opt.on||(()=>edChanged({noRebuild:opt.noRebuild})))(i.value); }; return i; }
function fColor(o,k,opt={}){ const i=H("input",{type:"color"}); i.value=hexStr(o[k]); i.oninput=()=>{ o[k]=i.value; (opt.on||(()=>edChanged()))(i.value); }; return i; }
function fCheck(o,k,label,opt={}){ const i=H("input",{type:"checkbox"}); i.checked=!!o[k]; i.onchange=()=>{ o[k]=i.checked; (opt.on||(()=>edChanged({inspector:opt.re})))(i.checked); }; return H("label",{class:"fchk"},[i,label]); }
function fSelect(o,k,options,opt={}){ const s=H("select"); for(const opt of options){ if(!Array.isArray(opt)){ const g=H("optgroup",{label:opt.group}); for(const [vv,tt] of opt.items){ g.appendChild(H("option",{value:vv,text:tt})); } s.appendChild(g); continue; } s.appendChild(H("option",{value:opt[0],text:opt[1]})); } s.value=String(o[k]??"");
  s.onchange=()=>{ o[k]=opt.num?+s.value:s.value; (opt.on||(()=>edChanged({inspector:opt.re})))(s.value); }; return s; }
function fBtns(list){ return H("div",{class:"fbtns"},list.map(([t,f,cls])=>H("button",{class:"btn small"+(cls?" "+cls:""),text:t,onclick:e=>{ e.currentTarget.blur(); f(e); }}))); }
function fConfirm(text, f){ const b=H("button",{class:"btn small danger",text}); let armed=0; b.onclick=()=>{ if(armed&&Date.now()-armed<3000){ armed=0; b.textContent=text; f(); } else { armed=Date.now(); b.textContent="Click again to confirm"; setTimeout(()=>{ if(armed){ armed=0; b.textContent=text; } },3000); } }; return b; }
function fHead(t,sub){ return H("div",{class:"fhead"},[H("h3",{text:t}),sub?H("p",{class:"muted",text:sub}):null]); }
const enemyOptions=()=>[["across","Random ACROSS"],{group:"ACROSS subclasses",items:VARIANTS.map(v=>["across:"+v.key,v.name])},["across_legless","Legless crawler"],["brute","Louis (Brute)"],["runner","Runner (BCROSS)"],["dummy","Training dummy"]];
const startOptions=[["hunting","Hunting Norah"],["wander","Wandering (unaware)"],["stand","Standing still"],["feed","Feeding"],["playdead","Playing dead"],["lurk","Lurking"]];
function assetOptions(){ const cats={}; for(const a of sbAssetList()) (cats[a.cat||"other"]=cats[a.cat||"other"]||[]).push([a.id,a.name]); return Object.entries(cats).map(([c,items])=>({group:c,items})); }

function edRenderSide(){ edRenderInspector(); edRenderAssets(); edRenderMap(); edRenderFiles(); }
function edRenderInspector(){
  const P=$("pane-inspect"); if(!P) return; P.innerHTML=""; const o=selObj();
  if(!o){ edToolOptions(P); return; }
  const re=()=>edRenderInspector();
  const head={wall:"Wall",floor:"Floor",block:"Block",pillar:"Pillar",prop:"Furniture",item:"Item on the floor",exit:"Exit",light:"Light",camera:"Fixed camera",spawn:"Norah's start",enemy:"Enemy",corpse:"Body",path:"Path"}[o.type]||o.type;
  P.appendChild(fHead(head, o.type==="prop"?(sbAsset(o.asset)||{}).name:null));
  const pos=()=>{ P.appendChild(fRow("X",fNum(o,"x",{step:0.05}))); P.appendChild(fRow("Z",fNum(o,"z",{step:0.05}))); };
  switch(o.type){
    case "wall": {
      P.appendChild(fRow("Start X / Z",H("div",{class:"pair"},[fNum(o.a,0,{step:0.05}),fNum(o.a,1,{step:0.05})]))); P.appendChild(fRow("End X / Z",H("div",{class:"pair"},[fNum(o.b,0,{step:0.05}),fNum(o.b,1,{step:0.05})])));
      P.appendChild(fRow("Length",H("span",{class:"val",text:Math.hypot(o.b[0]-o.a[0],o.b[1]-o.a[1]).toFixed(2)+" m"})));
      P.appendChild(fRow("Height (m)",fNum(o,"height",{step:0.1,min:0.2}))); P.appendChild(fRow("Thickness",fNum(o,"thick",{step:0.02,min:0.04})));
      P.appendChild(fCheck(o,"weak","Louis can smash through it")); P.appendChild(fRow("Colour",fColor(o,"color"))); P.appendChild(fRow("Texture",fSelect(o,"tex",sbTexOptions()))); P.appendChild(fRow("Other side",fSelect(o,"texB",sbTexOptions("(same)"))));
      P.appendChild(H("div",{class:"label",text:"Doors, windows and openings"}));
      const L=Math.hypot(o.b[0]-o.a[0],o.b[1]-o.a[1]);
      if(!o.openings.length) P.appendChild(H("p",{class:"muted",text:"None. Use the Door, Window or Opening tool and click on this wall."}));
      for(const op of o.openings){ const box=H("div",{class:"card"+(op.id===ED.selOp?" on":"")}); box.onclick=e=>{ if(ED.selOp!==op.id){ ED.selOp=op.id; ED.planDirty=true; box.classList.add("on"); } };
        box.appendChild(fRow("Kind",fSelect(op,"kind",[["door","Door"],["window","Window"],["gap","Open doorway"]],{re:true})));
        box.appendChild(fRow("Along wall (m)",fNum(op,"at",{step:0.05,min:0,max:L}))); box.appendChild(fRow("Width",fNum(op,"width",{step:0.05,min:0.3})));
        if(op.kind==="window"){ box.appendChild(fRow("Sill height",fNum(op,"sill",{step:0.05}))); box.appendChild(fRow("Top",fNum(op,"top",{step:0.05}))); }
        if(op.kind==="door"){ box.appendChild(fCheck(op,"closed","Starts closed")); box.appendChild(fCheck(op,"locked","Locked",{re:true}));
          if(op.locked) box.appendChild(fRow("Key that opens it",fText(op,"key",{ph:"e.g. Clinic key",list:"keyNames"}),"Put an item with this exact name in a container or on the floor. Louis can still smash it."));
          box.appendChild(fRow("Swings",fSelect(op,"side",[["1","One way"],["-1","The other way"]],{num:true}))); }
        box.appendChild(fBtns([["Remove",()=>{ edSnapshot(); o.openings=o.openings.filter(x=>x!==op); ED.selOp=null; edChanged({inspector:true}); },"danger"]]));
        P.appendChild(box); }
      break; }
    case "floor": pos(); P.appendChild(fRow("Width",fNum(o,"w",{step:0.25,min:0.2}))); P.appendChild(fRow("Depth",fNum(o,"d",{step:0.25,min:0.2})));
      P.appendChild(fRow("Height (m)",fNum(o,"y",{step:0.05}),"Characters stand at this height anywhere on this floor."));
      P.appendChild(fBtns([["Match the ground under it",()=>{ if(!ED.doc.terrain||!ED.doc.terrain.on) return; edSnapshot(); o.y=+tSample(ED.doc.terrain,o.x+o.w/2,o.z+o.d/2).toFixed(2); edChanged({inspector:true}); }],["Flatten the ground to it",()=>{ const T=ED.doc.terrain; if(!T||!T.on) return; edSnapshot(); tEach(T,o.x+o.w/2,o.z+o.d/2,Math.hypot(o.w,o.d)/2+2,(k,d,x,z)=>{ const inside=x>=o.x-1&&x<=o.x+o.w+1&&z>=o.z-1&&z<=o.z+o.d+1; if(inside) T.h[k]=+o.y||0; }); edChanged({terrain:true}); }]]));
      P.appendChild(fRow("Texture",fSelect(o,"tex",sbTexOptions("(two-tone check)")))); P.appendChild(fRow("Texture size",fNum(o,"scale",{step:0.25,min:0.25,ph:"1"}))); P.appendChild(fRow("Colours",H("div",{class:"pair"},[fColor(o,"colA"),fColor(o,"colB")]))); break;
    case "block": pos(); P.appendChild(fRow("Width",fNum(o,"w",{step:0.05,min:0.1}))); P.appendChild(fRow("Depth",fNum(o,"d",{step:0.05,min:0.1}))); P.appendChild(fRow("Height",fNum(o,"h",{step:0.05,min:0.05}),"0.35–1.3 m can be vaulted (Space)."));
      P.appendChild(fRow("Name",fText(o,"name",{ph:"crate"}))); P.appendChild(fRow("Colour",fColor(o,"color"))); P.appendChild(fRow("Texture",fSelect(o,"tex",sbTexOptions()))); P.appendChild(fCheck(o,"push","Can be pushed (E)"));
      edContainerUI(P,o); break;
    case "pillar": pos(); P.appendChild(fRow("Radius",fNum(o,"r",{step:0.05,min:0.05}))); P.appendChild(fRow("Height",fNum(o,"h",{step:0.1}))); P.appendChild(fRow("Colour",fColor(o,"color"))); break;
    case "prop": { pos(); P.appendChild(fRow("Model",fSelect(o,"asset",assetOptions(),{re:true})));
      P.appendChild(fRow("Turn (°)",fNum(o,"rot",{step:15}),"Q / E turn it in 15° steps (Shift: 90°).")); P.appendChild(fRow("Size ×",fNum(o,"scale",{step:0.05,min:0.05})));
      const det=H("details",{},[H("summary",{text:"Stretch, lift"})]); det.appendChild(fRow("Stretch X / Y / Z",H("div",{class:"trio"},[fNum(o,"sx",{step:0.05,ph:"1"}),fNum(o,"sy",{step:0.05,ph:"1"}),fNum(o,"sz",{step:0.05,ph:"1"})]))); det.appendChild(fRow("Lift (m)",fNum(o,"y",{step:0.05,ph:"0"}),"Raise it off the ground, onto a table or shelf.")); P.appendChild(det);
      P.appendChild(fRow("Blocks movement",fSelect(o,"solid",[["auto","Automatic (by size)"],["true","Yes"],["false","No (walk through)"]],{on:v=>{ o.solid=v==="auto"?"auto":v==="true"; edChanged(); }})));
      P.appendChild(fRow("Can be pushed",fSelect(o,"push",[["auto","Automatic"],["true","Yes"],["false","No"]],{on:v=>{ o.push=v==="auto"?"auto":v==="true"; edChanged(); }})));
      const a=sbAsset(o.asset); if(a&&a.light) P.appendChild(fCheck({on:o.light!==false},"on","Its lamp is lit",{on:v=>{ o.light=v; edChanged(); }}));
      P.appendChild(fRow("Name in game",fText(o,"name",{ph:a?a.name.split(/[,(]/)[0].toLowerCase():""}),"Shown as \"E: search the …\"."));
      edContainerUI(P,o); break; }
    case "item": pos(); edEntryFields(P,o); break;
    case "exit": pos(); P.appendChild(fRow("Radius",fNum(o,"r",{step:0.1,min:0.3}))); P.appendChild(fRow("Needs item",fText(o,"needs",{ph:"nothing",list:"keyNames"}),"Name of an item Norah must carry, e.g. Car keys. Leave empty for an open exit.")); P.appendChild(fRow("Label",fText(o,"label",{ph:"the exit",noRebuild:true}))); break;
    case "light": pos(); P.appendChild(fRow("Height (m)",fNum(o,"y",{step:0.1}))); P.appendChild(fRow("Colour",fColor(o,"color"))); P.appendChild(fRow("Brightness",fNum(o,"intensity",{step:0.1,min:0}))); P.appendChild(fRow("Reach (m)",fNum(o,"dist",{step:0.5,min:0.5}))); break;
    case "camera": pos(); P.appendChild(fRow("Height (m)",fNum(o,"y",{step:0.1}))); P.appendChild(fRow("Field of view",fNum(o,"fov",{step:1,min:20,max:120}))); P.appendChild(fCheck(o,"track","Turns to follow Norah"));
      P.appendChild(fRow("Looks at X / Y / Z",H("div",{class:"trio"},[fNum(o.look,0,{step:0.1}),fNum(o.look,1,{step:0.1}),fNum(o.look,2,{step:0.1})])));
      P.appendChild(fBtns([["Look through it (3D)",()=>{ edSetView("3d"); ED.preview=o.id; }]])); P.appendChild(H("p",{class:"muted",text:"Fixed cameras are used when Camera / controls in the play panel is set to a fixed-camera mode. Drag on the map while placing to aim."})); break;
    case "spawn": pos(); P.appendChild(fRow("Facing (°)",fNum(o,"yaw",{step:15}))); P.appendChild(H("p",{class:"muted",text:"Starting health, ammo and items are on the MAP tab."})); break;
    case "enemy": { pos(); P.appendChild(fRow("Type",fSelect(o,"kind",enemyOptions(),{re:true}))); P.appendChild(fRow("Starts",fSelect(o,"start",startOptions))); if(String(o.kind||"").startsWith("across")) P.appendChild(fRow("Moves",fSelect(o,"move",[["","Auto: by health, some start slower"],["marionette","Marionette (healthy)"],["lurcher","Lurcher"],["puller","Puller"]])));
      P.appendChild(fRow("Facing (°)",fNum(o,"yaw",{step:15}))); P.appendChild(fRow("Health ×",fNum(o,"hpMul",{step:0.1,min:0.1}))); P.appendChild(fRow("Speed ×",fNum(o,"speedMul",{step:0.1,min:0.1})));
      const v=(o.kind||"").startsWith("across:")?VMAP[o.kind.slice(7)]:null; if(v) P.appendChild(H("p",{class:"muted",text:v.fights})); break; }
    case "corpse": pos(); P.appendChild(fRow("Turn (°)",fNum(o,"yaw",{step:15}))); break;
    case "path": P.appendChild(fRow("Width",fNum(o,"width",{step:0.1,min:0.2}))); P.appendChild(fRow("Texture",fSelect(o,"tex",sbTexOptions()))); P.appendChild(fRow("Colour",fColor(o,"color"))); P.appendChild(H("p",{class:"muted",text:`${(o.points||[]).length} points. Paths are flat: flatten the terrain under them for roads.`})); break;
  }
  P.appendChild(fBtns([["Duplicate (Ctrl+D)",edDuplicate],["Deselect (Esc)",()=>{ ED.sel=null; edRenderInspector(); edUpdateSelBox(); ED.planDirty=true; }]]));
  P.appendChild(H("div",{class:"fbtns"},[fConfirm("Delete",edDelete)]));
}
function edEntryFields(P,e){
  P.appendChild(fRow("Item",fSelect(e,"item",itemOptions(),{re:true})));
  const d=itemDef(e.item); P.appendChild(fRow(e.item==="ammo"?"Rounds":"How many",fNum(e,"qty",{step:1,min:1})));
  if(["key","note","custom","truck_keys","house_keys"].includes(e.item)||d.cat==="key"||d.cat==="document") P.appendChild(fRow("Name",fText(e,"name",{ph:d.name})));
  if(d.cat==="document"||e.item==="custom") P.appendChild(fRow("Text",fText(e,"text",{area:true,ph:d.desc})));
  P.appendChild(H("p",{class:"muted",text:d.desc}));
}
function edContainerUI(P,o){
  P.appendChild(H("div",{class:"label",text:"Searchable"}));
  P.appendChild(fCheck(o,"search","Norah can search it (E) and take what's inside",{on:v=>{ if(v&&!o.items) o.items=[]; edChanged({inspector:true}); }}));
  if(!o.search) return; o.items=o.items||[];
  const box=H("div",{class:"card"});
  if(!o.items.length) box.appendChild(H("p",{class:"muted",text:"Empty. Searching it still takes time and makes noise."}));
  o.items.forEach((e,i)=>{ const row=H("div",{class:"entry"});
    row.appendChild(fSelect(e,"item",itemOptions(),{re:true})); row.appendChild(fNum(e,"qty",{step:1,min:1}));
    row.appendChild(H("button",{class:"btn small danger",text:"×",title:"Remove",onclick:()=>{ edSnapshot(); o.items.splice(i,1); edChanged({inspector:true}); }}));
    const d=itemDef(e.item); if(d.cat==="key"||d.cat==="document"||e.item==="custom"){ const sub=H("div",{class:"entrySub"}); sub.appendChild(fText(e,"name",{ph:"Name: "+d.name,list:d.cat==="key"?"keyNames":null})); if(d.cat==="document"||e.item==="custom") sub.appendChild(fText(e,"text",{area:true,ph:"What it says"})); row.appendChild(sub); }
    box.appendChild(row); });
  const add={item:"ammo"}; const sel=fSelect(add,"item",itemOptions(),{on:()=>{}});
  box.appendChild(H("div",{class:"entry"},[sel,H("button",{class:"btn small",text:"Add",onclick:()=>{ edSnapshot(); const d=ITEMS[add.item]; o.items.push({item:add.item,qty:d&&d.qty?d.qty:1,name:"",text:""}); edChanged({inspector:true}); }})]));
  box.appendChild(fBtns([["Random loot",()=>{ edSnapshot(); const n=1+Math.floor(Math.random()*2); o.items=[]; for(let i=0;i<n;i++){ const [k,q]=LOOT[Math.floor(Math.random()*LOOT.length)]; o.items.push({item:k,qty:q,name:"",text:""}); } edChanged({inspector:true}); }],["Empty it",()=>{ edSnapshot(); o.items=[]; edChanged({inspector:true}); }]]));
  P.appendChild(box);
}
function edToolOptions(P){
  const t=ED.tool, O=ED.opts[t]||{}, tl=TOOLS.find(x=>x[0]===t);
  P.appendChild(fHead(tl?tl[1]+" tool":"", HINTS[t]));
  const re=()=>edRenderInspector(), nop=()=>{ ED.planDirty=true; };
  switch(t){
    case "select": P.appendChild(H("p",{class:"muted",html:"Nothing selected. Click something in the plan or the 3D view.<br><br><b>Plan:</b> drag empty space or right-drag to pan, wheel to zoom.<br><b>3D:</b> drag empty space or right-drag to orbit, middle-drag (or Shift+right-drag) to pan, wheel to zoom.<br><b>Tab</b> switches views · <b>Enter</b> plays from Norah's start · <b>Shift+Enter</b> plays from the cursor · <b>H</b> centres on the selection."})); break;
    case "wall": case "room": P.appendChild(fRow("Wall height",fNum(ED.opts.wall,"height",{step:0.1,on:nop}))); P.appendChild(fRow("Thickness",fNum(ED.opts.wall,"thick",{step:0.02,on:nop}))); P.appendChild(fRow("Colour",fColor(ED.opts.wall,"color",{on:nop}))); P.appendChild(fRow("Texture",fSelect(ED.opts.wall,"tex",sbTexOptions(),{on:nop})));
      if(t==="room") P.appendChild(fRow("Floor texture",fSelect(ED.opts.floor,"tex",sbTexOptions("(two-tone check)"),{on:nop}))); break;
    case "floor": P.appendChild(fRow("Texture",fSelect(O,"tex",sbTexOptions("(two-tone check)"),{on:nop}))); P.appendChild(fRow("Colours",H("div",{class:"pair"},[fColor(O,"colA",{on:nop}),fColor(O,"colB",{on:nop})]))); break;
    case "door": P.appendChild(fRow("Width",fNum(O,"width",{step:0.05,on:nop}))); P.appendChild(fCheck(O,"closed","Starts closed",{on:nop})); P.appendChild(fCheck(O,"locked","Locked",{on:re})); if(O.locked) P.appendChild(fRow("Key name",fText(O,"key",{ph:"e.g. Clinic key",list:"keyNames",on:nop}))); break;
    case "window": P.appendChild(fRow("Width",fNum(O,"width",{step:0.05,on:nop}))); P.appendChild(fRow("Sill",fNum(O,"sill",{step:0.05,on:nop}))); P.appendChild(fRow("Top",fNum(O,"top",{step:0.05,on:nop}))); P.appendChild(H("p",{class:"muted",text:"ACROSS that are hunting smash through windows."})); break;
    case "gap": P.appendChild(fRow("Width",fNum(O,"width",{step:0.05,on:nop}))); break;
    case "block": P.appendChild(fRow("Height",fNum(O,"h",{step:0.05,on:nop}))); P.appendChild(fRow("Name",fText(O,"name",{on:nop}))); P.appendChild(fRow("Colour",fColor(O,"color",{on:nop}))); P.appendChild(fRow("Texture",fSelect(O,"tex",sbTexOptions(),{on:nop}))); P.appendChild(fCheck(O,"push","Can be pushed",{on:nop})); P.appendChild(fCheck(O,"search","Searchable",{on:nop})); break;
    case "pillar": P.appendChild(fRow("Radius",fNum(O,"r",{step:0.05,on:nop}))); P.appendChild(fRow("Height",fNum(O,"h",{step:0.1,on:nop}))); P.appendChild(fRow("Colour",fColor(O,"color",{on:nop}))); break;
    case "prop": { const a=sbAsset(O.asset); P.appendChild(fRow("Model",fSelect(O,"asset",assetOptions(),{on:re}))); P.appendChild(fRow("Turn (°)",fNum(O,"rot",{step:15,on:nop}))); P.appendChild(fRow("Size ×",fNum(O,"scale",{step:0.05,on:nop})));
      if(a&&a.search) P.appendChild(H("p",{class:"muted",text:"This model is searchable by default. Select it after placing to put items inside."}));
      P.appendChild(fBtns([["Browse the library",()=>edSetTab("assets")]])); break; }
    case "terrain": {
      const T=ED.doc.terrain; if(!T||!T.on) P.appendChild(H("p",{class:"muted",text:"This map has no terrain yet. The first stroke switches it on, sized to fit the map. Set its size on the MAP tab."}));
      P.appendChild(fRow("Brush",fSelect(O,"mode",[["raise","Raise"],["lower","Lower"],["smooth","Smooth"],["flatten","Flatten (to where you start)"],["noise","Roughen"]],{on:re})));
      P.appendChild(fRow("Radius (m)",fNum(O,"radius",{step:0.5,min:0.5,max:30,on:nop}))); P.appendChild(fRow("Strength",fNum(O,"strength",{step:0.1,min:0.05,max:3,on:nop})));
      if(O.mode==="paint"){ const sw=H("div",{class:"swatches"}); GROUND.forEach((gr,i)=>{ sw.appendChild(H("button",{class:"sw","aria-pressed":String(+O.paint===i),title:gr.name,style:`background:${gr.c}`,onclick:()=>{ O.paint=i; re(); }})); }); P.appendChild(sw); P.appendChild(H("p",{class:"muted",text:GROUND[O.paint].name})); }
      P.appendChild(H("p",{class:"muted",text:"Floors keep their own height; use a floor's \"Flatten the ground to it\" to seat a building. Hills block bullets."})); break; }
    case "enemy": P.appendChild(fRow("Type",fSelect(O,"kind",enemyOptions(),{on:re}))); P.appendChild(fRow("Starts",fSelect(O,"start",startOptions,{on:nop}))); { const v=O.kind.startsWith("across:")?VMAP[O.kind.slice(7)]:null; if(v) P.appendChild(H("p",{class:"muted",text:v.moves+" "+v.fights})); } break;
    case "item": edEntryFields(P,O); break;
    case "exit": P.appendChild(fRow("Radius",fNum(O,"r",{step:0.1,on:nop}))); P.appendChild(fRow("Needs item",fText(O,"needs",{ph:"nothing",list:"keyNames",on:nop}))); break;
    case "light": P.appendChild(fRow("Colour",fColor(O,"color",{on:nop}))); P.appendChild(fRow("Brightness",fNum(O,"intensity",{step:0.1,on:nop}))); P.appendChild(fRow("Reach (m)",fNum(O,"dist",{step:0.5,on:nop}))); P.appendChild(fRow("Height above ground",fNum(O,"height",{step:0.1,on:nop}))); P.appendChild(H("p",{class:"muted",text:`Up to ${SB_MAXLIGHTS} lights are lit in play (lamps count). Light makes Norah easier to see.`})); break;
    case "camera": P.appendChild(fRow("Height above ground",fNum(O,"height",{step:0.1,on:nop}))); P.appendChild(fRow("Field of view",fNum(O,"fov",{step:1,on:nop}))); P.appendChild(fCheck(O,"track","Turns to follow Norah",{on:nop})); break;
    case "path": P.appendChild(fRow("Width",fNum(O,"width",{step:0.1,on:nop}))); P.appendChild(fRow("Texture",fSelect(O,"tex",sbTexOptions(),{on:nop}))); P.appendChild(fRow("Colour",fColor(O,"color",{on:nop}))); break;
  }
}
// ASSETS tab
let thumbR=null, thumbScene=null, thumbCam=null; const thumbQ=[]; let thumbBusy=false;
function edThumbAsync(id, done){ if(ED.thumbs[id]){ done&&done(); return; } thumbQ.push([id,done]); if(!thumbBusy) edThumbPump(); }
function edThumbPump(){ thumbBusy=true; const job=thumbQ.shift(); if(!job){ thumbBusy=false; return; } const [id,done]=job; if(!ED.thumbs[id]){ try{ ED.thumbs[id]=edThumb(id); }catch(e){ ED.thumbs[id]=""; } } done&&done(); setTimeout(edThumbPump,0); }
function edThumb(id){
  if(!thumbR){ const c=document.createElement("canvas"); c.width=128; c.height=96; thumbR=new THREE.WebGLRenderer({canvas:c,antialias:true,preserveDrawingBuffer:true}); thumbR.setSize(128,96,false); thumbScene=new THREE.Scene(); thumbScene.background=new THREE.Color(0x101312);
    thumbScene.add(new THREE.HemisphereLight(0xdde4f0,0x302820,1.0)); const dl=new THREE.DirectionalLight(0xffffff,0.6); dl.position.set(2,4,3); thumbScene.add(dl); thumbCam=new THREE.PerspectiveCamera(35,128/96,0.01,200); }
  const g=sbAssetGroup(id); thumbScene.add(g); const B=sbAssetBounds(id); const cx=(B.minX+B.maxX)/2, cy=(B.minY+B.maxY)/2, cz=(B.minZ+B.maxZ)/2; const r=Math.max(0.2,Math.hypot(B.maxX-B.minX,B.maxY-B.minY,B.maxZ-B.minZ)/2);
  thumbCam.position.set(cx+r*1.5,cy+r*1.1,cz+r*2.1); thumbCam.lookAt(cx,cy,cz); thumbR.render(thumbScene,thumbCam); const url=thumbR.domElement.toDataURL(); thumbScene.remove(g); g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); return url;
}
function edRenderAssets(){
  const P=$("pane-assets"); if(!P) return; P.innerHTML="";
  P.appendChild(fHead("Furniture & props",`${Object.keys(LIB_ASSETS).length} pieces, each a grey box the size of the real thing. Click one, then click on the map to place it. SEARCH marks pieces that are searchable by default.`));
  const cats=["all",...new Set(sbAssetList().map(a=>a.cat||"other"))];
  const q=H("input",{type:"search",placeholder:"Search: bed, crate, pew…",value:ED.assetQ}); q.oninput=()=>{ ED.assetQ=q.value; fill(); };
  const cs=H("select"); for(const c of cats) cs.appendChild(H("option",{value:c,text:c==="all"?"All folders":c})); cs.value=ED.assetCat; cs.onchange=()=>{ ED.assetCat=cs.value; fill(); };
  P.appendChild(H("div",{class:"pair"},[q,cs])); const grid=H("div",{class:"lib"}); P.appendChild(grid);
  const io=new IntersectionObserver(ents=>{ for(const en of ents) if(en.isIntersecting){ const im=en.target; io.unobserve(im); edThumbAsync(im.dataset.id,()=>{ im.src=ED.thumbs[im.dataset.id]||""; }); } },{root:P});
  function fill(){ grid.innerHTML=""; const qq=ED.assetQ.trim().toLowerCase();
    for(const a of sbAssetList()){ if(ED.assetCat!=="all"&&(a.cat||"other")!==ED.assetCat) continue; if(qq&&!(a.name.toLowerCase().includes(qq)||a.id.includes(qq))) continue;
      const B=sbAssetBounds(a.id), im=H("small",{class:"dims",text:`${(B.maxX-B.minX).toFixed(1)} × ${(B.maxZ-B.minZ).toFixed(1)} × ${B.maxY.toFixed(1)} m`});
      const b=H("button",{class:"libitem","aria-pressed":String(ED.opts.prop.asset===a.id&&ED.tool==="prop"),title:a.name,onclick:()=>{ ED.opts.prop.asset=a.id; edSetTool("prop"); fill(); }},[im,H("span",{text:a.name}),a.search?H("small",{class:"tag",text:"SEARCH"}):null]);
      grid.appendChild(b); } }
  fill();
}
// MAP tab
function edRenderMap(){
  const P=$("pane-map"); if(!P) return; P.innerHTML=""; const d=ED.doc, E=d.env, st=d.start;
  P.appendChild(fHead("This map"));
  P.appendChild(fRow("Name",fText(d,"name",{noRebuild:true,on:v=>{ $("edName").value=v; edChanged({noRebuild:true}); }})));
  P.appendChild(fRow("Opening note",fText(d,"note",{area:true,ph:"Shown in the log when play starts",noRebuild:true})));
  P.appendChild(fRow("Goal",fSelect(d,"win",[["either","Clear every enemy or reach an exit"],["exit","Reach an exit"],["kill","Clear every enemy"],["none","Sandbox (never ends)"]],{on:()=>edChanged({noRebuild:true})})));
  P.appendChild(H("div",{class:"label",text:"Norah starts with"}));
  P.appendChild(fRow("Health",fNum(st,"hp",{step:5,min:1,ph:`${CFG.norah.hp} (panel)`,on:()=>edChanged({noRebuild:true})})));
  P.appendChild(fRow("Loaded / spare",H("div",{class:"pair"},[fNum(st,"rounds",{step:1,min:0,ph:String(CFG.rev.chambers),on:()=>edChanged({noRebuild:true})}),fNum(st,"spare",{step:1,min:0,ph:String(CFG.rev.spare),on:()=>edChanged({noRebuild:true})})]),"Empty uses the play panel's revolver settings."));
  const sbox=H("div",{class:"card"}); const so={search:true,items:st.items}; st.items.forEach((e,i)=>{ const row=H("div",{class:"entry"}); row.appendChild(fSelect(e,"item",itemOptions(),{on:()=>edChanged({noRebuild:true,inspector:false})})); row.appendChild(fNum(e,"qty",{step:1,min:1,on:()=>edChanged({noRebuild:true})})); row.appendChild(H("button",{class:"btn small danger",text:"×",onclick:()=>{ edSnapshot(); st.items.splice(i,1); edChanged({noRebuild:true}); edRenderMap(); }})); const dd=itemDef(e.item); if(dd.cat==="key"||dd.cat==="document") row.appendChild(H("div",{class:"entrySub"},[fText(e,"name",{ph:"Name: "+dd.name,noRebuild:true})])); sbox.appendChild(row); });
  const add={item:"flashlight"}; sbox.appendChild(H("div",{class:"entry"},[fSelect(add,"item",itemOptions(),{on:()=>{}}),H("button",{class:"btn small",text:"Add",onclick:()=>{ edSnapshot(); const dd=ITEMS[add.item]; st.items.push({item:add.item,qty:dd&&dd.qty?dd.qty:1,name:"",text:""}); edChanged({noRebuild:true}); edRenderMap(); }})]));
  P.appendChild(sbox); P.appendChild(fCheck(st,"flashOn","Flashlight on at the start",{on:()=>edChanged({noRebuild:true})}));
  P.appendChild(H("div",{class:"label",text:"Sky, fog and light"}));
  P.appendChild(fRow("Sky",fColor(E,"sky"))); P.appendChild(fRow("Fog colour",fColor(E,"fogColor",{on:()=>edChanged()}))); P.appendChild(fRow("Fog thickness",fNum(E,"fog",{step:0.005,min:0,max:0.3}),"Build view hides fog unless Fog is ticked above the view."));
  P.appendChild(fRow("Sky light",fNum(E,"hemi",{step:0.05,min:0}))); P.appendChild(fRow("Moonlight",fNum(E,"moon",{step:0.05,min:0})));
  P.appendChild(fRow("Darkness for stealth",fNum(E,"dark",{step:0.01,min:0,max:1,ph:"panel ("+CFG.stealth.ambient+")",blank:""}),"How visible Norah is in unlit places: 0 is pitch black, 0.6 is broad daylight."));
  P.appendChild(fCheck(E,"fill","Add a soft fill light over the whole map"));
  P.appendChild(H("div",{class:"label",text:"Terrain"}));
  const T=d.terrain;
  if(!T||!T.on){ P.appendChild(H("p",{class:"muted",text:"Off. Characters walk on flat ground at height 0, or on floors."})); P.appendChild(fBtns([["Add terrain sized to the map",()=>{ edSnapshot(); edEnsureTerrain(); edChanged({terrain:true}); edRenderMap(); }]])); }
  else {
    const t2={x0:T.x0,z0:T.z0,w:(T.nx-1)*T.cell,d:(T.nz-1)*T.cell,cell:T.cell};
    P.appendChild(fRow("Corner X / Z",H("div",{class:"pair"},[fNum(t2,"x0",{step:1,on:()=>{}}),fNum(t2,"z0",{step:1,on:()=>{}})])));
    P.appendChild(fRow("Size W / D (m)",H("div",{class:"pair"},[fNum(t2,"w",{step:2,min:4,on:()=>{}}),fNum(t2,"d",{step:2,min:4,on:()=>{}})])));
    P.appendChild(fRow("Grid cell",fSelect(t2,"cell",[["0.5","0.5 m (fine)"],["1","1 m"],["2","2 m (big maps)"]],{num:true,on:()=>{}})));
    P.appendChild(fBtns([["Apply size",()=>{ edSnapshot(); d.terrain=edResizeTerrain(T,+t2.x0,+t2.z0,+t2.w,+t2.d,+t2.cell); edChanged({terrain:true,now:true}); edRenderMap(); }],["Fit to the map",()=>{ edSnapshot(); const B=docBounds({objects:d.objects,terrain:null}); d.terrain=edResizeTerrain(T,Math.floor(B.x0-6),Math.floor(B.z0-6),Math.ceil(B.x1-B.x0+12),Math.ceil(B.z1-B.z0+12),T.cell); edChanged({terrain:true,now:true}); edRenderMap(); }]]));
    const hl={amt:1.5}; P.appendChild(fRow("Hill height",fNum(hl,"amt",{step:0.25,min:0.25,on:()=>{}})));
    P.appendChild(fBtns([["Add rolling hills",()=>{ edSnapshot(); terrainHills(T,+hl.amt); edChanged({terrain:true,now:true}); }],["Smooth all",()=>{ edSnapshot(); for(let n=0;n<2;n++){ const h=T.h.slice(); for(let j=1;j<T.nz-1;j++) for(let i=1;i<T.nx-1;i++){ const k=j*T.nx+i; h[k]=(T.h[k]*4+T.h[k-1]+T.h[k+1]+T.h[k-T.nx]+T.h[k+T.nx])/8; } T.h=h; } edChanged({terrain:true,now:true}); }],["Flatten all",()=>{ edSnapshot(); T.h.fill(0); edChanged({terrain:true,now:true}); }]]));
    const pa={p:1}; P.appendChild(fRow("Paint everything",H("div",{class:"pair"},[fSelect(pa,"p",GROUND.map((g,i)=>[String(i),g.name]),{num:true,on:()=>{}}),H("button",{class:"btn small",text:"Paint",onclick:()=>{ edSnapshot(); T.p.fill(+pa.p); edChanged({terrain:true,now:true}); }})])));
    P.appendChild(fBtns([[ "Remove terrain",()=>{ edSnapshot(); d.terrain=null; edChanged({terrain:true,now:true}); edRenderMap(); },"danger"]]));
  }
  const c={}; for(const o of d.objects) c[o.type]=(c[o.type]||0)+1;
  P.appendChild(H("p",{class:"muted",text:"In this map: "+Object.entries(c).map(([k,v])=>`${v} ${k}${v>1?"s":""}`).join(", ")}));
}
function edResizeTerrain(T,x0,z0,w,d,cell){ const N=terrainMake(x0,z0,Math.max(4,w),Math.max(4,d),cell||1,1);
  for(let j=0;j<N.nz;j++) for(let i=0;i<N.nx;i++){ const x=x0+i*N.cell, z=z0+j*N.cell, k=j*N.nx+i; if(x>=T.x0&&z>=T.z0&&x<=T.x0+(T.nx-1)*T.cell&&z<=T.z0+(T.nz-1)*T.cell){ N.h[k]=+tSample(T,x,z).toFixed(3); const oi=Math.round((x-T.x0)/T.cell), oj=Math.round((z-T.z0)/T.cell); N.p[k]=T.p[oj*T.nx+oi]??1; } }
  return N; }
// FILES tab
function edRenderFiles(){
  const P=$("pane-files"); if(!P) return; P.innerHTML="";
  P.appendChild(fHead("Start from","Opening one replaces the map you're editing. Save it below first if you want to keep it."));
  const pl=H("div",{class:"presets"}); for(const pr of PRESETS){ let armed=0; const b=H("button",{class:"preset"},[H("b",{text:pr.name}),H("span",{text:pr.desc})]);
    b.onclick=()=>{ if(!armed){ armed=Date.now(); b.classList.add("armed"); b.querySelector("span").textContent="Click again to open (replaces the current map)"; setTimeout(()=>{ armed=0; b.classList.remove("armed"); b.querySelector("span").textContent=pr.desc; },3000); return; }
      edSnapshot(); ED.doc=sbNormalize(pr.make()); ED.sel=null; edAfterLoad(true); edStatusMsg(`Opened: ${pr.name}`); }; pl.appendChild(b); }
  P.appendChild(pl);
  P.appendChild(H("div",{class:"label",text:"Saved in this browser"}));
  const maps=edMaps(); const nm={n:ED.doc.name};
  P.appendChild(H("div",{class:"pair"},[fText(nm,"n",{on:()=>{}}),H("button",{class:"btn small primary",text:"Save",onclick:()=>{ const n=(nm.n||"").trim()||ED.doc.name; const m=edMaps(); m[n]=ED.doc; try{ localStorage.setItem("crossed_sandbox_maps",JSON.stringify(m)); edStatusMsg("Saved as "+n); }catch(e){ edStatusMsg("Couldn't save: browser storage is full. Copy the map instead."); } edRenderFiles(); }})]));
  if(!Object.keys(maps).length) P.appendChild(H("p",{class:"muted",text:"Nothing saved yet. The map you're editing is kept automatically; Save keeps named copies."}));
  for(const n of Object.keys(maps)) P.appendChild(H("div",{class:"saved"},[H("span",{text:n}),H("button",{class:"btn small",text:"Open",onclick:()=>{ edSnapshot(); ED.doc=sbNormalize(sbClone(edMaps()[n])); sbAddDocTextures(ED.doc).then(()=>edAfterLoad(true)); }}),fConfirm("Delete",()=>{ const m=edMaps(); delete m[n]; try{ localStorage.setItem("crossed_sandbox_maps",JSON.stringify(m)); }catch(e){} edRenderFiles(); })]));
  P.appendChild(H("div",{class:"label",text:"Share or move a map"}));
  const out=H("textarea",{readonly:true,class:"mono",placeholder:"Copy map JSON fills this if the clipboard is blocked"});
  P.appendChild(fBtns([["Copy map JSON",()=>{ const t=JSON.stringify(ED.doc); try{ navigator.clipboard.writeText(t).then(()=>edStatusMsg("Map copied. Paste it to Claude or into another browser."),()=>{ out.value=t; out.select(); }); }catch(e){ out.value=t; out.select(); } }]]));
  P.appendChild(out);
  P.appendChild(H("div",{class:"label",text:"Import"}));
  P.appendChild(H("p",{class:"muted",text:"Accepts this sandbox's maps, a Map Designer export (walls, doors, floors, stages, furniture, lights, cameras, markers, paths, your textures and models) and an Item Modeler export (adds its items to the item list)."}));
  const fi=H("input",{type:"file",accept:".json,application/json,text/plain"}); const ta=H("textarea",{class:"mono",placeholder:"…or paste JSON here"}); const msg=H("p",{class:"muted"}); const lv=H("div");
  const go=txt=>edImport(txt,msg,lv);
  fi.onchange=()=>{ const f=fi.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>go(String(r.result)); r.readAsText(f); };
  P.appendChild(fi); P.appendChild(ta); P.appendChild(fBtns([["Import pasted JSON",()=>go(ta.value)]])); P.appendChild(lv); P.appendChild(msg);
  const ci=ED.doc.customItems||[]; if(ci.length){ P.appendChild(H("div",{class:"label",text:"Imported items"})); for(const c of ci) P.appendChild(H("div",{class:"saved"},[H("span",{text:`${c.name} (${c.cat})`}),H("button",{class:"btn small danger",text:"Remove",onclick:()=>{ edSnapshot(); ED.doc.customItems=ci.filter(x=>x!==c); edChanged({noRebuild:true}); edRenderFiles(); }})])); }
}
function edMaps(){ try{ return JSON.parse(localStorage.getItem("crossed_sandbox_maps")||"{}"); }catch(e){ return {}; } }
function edImport(txt,msg,lvBox){
  let j; try{ j=JSON.parse(txt); }catch(e){ msg.textContent="That isn't valid JSON. Paste the whole export, from the first { to the last }."; return; }
  lvBox.innerHTML="";
  if(j&&j.app==="crossed-sandbox"){ edSnapshot(); ED.doc=sbNormalize(j); sbAddDocTextures(ED.doc).then(()=>edAfterLoad(true)); msg.textContent=`Opened "${j.name}".`; return; }
  const items=sbFindItems(j);
  if(items){ edSnapshot(); const ci=ED.doc.customItems=ED.doc.customItems||[]; let n=0; for(const it of items){ const key="im_"+(it.key||it.name||"item").replace(/\W+/g,"_").toLowerCase(); if(ITEMS[it.key]) continue; if(ci.some(c=>c.key===key)) continue; ci.push({key,name:it.name||it.key,cat:it.cat||"misc",desc:it.desc||it.examine||""}); n++; }
    edChanged({noRebuild:true}); edRenderFiles(); msg.textContent=n?`Added ${n} item${n>1?"s":""} from the Item Modeler. They're in every item list, marked ★. Items the sandbox already knows (flashlight, revolver ammo, pills…) use the built-in versions.`:"Those items are already in the list."; return; }
  const m=sbFindDesignerMap(j); if(!m){ msg.textContent="No map or items found in that JSON."; return; }
  const levels=(m.levels||[]).filter(l=>m.objects.some(o=>o.level===l.id));
  const doIt=lid=>{ const r=fromDesigner(m,lid); edSnapshot(); ED.doc=r.doc; sbAddDocTextures(ED.doc).then(()=>edAfterLoad(true));
    msg.textContent=`Imported "${ED.doc.name}"${levels.length>1?` (${r.level})`:""}: ${ED.doc.objects.length} objects.${r.skipped?` ${r.skipped} things the sandbox can't play yet were left out (roofs, ceilings, stairs, other floors, NPC figures).`:""} Furniture marked searchable in the designer is searchable here: select it to fill it.`; };
  if(levels.length>1){ const o={l:levels.find(l=>(l.elev||0)===0)?.id||levels[0].id}; lvBox.appendChild(fRow("Which floor",fSelect(o,"l",levels.map(l=>[l.id,l.name]),{on:()=>{}}))); lvBox.appendChild(fBtns([["Import this floor",()=>doIt(o.l),"primary"]])); msg.textContent=`This map has ${levels.length} floors. The sandbox plays one at a time.`; return; }
  doIt(levels[0]&&levels[0].id);
}

// ---------------------------------------------------------------- chrome
function edSetTool(t){ if(ED.draft&&ED.draft.kind==="path"&&t!=="path") edEndChain(); ED.draft=null; ED.tool=t; for(const b of document.querySelectorAll("#edTools .tool")) b.setAttribute("aria-pressed",String(b.dataset.t===t));
  if(t!=="select"&&ED.sel){ ED.sel=null; ED.selOp=null; edUpdateSelBox(); } $("edHint").textContent=HINTS[t]||""; if(ED.tab!=="inspect"&&t!=="prop") edSetTab("inspect"); edRenderInspector(); ED.planDirty=true;
  planCv.style.cursor=t==="select"?"default":"crosshair"; }
function edSetView(v){ ED.view=v; $("vPlan").setAttribute("aria-pressed",String(v==="plan")); $("v3d").setAttribute("aria-pressed",String(v==="3d")); planCv.hidden=v!=="plan"; ED.planDirty=true; if(v==="3d") ED.preview=null; }
function edSetTab(t){ ED.tab=t; for(const b of document.querySelectorAll("#edTabs button")) b.setAttribute("aria-selected",String(b.dataset.tab===t)); for(const p of document.querySelectorAll("#edSide .pane")) p.hidden=p.id!=="pane-"+t; if(t==="map") edRenderMap(); if(t==="files") edRenderFiles(); if(t==="assets") edRenderAssets(); }
function edHideSide(){ document.body.classList.remove("sideOpen"); }
let statusMsg="", statusT=0;
function edStatusMsg(t){ statusMsg=t; clearTimeout(statusT); statusT=setTimeout(()=>{ statusMsg=""; edStatus(); },3500); edStatus(); }
function edStatus(){ const c=ED.cursor, el=$("edStatus"); if(!el) return; const n=ED.doc?ED.doc.objects.length:0;
  el.innerHTML=`<span>X <b>${c.ok?c.x.toFixed(2):"–"}</b> Z <b>${c.ok?c.z.toFixed(2):"–"}</b> ground <b>${c.ok&&world?groundY(c.x,c.z).toFixed(2):"–"} m</b></span><span>${n} objects${world&&world.lightCapped?` · over ${SB_MAXLIGHTS} lights: some stay dark in play`:""}</span><span>${statusMsg||ED.saveMsg||""}</span>`; }
function edInitUI(){
  const tools=$("edTools"); tools.innerHTML="";
  for(const [k,label,key] of TOOLS) tools.appendChild(H("button",{class:"tool","data-t":k,title:`${label} (${key})`,"aria-pressed":String(k===ED.tool),onclick:()=>edSetTool(k),html:`<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg><span>${label}</span><kbd>${key}</kbd>`}));
  $("vPlan").onclick=()=>edSetView("plan"); $("v3d").onclick=()=>edSetView("3d");
  $("edUndo").onclick=edUndo; $("edRedo").onclick=edRedo; $("edPlay").onclick=()=>{ $("mm").hidden=true; playMap(null); };
  $("edName").value=ED.doc.name; $("edName").oninput=()=>{ ED.doc.name=$("edName").value; edChanged({noRebuild:true}); };
  for(const b of document.querySelectorAll("#edTabs button")) b.onclick=()=>edSetTab(b.dataset.tab);
  $("edSnap").value=String(ED.snap); $("edSnap").onchange=()=>{ ED.snap=+$("edSnap").value; $("edSnap").blur(); };
  const chip=(id,key,f)=>{ const c=$(id); c.checked=!!edPrefs[key]; c.onchange=()=>{ edPrefs[key]=c.checked; savePrefs(); f&&f(); c.blur(); }; };
  chip("edFog","fog",()=>edRebuild(true)); chip("edWork","work",()=>{ edAmb.intensity=edPrefs.work?0.55:0; }); chip("edPixel","pixel",()=>{ document.body.classList.toggle("pixel",!!edPrefs.pixel); resize(); }); document.body.classList.toggle("pixel",!!edPrefs.pixel); chip("edGrid","grid",()=>{ ED.planDirty=true; });
  $("edPanelBtn").onclick=()=>document.body.classList.toggle("sideOpen");
  const dl=$("keyNames"); dl.innerHTML=""; for(const n of ["Clinic key","House keys","Truck keys","Car keys","Front door key","Cellar key"]) dl.appendChild(H("option",{value:n}));
  edSetView(ED.view); edSetTool("select"); edSetTab("inspect"); edRenderSide();
  new ResizeObserver(()=>{ if(MODE==="build"){ resize(); ED.planDirty=true; } }).observe(canvas);
}
function edFrame(rdt){
  if(!SB.ready){ renderer.render(scene,camera); return; }
  if(MODE==="menu"){ ED.preview=null; ED.orbit.yaw+=rdt*0.06; edOrbitCam(); renderer.render(scene,camera); return; }
  if(ED.view==="3d"){ edOrbitCam(); for(const d of world.doors) applyDoor(d); renderer.render(scene,camera); }
  else if(ED.planDirty) drawPlan();
}
async function sbBoot(){
  $("edLoading").hidden=false;
  try{ await sbInitTextures(); }catch(e){ console.warn(e); }
  let d=null; try{ d=JSON.parse(localStorage.getItem("crossed_sandbox_current")||"null"); }catch(e){}
  let firstCh1=false; try{ firstCh1=!localStorage.getItem("crossed_sandbox_ch1_v1"); localStorage.setItem("crossed_sandbox_ch1_v1","1"); }catch(e){}
  if(firstCh1 && d && d.app==="crossed-sandbox"){ try{ const m=edMaps(); m["Saved before Chapter One opened ("+(d.name||"map")+")"]=d; localStorage.setItem("crossed_sandbox_maps",JSON.stringify(m)); }catch(e){} }
  ED.doc = sbNormalize(d && d.app==="crossed-sandbox" && !firstCh1 ? d : Object.assign(PRESETS[0].make(),{preset:PRESETS[0].key}));
  await sbAddDocTextures(ED.doc);
  SB.ready=true; $("edLoading").hidden=true;
  edInitUI(); goMenu("title"); edStatus();
}
// ================================================================ menus: title, controls, setup, and the in-simulation menu
const SIM = Object.assign({extraAcross:0, extraKind:"across", extraLouis:0, startOverride:"map", hpMul:1, speedMul:1, models:{on:true, norah:"norah", louis:"louis_brute", pools:{}}}, (()=>{ try{ return JSON.parse(localStorage.getItem("crossed_sandbox_sim")||"{}"); }catch(e){ return {}; } })());
function saveSim(){ try{ localStorage.setItem("crossed_sandbox_sim",JSON.stringify(SIM)); }catch(e){} }
let suSection="map";
const mh=(tag,attrs={},kids=[])=>H(tag,attrs,kids);

// ---------------------------------------------------------------- screens
function showScreen(id){ for(const s of document.querySelectorAll("#mm .mmScreen")) s.hidden = s.id!==id; }
function goMenu(screen){
  if(MODE==="play") toBuild();
  MODE="menu"; document.body.classList.remove("build","play","sideOpen"); document.body.classList.add("menu");
  try{ document.exitPointerLock(); }catch(e){}
  $("mm").hidden=false; $("simMenu").hidden=true; SB.simMenu=false; $("panel").classList.add("hidden");
  resize(); edDoRebuild(); ED.helpers.visible=false; ED.selBox.visible=false; edFrameAll(); ED.orbit.pitch=0.55; ED.orbit.dist*=0.9;
  showScreen(screen==="setup"?"mmSetup":screen==="controls"?"mmCtl":"mmTitle");
  if(screen==="setup") renderSetup();
}
function openBuilder(){
  MODE="build"; $("mm").hidden=true; document.body.classList.remove("menu","play"); document.body.classList.add("build");
  resize(); edRebuild(true); ED.helpers.visible=true; edFrameAll(); edRenderSide();
}
function beginSim(){ $("mm").hidden=true; document.body.classList.remove("menu"); playMap(null); }

// ---------------------------------------------------------------- setup
const SETUP_SECTIONS=[
  ["map","Map","Pick or build the place, and what counts as winning."],
  ["norah","Norah","What she starts with, and how she moves and fights."],
  ["enemies","Enemies","Who is in the map, how they start, and extras on top."],
  ["models","Models","Which character model each body wears. Opens the model viewer too."],
  ["louis","Louis AI","Hunting, breaking the house, the charge, slam, grab and throws."],
  ["runner","Runner AI","The sprinter: charge-ups, sprint attacks, kicks, the grab and the rare drop kick."],
  ["across","ACROSS AI","The pack: speed, tells, lunges, swipes, grabs, knockdowns."],
  ["combat","Combat","The revolver, aim help, and what each hit zone does."],
  ["physics","Physics","Momentum, weight and pushes."],
  ["stealth","Stealth","Light, noise, sight and how long they search."],
  ["items","Items","Searching, healing and the flashlight."],
  ["camera","Camera & controls","Shoulder camera or fixed cameras, sensitivity, controller."],
  ["world","World & debug","Time scale, resolution, fog, doors, overlays."]];
const SCHEMA_FOR={norah:["Norah","Norah · Movement"],louis:["Louis (Brute)"],runner:["Runner (BCROSS)"],across:["ACROSS","ACROSS · Walker","ACROSS · Crawler","ACROSS · Matron","ACROSS · Mourner","ACROSS · Animation","ACROSS · Movement types"],combat:["Revolver","Hit zones"],physics:["Physics"],stealth:["Stealth"],items:["Items & searching"],camera:["Camera & controls"],world:["Spawn & world","See what's happening"]};
function renderSetup(){
  const nav=$("suNav"); nav.innerHTML="";
  for(const [k,label] of SETUP_SECTIONS) nav.appendChild(mh("button",{class:"suTab","aria-pressed":String(k===suSection),text:label,onclick:()=>{ suSection=k; renderSetup(); }}));
  const M=$("suMain"); M.innerHTML=""; M.scrollTop=0; const sec=SETUP_SECTIONS.find(s=>s[0]===suSection);
  M.appendChild(mh("div",{class:"suHead"},[mh("h2",{text:sec[1]}),mh("p",{text:sec[2]})]));
  if(suSection==="map") suMap(M); else if(suSection==="norah"){ suNorah(M); suSchema(M,SCHEMA_FOR.norah); } else if(suSection==="enemies") suEnemies(M); else if(suSection==="models") suModels(M); else suSchema(M,SCHEMA_FOR[suSection]);
  suSummary();
}
function suSummary(){
  const d=ED.doc, en={}; for(const o of d.objects) if(o.type==="enemy"){ const k=(o.kind==="brute"?"Louis":o.kind==="dummy"?"Dummy":"ACROSS"); en[k]=(en[k]||0)+1; }
  if(SIM.extraAcross) en.ACROSS=(en.ACROSS||0)+SIM.extraAcross; if(SIM.extraLouis) en.Louis=(en.Louis||0)+SIM.extraLouis;
  const goal={either:"clear or escape",exit:"reach an exit",kill:"clear every enemy",none:"sandbox"}[d.win]||"";
  $("suSummary").innerHTML=`<b>${d.name.replace(/</g,"&lt;")}</b> · ${Object.entries(en).map(([k,v])=>`${v} ${k}`).join(", ")||"no enemies"} · goal: ${goal}${CFG.rev.infinite?" · infinite ammo":""}${CFG.norah.god?" · god mode":""}`;
}
function suCard(title,desc,on,click,badge){ return mh("button",{class:"suCard"+(on?" on":""),onclick:click},[badge?mh("i",{text:badge}):null,mh("b",{text:title}),mh("span",{text:desc})]); }
function suLoad(doc,label){
  if(ED.dirty){ try{ const m=edMaps(); m["Unsaved: "+ED.doc.name]=ED.doc; localStorage.setItem("crossed_sandbox_maps",JSON.stringify(m)); }catch(e){} }
  ED.doc=sbNormalize(doc); ED.sel=null; ED.undo=[]; ED.redo=[];
  sbAddDocTextures(ED.doc).then(()=>{ edSave(); ED.dirty=false; edDoRebuild(); ED.helpers.visible=false; edFrameAll(); ED.orbit.pitch=0.55; $("edName").value=ED.doc.name; renderSetup(); });
}
function suMap(M){
  const d=ED.doc;
  M.appendChild(mh("div",{class:"suLabel",text:"Current map"}));
  const c={}; for(const o of d.objects) c[o.type]=(c[o.type]||0)+1;
  M.appendChild(mh("div",{class:"suCurrent"},[mh("b",{text:d.name}),mh("span",{text:`${c.wall||0} walls · ${c.prop||0} furniture · ${c.enemy||0} enemies · ${(c.prop?d.objects.filter(o=>o.search).length:0)} searchable${d.terrain&&d.terrain.on?" · terrain":""}`}),
    mh("div",{class:"suRow"},[mh("button",{class:"suBtn",text:"Edit this map in the builder",onclick:openBuilder}),mh("button",{class:"suBtn",text:"New empty room",onclick:()=>{ suLoad(PRESETS.find(p=>p.key==="blankIn").make()); openBuilder(); }}),mh("button",{class:"suBtn",text:"New open ground",onclick:()=>{ suLoad(PRESETS.find(p=>p.key==="blankOut").make()); openBuilder(); }})])]));
  M.appendChild(suField("Goal",suSelect(d,"win",[["either","Clear every enemy or reach an exit"],["exit","Reach an exit"],["kill","Clear every enemy"],["none","Sandbox (never ends)"]],()=>{ edSave(); suSummary(); })));
  const E=d.env; M.appendChild(suField("Darkness",suSelect(E,"dark",[["","Map default"],["0.02","Pitch black"],["0.1","Night"],["0.3","Dusk"],["0.6","Daylight"]],()=>{ edSave(); })));
  M.appendChild(suField("Fog",suSelect({f:String(E.fog)},"f",[["0","None"],["0.015","Thin"],["0.03","Light"],["0.05","Heavy"],["0.09","Blind"]].concat([[String(E.fog),"Map default ("+E.fog+")"]]),v=>{ E.fog=+v; edSave(); edDoRebuild(); ED.helpers.visible=false; })));
  M.appendChild(mh("div",{class:"suLabel",text:"Maps"}));
  const g=mh("div",{class:"suGrid"}); for(const pr of PRESETS){ if(pr.key.startsWith("blank")) continue; g.appendChild(suCard(pr.name,pr.desc,d.preset===pr.key,()=>suLoad(Object.assign(pr.make(),{preset:pr.key})),pr.key==="ch1house"?"CHAPTER ONE":null)); }
  M.appendChild(g);
  const maps=edMaps(); if(Object.keys(maps).length){ M.appendChild(mh("div",{class:"suLabel",text:"Your saved maps"})); const g2=mh("div",{class:"suGrid"}); for(const n of Object.keys(maps)) g2.appendChild(suCard(n,`${(maps[n].objects||[]).length} objects`,false,()=>suLoad(sbClone(edMaps()[n])))); M.appendChild(g2); }
  M.appendChild(mh("p",{class:"suNote",text:"Import Map Designer or Item Modeler files from the builder's FILES tab."}));
}
function suField(label,input,hint){ return mh("div",{class:"suField"},[mh("label",{text:label}),input,hint?mh("small",{text:hint}):null]); }
function suSelect(o,k,opts,on){ const s=mh("select"); for(const [v,t] of opts) s.appendChild(mh("option",{value:v,text:t})); s.value=String(o[k]??""); s.onchange=()=>{ o[k]=s.value; on&&on(s.value); }; return s; }
function suNum(o,k,ph,on,step=1){ const i=mh("input",{type:"number",step,placeholder:ph||""}); i.value=o[k]??""; i.oninput=()=>{ o[k]=i.value===""?"":+i.value; on&&on(); }; return i; }
function suCheck(label,get,set){ const c=mh("input",{type:"checkbox"}); c.checked=!!get(); c.onchange=()=>{ set(c.checked); suSummary(); }; return mh("label",{class:"suChk"},[c,label]); }
function suNorah(M){
  const st=ED.doc.start, save=()=>{ edSave(); suSummary(); };
  M.appendChild(mh("div",{class:"suLabel",text:"Starting loadout (this map)"}));
  M.appendChild(suField("Health",suNum(st,"hp",`${CFG.norah.hp} (full)`,save)));
  M.appendChild(suField("Rounds loaded",suNum(st,"rounds",String(CFG.rev.chambers),save)));
  M.appendChild(suField("Spare rounds",suNum(st,"spare",String(CFG.rev.spare),save)));
  const items=mh("div",{class:"suItems"}); const draw=()=>{ items.innerHTML=""; st.items.forEach((e,i)=>items.appendChild(mh("span",{class:"suChip"},[entryLabel(e)+" ",mh("button",{text:"×","aria-label":"Remove",onclick:()=>{ st.items.splice(i,1); save(); draw(); }})]))); if(!st.items.length) items.appendChild(mh("span",{class:"suNote",text:"Nothing in her bag."})); };
  draw(); const add={item:"flashlight"}; M.appendChild(suField("In her bag",items));
  M.appendChild(suField("",mh("div",{class:"suRow"},[suSelect(add,"item",itemOptions()),mh("button",{class:"suBtn",text:"Add",onclick:()=>{ const dd=ITEMS[add.item]; st.items.push({item:add.item,qty:dd&&dd.qty?dd.qty:1,name:"",text:""}); save(); draw(); }})])));
  M.appendChild(suCheck("Flashlight on at the start",()=>st.flashOn,v=>{ st.flashOn=v; save(); }));
  M.appendChild(mh("div",{class:"suLabel",text:"Cheats"}));
  M.appendChild(suCheck("Infinite ammo",()=>CFG.rev.infinite,v=>{ CFG.rev.infinite=v; saveCfg(); }));
  M.appendChild(suCheck("God mode (takes no damage)",()=>CFG.norah.god,v=>{ CFG.norah.god=v; saveCfg(); }));
  M.appendChild(suCheck("Ammo budget: Chapter One supply (5 loaded + 7), whatever the map says",()=>CFG.world.budget,v=>{ CFG.world.budget=v; saveCfg(); }));
}
function suEnemies(M){
  const d=ED.doc, list=d.objects.filter(o=>o.type==="enemy");
  M.appendChild(mh("div",{class:"suLabel",text:`In this map (${list.length})`}));
  if(!list.length) M.appendChild(mh("p",{class:"suNote",text:"No enemy markers. Add some below, or place them in the builder."}));
  const kindName=k=>k==="brute"?"Louis":k==="dummy"?"Training dummy":k==="across"?"ACROSS (random)":k==="across_legless"?"Legless crawler":(VMAP[(k||"").slice(7)]||{}).name||k;
  const groups={}; for(const o of list){ const key=kindName(o.kind)+" · "+(startOptions.find(s=>s[0]===o.start)||["","Hunting"])[1]; groups[key]=(groups[key]||0)+1; }
  const ul=mh("div",{class:"suItems"}); for(const [k,v] of Object.entries(groups)) ul.appendChild(mh("span",{class:"suChip",text:`${v} × ${k}`})); if(list.length) M.appendChild(ul);
  M.appendChild(suField("How they start",suSelect(SIM,"startOverride",[["map","As placed in the map"],["hunting","All hunting Norah"],["wander","All unaware, wandering"],["stand","All unaware, standing still"]],saveSim)));
  M.appendChild(mh("div",{class:"suLabel",text:"Extra enemies"}));
  M.appendChild(suField("Extra ACROSS",suNum(SIM,"extraAcross","0",()=>{ SIM.extraAcross=Math.max(0,Math.min(30,+SIM.extraAcross||0)); saveSim(); suSummary(); }),"They appear at random spots at least 8 m from Norah."));
  M.appendChild(suField("Which ACROSS",suSelect(SIM,"extraKind",[["across","Random subclass"],...VARIANTS.map(v=>["across:"+v.key,v.name])],saveSim)));
  M.appendChild(suField("Extra Louis",suNum(SIM,"extraLouis","0",()=>{ SIM.extraLouis=Math.max(0,Math.min(5,+SIM.extraLouis||0)); saveSim(); suSummary(); })));
  M.appendChild(mh("div",{class:"suLabel",text:"Every enemy"}));
  M.appendChild(suField("Health ×",suNum(SIM,"hpMul","1",saveSim,0.1)));
  M.appendChild(suField("Speed ×",suNum(SIM,"speedMul","1",saveSim,0.1)));
  M.appendChild(suField("ACROSS attacking at once",suNum(CFG.across,"maxAttackers",String(DEFAULTS.across.maxAttackers),()=>saveCfg())));
  M.appendChild(mh("p",{class:"suNote",text:"Their behaviour is in Louis AI and ACROSS AI."}));
}
function suSchema(M, titles){
  for(const t of titles){ const sec=SCHEMA.find(s=>s[0]===t); if(!sec) continue; const [title,sub,rows]=sec;
    const box=mh("div",{class:"suBlock"}); box.appendChild(mh("div",{class:"suLabel"},[title,mh("button",{class:"suReset",text:"Reset to defaults",onclick:()=>{ for(const r of rows){ const p=r[0]==="chk"?r[1]:r[0]; if(typeof p==="string"&&p.includes(".")) setP(p,defP(p)); } saveCfg(); renderSetup(); }})]));
    if(sub) box.appendChild(mh("p",{class:"suNote",text:sub}));
    for(const r of rows){ const kind=r[0];
      if(kind==="chk"){ box.appendChild(suCheck(r[2],()=>getP(r[1]),v=>{ setP(r[1],v); if(r[1]==="world.showZones") setZoneView(v); saveCfg(); })); continue; }
      if(kind==="cam"){ box.appendChild(suField("Camera",suSelect(CFG.ctrl,"cam",[["ots","Over the shoulder"],["tank","Fixed cameras · tank controls"],["relative","Fixed cameras · camera-relative"]],()=>{ saveCfg(); activeCam=null; }))); continue; }
      if(kind==="variants"){ continue; }
      if(typeof kind!=="string"||!kind.includes(".")||r.length<5) continue;
      const [path,label,min,max,step]=r, def=defP(path), v=mh("output",{text:fmt(getP(path))}), inp=mh("input",{type:"range",min,max,step}); inp.value=getP(path);
      const paint=()=>v.classList.toggle("changed",getP(path)!==def);
      inp.oninput=()=>{ const x=parseFloat(inp.value); setP(path,x); v.textContent=fmt(x); paint(); if(path==="world.res") resize(); saveCfg(); };
      paint(); box.appendChild(mh("div",{class:"suSlider",title:"Default: "+def},[mh("label",{text:label}),inp,v])); }
    M.appendChild(box); }
}

// ---------------------------------------------------------------- the in-simulation menu
function openSimMenu(result){
  if(MODE!=="play"||SB.simMenu) return; if(SB.inv) closeInv();
  SB.simMenu=true; try{ document.exitPointerLock(); }catch(e){} $("simMenu").hidden=false; renderSimMenu(result);
}
function closeSimMenu(){ SB.simMenu=false; $("simMenu").hidden=true; $("result").style.display="none"; try{ const p=canvas.requestPointerLock(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
function renderSimMenu(result){
  $("smTitle").textContent = result==="WON"?"CLEARED":result==="ESCAPED"?"ESCAPED":result==="DIED"||player.dead?"YOU DIED":"PAUSED";
  const B=$("smBody"); B.innerHTML="";
  const btn=(t,f,cls)=>mh("button",{class:"smBtn"+(cls?" "+cls:""),text:t,onclick:()=>{ f(); }});
  const tog=(t,get,set)=>{ const b=mh("button",{class:"smTog","aria-pressed":String(!!get()),text:t}); b.onclick=()=>{ set(!get()); saveCfg(); b.setAttribute("aria-pressed",String(!!get())); }; return b; };
  if(run) B.appendChild(mh("p",{class:"smStats",text:`${run.name} · ${run.t.toFixed(1)} s · shots ${run.shots} · hits ${run.hits} · damage taken ${Math.round(run.dmgTaken)} · ammo ${CFG.rev.infinite?"∞":player.rounds+player.spare}`}));
  B.appendChild(mh("div",{class:"smCol"},[
    result||player.dead ? null : btn("Resume",closeSimMenu,"primary"),
    btn("Restart",()=>{ closeSimMenu(); startPlay(); },result||player.dead?"primary":""),
    btn("Back to setup",()=>goMenu("setup")),
    btn("Edit this map",()=>{ goMenu("setup"); openBuilder(); }),
    btn("Main menu",()=>goMenu("title"))]));
  B.appendChild(mh("div",{class:"smLabel",text:"Combat options"}));
  B.appendChild(mh("div",{class:"smGrid"},[
    tog("Infinite ammo",()=>CFG.rev.infinite,v=>CFG.rev.infinite=v),
    tog("God mode",()=>CFG.norah.god,v=>CFG.norah.god=v),
    tog("Freeze AI",()=>CFG.world.freezeAI,v=>CFG.world.freezeAI=v),
    tog("Slow motion",()=>CFG.world.timeScale<1,v=>CFG.world.timeScale=v?0.25:1),
    tog("Show hit zones",()=>CFG.world.showZones,v=>{ CFG.world.showZones=v; setZoneView(v); }),
    tog("Reach rings",()=>CFG.debug.rings,v=>CFG.debug.rings=CFG.debug.attackLog=v)]));
  B.appendChild(mh("div",{class:"smGrid"},[
    btn("Clear enemies",()=>{ clearEnemies(); log("Enemies cleared","#9a9283"); renderSimMenu(result); }),
    btn("Heal + refill",()=>{ player.hp=CFG.norah.hp; player.rounds=CFG.rev.chambers; player.spare=Math.max(player.spare,CFG.rev.spare); if(player.dead) respawn(); renderSimMenu(result); }),
    btn("Spawn ACROSS",()=>{ spawn("across"); }), btn("Spawn Louis",()=>{ spawn("brute"); }), btn("Spawn dummy",()=>{ spawn("dummy"); }),
    btn("Tuning panel",()=>{ closeSimMenu(); $("panel").classList.remove("hidden"); try{ document.exitPointerLock(); }catch(e){} })]));
  B.appendChild(mh("p",{class:"smHint",text:"Esc or P closes this menu · N restarts · ` opens the tuning panel"}));
}
// extra enemies from the setup screen, at open spots away from Norah
function simExtras(){
  const b=world.bounds, R=mulberry(9001), spots=[];
  const pick=()=>{ for(let i=0;i<60;i++){ const x=b.x0+1+R()*(b.x1-b.x0-2), z=b.z0+1+R()*(b.z1-b.z0-2); if(Math.hypot(x-player.pos.x,z-player.pos.z)<8) continue;
      const p=new THREE.Vector3(x,0,z); if(collide(p,0.45)) continue; if(spots.some(s=>Math.hypot(s.x-x,s.z-z)<1.5)) continue; spots.push({x,z}); return {x,z}; } return null; };
  for(let i=0;i<(+SIM.extraAcross||0);i++){ const s=pick(); if(s) spawn(SIM.extraKind||"across",s.x,s.z,{aware:"hunting"}); }
  for(let i=0;i<(+SIM.extraLouis||0);i++){ const s=pick(); if(s) spawn("brute",s.x,s.z); }
}

// ---------------------------------------------------------------- wiring
$("mmStart").onclick=()=>{ audio(); goMenu("setup"); };
$("mmControls").onclick=()=>showScreen("mmCtl");
$("ctlBack").onclick=()=>showScreen("mmTitle");
$("suBack").onclick=()=>showScreen("mmTitle");
$("suEdit").onclick=openBuilder;
$("suGo").onclick=()=>{ audio(); beginSim(); };
$("suReset").onclick=()=>{ const keep=clone(CFG.ctrl); CFG=clone(DEFAULTS); CFG.ctrl=keep; saveCfg(); resize(); scene.fog.density=CFG.world.fog; buildPanel(); renderSetup(); };
$("edBack").onclick=e=>{ e.currentTarget.blur(); goMenu("setup"); };
$("toBuildBtn").onclick=e=>{ e.currentTarget.blur(); openSimMenu(); };
$("help").innerHTML=`<b>READY</b><br>Click the view to take the mouse. <b>Esc</b> opens the menu: pause, restart, combat options.<br>Controls are on the title screen.<div class="btns" style="margin-top:8px"><button id="helpok">Begin</button></div>`;
$("helpok").onclick=()=>{ audio(); $("help").style.display="none"; try{ const p=canvas.requestPointerLock(); if(p&&p.catch)p.catch(()=>{}); }catch(e){} };
document.addEventListener("pointerlockchange",()=>{ if(document.pointerLockElement!==canvas && MODE==="play" && !SB.inv && !SB.simMenu && $("help").style.display==="none" && $("panel").classList.contains("hidden") && !replay.on) openSimMenu(); });
// ---------------------------------------------------------------- models: setup section and the model viewer
const MDL_GROUPS = [
  ["cast","Cast","Kenneth, Norah, Louis (human), the Stranger and Rachel."],
  ["catalogue","Catalogue adults","Adult NPCs, no roles yet. cat08 shares Louis's face: don't cast it near him."],
  ["kids","Kids","The ten catalogue kids."],
  ["across/men","ACROSS · men","across_01 and v01–v12. Bigger ones carry extra hits."],
  ["across/women","ACROSS · women","The women's twins of the same 13."],
  ["across/imposing","ACROSS · imposing","Wider bony shoulders, longer legs, big hands. Up to 2 extra hits."],
  ["across/uncanny","ACROSS · uncanny","Look test: they keep the photo's own eyes, grin and lips. Not a decision yet."],
  ["bcross/brute","BCROSS · Brutes","Louis, the one-armed woman, the club-fist, and the four two-armed Brutes (static, no rig yet)."],
  ["bcross/runner","BCROSS · Runners","Base man, woman, and one in bone armour (endgame only)."],
  ["bcross/reacher","BCROSS · Reachers","Three neck Reachers and two arm Reachers. Dies when its head comes off."],
  ["bcross/tactician","BCROSS · Tactician","The big vertical eye. Shots to the eye do full headshot damage."],
  ["bcross/contortionist","BCROSS · Contortionists","Spider-like wall and ceiling crawlers. Child-sized, base, large, and two armoured (endgame only)."]];
const mdlName = k => k.replace(/_/g," ");
function mdlKeys(g){ return Object.keys(MODEL_LIB).filter(k=>MODEL_LIB[k].g===g); }

function suModels(M){
  const MS = SIM.models = Object.assign({on:true, norah:"norah", louis:"louis_brute", pools:{}}, SIM.models||{}); MS.pools = MS.pools||{};
  M.appendChild(mh("div",{class:"suField"},[mh("label",{text:"Character models"}),suCheck(" Use the low-poly models from the repo",()=>MS.on!==false,v=>{ MS.on=v; saveSim(); renderSetup(); }),
    mh("small",{text:"Off brings back the old procedural bodies. The models still use the same AI, hitboxes and poses; the hidden rig drives their skeletons."})]));
  if(MS.on===false){ M.appendChild(mh("button",{class:"suBtn",text:"Open the model viewer",onclick:()=>mvOpen()})); return; }
  const opt = test => Object.keys(MODEL_LIB).filter(k=>MODEL_LIB[k].hip && !MODEL_LIB[k].end && test(MODEL_LIB[k],k)).map(k=>[k,mdlName(k)]);
  M.appendChild(suField("Norah",suSelect(MS,"norah",opt(I=>I.g==="cast"),saveSim),"Her model in play. The cast models are all the same build."));
  M.appendChild(suField("Louis",suSelect(MS,"louis",opt(I=>I.g==="bcross/brute"),saveSim),"Louis turned (2.64 m). The one-armed woman and the club-fist use the same rig and moves, standing in for him."));
  for(const [v,label] of [["walker","Walker"],["crawler","Crawler"],["matron","Matron"],["mourner","Mourner"]]){
    if(MS.pools[v]==null) MS.pools[v]=MDL_DEFAULT_POOL[v];
    const n=()=>mdlPool(MS.pools[v]).length;
    const sm=mh("small",{text:""}); const upd=()=>{ sm.textContent = MS.pools[v]==="off" ? "Old procedural body." : `${n()} models; each one is picked at random when it spawns.${v==="mourner"?" Extra hits don't apply: 3 headshots always kill it.":""}`; };
    const s=suSelect(MS.pools,v,MDL_POOL_OPTS,()=>{ saveSim(); upd(); }); upd();
    M.appendChild(mh("div",{class:"suField"},[mh("label",{text:label}),s,sm])); }
  M.appendChild(mh("p",{class:"suNote",text:"Bigger ACROSS take more shots: each model's extra hits (0–2) are added to its health. Bone-armoured models are endgame only and never spawn here. Models load the first time they're used, so a body can appear as the old greybox for a moment."}));
  M.appendChild(mh("button",{class:"suBtn",text:"Open the model viewer",onclick:()=>mvOpen()}));
}

// the viewer: every model in the repo, its own clips, size and rules
const MV={open:false};
function mvBuild(){
  const st=document.createElement("style"); st.textContent=`
#mv{position:fixed;inset:0;z-index:60;background:#121010;color:#e3dccb;display:grid;grid-template-columns:260px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);font:13px "Courier New",monospace}
#mv[hidden]{display:none}
#mvTop{grid-column:1/3;display:flex;gap:10px;align-items:center;padding:10px 14px;border-bottom:1px solid #3a3228}
#mvTop b{letter-spacing:.12em;color:#e8c77a} #mvTop .sp{flex:1}
#mvList{overflow:auto;border-right:1px solid #3a3228;padding:8px}
#mvList h4{margin:10px 4px 4px;color:#b7ad98;font-size:12px;font-weight:normal;text-transform:uppercase;letter-spacing:.08em}
#mvList button{display:block;width:100%;text-align:left;font:inherit;font-size:12.5px;color:#d8d0bc;background:none;border:0;padding:3px 6px;cursor:pointer}
#mvList button[aria-pressed=true]{background:#3a3226;color:#fff} #mvList button:hover{background:#2a241c}
#mvStage{position:relative;min-height:0} #mvCan{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}
#mvInfo{position:absolute;left:12px;top:12px;max-width:min(420px,calc(100% - 24px));background:rgba(18,16,16,.82);border:1px solid #3a3228;padding:10px 12px;line-height:1.45}
#mvInfo h3{margin:0 0 4px;font-size:15px;color:#e8c77a} #mvInfo .gp{color:#9a9283;font-size:12px}
#mvClips{position:absolute;left:12px;bottom:12px;right:12px;display:flex;flex-wrap:wrap;gap:6px}
#mvClips button,#mvTop button{font:inherit;font-size:12.5px;color:#e3dccb;background:#2a241c;border:1px solid #5a5040;padding:6px 10px;cursor:pointer}
#mvClips button[aria-pressed=true]{background:#5a4a2a;border-color:#e8c77a}
#mv .warn{color:#ff9a6a}
@media (max-width:700px){ #mv{grid-template-columns:minmax(0,1fr);grid-template-rows:auto 34vh minmax(0,1fr)} #mvTop{grid-column:1} #mvList{border-right:0;border-bottom:1px solid #3a3228} }`;
  document.head.appendChild(st);
  const root=document.createElement("div"); root.id="mv"; root.hidden=true; root.setAttribute("role","dialog"); root.setAttribute("aria-label","Model viewer");
  root.innerHTML=`<div id="mvTop"><b>MODELS</b><span id="mvCount"></span><span class="sp"></span><button id="mvLine">Lineup</button><button id="mvClose">Close (Esc)</button></div>
    <nav id="mvList" aria-label="Models"></nav><div id="mvStage"><canvas id="mvCan"></canvas><div id="mvInfo"></div><div id="mvClips"></div></div>`;
  document.body.appendChild(root);
  const L=root.querySelector("#mvList");
  for(const [g,label] of MDL_GROUPS){ const ks=mdlKeys(g); if(!ks.length) continue; L.appendChild(Object.assign(document.createElement("h4"),{textContent:`${label} (${ks.length})`}));
    for(const k of ks){ const b=document.createElement("button"); b.textContent=mdlName(k)+(MODEL_LIB[k].end?" ·endgame":""); b.dataset.k=k; b.onclick=()=>mvShow(k); L.appendChild(b); } }
  root.querySelector("#mvCount").textContent=`${Object.keys(MODEL_LIB).length} models`;
  root.querySelector("#mvClose").onclick=mvClose; root.querySelector("#mvLine").onclick=()=>mvLineup(MV.group||"across/men");
  MV.can=root.querySelector("#mvCan"); MV.r=new THREE.WebGLRenderer({canvas:MV.can,antialias:true}); MV.r.setPixelRatio(Math.min(2,devicePixelRatio||1));
  MV.scene=new THREE.Scene(); MV.scene.background=new THREE.Color(0x24201c);
  MV.scene.add(new THREE.HemisphereLight(0xe8eef8,0x302820,0.9)); const dl=new THREE.DirectionalLight(0xffffff,0.55); dl.position.set(2,4,3); MV.scene.add(dl);
  const fl=new THREE.Mesh(new THREE.CircleGeometry(4,32),new THREE.MeshLambertMaterial({color:0x3a342c})); fl.rotation.x=-Math.PI/2; MV.scene.add(fl);
  MV.cam=new THREE.PerspectiveCamera(35,1,0.05,100); MV.yaw=0.5; MV.pitch=0.12; MV.dist=4; MV.ty=0.9; MV.clock=new THREE.Clock(); MV.items=[];
  let drag=null; MV.can.addEventListener("pointerdown",e=>{ drag={x:e.clientX,y:e.clientY,yaw:MV.yaw,pitch:MV.pitch}; MV.can.setPointerCapture(e.pointerId); });
  MV.can.addEventListener("pointermove",e=>{ if(!drag) return; MV.yaw=drag.yaw-(e.clientX-drag.x)*0.01; MV.pitch=Math.max(-0.2,Math.min(1.2,drag.pitch+(e.clientY-drag.y)*0.006)); });
  MV.can.addEventListener("pointerup",()=>drag=null);
  MV.can.addEventListener("wheel",e=>{ e.preventDefault(); MV.dist=Math.max(0.8,Math.min(30,MV.dist*(e.deltaY>0?1.1:0.9))); },{passive:false});
  addEventListener("keydown",e=>{ if(MV.open && e.code==="Escape"){ e.stopImmediatePropagation(); mvClose(); } },true);
  MV.root=root;
}
function mvOpen(key){ if(!MV.root) mvBuild(); MV.open=true; MV.root.hidden=false; mvShow(key||MV.key||"norah"); mvLoop(); }
function mvClose(){ MV.open=false; if(MV.root) MV.root.hidden=true; }
function mvClear(){ for(const it of MV.items){ MV.scene.remove(it.obj); } MV.items=[]; }
function mvPlace(k, x){ const c=mdlClone(k); if(!c) return null; c.scene.position.x=x; MV.scene.add(c.scene);
  const it={k, obj:c.scene, mixer:c.clips.length?new THREE.AnimationMixer(c.scene):null, clips:c.clips}; MV.items.push(it); return it; }
function mvPlay(it, name){ if(!it.mixer) return; it.mixer.stopAllAction(); if(!name) return; const cl=it.clips.find(c=>c.name===name); if(!cl) return;
  const a=it.mixer.clipAction(cl); a.reset(); a.setLoop(name==="death"||name==="hit"?THREE.LoopOnce:THREE.LoopRepeat); a.clampWhenFinished=true; a.play(); }
function mvShow(k){
  MV.key=k; MV.group=MODEL_LIB[k].g; for(const b of MV.root.querySelectorAll("#mvList button")) b.setAttribute("aria-pressed",String(b.dataset.k===k));
  const I=MODEL_LIB[k]; const info=MV.root.querySelector("#mvInfo"); const gl=(MDL_GROUPS.find(g=>g[0]===I.g)||[])[2]||"";
  info.innerHTML=`<h3>${mdlName(k)}</h3><div class="gp">${I.g} · ${I.f.split("/").pop()}</div>
    <div>Height ${I.h.toFixed(2)} m · ${I.tri.toLocaleString()} triangles · ${I.kb} KB</div>
    <div>${I.hip?`Rigged (16 bones) · clips: ${I.clips.join(", ")}`:`<span class="warn">Static and posed, no rig yet</span>`}</div>
    ${I.x?`<div>Extra hits: +${I.x} health</div>`:""}${I.end?`<div class="warn">Bone armour: endgame only</div>`:""}<div class="gp" style="margin-top:4px">${gl}</div><div id="mvState" class="gp"></div>`;
  const clips=MV.root.querySelector("#mvClips"); clips.innerHTML="";
  mvClear(); MV.root.querySelector("#mvState").textContent=MDL.ready[k]?"":"Loading…";
  mdlLoad(k).then(()=>{ if(MV.key!==k) return; mvClear(); const it=mvPlace(k,0); MV.ty=I.h*0.5; MV.dist=Math.max(2.4,I.h*2.3); const st=MV.root.querySelector("#mvState"); if(st) st.textContent="";
    const btns=[]; const mk=(name,label)=>{ const b=document.createElement("button"); b.textContent=label; b.onclick=()=>{ mvPlay(it,name); for(const x of btns) x.setAttribute("aria-pressed",String(x===b)); }; btns.push(b); clips.appendChild(b); return b; };
    const rest=mk(null,"Bind pose"); for(const c of it.clips) mk(c.name,c.name);
    const first=it.clips.find(c=>c.name==="spider_idle")||it.clips.find(c=>c.name==="walk"); if(first) btns[it.clips.indexOf(first)+1].click(); else rest.setAttribute("aria-pressed","true");
  }).catch(e=>{ const st=MV.root.querySelector("#mvState"); if(st) st.innerHTML=`<span class="warn">Couldn't load: ${String(e&&e.message||e)}</span>`; });
}
function mvLineup(g){
  const ks=mdlKeys(g); MV.key=null; mvClear(); const clips=MV.root.querySelector("#mvClips"); clips.innerHTML="";
  const info=MV.root.querySelector("#mvInfo"); info.innerHTML=`<h3>${(MDL_GROUPS.find(x=>x[0]===g)||[0,g])[1]} lineup</h3><div class="gp">${ks.length} models, true heights. Loading…</div>`;
  mdlPreload(ks).then(()=>{ let x=0, w=0; const its=[]; for(const k of ks){ const I=MODEL_LIB[k], step=Math.max(0.9,I.h*1.08); const it=mvPlace(k,x); if(it){ its.push(it); } x+=step; w=x; }
    for(const it of its){ it.obj.position.x-=w/2-0.45; }
    const mh_=Math.max(...ks.map(k=>MODEL_LIB[k].h)); MV.ty=mh_*0.5; MV.dist=Math.max(4,w*1.25); MV.yaw=0; MV.pitch=0.08;
    info.querySelector(".gp").textContent=`${ks.length} models, true heights.`;
    const any=its.find(i=>i.mixer); const btns=[]; const mk=(name,label)=>{ const b=document.createElement("button"); b.textContent=label; b.onclick=()=>{ for(const i of its) mvPlay(i,name); for(const y of btns) y.setAttribute("aria-pressed",String(y===b)); }; btns.push(b); clips.appendChild(b); };
    mk(null,"Bind pose"); if(any) for(const c of any.clips) mk(c.name,"All: "+c.name); });
}
function mvLoop(){ if(!MV.open) return; requestAnimationFrame(mvLoop);
  const dt=Math.min(0.05,MV.clock.getDelta()); for(const it of MV.items) if(it.mixer) it.mixer.update(dt);
  const w=MV.can.clientWidth||1, h=MV.can.clientHeight||1; if(MV.can.width!==Math.round(w*MV.r.getPixelRatio())||MV.can.height!==Math.round(h*MV.r.getPixelRatio())){ MV.r.setSize(w,h,false); MV.cam.aspect=w/h; MV.cam.updateProjectionMatrix(); }
  if(!MV.key && MV.items.length===0) MV.yaw+=dt*0.2; else if(MV.key) MV.yaw+=dt*0.15;
  MV.cam.position.set(Math.sin(MV.yaw)*Math.cos(MV.pitch)*MV.dist, MV.ty+Math.sin(MV.pitch)*MV.dist, Math.cos(MV.yaw)*Math.cos(MV.pitch)*MV.dist); MV.cam.lookAt(0,MV.ty,0);
  MV.r.render(MV.scene,MV.cam); }
(function(){ const nav=document.querySelector("#mmTitle .mmButtons"); if(!nav) return; const b=document.createElement("button"); b.id="mmModels"; b.textContent="MODELS"; b.onclick=()=>mvOpen(); nav.insertBefore(b, document.getElementById("mmControls")); })();
// start fetching the default bodies as soon as the page is up
setTimeout(()=>{ try{ mdlPreload(mdlPoolKeys()); }catch(e){} }, 300);
buildPanel(); scene.fog.density = CFG.world.fog;
sbBoot();
