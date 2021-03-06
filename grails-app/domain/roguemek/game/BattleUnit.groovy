package roguemek.game

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

import roguemek.MekUser
import roguemek.assets.ContextHelper
import roguemek.game.Coords
import roguemek.game.EntityImage
import roguemek.game.UnitService
import roguemek.model.Equipment

/**
 * Represents the owned unit that can be taken into battle as a base class for BattleMech, BattleTank, etc
 */
class BattleUnit {
	private static Log log = LogFactory.getLog(this)
	
	String id
	static mapping = {
		id generator: 'uuid'
		
		// All extending classes will get their own tables
		tablePerHierarchy false
	}

	MekUser owner
	Pilot pilot	// pilot can be a Pilot other than the owner of the unit
	
	Integer x = 0
	Integer y = 0
	Integer heading = 0
	Integer actionPoints = 0
	Integer apRemaining = 0
	Integer jumpPoints = 0
	Integer jpRemaining = 0
	Double heat = 0
	
	Integer apMoved = 0
	Integer jpMoved = -1
	Integer hexesMoved = 0
	Integer damageTaken = 0
	Boolean damageTakenCheck = false
	Boolean shutdown = false
	Boolean prone = false
	
	Character status = STATUS_ACTIVE
	
	String imageFile
	String camoFile
	Short[] rgb = [100,100,100]
	byte[] image
	
	// STATIC value mappings
	public static final Character STATUS_ACTIVE = 'A'
	public static final Character STATUS_DESTROYED = 'D'
	
	// STATIC variables
	public static final Integer HEADING_N = 0
	public static final Integer HEADING_NE = 1
	public static final Integer HEADING_SE = 2
	public static final Integer HEADING_S = 3
	public static final Integer HEADING_SW = 4
	public static final Integer HEADING_NW = 5
	
    static constraints = {
		owner nullable: true
		pilot nullable: true
		
		x nullable: true
		y nullable: true
		heading nullable: true
		actionPoints min: 0
		apRemaining min: 0
		jumpPoints min: 0
		jpRemaining min: 0
		heat min: 0.0D
		
		apMoved min: 0
		hexesMoved min: 0
		damageTaken min: 0
		damageTakenCheck nullable: false
		shutdown nullable: false
		prone nullable: false
		
		imageFile nullable: false
		camoFile nullable: true
		rgb size: 3..3
		image nullable: false, maxSize: 16384
		
		status inList: [STATUS_ACTIVE, STATUS_DESTROYED]
    }
	
	def unitService
	
	/**
	 * Returns true if the status of the unit is destroyed
	 * @return
	 */
	public boolean isDestroyed() {
		return status == STATUS_DESTROYED
	}
	
	/**
	 * Returns true if the status of the unit is active
	 * @return
	 */
	public boolean isActive() {
		return status == STATUS_ACTIVE
	}
	
	/**
	 * Gets the x,y hex location of this unit as Coords
	 * @return
	 */
	public Coords getLocation() {
		if(this.x == null || this.y == null) {
			return null
		}
		return new Coords(this.x, this.y)
	}
	
	/**
	 * Return the height of this mech above the terrain.
	 */
	public int getHeight() {
		return prone ? 0 : 1;
	}
	
	/**
	 * Returns the name of the unit and callsign of the pilot user as one string, 
	 * needs to be overridden to by extending classes if they want to include more than just callsign
	 * @return
	 */
	public String getUnitCallsign() {
		return pilot?.ownerUser?.callsign ?: ""
	}
	
	/**
	 * Returns true if the pilot is controlled by the given User
	 * @param user
	 * @return
	 */
	public boolean isUsedBy(MekUser user) {
		return (pilot?.ownerUser?.id == user.id)
	}
	
	/**
	 * Returns the user that is controlling the pilot
	 * @return
	 */
	public MekUser getPlayerUser() {
		return pilot?.ownerUser
	}
	
	/**
	 * Returns true if the owner is the given User
	 * @param user
	 * @return
	 */
	public boolean isOwnedBy(MekUser user) {
		return (owner?.id == user.id)
	}
	
	public static byte[] initUnitImage(BattleUnit unit) {
		if(unit == null) return null;
		
		InputStream stream = ContextHelper.getContextAsset("images/" + unit.imageFile)
		
		EntityImage entity
		if(unit.camoFile) {
			InputStream camoStream = ContextHelper.getContextAsset("images/camo/" + unit.camoFile)
			entity = new EntityImage(stream, camoStream)
		}
		else {
			entity = new EntityImage(stream, unit.rgb)
		}
		
		return entity.toByteArray()
	}
	
	/**
	 * Gets all weapons currently equipped
	 * @return Array of BattleWeapon objects
	 */
	public def getWeapons() {
		return unitService.getWeapons(this)
	}
	
	/**
	 * Gets only the BattleEquipment objects which match the base equipment object
	 * @param equip
	 * @return
	 */
	public BattleEquipment[] getEquipmentFromBaseObject(Equipment equip) {
		return unitService.getEquipmentFromBaseObject(this, equip)
	}
	
	/**
	 * Gets only the BattleEquipment objects which match the base equipment object
	 * @param equip
	 * @return
	 */
	public BattleEquipment[] getEquipmentFromMTFNames(List MTF_NAMES) {
		return unitService.getEquipmentFromMTFNames(this, MTF_NAMES)
	}
	
	/**
	 * Gets the average calculated health percentage of the unit based on its remaining armor/internals/etc.
	 * @return Double value of overall health percentage
	 */
	public double getHealthPercentage() {
		return 0d
	}
	
	@Override
	public String toString() {
		return "Unit piloted by "+pilot?.toString()
	}
}
