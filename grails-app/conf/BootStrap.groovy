import javax.servlet.ServletContext
import grails.util.Environment

import roguemek.*
import roguemek.assets.*
import roguemek.board.*
import roguemek.game.*
import roguemek.model.*
import roguemek.mtf.*

class BootStrap {
	
	def grailsApplication
	
	def equipmentService
	def nameService
	
    def init = { ServletContext servletContext ->
		
		/* Sample code for determining environment from grails.util.Environment */
		if (Environment.current == Environment.DEVELOPMENT) {
			// insert Development environment specific code here
			printClassPath this.class.classLoader
			log.debug("mail: "+grailsApplication.config.grails.mail)
        }
		else if (Environment.current == Environment.TEST) {
            // insert Test environment specific code here
        }
		else if (Environment.current == Environment.PRODUCTION) {
            // insert Production environment specific code here
        }
		
		// Initialize the Context helping for determining location of resource with or without using the war
		ContextHelper.setContext(servletContext)
		
		def userRole = Role.findByAuthority(Role.ROLE_USER)
		if(!userRole) {
			userRole = new Role(authority: Role.ROLE_USER).save(flush: true)
		}
		
		def adminRole = Role.findByAuthority(Role.ROLE_ADMIN)
		if(!adminRole) {
			adminRole = new Role(authority: Role.ROLE_ADMIN).save(flush: true)
		}
		
		def rootRole = Role.findByAuthority(Role.ROLE_ROOT)
		if(!rootRole) {
			rootRole = new Role(authority: Role.ROLE_ROOT).save(flush: true)
		}
		
		assert Role.count == 3
		
		// Initialize names
		log.info('Initializing Names/Surnames...')
		nameService.initNames()
		
		if(Environment.current == Environment.DEVELOPMENT){
			// random query name test
			try{
				log.info('Random query names test:')
				log.info("R: "+ Name.getRandom().name)
				log.info("F: "+ Name.getRandom(Name.GENDER_FEMALE).name)
				log.info("M: "+ Name.getRandom(Name.GENDER_MALE).name)
				log.info("S: "+ Surname.getRandom().surname)
			} catch(Exception e) {
				log.error e.toString
			}
		}
		
		// Initialize equipment, weapons, ammo, and heat sinks
		log.info('Initializing Equipment')
		equipmentService.initEquipment()
		
		// Initialize the Hex Tileset
		log.info('Initializing Hexes')
		HexTileset.init()
		
		// Initialize maps
		log.info('Initializing Maps')
		MapBoard.initBoards()
		
		if(grailsApplication.config.roguemek.server.preloadMaps) {
			HexMap.list().each {
				if(!it.mapLoaded) {
					it.loadMap()
					log.info("Pre Loaded Map ${it.name}")
				}
			}
		}
		
		// Initialize factions
		log.info('Initializing Factions')
		Faction.init()
		
		// Initialize stock mechs
		log.info('Initializing Mechs')
		if(grailsApplication.config.roguemek.server.preloadUnits) {
			// fully load units
			MechMTF.initMechs(false)
		}
		else {
			// only initialize the unit basics
			MechMTF.initMechs(true)
		}
		
		// Initialize heat effects
		HeatEffect.initializeHeatEffects()
		
		////////////////////////////////////////////////////////
		// use RogueMek-config.groovy to define initial users //
		////////////////////////////////////////////////////////
		
		// Create Admin user with all Roles
		def createAdmin = grailsApplication.config.roguemek.users.admin?.username
		def adminUser = MekUser.findByUsername(createAdmin)
		def adminPilot
		if(createAdmin && !adminUser) {
			// initialize testing admin user
			adminUser = new MekUser(grailsApplication.config.roguemek.users.admin)
			adminUser.enabled = true
			
			if(!adminUser.validate()) {
				log.error("Errors with admin "+adminUser.username+":\n")
				adminUser.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				adminUser.save flush:true
				
				// assign all roles to admin user
				MekUserRole.create adminUser, rootRole, true
				MekUserRole.create adminUser, adminRole, true
				MekUserRole.create adminUser, userRole, true
				
				log.info "Initialized admin user ${adminUser.username} (${adminUser.id})"
			}
			
			assert MekUser.count() >= 1
			assert MekUserRole.count() >= 1
			
			if(Environment.current == Environment.DEVELOPMENT){
				// only creating test pilot in dev environment
				adminPilot = new Pilot(firstName: Name.getRandom().name, lastName: Surname.getRandom().surname, ownerUser: adminUser, status: Pilot.STATUS_ACTIVE, temporary: false)
				if(!adminPilot.validate()) {
					log.error("Errors with pilot "+adminPilot.firstName+":\n")
					adminPilot.errors.allErrors.each {
						log.error(it)
					}
				}
				else {
					adminPilot.save flush:true
					
					log.info('Initialized admin pilot '+adminPilot.toString())
				}
				
				assert Pilot.count() >= 1
			}
		}
		
		// Create optional test user with User role
		def createTester = grailsApplication.config.roguemek.users.demo?.username
		def testUser = MekUser.findByUsername(createTester)
		def testPilot
		if(createTester && !testUser) {
			// initialize testing admin user
			testUser = new MekUser(grailsApplication.config.roguemek.users.demo)
			testUser.enabled = true
			
			if(!testUser.validate()) {
				log.error("Errors with tester "+testUser.username+":\n")
				testUser.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				testUser.save flush:true
				
				// assign user role to test user
				MekUserRole.create testUser, userRole, true
				
				log.info "Initialized test user ${testUser.username} (${testUser.id})"
			}
			
			assert MekUser.count() >= 1
			assert MekUserRole.count() >= 1
			
			if(Environment.current == Environment.DEVELOPMENT){
				// only creating test pilot in dev environment
				testPilot = new Pilot(firstName: Name.getRandom().name, lastName: Surname.getRandom().surname, ownerUser: testUser, status: Pilot.STATUS_ACTIVE, temporary: false)
				if(!testPilot.validate()) {
					log.error("Errors with pilot "+testPilot.firstName+":\n")
					testPilot.errors.allErrors.each {
						log.error(it)
					}
				}
				else {
					testPilot.save flush:true
					
					log.info('Initialized test pilot '+testPilot.toString())
				}
				
				assert Pilot.count() >= 1
			}
		}
		
		// setting up some test BattleMech instances for the test game
		def battleMechA
		def battleMechB
		def battleMech2
		def battleMech3
		
		if(adminPilot) {
			// Initialize a sample BattleMech
			Mech mechA = Mech.findByName("Stalker")
			battleMechA = new BattleMech(pilot: adminPilot, mech: mechA.loadUnit(), rgb: [255, 0, 0])
			battleMechA.camoFile = "Kurita/Pesht Regulars/3rd Pesht Regulars.jpg"
			if(!battleMechA.validate()) {
				log.error("Errors with battle mech "+battleMechA.mech?.name+":\n")
				battleMechA.errors.allErrors.each {
					log.error(it)
				}
				assert false
			}
			else {
				battleMechA.save flush:true
				
				log.info('Initialized battle mech '+battleMechA.mech.name+" with ID="+battleMechA.id)
			}
			
			// and a 2nd mech for the admin pilot
			Mech mechB = Mech.findByName("Firestarter")
			battleMechB = new BattleMech(pilot: adminPilot, mech: mechB.loadUnit(), rgb: [255, 105, 105])
			battleMechB.camoFile = "Kurita/Pesht Regulars/3rd Pesht Regulars.jpg"
			if(!battleMechB.validate()) {
				log.error("Errors with battle mech "+battleMechB.mech?.name+":\n")
				battleMechB.errors.allErrors.each {
					log.error(it)
				}
				assert false
			}
			else {
				battleMechB.save flush:true
				
				log.info('Initialized battle mech '+battleMechB.mech.name+" with ID="+battleMechB.id)
			}
			
			/*if (Environment.current == Environment.DEVELOPMENT) {
				// testing creating ALL BattleMechs
				Mech.list().each {
					def thisBattleMech= new BattleMech(pilot: adminPilot, mech: it, rgb: [255, 0, 0])
					thisBattleMech.save flush: true
					
					log.info('Initialized test battle mech '+thisBattleMech.mech.name+" with ID="+thisBattleMech.id)
				}
			}*/
		}
		
		if(testPilot) {
			// and another BattleMech
			Mech mech2 = Mech.findByName("Warhammer")
			battleMech2 = new BattleMech(pilot: testPilot, mech: mech2.loadUnit(), rgb: [0, 0, 255])
			if(!battleMech2.validate()) {
				log.error("Errors with battle mech "+battleMech2.mech?.name+":\n")
				battleMech2.errors.allErrors.each {
					log.error(it)
				}
				assert false
			}
			else {
				battleMech2.save flush:true
				
				log.info('Initialized battle mech '+battleMech2.mech.name+" with ID="+battleMech2.id)
			}
			
			// yet another BattleMech
			Mech mech3 = Mech.findByName("Blackjack")
			battleMech3 = new BattleMech(pilot: testPilot, mech: mech3.loadUnit(), rgb: [0, 255, 0])
			if(!battleMech3.validate()) {
				log.error("Errors with battle mech "+battleMech3.mech?.name+":\n")
				battleMech3.errors.allErrors.each {
					log.error(it)
				}
				assert false
			}
			else {
				battleMech3.save flush:true
				
				log.info('Initialized battle mech '+battleMech3.mech.name+" with ID="+battleMech3.id)
			}
		}
		
		if(adminPilot && testPilot
				&& battleMechA && battleMechB && battleMech2 && battleMech3) {
			// Initialize a sample HexMap board
			HexMap boardMap = HexMap.findByName("Battletech")
			boardMap?.loadMap()
			log.info('Preloaded sample Board')
			
			// Initialize a sample Game
			Game sampleGame = new Game(ownerUser: adminUser, description: "The Battle of Wits")
			
			BattleHexMap battleBoardMap = new BattleHexMap(game: sampleGame, map: boardMap)
			sampleGame.board = battleBoardMap
			
			if(!sampleGame.validate()) {
				log.error("Errors with game:\n")
				sampleGame.errors.allErrors.each {
					log.error(it)
				}
				assert false
			}
			else {
				sampleGame.save flush:true
				log.info('Initialized game '+sampleGame.id)
				
				// setup teams for the sample game
				GameTeam adminTeam = new GameTeam(
						game: sampleGame, user: adminUser, team: 1)
				adminTeam.save flush:true
				
				GameTeam testTeam = new GameTeam(
						game: sampleGame, user: testUser, team: 2)
				testTeam.save flush:true	
				
				// create staging data for the sample game
				StagingUser stagingAdmin = new StagingUser(
						game: sampleGame, user: adminUser,
						startingLocation: Game.STARTING_NW,
						camoFile: "Kurita/Pesht Regulars/3rd Pesht Regulars.jpg",
						rgbCamo: [255, 0, 0],
						units: [battleMechA, battleMechB])
				stagingAdmin.save flush:true
				
				StagingUser stagingTester = new StagingUser(
						game: sampleGame, user: testUser,
						startingLocation: Game.STARTING_N,
						rgbCamo: [0, 0, 255],
						units: [battleMech2, battleMech3])
				stagingTester.save flush:true
				
				/*
				// testing loading many W/L and K/D records
				for(i in (0..100)) {
					boolean coinToss = (Roll.randomInt(2, 1) == 1)
					
					def thisWL = new roguemek.stats.WinLoss(game: sampleGame, user: adminUser, winner: coinToss)
					thisWL.save flush:true
					
					def anotherWL = new roguemek.stats.WinLoss(game: sampleGame, user: testUser, winner: !coinToss)
					anotherWL.save flush:true
				}
				
				for(i in (0..250)) {
					boolean coinToss = (Roll.randomInt(2, 1) == 1)
					
					def killer, killerUnit
					def victim, victimUnit
					
					if(coinToss) {
						killer = adminUser
						killerUnit = battleMechA.mech
						victim = testUser
						victimUnit = battleMech2.mech
					}
					else {
						killer = testUser
						killerUnit = battleMech2.mech
						victim = adminUser
						victimUnit = battleMechA.mech
					}
					
					def thisKD = new roguemek.stats.KillDeath(game: sampleGame,
																killer: killer, killerUnit: killerUnit,
																victim: victim, victimUnit: victimUnit)
					thisKD.save flush:true
					
				}
				*/
			}
		}
    }
	
    def destroy = {
    }
	
	def printClassPath(classLoader) {
		log.debug "$classLoader"
		classLoader.getURLs().each {url->
		   log.debug "- ${url.toString()}"
		}
		if (classLoader.parent) {
		   printClassPath(classLoader.parent)
		}
	  }
}
