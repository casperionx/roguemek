package roguemek.model

/**
 * Represents a generic unit implementation as a base for Mech, Tank, etc.
 */
class Unit {

    static searchable = {
		only = ['name', 'description']
	}
	
	// Configuration properties
	String name
	String description
	
	Character tech
	Faction faction
	Integer year
	
	Float mass
	Character heatSinkType = HS_SINGLE
	
	Long cbills
	Integer battleValue
	
	// STATIC value mappings
	public static final Character TECH_IS = 'I'
	public static final Character TECH_CLAN = 'C'
	
	public static final Character HS_SINGLE = 'S'
	public static final Character HS_DOUBLE = 'D'
	
	static mapping = {
		// All extending classes will get their own tables
		tablePerHierarchy false
	}
	
	static constraints = {
		name blank: false
		description nullable: true
		
		tech inList: [TECH_IS, TECH_CLAN]
		faction nullable: true
		year range: 0..3132
		
		mass min: 0F
		heatSinkType inList: [HS_SINGLE, HS_DOUBLE]
		
		cbills min: 0L
		battleValue min: 0
	}
	
	@Override
	public String toString() {
		return "<Unit:"+name+">"
	}
	
}
