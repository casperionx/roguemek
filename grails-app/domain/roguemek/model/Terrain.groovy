package roguemek.model

class Terrain {

	Integer type
	Integer level
	Integer exits
	Integer terrainFactor
	
	static constraints = {
		type nullable: false
		level nullable: false
		exits nullable: false
		terrainFactor nullable: false
	}
	
	static mapping = {
		// Model classes do not change values, versioning not needed
		version false
	}
	
	public static final int LEVEL_NONE = Integer.MIN_VALUE;
	public static final int WILDCARD = Integer.MAX_VALUE;
	
	// STATIC terrain types (Sourced from MegaMek Terrains.java)
	public static final int WOODS      = 1; //1: light 2: heavy 3: ultra
    public static final int WATER      = 2; //level = depth
    public static final int ROUGH      = 3; //1: normal 2: ultra
    public static final int RUBBLE     = 4; //1: light bldg 2: medium bldg 3: heavy bldg 4: hardened bldg 5: wall 6: ultra
    public static final int JUNGLE     = 5; //1: light 2: heavy 3: ultra
    public static final int SAND       = 6;
    public static final int TUNDRA     = 7;
    public static final int MAGMA      = 8; // 1: crust 2: liquid
    public static final int FIELDS     = 9;
    public static final int INDUSTRIAL = 10; //level indicates height
    public static final int SPACE      = 11;
    //unimplemented
    //Level 1 Foliage
    //Sheer Cliffs

    //Terrain modifications
    public static final int PAVEMENT = 12;
    public static final int ROAD     = 13;
    public static final int SWAMP    = 14; //1: normal 2: just became quicksand 3: quicksand
    public static final int MUD      = 15;
    public static final int RAPIDS   = 16; //1: rapids 2: torrent
    public static final int ICE      = 17;
    public static final int SNOW     = 18; // 1: thin 2: deep
    public static final int FIRE     = 19; // 1: normal fire 2: inferno fire
    public static final int SMOKE    = 20; // 1: light smoke 2: heavy smoke 3:light LI smoke 4: Heavy LI smoke
    public static final int GEYSER   = 21; // 1: dormant 2: active 3: magma vent
    //unimplemented
    //Black Ice
    //Bug Storm
    //Extreme Depths
    //Hazardous Liquid Pools
    //Rail
    //Dirt Roads, Gravel Roads
    //Water Flow

    //Building stuff
    public static final int BUILDING       = 22; // 1: light 2: medium 3: heavy 4: hardened 5: wall
    public static final int BLDG_CF        = 23;
    public static final int BLDG_ELEV      = 24;
    public static final int BLDG_BASEMENT_TYPE = 25; // level equals BasemenType, one of the values of the BasementType enum
    public static final int BLDG_CLASS     = 26; //1: hangars 2: fortresses 3: gun emplacements
    public static final int BLDG_ARMOR     = 27;
    //leaving this empty will be interpreted as standard
    public static final int BRIDGE         = 28;
    public static final int BRIDGE_CF      = 29;
    public static final int BRIDGE_ELEV    = 30;
    public static final int FUEL_TANK      = 31;
    public static final int FUEL_TANK_CF   = 32;
    public static final int FUEL_TANK_ELEV = 33;
    public static final int FUEL_TANK_MAGN = 34;

    // special types
    public static final int IMPASSABLE = 35;
    public static final int ELEVATOR   = 36; // level=elevation it moves to,exits=d6 rolls it moves on
    public static final int FORTIFIED  = 37;
    public static final int SCREEN     = 38;

    //fluff
    public static final int FLUFF = 39;
    public static final int ARMS  = 40; // blown off arms for use as clubs, level = number of arms in that hex
    public static final int LEGS  = 41; // blown off legs for use as clubs, level = number of legs in that hex

    public static final int METAL_CONTENT = 42; // Is there metal content that will block magscan sensors?
    public static final int BLDG_BASE_COLLAPSED = 43; //1 means collapsed
	
	// Sourced from MegaMek Terrains.java
	private static final String[] names = [ "none", "woods", "water", "rough",
		"rubble", "jungle", "sand", "tundra", "magma", "planted_fields",
		"heavy_industrial", "space",
		"pavement", "road", "swamp", "mud", "rapids", "ice", "snow",
		"fire", "smoke", "geyser",
		"building", "bldg_cf", "bldg_elev", "bldg_basement_type", "bldg_class", "bldg_armor", "bridge", "bridge_cf",
		"bridge_elev", "fuel_tank", "fuel_tank_cf", "fuel_tank_elev", "fuel_tank_magn",
		"impassable", "elevator", "fortified", "screen",
		"fluff", "arms", "legs", "metal_deposit", "bldg_base_collapsed" ]

	public static final int SIZE = names.length
	
	private static Hashtable<String, Integer> hash
	
	/**
	 * Parses a string containing terrain info into the actual terrain
	 * Sourced from MegaMek Terrain.java
	 */
	public static Terrain createTerrain(String terrain) {
		// should have at least one colon, maybe two
		int firstColon = terrain.indexOf(':')
		int lastColon = terrain.lastIndexOf(':')
		String name = terrain.substring(0, firstColon)

		int type = Terrain.getType(name)
		
		int level = 0
		
		int exits = -1
		if (firstColon == lastColon) {
			level = levelFor(terrain.substring(firstColon + 1))
			// exitsSpecified will be determined dynamically instead of stored
			/*exitsSpecified = false;

			// Buildings *never* use implicit exits.
			if ((type == Terrain.BUILDING)
					|| (type == Terrain.FUEL_TANK)) {
				exitsSpecified = true;
			}*/
		} else {
			level = levelFor(terrain.substring(firstColon + 1, lastColon))
			//exitsSpecified = true;
			exits = levelFor(terrain.substring(lastColon + 1))
		}
		
		// Try to find existing Terrain in database with same type/level/exits before creating a new instance
		Terrain t = Terrain.findByTypeAndLevelAndExits(type, level, exits)
		if(t != null){
			return t
		}
		
		int terrainFactor = Terrain.getTerrainFactor(type, level)
		
		t = new Terrain(type: type, level: level, exits: exits, terrainFactor: terrainFactor)
		if(!t.validate()) {
			t.errors.allErrors.each {
				log.error(it)
			}
			return null
		}
		else {
			t.save flush:true
			return t
		}
	}
	
	/**
	 * Sourced from MegaMek Terrain.java
	 * @param string
	 * @return
	 */
	public static int levelFor(String string) {
		if (string.equals("*")) {
			return WILDCARD;
		}
		return Integer.parseInt(string);
	}
	
	/**
	 * Determines if exits are specified in the terrain
	 * @return
	 */
	public boolean hasExitsSpecified() {
		// Buildings *never* use implicit exits.
		return exits >= 0 || ((type == Terrain.BUILDING) || (type == Terrain.FUEL_TANK));
	}
	
	/**
	 * Sourced from MegaMek Terrains.java
	 * @param type
	 * @return
	 */
	public static String getName(int type) {
		return names[type];
	}
	
	/**
	 * This function converts the name of a terrain into the constant.
	 * Sourced from MegaMek Terrains.java
	 * @param name the name of the terain (from the names list.
	 * @return an integer coresponding to the terain, or 0 if no match (terrain
	 *         none)
	 */
	public static int getType(String name) {
		Object o = getHash().get(name);
		if (o instanceof Integer) {
			return ((Integer) o).intValue();
		}
		return 0;
	}

	/**
	 * Sourced from MegaMek Terrains.java
	 * @return Hashtable of the terrain names mapped to their type index
	 */
	protected static Hashtable<String, Integer> getHash() {
		if (hash == null) {
			hash = new Hashtable<String, Integer>(SIZE);
			for (int i = 0; i < names.length; i++) {
				hash.put(names[i], new Integer(i));
			}
		}
		return hash;
	}

	/**
	 * Sourced from MegaMek Terrains.java
	 * @param type
	 * @param level
	 * @return a displayable name for this terrain (for tooltips)
	 * TODO: Implement using translatable properties
	 */
	public static String getDisplayName(int type, int level) {
		switch(type) {
			case(WOODS):
				if(level == 1) {
					return "light woods";
				}
				if(level == 2) {
					return "heavy woods";
				}
				if(level == 3) {
					return "ultra-heavy woods";
				}
				return "woods (unknown)";
			case(ROUGH):
				if(level == 1) {
					return "rough";
				}
				if(level == 2) {
					return "ultra rough";
				}
				return "rough (unknown)";
			case(RUBBLE):
				if(level < 6) {
					return "rubble";
				}
				if(level > 5) {
					return "ultra rubble";
				}
				return "rubble (unknown)";
			case(WATER):
				return "water (depth " + level + ")";
			case(PAVEMENT):
				return "pavement";
			case(ROAD):
				return "road";
			case(FIRE):
				if(level == 1) {
					return "fire";
				}
				if(level == 2) {
					return "inferno fire";
				}
				return "fire (unknown)";
			case(SMOKE):
				if(level == 1) {
					return "light smoke";
				}
				if(level == 2) {
					return "heavy smoke";
				}
				if(level == 3) {
					return "LASER inhibiting smoke";
				}
				if(level == 4) {
					return "LASER inhibiting smoke";
				}
				if(level == 5) {
					return "Chaff (ECM)";
				}
				return "smoke (unknown)";
			case(SWAMP):
				if(level == 1) {
					return "swamp";
				}
				if((level == 2) || (level == 3)) {
					return "quicksand";
				}
				return "swamp";
			case(ICE):
				return "ice";
			case(FORTIFIED):
				return "improved position";
			case(GEYSER):
				if(level == 1) {
					return "dormant";
				}
				if(level == 2) {
					return "active";
				}
				if(level == 3) {
					return "magma vent";
				}
				return "geyser (unknown)";
			case(JUNGLE):
				if(level == 1) {
					return "light jungle";
				}
				if(level == 2) {
					return "heavy jungle";
				}
				if(level == 3) {
					return "ultra-heavy jungle";
				}
				return "jungle (unknown)";
			case(MAGMA):
				if(level == 1) {
					return "magma crust";
				}
				if(level == 2) {
					return "magma liquid";
				}
				return "magma (unknown)";
			case(MUD):
				return "mud";
			case(RAPIDS):
				if(level == 1) {
					return "rapids";
				}
				if(level == 2) {
					return "torrent";
				}
				return "rapids (unknown)";
			case(SAND):
				return "sand";
			case(SNOW):
				if(level == 1) {
					return "thin snow";
				}
				if(level == 2) {
					return "heavy snow";
				}
				return "snow (unknown)";
			case(TUNDRA):
				return "tundra";
			case(SPACE):
				return "space";
			case(SCREEN):
				return "screen";
			case(FIELDS):
				return "planted fields";
			case(INDUSTRIAL):
				return "heavy industrial zone (height " + level + ")";
			case(IMPASSABLE):
				return "impassable terrain";
			case(ELEVATOR):
				return "elevator";
			case(METAL_CONTENT):
				if(level < 1) {
					return "no metal content";
				}
				if(level == 1) {
					return "very low metal content";
				}
				if(level == 2) {
					return "low metal content";
				}
				if((level == 3) || (level == 4)) {
					return "medium metal content";
				}
				if((level == 5) || (level == 6)) {
					return "high metal content";
				}
				if((level == 7) || (level == 8)) {
					return "very high metal content";
				}
				return "extreme high metal content";
			default:
				return null;
		}

	}
	
	/**
	 * Sourced from MegaMek Terrains.java
	 * @param level
	 * @return the terrain factor for the given type and level - pg. 64, TacOps
	 */
	public static int getTerrainFactor(int type, int level) {
		switch(type) {
		case(WOODS):
			if(level == 1) {
				return 50;
			}
			if(level == 2) {
				return 90;
			}
			if(level == 3) {
				return 130;
			}
			return 50;
		case(ROUGH):
			return 200;
		case(PAVEMENT):
			return 200;
		case(ROAD):
			return 150;
		case(ICE):
			return 40;
		case(JUNGLE):
			if(level == 1) {
				return 50;
			}
			if(level == 2) {
				return 90;
			}
			if(level == 3) {
				return 130;
			}
			return 50;
		case(MAGMA):
			if(level == 1) {
				return 30;
			}
			return 0;
		case(SAND):
			return 100;
		case(SNOW):
			if(level == 1) {
				return 15;
			}
			if(level == 2) {
				return 30;
			}
			return 15;
		case(TUNDRA):
			return 70;
		case(FIELDS):
			return 30;
		/*case(METAL_CONTENT):
			if(level < 1) {
				return 0;
			}
			return level;*/
		default:
			return 0;
		}
	}
	
	/**
	 * Sourced from MegaMek Terrain.java
	 * @return
	 */
	public int getPilotingModifier() {
		//public int pilotingModifier(EntityMovementMode moveMode) {
		switch (type) {
			case Terrain.JUNGLE:
				return level
				
			case Terrain.MAGMA:
				return (level == 2) ? 4 : 1
				
			case Terrain.TUNDRA:
			case Terrain.SAND:
				return 1
				
			case Terrain.SNOW:
				return (level == 2) ? 1 : 0
				
			case Terrain.SWAMP:
				//if ((moveMode == EntityMovementMode.HOVER)
				//		|| (moveMode == EntityMovementMode.WIGE)) {
				//	return 0;
				//} else if ((moveMode == EntityMovementMode.BIPED)
				//		|| (moveMode == EntityMovementMode.QUAD)) {
					return 1
				//} else {
				//	return 2;
				//}
					
			case Terrain.MUD:
				//if ((moveMode == EntityMovementMode.BIPED)
				//		|| (moveMode == EntityMovementMode.QUAD)
				//		|| (moveMode == EntityMovementMode.HOVER)
				//		|| (moveMode == EntityMovementMode.WIGE)) {
					return 0
				//}
				//return 1
				
			case Terrain.GEYSER:
			case Terrain.RUBBLE:
				if (level == 2) {
					return 1
				}
				return 0
				
			case Terrain.RAPIDS:
				if (level == 2) {
					return 3
				}
				return 2
				
			case Terrain.ICE:
				//if ((moveMode == EntityMovementMode.HOVER)
				//		|| (moveMode == EntityMovementMode.WIGE)) {
				//	return 0;
				//}
				return 4
				
			case Terrain.INDUSTRIAL:
				return 1
				
			default:
				return 0
		}
	}

	/**
	 * Sourced from MegaMek Terrain.java
	 */
	public int getMovementCost() {
		//public int movementCost(Entity e) {
		//EntityMovementMode moveMode = e.getMovementMode();
		switch (type) {
			case Terrain.MAGMA:
				return level - 1
				
			case Terrain.GEYSER:
				if (level == 2) {
					return 1
				}
				return 0
				
			case Terrain.RUBBLE:
				//if ((e instanceof Mech) && ((Mech)e).isSuperHeavy()) {
				//	return 0;
				//}
				return 1
				
			case Terrain.WOODS:
				//if ((e instanceof Mech) && ((Mech)e).isSuperHeavy()) {
				//	return level - 1;
				//}
				return level
				
			case Terrain.JUNGLE:
				//if ((e instanceof Mech) && ((Mech)e).isSuperHeavy()) {
				//	return level;
				//}
				return level + 1
				
			case Terrain.SNOW:
				if (level == 2) {
					//if ((moveMode == EntityMovementMode.HOVER)
					//		|| (moveMode == EntityMovementMode.WIGE)) {
					//	return 0;
					//}
					return 1
				}
				//if ((moveMode == EntityMovementMode.WHEELED)
				//		|| (moveMode == EntityMovementMode.INF_JUMP)
				//		|| (moveMode == EntityMovementMode.INF_LEG)
				//		|| (moveMode == EntityMovementMode.INF_MOTORIZED)) {
				//	return 1;
				//}
				return 0
				
			case Terrain.MUD:
				//if ((moveMode == EntityMovementMode.BIPED)
				//		|| (moveMode == EntityMovementMode.QUAD)
				//		|| (moveMode == EntityMovementMode.HOVER)
				//		|| (moveMode == EntityMovementMode.WIGE)) {
					return 0
				//}
				//return 1;
					
			case Terrain.SWAMP:
				//if ((moveMode == EntityMovementMode.HOVER)
				//		|| (moveMode == EntityMovementMode.WIGE)) {
				//	return 0;
				//} else if ((moveMode == EntityMovementMode.BIPED)
				//		|| (moveMode == EntityMovementMode.QUAD)) {
					return 1
				//} else {
				//	return 2;
				//}
					
			case Terrain.ICE:
				//if ((moveMode == EntityMovementMode.HOVER)
				//		|| (moveMode == EntityMovementMode.WIGE)) {
				//	return 0;
				//}
				return 1
				
			case Terrain.RAPIDS:
			case Terrain.ROUGH:
				if (level == 2) {
					//if ((e instanceof Mech) && ((Mech)e).isSuperHeavy()) {
					//	return 1;
					//}
					return 2
				}
				//if ((e instanceof Mech) && ((Mech)e).isSuperHeavy()) {
				//	return 0;
				//}
				return 1
				
			case Terrain.SAND:
				//if (((moveMode == EntityMovementMode.WHEELED) && !e.hasWorkingMisc(MiscType.F_DUNE_BUGGY))
				//		|| (moveMode == EntityMovementMode.INF_JUMP)
				//		|| (moveMode == EntityMovementMode.INF_LEG)
				//		|| (moveMode == EntityMovementMode.INF_MOTORIZED)) {
				//	return 1;
				//}
				return 0
				
			case Terrain.INDUSTRIAL:
				//if ((moveMode == EntityMovementMode.BIPED)
				//		|| (moveMode == EntityMovementMode.QUAD)) {
					return 1
				//}
				//return 0
				
			default:
				return 0
		}
	}
	
	/**
	 * Gets all applicable data for the object that can be turned into JSON for the client
	 * @return
	 */
	public def getTerrainRender() {
		
		def terrainRender = [
			type: this.type,
			level: this.level,
			exits: this.exits,
			terrainFactor: this.terrainFactor
		]
		
		return terrainRender
	}
	
	@Override
	public String toString(){
		return "[Terrain:"+Terrain.getName(this.type)+"]"
	}
}
