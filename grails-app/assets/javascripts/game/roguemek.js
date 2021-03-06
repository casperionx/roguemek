// This is the main javascript file for the RogueMek game client 
//
//= require_self
//= require_tree .

"use strict";

// Create HexMap variables 
var numCols = 0;
var numRows = 0;

// STATIC variables
var HEADING_N = 0;
var HEADING_NE = 1;
var HEADING_SE = 2;
var HEADING_S = 3;
var HEADING_SW = 4;
var HEADING_NW = 5;
var HEADING_ANGLE = [0, 60, 120, 180, 240, 300];

// STATIC location indices
var HEAD = 0;
var LEFT_ARM = 1;
var LEFT_TORSO = 2;
var CENTER_TORSO = 3;
var RIGHT_TORSO = 4;
var RIGHT_ARM = 5;
var LEFT_LEG = 6;
var RIGHT_LEG = 7;
var LEFT_REAR = 8;
var CENTER_REAR = 9;
var RIGHT_REAR = 10;

// STATIC equipment type strings
var TYPE_EQUIPMENT = "Equipment";
var TYPE_WEAPON = "Weapon";
var TYPE_AMMO = "Ammo";
var TYPE_JUMP_JET = "JumpJet";
var TYPE_HEAT_SINK = "HeatSink";

var WEAPON_ENERGY = "Energy";
var WEAPON_BALLISTIC = "Ballistic";
var WEAPON_MISSILE = "Missile";
var WEAPON_PHYSICAL = "Physical";

// STATIC action strings
var ACTION_ROTATE_CW = "rotatecw";
var ACTION_ROTATE_CCW = "rotateccw";
var ACTION_FORWARD = "forward";
var ACTION_BACKWARD = "backward";

// Global variables used throughout the game
var queue, progress;
var hexMap, teams, units, unitsOrder;

// Keep track of which units belong to the player
var playerUnits;

// Keep track of targets for each unit belonging to the player
var unitTargets, targetCache;

// Keep track of which unit's turn it currently is
var turnUnit;
var selectedWeapons = [];

// Keep track of when actions are ready to be performed during the player turn
var playerActionReady = true;

// Track when the stage map is dragged to pan the board
var stageInitDragMoveX = null;
var stageInitDragMoveY = null;

// Enables certain development functions only when run locally
var devMode = (document.location.hostname == "localhost");
var lastPing = 0;

/**
 * Gets the game ready to play
 */
function initGame(){
	
	document.oncontextmenu = function(e){
		// return false is needed to prevent the right click menu from appearing on the page while the game is playing
		return false;
	};
	
	// only use async ajax
	$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
        options.async = true;
    });
	
	// prevent ajax caching
	$.ajaxSetup({ cache: false });
	
	// load default or stored settings
	Settings.init();
	
	window.onbeforeunload = function(e) {
		// disconnect the user from the game chat list
		// if the user cancels navigation, the next ping will handleChatReconnect()
		reconnectGameChat = true;
		HPG.sendUserDisconnect(GAME_REQUEST_TYPE);
		
		// If we haven't been passed the event get the window.event
	    e = e || window.event;

	    var message = 'Embrace Cowardice?';	// TODO: i18n?
	    // For IE6-8 and Firefox prior to version 4
	    if(e) {
	        e.returnValue = message;
	    }
	    // For Chrome, Safari, IE8+ and Opera 12+
	    return message;
	};
	
	window.onunload = function() {
		// since we're not disconnecting entirely in onbeforeunload in order to confirm leaving, disconnecting only as last resort here 
		// (since onunload is not called when closing the browser, only when reloading/navigating away)
		HPG.disconnectUplink();
	}
	
	// Create the EaselJS stage
	rootStage = new createjs.Stage("canvas");
	canvas = rootStage.canvas;
	
	// setup initial size of canvas to window
	canvas.width = window.innerWidth - 5;
	canvas.height = window.innerHeight - 5;
	
	// add board stage and UI containers to the root stage
	stage = new createjs.Container();
	overlay = new createjs.Container();
	rootStage.addChild(stage);
	rootStage.addChild(overlay);
	
	// apply stored scaling to the stage and overlay if available
	stage.scaleX = stage.scaleY = parseFloat(Settings.get(Settings.BOARD_SCALE)) || 1.0;
	overlay.scaleX = overlay.scaleY = parseFloat(Settings.get(Settings.UI_SCALE)) || 1.0;
	
	// apply Touch capability for touch screens
	createjs.Touch.enable(rootStage);
	
	// add resizing event
	window.addEventListener('resize', resize_canvas, false);

	// add keyboard listener
	addEventHandlers();
	
	// set up image loading queue handler
	queue = new createjs.LoadQueue();
	queue.addEventListener("complete", handleComplete);
	queue.addEventListener("progress", handleProgress);
	
	// create progress bar during image loading
	progress = $("#progressBar");
	
	// load the board, units and their images
	loadGameElements();
	
	// TODO: make target FPS a customizable value
	createjs.Ticker.on("tick", tick);
	createjs.Ticker.setFPS(Settings.get(Settings.GFX_FRAMERATE));
}


function isXOdd(X) {
	return (X & 1 == 1);
}

/**
 * Returns the x parameter of the coordinates in the direction
 *
 * based off of the same method from MegaMek (Coords.java)
 */
function xInDirection(x, y, direction) {
	 switch (direction) {
		 case 1 :
		 case 2 :
			 return x + 1;
		 case 4 :
		 case 5 :
			 return x - 1;
		 default :
			 return x;
	 }
}

/**
 * Returns the y parameter of the coordinates in the direction
 *
 * based off of the same method from MegaMek (Coords.java)
 */
function yInDirection(x, y, direction) {
	switch (direction) {
		case 0 : 
			return y - 1;
		case 1 : 
		case 5 :
			return y - ((x + 1) & 1);
		case 2 : 
		case 4 : 
			return y + (x & 1);
		case 3 : 
			return y + 1;
		default :
			return y;
	}
}

/**
 * Loads all initial game elements from the server to begin the game
 */
function loadGameElements() {
	
	$.getJSON("game/getGameElements", {
	  })
	  .fail(function(jqxhr, textStatus, error) {
		  var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
	  })
	  .done(function( data ) {
		  
		  if(data.gameState != null 
				  && data.gameState == "O") {
			  // The game is over already
			  showGameOverDialog(data);
			  return;
		  }

		  var manifest = [];
		  var alreadyManifested = {};
		  
		  // teams stored by user id as key, value is team number
		  teams = data.teams;
		  
		  units = {};
		  unitsOrder = data.turnOrder;
		  hexMap = [];
		  
		  playerUnits = [];
		  unitTargets = {};
		  targetCache = {};
		  
		  numCols = data.board.numCols;
		  numRows = data.board.numRows;
		  
		  // create the board hex display
		  $.each(data.board.hexMap, function(key, thisHex) {
			  if(thisHex != null){
				  var hexInstance = new Hex(thisHex.x, thisHex.y, thisHex.elevation, this.terrains, thisHex.images);
				  
				  // Place the hex in the map
				  var hexRow = hexMap[hexInstance.yCoords()];
				  if(hexRow == null){
					  hexRow = [];
					  hexMap[hexInstance.yCoords()] = hexRow;
				  }
				  hexRow[hexInstance.xCoords()] = hexInstance;
				  
				  // Make sure each image gets loaded to the manifest if not already present
				  $.each(thisHex.images, function(i, img) {
					  if(alreadyManifested[img] == null){
						  manifest.push({id:img, src:"assets/hexes/"+img});
						  alreadyManifested[img] = true;		// comment this line to test a slow progress bar locally 
					  }
				  });
			  }
		  });
		  
		  // create each unit display
		  $.each(data.units, function(index, thisUnit) {
			  if(thisUnit != null){
				  var unitInstance = new Unit(thisUnit.unit, thisUnit.x, thisUnit.y, thisUnit.heading);
				  unitInstance.owner = thisUnit.owner;
				  unitInstance.image = thisUnit.image;
				  unitInstance.imageFile = thisUnit.imageFile;
				  unitInstance.apRemaining = thisUnit.apRemaining;
				  unitInstance.jpRemaining = thisUnit.jpRemaining;
				  unitInstance.jumpJets = thisUnit.jumpJets;
				  unitInstance.jumping = thisUnit.jumping;
				  unitInstance.jumpCapable = thisUnit.jumpCapable;
				  unitInstance.heat = thisUnit.heat;
				  unitInstance.heatDiss = thisUnit.heatDiss;
				  unitInstance.callsign = thisUnit.callsign;
				  unitInstance.name = thisUnit.name;
				  unitInstance.chassisVariant = thisUnit.chassisVariant;
				  unitInstance.mass = thisUnit.mass;
				  unitInstance.armor = thisUnit.armor;
				  unitInstance.initialArmor = thisUnit.initialArmor;
				  unitInstance.internals = thisUnit.internals;
				  unitInstance.initialInternals = thisUnit.initialInternals;
					
				  unitInstance.effects = thisUnit.effects;
				  unitInstance.status = thisUnit.status;
				  unitInstance.prone = thisUnit.prone;
				  unitInstance.shutdown = thisUnit.shutdown;
				  
				  unitInstance.crits = thisUnit.crits;
				  unitInstance.physical = thisUnit.physical;
				  unitInstance.weapons = initUnitWeapons(thisUnit);
				  
				  if(data.turnUnit == thisUnit.unit){
					  turnUnit = unitInstance;
				  }
				  
				  if(data.moveAP != null) {
					  unitInstance.forwardAP = data.moveAP.forward;
					  unitInstance.backwardAP = data.moveAP.backward;
				  }
				  
				  // add to unit list
				  units[thisUnit.unit] = unitInstance;
				  
				  if(alreadyManifested[thisUnit.imageFile] == null){
					  manifest.push({id:thisUnit.imageFile, src:"assets/"+thisUnit.imageFile});
					  alreadyManifested[thisUnit.imageFile] = true;
				  }
			  }
		  });
		  
		  // find out which units are controlled by the player
		  $.each(data.playerUnits, function(index, unitId) {
			 if(unitId != null && units[unitId] != null) {
				 playerUnits.push(units[unitId]);
			 } 
		  });
		  
		  
		  // load any additional client side images
		  manifest.push({id:"out1", src:"assets/hexes/boring/out_of_bounds_1.gif"});
		  manifest.push({id:"out2", src:"assets/hexes/boring/out_of_bounds_2.gif"});
		  
		  manifest.push({id:"laser", src:"assets/ui/laser.png"});
		  manifest.push({id:"ballistic", src:"assets/ui/ballistics.png"});
		  manifest.push({id:"missile", src:"assets/ui/missiles.png"});
		  manifest.push({id:"melee", src:"assets/ui/melee.png"});
		  
		  manifest.push({id:"shell-yellow", src:"assets/ui/shell-yellow.png"});
		  manifest.push({id:"ejection-pod", src:"assets/ui/ejection-pod.png"});
		  
		  manifest.push({id:"jumpjet", src:"assets/ui/jumpjet_sprite.png"});
		  
		  manifest.push({id:"particle-white", src:"assets/ui/particle-white.png"});
		  manifest.push({id:"particle-red", src:"assets/ui/particle-red.png"});
		  manifest.push({id:"particle-yellow", src:"assets/ui/particle-yellow.png"});
		  manifest.push({id:"particle-orange", src:"assets/ui/particle-orange.png"});
		  manifest.push({id:"particle-blue", src:"assets/ui/particle-blue.png"});
		  manifest.push({id:"particle-smoke", src:"assets/ui/particle-smoke.png"});
		  
		  manifest.push({id:"spark-white", src:"assets/ui/spark-white.png"});
		  manifest.push({id:"spark-yellow", src:"assets/ui/spark-yellow.png"});
		  manifest.push({id:"spark-blue", src:"assets/ui/spark-blue.png"});
		  
		  manifest.push({id:"wreck.mech.light", src:"assets/units/wrecks/light.gif"});
		  manifest.push({id:"wreck.mech.medium", src:"assets/units/wrecks/medium.gif"});
		  manifest.push({id:"wreck.mech.heavy", src:"assets/units/wrecks/heavy.gif"});
		  manifest.push({id:"wreck.mech.assault", src:"assets/units/wrecks/assault.gif"});
		  
		  queue.loadManifest(manifest);
	  });
}

/**
 * Initializes a Unit's Weapon objects from the crits that have been loaded
 * @param unit
 */
function initUnitWeapons(unit) {
	if(unit == null || unit.crits == null) return null;
	
	var weapons = {};
	
	$.each(unit.crits, function(index, c) {
		if(c.type == TYPE_WEAPON && weapons[c.id] == null){
			var w = new Weapon(c.id, c.name, c.shortName, c.weaponType, c.location, 
								c.damage, c.projectiles, c.heat, c.cycle, c.cooldown, 
								c.minRange, [c.shortRange, c.mediumRange, c.longRange], c);
			weapons[c.id] = w;
			
			if(c.ammo) {
				// store the ammo objects directly on the weapon for easy lookup
				w.ammo = {};
				$.each(c.ammo, function(index, ammoId) {
					var ammoObj = getCritObjectById(unit, ammoId);
					if(ammoObj != null) {
						w.ammo[ammoId] = ammoObj;
					}
				});
			}
		}
	});
	
	$.each(unit.physical, function(index, c) {
		if(c.type == TYPE_WEAPON && weapons[c.id] == null){
			// ensure physical weapons appear as active on the UI
			c.status = "A";
			
			var w = new Weapon(c.id, c.name, c.shortName, c.weaponType, c.location, 
								c.damage, c.projectiles, c.heat, c.cycle, c.cooldown, 
								c.minRange, [c.shortRange, c.mediumRange, c.longRange], c);
			weapons[c.id] = w;
		}
	});
	
	return weapons;
}

// returns shortened text of the hit location index
function getLocationText(index){
	var locText = "";
	
	if(index == HEAD){
		locText = "HD";
	}
	else if(index == LEFT_ARM){
		locText = "LA";
	}
	else if(index == LEFT_TORSO){
		locText = "LT";
	}
	else if(index == CENTER_TORSO){
		locText = "CT";
	}
	else if(index == RIGHT_TORSO){
		locText = "RT";
	}
	else if(index == RIGHT_ARM){
		locText = "RA";
	}
	else if(index == LEFT_LEG){
		locText = "LL";
	}
	else if(index == RIGHT_LEG){
		locText = "RL";
	}
	else if(index == LEFT_REAR){
		locText = "LTR";
	}
	else if(index == CENTER_REAR){
		locText = "CTR";
	}
	else if(index == RIGHT_REAR){
		locText = "RTR";
	}
		
	return locText;
}

/**
 * Returns the string value of the unit class based on its mass
 * @param unit
 * @returns {String}
 */
function getUnitClassSize(unit) {
	var classSize = "unknown";
	
	if(unit.mass >= 80) {
		classSize = "assault";
	}
	else if(unit.mass >= 60) {
		classSize = "heavy";
	}
	else if(unit.mass >= 40) {
		classSize = "medium";
	}
	else if(unit.mass >= 20) {
		classSize = "light";
	}
	else {
		classSize = "ultralight";
	}
	
	return classSize;
}

/**
 * Returns true if a unit controlled by the player is currently having its turn
 * @returns
 */
function isPlayerUnitTurn() {
	return isPlayerUnit(turnUnit);
}

/**
 * Return true if the given unit is controlled by the player
 * @param unit
 * @returns
 */
function isPlayerUnit(unit) {
	if(unit == null || unit.id == null 
			|| playerUnits == null || playerUnits.length == 0) {
		return false;
	}
	
	var isPlayerUnit = false;
	$.each(playerUnits, function(index, pUnit) {
		if(pUnit.id == unit.id) {
			isPlayerUnit = true;
			return;
		}
	});
	
	return isPlayerUnit;
}
function isPlayerUnitId(unitId) {
	return isPlayerUnit(units[unitId]);
}

/**
 * Return true if the given unit is on the same team as the player
 * @param unit
 * @returns
 */
function isTeamUnit(unit) {
	if(unit == null || unit.owner == null || teams[unit.owner] == null
			|| currentUserId == null || teams[currentUserId] == null) {
		return false;
	}
	return (teams[unit.owner] == teams[currentUserId]);
}
function isTeamUnitId(unitId) {
	return isTeamUnit(units[unitId]);
}

/**
 * Return true if the given unit is the current turn unit
 * @param unit
 * @returns {Boolean}
 */
function isTurnUnit(unit) {
	if(unit == null || unit.id == null 
			|| turnUnit == null || turnUnit.id == null) {
		return false;
	}
	
	return (unit.id == turnUnit.id);
}


/**
 * Sets the given unit's target to target
 * @param unit
 * @param target
 */
function setUnitTarget(unit, target) {
	if(unit == null) return;
	unitTargets[unit.id] = target;
}
function getUnitTarget(unit) {
	if(unit == null) return null;
	return unitTargets[unit.id];
}

function getUnit(unitId) {
	if(unitId == null) return null;
	return units[unitId];
}

/**
 * Gets the Hex object at the given Coords object
 * @param coords
 */
function getHex(coords) {
	if(coords == null || coords.x == null || coords.y == null) return null;
	
	var hexRow = hexMap[coords.y];
	if(hexRow != null){
		return hexRow[coords.x];
	}
	
	return null;
}

// returns full name of the hit location index
function getLocationName(index){
	var locText = "";
		if(index == HEAD){
			locText = "Head";
		}
		else if(index == LEFT_ARM){
			locText = "Left Arm";
		}
		else if(index == LEFT_TORSO){
			locText = "Left Torso";
		}
		else if(index == CENTER_TORSO){
			locText = "Center Torso";
		}
		else if(index == RIGHT_TORSO){
			locText = "Right Torso";
		}
		else if(index == RIGHT_ARM){
			locText = "Right Arm";
		}
		else if(index == LEFT_LEG){
			locText = "Left Leg";
		}
		else if(index == RIGHT_LEG){
			locText = "Right Leg";
		}
		else if(index == LEFT_REAR){
			locText = "Left Torso Rear";
		}
		else if(index == CENTER_REAR){
			locText = "Center Torso Rear";
		}
		else if(index == RIGHT_REAR){
			locText = "Right Torso Rear";
		}
			
	return locText;
}

/**
 * Gets the unit weapon with the given ID
 * @param id
 * @returns
 */
function getUnitWeaponById(id) {
	// check all units for the weapon id
	var foundWeapon = null;
	$.each(units, function(index, thisUnit) {
		$.each(thisUnit.weapons, function(key, chkWeapon) {
			if(chkWeapon.id == id){
				foundWeapon = chkWeapon;
			}
		});
	});
	
	return foundWeapon;
}

/**
 * Gets an array of the player weapons that have been selected on the UI to fire
 * @returns {Array}
 */
function getSelectedWeapons() {
	return selectedWeapons;
}
function getSelectedWeaponsIndices() {
	var selectedIndices = [];
	if(!isPlayerUnitTurn()) return selectedIndices;
	
	var index = 0;
	$.each(turnUnit.weapons, function(key, weapon) {
		if( $.inArray(weapon, selectedWeapons) != -1) {
			
			var wIndex = (index+1).toString();
			if(weapon.isPunch()) {
				wIndex = "P";
			}
			else if(weapon.isKick()) {
				wIndex = "K";
			}
			else if(weapon.isCharge()) {
				wIndex = "C";
			}
			else if(weapon.isDFA()) {
				wIndex = "V";
			}
			
			selectedIndices.push(wIndex);
		}
		
		index++;
	});
	
	return selectedIndices;
}
function clearSelectedWeapons() {
	selectedWeapons = [];
}
function clearWeaponsToHit(unit) {
	if(unit == null) return;
	$.each(unit.weapons, function(key, w) {
		w.toHit = null;
	});
}
function addSelectedWeapon(weapon) {
	if(weapon != null && weapon.cooldown == 0
			&& weapon.toHit != null && weapon.toHit > 0) {
		
		if(weapon.isMeleeWeapon()) {
			// the weapon is a physical weapon, ensure it is the only weapon selected
			clearSelectedWeapons();
		}
		else {
			// otherwise, make sure no physical weapons are selected already to fire this weapon
			$.each(selectedWeapons, function(index, w) {
				if(w != null && w.isMeleeWeapon()){
					clearSelectedWeapons();
				}
			});
		}
		
		var selectedIndex = $.inArray(weapon, selectedWeapons);
		if(selectedIndex == -1) {
			// weapon not currently selected
			selectedWeapons.push(weapon);
		}
	}
}
function removeSelectedWeapon(weapon) {
	if(weapon != null) {
		var selectedIndex = $.inArray(weapon, selectedWeapons);
		if(selectedIndex == -1) {
			// weapon not currently selected
		}
		else {
			delete selectedWeapons[selectedIndex];
		}
	}
}

/**
 * Returns the number of weapons selected to fire for the turn unit
 */
function getNumSelectedWeapons() {
	// determine if all weapons are selected or not
	var weaponsPreparedToFire = getSelectedWeapons();
	var numSelectedWeapons = 0;
	
	// physical weapons do not count towards all being selected
	$.each(weaponsPreparedToFire, function(index, weapon) {
		if(weapon != null && !weapon.isMeleeWeapon()) {
			numSelectedWeapons ++;
		}
	});
	
	return numSelectedWeapons;
}

/**
 * Returns the number of non-melee weapons for the given unit
 */
function getNumWeapons(unit) {
	if(unit == null || unit.weapons == null) return 0;
	
	var numWeapons = 0;
	$.each(unit.weapons, function(index, weapon) {
		if(weapon != null && !weapon.isMeleeWeapon()) {
			numWeapons ++;
		}
	});
	
	return numWeapons;
}

/**
 * Returns the number of active, non-melee weapons for the given unit
 * It does not include weapons that are destroyed, on cooldown, or unable to hit
 */
function getNumAvailableWeapons(unit) {
	if(unit == null || unit.weapons == null) return 0;
	
	var numAvailWeapons = 0;
	$.each(unit.weapons, function(index, weapon) {
		if(weapon != null && !weapon.isMeleeWeapon() 
				&& weapon.isActive()
				&& weapon.cooldown == 0
				&& weapon.toHit > 0) {
			numAvailWeapons ++;
		}
	});
	
	return numAvailWeapons;
}

/**
 * just a roll of the dice
 */
function rollDice(numDie, numSides){
	//defaults to 2 dice with 6 sides
	if (!numDie) numDie = 2;
	if (!numSides) numSides = 6;
	
	//results of the dice rolls
	var results = [];
	
	for(var i=0; i<numDie; i++){
		//generate a random number between 1 and the number of sides
		results[i] = Math.floor( (Math.random()*numSides) +1 );
	}

	return results;
}

/**
 * adds the resulting number of die together
 */
function getDieRollTotal(numDie, numSides){
	var results = rollDice(numDie, numSides);
	
	var total = 0;
	for(var i=0; i<results.length; i++){
		total += results[i];
	}
	
	return total;
}

/**
 * Gets the crit object represented by the given id
 * @param unit
 * @param critId
 */
function getCritObjectById(unit, critId) {
	var critObj = null;
	
	$.each(unit.crits, function(index, c) {
		if(c != null && c.id == critId){
			critObj = c;
		}
		
		// end the each loop when the object is found
		return (critObj == null);
	});
	
	return critObj;
}

/**
 * Occasionally perform a ping poll to determine response time
 */
function ping() {
	lastPing = new Date().getTime();
	$.getJSON("game/ping", {
		ping: "true"
	})
	.fail(function(jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
	})
	.done(pingResponse);
}

/**
 * Loads initial list of users connected to chat
 */
function loadChatUsersList() {
	$.getJSON("game/listChatUsers", 
		null
	)
	.fail(function(jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log( "Request Failed: " + err );
	})
	.done(handleChatUsersList);
}

/**
 * Stores JSON target data in the cache 
 * @param data
 */
function storeTargetCache(data) {
	if(data == null || data.target == null || data.weaponData == null) return;
	
	var targetId = data.target;
	
	targetCache[targetId] = data;
}

/**
 * Retrieves JSON target data from the cache, or null if it is not cached
 * @param targetId
 */
function getTargetCache(targetId) {
	return targetCache[targetId];
}

/**
 * Clears JSON target data from the cache
 */
function clearTargetCache() {
	targetCache = {};
}

/**
 * Handle all game and unit updates resulting from server actions
 * @param data
 */
function updateGameData(data) {
	
	if(data.chatUser != null) {
		// update displayed list of users in the game chat
		handleChatUsersUpdate(data.chatUser);
		return;
	}
	
	if(data.message) {
		// display the message to the player
		var t = new Date(data.time);
		addMessageUpdate("["+t.toLocaleTimeString()+"] "+data.message);
	}
	
	if(data.gameState != null 
			&& data.gameState == "O") {
		// The game is over
		showGameOverDialog(data);
		return;
	}
	
	if(data.unit && data.turnUnit){
		// TODO: figure out when this happens and comment why it needs to be skipped
		return;
	}
	else if(data.turnUnit) {
		// presence of turnUnit indicates the unit is starting a new turn
		data.unit = data.turnUnit;
	}
	else if(data.unit == null) {
		resetControls();
	}
	
	// keep track of previous turn unit in the event it changes turns
	var prevTurnUnit = turnUnit;
	if(data.turnUnit){
		if(prevTurnUnit != null 
				&& isPlayerUnit(prevTurnUnit)) {
			// clear selection and toHit of weapons before next turn unit begins
			clearSelectedWeapons();
			resetWeaponsToHit(prevTurnUnit);
			updateWeaponsDisplay(prevTurnUnit);
			
			// update selected weapons display that also updates the heat display
			updateSelectedWeapons();
			
			var animatingWaitTime = getAnimatingTime();
			if(animatingWaitTime > 0) {
				// hide controls while any animations are playing
				showPlayerUnitControls(null);
			}
		}
		
		turnUnit = getUnit(data.turnUnit);
		
		updatePlayerUnitListDisplay();
		updateUnitTurnListDisplay();
	}
	
	// determine what units are being referenced
	var u = getUnit(data.unit);
	var t = getUnit(data.target);
	
	var isPlayerU = (u != null) ? isPlayerUnit(u) : isPlayerUnitTurn();
	var isPlayerT = isPlayerUnit(t);
	
	var prevTurnTarget = getUnitTarget(prevTurnUnit);
	var newTurnTarget = getUnitTarget(turnUnit);
	
	// determine what UI areas need to be updated
	var updatePosition = false;
	var updateWeapons = false;
    var updateUnitDisplay = false;
    var updateInfoDisplay = false;
	
	// update to unit status
	if(data.status != null) {
		var prevStatus = u.status;
		u.status = data.status;
		
		if(prevStatus != "D" && u.isDestroyed()) {
			// show floating message about the unit being destroyed
			var floatMessageStr = "DESTROYED";	// TODO: localize this message
			
			// determine location of message and create it
			var floatMessagePoint = new Point(u.getUnitDisplay().x, u.getUnitDisplay().y);
			createFloatMessage(floatMessagePoint, floatMessageStr, null, 0, 1.0, false);
			
			// show ejection pod from the unit
			animateEjectionPod(u);
			
			// center on the destruction
			centerDisplayOnHexAt(u.getHexLocation(), true);
		}
		
		// re-initialize unit display to show as destroyed
		u.getUnitDisplay().init();
		updateUnitDisplay = true;
		arrangeUnitsDisplay();
		
		// update unit info display to show as destroyed
		updateInfoDisplay = true;
		
		// update unit list display to show armor bar as destroyed
		var listUnits = getUnitListDisplays(u);
		$.each(listUnits, function(index, listUnit) {
			listUnit.updateArmorBar(true);
		});
	}
	
	// update to position
	if(data.x != null && data.y != null){
		updatePosition = u.setHexLocation(data.x, data.y);
	}
	
	// update to heading
	if(data.heading != null && u.heading != data.heading){
		u.heading = data.heading;
		updatePosition = true;
	}
	
	// update to being prone
	if(data.prone != null && u.prone != data.prone) {
		u.prone = data.prone;
		
		// show floating message about the unit being prone
		var floatMessageStr = u.prone? "PRONE" : "STANDING";	// TODO: localize this message
		
		// determine location of message and create it
		var floatMessagePoint = new Point(u.getUnitDisplay().x, u.getUnitDisplay().y);
		createFloatMessage(floatMessagePoint, floatMessageStr, null, 0, 1.0, false);
		
		if(u.prone) {
			// show animation indicating the unit has fallen as a cloud of dust
			animateFallingMech(u);
		}
		
		// update the UI on being prone or not
		updateUnitDisplay = true;
		
		// update unit info display to show as prone
		updateInfoDisplay = true;
	}
	
	// update to being shutdown
	if(data.shutdown != null && u.shutdown != data.shutdown) {
		u.shutdown = data.shutdown;
		
		// show floating message about the unit being destroyed
		var floatMessageStr = u.shutdown ? "SHUTDOWN" : "POWER ON";	// TODO: localize this message
		
		// determine location of message and create it
		setTimeout(function(){
			// delay this message just a short while so it has a better chance of being seen
			var floatMessagePoint = new Point(u.getUnitDisplay().x, u.getUnitDisplay().y);
			createFloatMessage(floatMessagePoint, floatMessageStr, null, 0, 1.0, false);
		}, getAnimatingTime()+5);
		
		// update the UI on being shutdown or not
		updateUnitDisplay = true;
		
		// update unit info display to show as shutdown
		updateInfoDisplay = true;
	}
	
	if(data.apRemaining != null) {
		u.apRemaining = data.apRemaining;
		
		if(isPlayerU) {
			// the player unit moved or started a new turn, clear the cache
			clearTargetCache();
			
			updateUnitActionPoints(u);
		}
	}
	
	if(data.jpRemaining != null) {
		u.jpRemaining = data.jpRemaining;
		
		if(isPlayerU) updateUnitJumpPoints(u);
	}
	
	if(data.jumping != null) {
		var jumpingChanging = (u.jumping != data.jumping);
		
		u.jumping = data.jumping;
		
		if(isPlayerU) {
			u.getUnitDisplay().positionUpdate(performUnitPositionUpdates);
			setControlActive(PlayerControl.TYPE_JUMP, u.jumping);
		}
		else{
			u.getUnitDisplay().positionUpdate();
		}
		
		if(u.jumping && jumpingChanging) {
			animateJumpingMech(u);
		}
		
		// update unit info display to show as jumping
		updateInfoDisplay = true;
		updateUnitDisplay = true;
	}
	
	if(data.jumpCapable != null) {
		u.jumpCapable = data.jumpCapable;
	}
	
	if(data.moveAP != null) {
		u.forwardAP = data.moveAP.forward;
		u.backwardAP = data.moveAP.backward;
		
		if(isPlayerU) updateUnitMovePoints(u);
	}
	
	// update armor values of the target
	if(data.armorHit) {
		var numArmorHits = data.armorHit.length;
		for(var i=0; i<numArmorHits; i++) {
			var armorRemains = data.armorHit[i];
			if(armorRemains != null
					&& t.armor[i] != armorRemains) {
				t.armor[i] = armorRemains;
				
				applyUnitDamage(t, i, false, true);
			}
		}
	}
	
	// update internal values of the target
	if(data.internalsHit) {
		var numInternalsHits = data.internalsHit.length;
		for(var i=0; i<numInternalsHits; i++) {
			var internalsRemains = data.internalsHit[i];
			if(internalsRemains != null
					&& t.internals[i] != internalsRemains) {
				t.internals[i] = internalsRemains;
				
				applyUnitDamage(t, i, true, true);
			}
		}
	}
	
	// update criticals hit on the target
	if(data.criticalHit) {
		var critHit = data.criticalHit;
		
		var equipId = critHit.id;
		var status = critHit.status;
		
		var equipObj = getCritObjectById(t, equipId);
		var prevStatus = equipObj.status;
		
		equipObj.status = status;
		
		if(data.locationDestroyed && equipObj.type != TYPE_WEAPON) {
			// if the critical hit comes from the entire location being destroyed, 
			// don't spam floating messages with non-weapon equipment
		}
		else {
			// show floating message about the crit being hit
			var floatMessageStr = "CRIT "+equipObj.shortName;	// TODO: localize this message and include short name of the equipment
			
			// determine location of message and create it
			var floatMessagePoint = new Point(t.getUnitDisplay().x, t.getUnitDisplay().y);
			createFloatMessage(floatMessagePoint, floatMessageStr, null, 0, 1.0, false);
		}
		
		if(equipObj.status != "A" && equipObj.type == TYPE_WEAPON) {
			if(isPlayerT) {
				updateWeapons = true;
			}
			else {
				updateWeaponsListDisplays(t);
			}
		}
	}
	
	// update ammo remaining
	if(data.ammoRemaining) {
		$.each(data.ammoRemaining, function(ammoId, ammoRemaining) {
			var ammoObj = getCritObjectById(u, ammoId);
			ammoObj.ammoRemaining = ammoRemaining;
		});
		
		if(isPlayerU) updateWeapons = true;
	}
	
	if(data.weaponData){
		// clearing previous toHit for each weapon
		clearWeaponsToHit(turnUnit);
		
		// update the cooldown status of the weapons fired
		$.each(data.weaponData, function(key, wData) {
			var id = wData.weaponId;
			
			var weapon = getPlayerWeaponById(id);
			if(weapon != null){
				if(wData.toHit != null) weapon.toHit = wData.toHit;
				if(wData.weaponCooldown != null) weapon.cooldown = wData.weaponCooldown;
			}
		});
		
		if(isPlayerU) {
			// the player unit targeted something, store it in cache
			storeTargetCache(data);
			
			updateWeapons = true;
		}
	}
	
	if(data.weaponFire){
		// update result of weapons fire from another unit
		var wData = data.weaponFire;
		
		var id = wData.weaponId;
		var hit = wData.weaponHit;
		var hitLocations = wData.weaponHitLocations;
		var cooldown = wData.weaponCooldown;
		
		var weapon = getUnitWeaponById(id);
		if(weapon != null){
			weapon.cooldown = cooldown;
			
			// show weapon fire and floating miss/hit numbers
			animateWeaponFire(u, weapon, t, hitLocations);
		}
		else{
			console.error("Weapon null? Weapon ID:"+id);
			console.log(data.weaponFire);
			
			$.each(hitLocations, function(loc, damage) {
				if(damage != null) {
					var tgtPoint = new Point(t.displayUnit.x, t.displayUnit.y);
					
					var floatMessagePoint = getSimplePositionForLocation(tgtPoint, loc);
					var floatMessageStr = getLocationText(loc) + " -" + damage;
					
					createFloatMessage(floatMessagePoint, floatMessageStr, null, 0, 1.0, false);
				}
			});
		}
		
		// focus display on the unit being shot at
		centerDisplayOnHexAt(t.getHexLocation(), true);
		
		if(isPlayerU) updateWeapons = true;
	}
	
	if(data.damage != null && data.hitLocation != null) {
		// show damage resulting from a non-weapon action
		var damage = data.damage;
		var hitLocation = data.hitLocation;
		
		var srcUnit = (t != null) ? t : u;
		var srcPoint = new Point(srcUnit.displayUnit.x, srcUnit.displayUnit.y);
		
		var floatMessagePoint = getSimplePositionForLocation(srcPoint, data.hitLocation);
		var floatMessageStr = getLocationText(hitLocation) + " -" + damage;
		
		createFloatMessage(floatMessagePoint, floatMessageStr, null, 0, 1.0, false);
	}
	
	if(data.ammoExploded != null) {
		// show effects resulting from ammo explosion
		var ammoId = data.ammoExploded;
		var ammoObj = getCritObjectById(u, ammoId);
		
		animateAmmoExplosion(u, ammoObj);
	}
	
	if(data.heat != null) {
		u.heat = data.heat;
		
		if(data.heatDiss) {
			u.heatDiss = data.heatDiss;
		}
		
		// update heat display
		if(isPlayerU) updateHeatDisplay(u);
	}
	
	if(data.effects != null) {
		u.effects = data.effects;
		
		// update unit info display to show any effects
		updateInfoDisplay = true;
		updateUnitDisplay = true;
	}
	
	if(data.turnOrder != null) {
		unitsOrder = data.turnOrder;
		
		// update the UI component that shows the unit order
		updateUnitTurnListDisplay();
	}
	
	if(updatePosition) {
		// hide the target line before starting the animated move
		setPlayerTargetLineVisible(false);
		
		if(isPlayerU) {
			u.getUnitDisplay().animateUpdateDisplay(u.getHexLocation(), u.getHeading(), performUnitPositionUpdates);
		}
		else {
			u.getUnitDisplay().animateUpdateDisplay(u.getHexLocation(), u.getHeading());
		}
	}
	
	if(updateWeapons) {
		updateWeaponsDisplay(turnUnit);
		
		// remove any selected weapons that can no longer hit
		var weaponsPreparedToFire = getSelectedWeapons();
		$.each(weaponsPreparedToFire, function(index, weapon) {
			if(weapon != null 
					&& (weapon.toHit == null || weapon.toHit == 0)) {
				weaponsPreparedToFire[index] = null;
			}
		});
		
		// Update selected weapons
		updateSelectedWeapons();
	}
    
    if(updateUnitDisplay) {
        // updates the unit display object
        u.getUnitDisplay().update();
    }
    
    if(updateInfoDisplay) {
        // updates the unit info display window
		updateInfoDisplays(u);
    }
	
	// do some final UI updates from turn changes
	if(prevTurnUnit != null && data.turnUnit) {
		// don't perform new turn updates until after animations are done
		var animatingWaitTime = getAnimatingTime();
		setTimeout(function(){
			if(isPlayerUnit(prevTurnUnit)) {
				if(!isPlayerUnitTurn()) {
					setPlayerTarget(null);
				}
				
				if(prevTurnTarget != null) {
					prevTurnTarget.getUnitDisplay().setUnitIndicatorVisible(true);
				}
			}
			
			var prevUnitDisplay = prevTurnUnit.getUnitDisplay();
			var turnUnitDisplay = turnUnit.getUnitDisplay();
			
			prevUnitDisplay.updateUnitIndicator();
			turnUnitDisplay.updateUnitIndicator();
			
			if(isPlayerUnitTurn()) {
				// update player unit displays to prepare for its new turn
				showPlayerUnitDisplay(turnUnit);
				showPlayerUnitControls(turnUnit);
				
				setPlayerTarget(newTurnTarget);
				if(newTurnTarget != null) {
					newTurnTarget.getUnitDisplay().setUnitIndicatorVisible(false);
					
					// force the action ready to true to re-acquire the target at the start of the new turn
					playerActionReady = true;
					target(newTurnTarget);
				}
			}
			else {
				showOtherUnitDisplay(turnUnit);
				showPlayerUnitControls(null);
			}
			
			centerDisplayOnHexAt(turnUnit.getHexLocation(), true);
		}, animatingWaitTime);
	}
	
	update = true;
}
