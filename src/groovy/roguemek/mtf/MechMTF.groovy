package roguemek.mtf

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

import roguemek.model.*;

class MechMTF {
	private static Log log = LogFactory.getLog(this)
	
	/**
	 * Generates a Mech instance from an MTF format file
	 * @param mtfFile
	 * @return Mech created from the file
	 */
	public static Mech createMechFromMTF(File mtfFile) {
		
		def mtf = MapMTF.createMapFromMTF(mtfFile)
		if(mtf == null) {
			return null
		}
		
		def map = [:]
		
		// initialize values not in the MTF spec
		map.cbills = 0
		map.battleValue = 0
		map.faction = null
		
		// initialize arrays
		map.armor = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		map.internals = [0, 0, 0, 0, 0, 0, 0, 0]
		map.crits = []
		
		
		if(mtf[MapMTF.MTF_VERSION] instanceof List) {
			map.name = mtf[MapMTF.MTF_VERSION].get(1)
			
			String chassisVariant = mtf[MapMTF.MTF_VERSION].get(2)
			int dashIndex = chassisVariant.indexOf("-")
			if(dashIndex >= 0) {
				map.chassis = chassisVariant.substring(0, dashIndex)
				map.variant = chassisVariant.substring(dashIndex+1)
			}
			else {
				map.chassis = chassisVariant
				map.variant = "?"
			}
		}
		
		if(mtf[MapMTF.MTF_TECHBASE] instanceof List) {
			String line = mtf[MapMTF.MTF_TECHBASE].get(0)
			map.tech = line.equals("Inner Sphere") ? Mech.TECH_IS : Mech.TECH_CLAN
		}
		
		if(mtf[MapMTF.MTF_ERA] instanceof List) {
			String line = mtf[MapMTF.MTF_ERA].get(0)
			map.year = Integer.valueOf(line)
		}
		
		if(mtf[MapMTF.MTF_SOURCE] instanceof List) {
			// ignored
		}
		
		if(mtf[MapMTF.MTF_RULES] instanceof List) {
			// ignored
		}
		
		if(mtf[MapMTF.MTF_MASS] instanceof List) {
			String line = mtf[MapMTF.MTF_MASS].get(0)
			map.mass = Integer.valueOf(line)
			
			// Assign internal structure values based on mass
			map.internals = Mech.INTERNAL_STRUCTURE[map.mass]
		}
		
		if(mtf[MapMTF.MTF_ENGINE] instanceof List) {
			// ignored (for now)
		}
		
		if(mtf[MapMTF.MTF_STRUCTURE] instanceof List) {
			// ignored (for now)
		}
		
		if(mtf[MapMTF.MTF_MYOMER] instanceof List) {
			// ignored (for now)
		}
		
		if(mtf[MapMTF.MTF_HEATSINKS] instanceof List) {
			// only using the heat sink type specified since 
			// the quantity will be generated dynamically from crits
			String line = mtf[MapMTF.MTF_HEATSINKS].get(0)
			if(line.toLowerCase().contains("double")) {
				map.heatSinkType = Unit.HS_DOUBLE
			}
			else {
				map.heatSinkType = Unit.HS_SINGLE
			}
		}
		
		if(mtf[MapMTF.MTF_WALKMP] instanceof List) {
			String line = mtf[MapMTF.MTF_WALKMP].get(0)
			map.walkMP = Integer.valueOf(line)
		}
		
		if(mtf[MapMTF.MTF_JUMPMP] instanceof List) {
			String line = mtf[MapMTF.MTF_JUMPMP].get(0)
			map.jumpMP = Integer.valueOf(line)
		}
		
		if(mtf[MapMTF.MTF_ARMOR] instanceof List) {
			mtf[MapMTF.MTF_ARMOR].each { String line ->
				int colon = line.indexOf(":")
				
				if(colon > 0) {
					String armorSection = line.substring(0, colon).trim()
					
					// update the line to only contain the value after the colon
					line = line.substring(colon + 1).trim()
					
					switch(armorSection) {
						case(MapMTF.MTF_LA_ARMOR):
									map.armor[Mech.LEFT_ARM] = Integer.valueOf(line)
									break
						case(MapMTF.MTF_RA_ARMOR):
									map.armor[Mech.RIGHT_ARM] = Integer.valueOf(line)
									break
						case(MapMTF.MTF_LT_ARMOR):
									map.armor[Mech.LEFT_TORSO] = Integer.valueOf(line)
									break
						case(MapMTF.MTF_RT_ARMOR):
									map.armor[Mech.RIGHT_TORSO] = Integer.valueOf(line)
									break
						case(MapMTF.MTF_CT_ARMOR):
									map.armor[Mech.CENTER_TORSO] = Integer.valueOf(line)
									break
						case(MapMTF.MTF_HD_ARMOR):
									map.armor[Mech.HEAD] = Integer.valueOf(line)
									break
						case(MapMTF.MTF_LL_ARMOR):
									map.armor[Mech.LEFT_LEG] = Integer.valueOf(line)
									break
						case(MapMTF.MTF_RL_ARMOR):
									map.armor[Mech.RIGHT_LEG] = Integer.valueOf(line)
									break
						case(MapMTF.MTF_RTL_ARMOR):
									map.armor[Mech.LEFT_REAR] = Integer.valueOf(line)
									break
						case(MapMTF.MTF_RTR_ARMOR):
									map.armor[Mech.RIGHT_REAR] = Integer.valueOf(line)
									break
						case(MapMTF.MTF_RTC_ARMOR):
									map.armor[Mech.CENTER_REAR] = Integer.valueOf(line)
									break
								
						default: break
					}
				}
			}
		}
		
		if(mtf[MapMTF.MTF_WEAPONS] instanceof List) {
			// Weapons are generated dynamically from their crits
		}
		
		
		def mtfCritSections = [MapMTF.MTF_LEFT_ARM, MapMTF.MTF_RIGHT_ARM, 
			MapMTF.MTF_LEFT_TORSO, MapMTF.MTF_RIGHT_TORSO, MapMTF.MTF_CENTER_TORSO, 
			MapMTF.MTF_HEAD, MapMTF.MTF_LEFT_LEG, MapMTF.MTF_RIGHT_LEG]
		
		mtfCritSections.each { mtfSection ->
			if(mtf[mtfSection] instanceof List) {
				int subIndex = 0
				mtf[mtfSection].each { String line ->
					// add crits
					addCriticalsFromMTF(map.crits, line, mtfSection, subIndex ++)
				}
			}
		}
		
		
		Mech mech = new Mech(map)
		if(!mech.validate()) {
			log.error("Errors with mech "+mech.name+":\n")
			mech.errors.allErrors.each {
				log.error(it)
			}
		}
		else {
			mech.save flush:true
			log.info("Created mech "+mech.name)
		}
		
		return mech
	}
	
	private static void addCriticalsFromMTF(List crits, String line, String mtfSectionIndex, int subSectionIndex){
		// one crit is listed per line and in order, just push each entry after determining what it is
		if(crits == null || line == null || line.length() == 0) {
			return
		}
		
		int section = -1;
		switch(mtfSectionIndex){
			case(MapMTF.MTF_LEFT_ARM): 		section = Mech.LEFT_ARM
											break
			case(MapMTF.MTF_RIGHT_ARM): 	section = Mech.RIGHT_ARM
											break
			case(MapMTF.MTF_LEFT_TORSO): 	section = Mech.LEFT_TORSO
											break
			case(MapMTF.MTF_RIGHT_TORSO): 	section = Mech.RIGHT_TORSO
											break
			case(MapMTF.MTF_CENTER_TORSO): 	section = Mech.CENTER_TORSO
											break
			case(MapMTF.MTF_LEFT_LEG): 		section = Mech.LEFT_LEG
											break
			case(MapMTF.MTF_RIGHT_LEG): 	section = Mech.RIGHT_LEG
											break
			case(MapMTF.MTF_HEAD): 			section = Mech.HEAD
											break
								
			default: break
		}
		
		if(section == -1){
			log.error("Unknown MTF section index="+mtfSectionIndex+", line:"+line)
			return
		}
		
		int critStart = Mech.getCritSectionStart(section)
		int critEnd = Mech.getCritSectionEnd(section)
		
		if(critStart + subSectionIndex > critEnd) {
			// if crit is outside the section is was extra (MTF likes to put 12 crits in Head and Legs even though they only have 6)
			return
		}
		
		// look up weapon table to see if this is a weapon slot
		def critName = line;
		
		// Determine if it is a rear facing item
		def isRear = (critName.indexOf("(R)") != -1);
		if(isRear){
			critName = line.substring(0, critName.indexOf("(R)") - 1);
		}
		
		def thisCrit = null
		
		// TODO: determine how to model rear facing weapons
		/*def weaponClass = (MTF_WEAPON_TABLE[critName] != null) ? MTF_WEAPON_TABLE[critName].weapon : null;
		
		if(weaponClass != null){
			thisCrit = new WeaponSlot(line, weaponClass, isRear);
			
			//debug.log(" Weapon crit, rear="+isRear+": "+critName);
			if(isRear){
				// set an appropriate weapon to the rear location
				for(int i=0; i<mech.weapons.length; i++){
					def thisWeapon = mech.weapons[i];
					
					if(thisWeapon instanceof this[weaponClass]
							&& thisWeapon.getLocation() == section){
						switch(section){
							case LEFT_TORSO:
											thisWeapon.location = LEFT_REAR;
											break;
							
							case RIGHT_TORSO:
											thisWeapon.location = RIGHT_REAR;
											break;
								
							case CENTER_TORSO:
											thisWeapon.location = CENTER_REAR;
											break;
								
							default: break;
						}
						
						// stop after the first weapon set to the rear
						break;
					}
				}
			}
		}*/
		
		if(thisCrit == null){
			// search all Equipment for the item, if it is not found then create a new one with some default info
			def foundEquip = Equipment.findByName(critName)
			
			if(foundEquip) {
				thisCrit = foundEquip
			}
			else {
				// TODO: The findByAliases queries were all failing, so doing it the dumb way just to get past this part, fix it later!
				//def thisEquip = Equipment.findByAliases(critName)
				def equipList = Equipment.getAll()
	
				equipList.each { thisEquip ->
					if(thisEquip.aliases?.contains(critName)){
						thisCrit = thisEquip
						return
					}
				}
				
				if(thisCrit == null) {
					// create Equipment based on the incoming name so it has an object
					thisCrit = new Equipment([
							name:critName,
							shortName:critName,
							mass:0,
							crits:1,
							tech:Mech.IS,
							year:2014,
							cbills:0,
							battleValue:0])
					
					thisCrit.save()
					log.info("CREATED MISSING EQUIPMENT "+thisCrit.name)
				}
			}
		}
		
		crits[critStart + subSectionIndex] = thisCrit.id
	}
}
