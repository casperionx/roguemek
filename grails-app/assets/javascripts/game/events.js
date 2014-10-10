/**
 * events.js - Handles all events for the game
 */

function tick(event) {
	
	if(fpsDisplay != null) {
		fpsDisplay.htmlElement.innerHTML = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps";
	}
	
	// TODO: only update when something actually needs to be updated on screen
	
	stage.update(event);
}

/**
 * Resizes the canvas based on the current browser window size
 */
function resize_canvas(){
	if(stage != null){
		// TODO: add method to also center on the player unit on resize
		
		stage.canvas.width = window.innerWidth - 5;
		stage.canvas.height = window.innerHeight - 5;
		
		console.log("resizing window ("+window.innerWidth+"x"+window.innerHeight+") stage: "+stage.canvas.width+"x"+stage.canvas.height);
		
		// Keep the board from shifting to the center the first time it is dragged if the windows is wider than the board
		if(stage.canvas.width > (numCols+1) * (3 * hexWidth / 4)){
			console.log("stage width "+stage.canvas.width+" > "+
				"board width "+(numCols+1)+" * "+(3 * hexWidth / 4)+"="+((numCols+1) * (3 * hexWidth / 4)));
			
		    if(stage.x < -((numCols+1) * (3 * hexWidth / 4)) + stage.canvas.width){
		    	stage.x = -((numCols+1) * (3 * hexWidth / 4)) + stage.canvas.width;
		    }
		    if(stage.x > (3 * hexWidth / 4)) {
		    	stage.x = (3 * hexWidth / 4);
		    }
		}
		
		// resize certain UI elements to fit the window size
		$("#messagingArea").css({width: stage.canvas.width - playerContainerWidth - 10, height: messagingContainerHeight});
		$("#weaponsDiv").css({width: stage.canvas.width - playerContainerWidth});
	}
}

function handleProgress(event) {
	progress.graphics.clear();
    
    // Draw the outline again.
    progress.graphics.beginStroke("#000000").drawRect(0,0,100,20);
    
    // Draw the progress bar
    progress.graphics.beginFill("#ff0000").drawRect(0,0,100*event.progress,20);
}

function handleComplete(event) {
	stage.removeChild(progress);
	
	// Initialize the hex map display objects
	initHexMapDisplay();
	
	// Initialize the units display objects
	initUnitsDisplay();
	
	// Initialize the player UI
	initPlayerUI();
	setPlayerInfo(playerUnit.name+" "+playerUnit.chassisVariant, playerUnit.callsign);
	
	// Initialize player AP display
	setActionPoints(playerUnit.actionPoints);
	setJumpPoints(playerUnit.jumpPoints);
	setHeatDisplay(playerUnit.heat);
	setArmorDisplay(playerUnit.armor, playerUnit.internals);
	
	// TESTING weapons display
	updateWeaponsDisplay();
	
	// Initialize FPS counter
	var fpsDiv = document.getElementById("fpsDiv");
	fpsDisplay = new createjs.DOMElement(fpsDiv);
	fpsDisplay.x = -stage.x - 10;
    fpsDisplay.y = -stage.y + stage.canvas.height - 20;
    stage.addChild(fpsDisplay);
}

function handleHexClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var hex = event.target;
	
	console.log("clicked "+x+","+y+": "+hex);
	
	// TESTING the clicking based movement on adjacent hexes
	if(!playerUnit.coords.equals(hex.coords)){
		var adjacents = playerUnit.coords.getAdjacentCoords();
		
		// see if the clicked hex is one of the adjacents
		for (var toHeading = 0; toHeading < 6; toHeading++) {
			var adj = adjacents[toHeading];
			if(adj != null && adj.equals(hex.coords)) {
				// figure out which way that direction is relative to the unit heading, then turn or move accordingly
				
				if(toHeading == playerUnit.heading) {
					// move forward
					move(true);
				}
				else if(toHeading == ((playerUnit.heading + 3) % 6)) {
					// move backward
					move(false);
				}
				else {
					var cwHeadings = [(playerUnit.heading + 1) % 6, (playerUnit.heading + 2) % 6];
					var ccwHeadings = [(playerUnit.heading - 1) % 6, (playerUnit.heading - 2) % 6];
					
					if(jQuery.inArray( toHeading, cwHeadings ) >= 0){
						// rotate Heading CW
						rotate(true);
					}
					else{
						// rotate Heading CCW
						rotate(false);
					}
				}
				
				break;
			}
		}
	}
}

function handleUnitClick(event) {
	var x = event.stageX;
	var y = event.stageY;
	var unit = event.target;
	
	console.log("clicked "+x+","+y+": "+unit); 
	
	if(playerUnit != unit) {
		playerTarget = unit;
		updateTargetDisplay();
	}
}

function handleTargetCloseClick(event) {
	createjs.Tween.get(weaponsContainer).to({alpha: 0}, 250);
	createjs.Tween.get(targetContainer).to({alpha: 0}, 250);
	createjs.Tween.get(targetBracket).to({alpha: 0}, 250);
}

//Using jQuery add the event handlers after the DOM is loaded
function addEventHandlers() {
	// add event handler for key presses
	document.onkeypress = function(e){
		var charCode = e.which || e.keyCode;
		var key = String.fromCharCode(charCode);
		
		handleKeyPress(key);
		
		e.preventDefault();
	};
	
	specialKeyCodes = [8, 9, 13, 16, 17, 18, 27, 32, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46];
	window.addEventListener("keydown", function(e) {
		// handle special keys which don't have char codes, such as space and arrow keys
		if(specialKeyCodes.indexOf(e.keyCode) > -1) {
			e.preventDefault();
			
			var key = "";
			switch(e.keyCode){
				case 8:		key = "backspace";
							break;
				case 9:		key = "tab";
							break;
				case 13:	key = "enter";
							break;
				case 16:	key = "shift";
							break;
				case 17:	key = "ctrl";
							break;
				case 18:	key = "alt";
							break;
				case 27:	key = "escape";
							break;
				case 32:	key = "space";
							break;
				case 33:	key = "pgup";
							break;
				case 34:	key = "pgdn";
							break;
				case 35:	key = "end";
							break;
				case 36:	key = "home";
							break;
				case 37:	key = "left";
							break;
				case 38:	key = "up";
							break;
				case 39:	key = "right";
							break;
				case 40:	key = "down";
							break;
				case 45:	key = "insert";
							break;
				case 46:	key = "delete";
							break;
				default:	key = "undefined";
							break;
			}
			
			handleKeyPress(key);
		}
	}, false);
}

function handleKeyPress(key) {
	if(!playerActionReady){
		// TODO: alternate actions if pressed when player turns but between being ready for another action
		console.log("Waiting...")
		return;
	}
	
	// TODO: alternate actions if pressed when not player turn so the server isn't bugged by it
	
	var weaponFired = -1;
	
	// pressing 1-0 fires that weapon
	for(var i=1; i<=10; i++){
		var strVal = i.toString();
		if(i == 10) strVal = "0";
		
		if(key == strVal){
			weaponFired = (i-1);
			break;
		}
	}
	
	if(weaponFired >= 0){
		// fire the indicated weapon only
		fire_weapon(weaponFired);
	}
	else if(key == "." || key == "space" || key == "enter"){
		// Skip the remainder of the turn
		skip();
	}
	else if(key == "a" || key == "left"){
		// turn left/CCW
		rotate(false);
	}
	else if(key == "d" || key == "right"){
		// turn right/CW
		rotate(true);
	}
	else if(key == "w" || key == "up"){
		// move forward
		move(true);
	}
	else if(key == "s" || key == "down"){
		// move backward
		move(false);
	}
}