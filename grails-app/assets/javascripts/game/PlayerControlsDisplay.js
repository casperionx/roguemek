/**
 * Class for displaying player touch controls
 */
(function() {
"use strict";

var DEFAULT_WIDTH = 250;
var BORDER_WIDTH = 2;

function PlayerControlsDisplay(unit) {
	this.Container_constructor();
	
	this.width = DEFAULT_WIDTH;
	this.height = 0;
	
	this.unit = unit;
	
	this.left = null;
	this.right = null;
	this.forward = null;
	this.backward = null;
	this.center = null;
	this.jump = null;
}
var c = createjs.extend(PlayerControlsDisplay, createjs.Container);

c.init = function() {
	
	// TODO: allow custom UI colors
	
	// update the container height based on all of the components that are added
	this.height = 0;
	
	// create the button that moves the unit backward
	this.backward = new PlayerControl(PlayerControl.TYPE_BACKWARD);
	this.backward.init();
	this.addChild(this.backward);
	this.height += this.backward.height;
	// add mouse event listener
	this.backward.on("click", handleControls);
	this.backward.mouseChildren = false;
	
	// create the button that rotates the unit left (counter-clockwise)
	this.left = new PlayerControl(PlayerControl.TYPE_LEFT);
	this.left.init();
	this.addChild(this.left);
	this.height += this.left.height;
	// add mouse event listener
	this.left.on("click", handleControls);
	this.left.mouseChildren = false;
	
	// create the button that rotates the unit right (clockwise)
	this.right = new PlayerControl(PlayerControl.TYPE_RIGHT);
	this.right.init();
	this.addChild(this.right);
	this.height += this.right.height;
	// add mouse event listener
	this.right.on("click", handleControls);
	this.right.mouseChildren = false;
	
	// create the central button that shows AP and ends the turn or fires weapons
	this.center = new PlayerControl(PlayerControl.TYPE_CENTER);
	this.center.init();
	this.addChild(this.center);
	this.height += this.center.height;
	// add mouse event listener
	this.center.on("click", handleControls);
	this.center.mouseChildren = false;
	
	// create the button that moves the unit forward
	this.forward = new PlayerControl(PlayerControl.TYPE_FORWARD);
	this.forward.init();
	this.addChild(this.forward);
	this.height += this.forward.height;
	// add mouse event listener
	this.forward.on("click", handleControls);
	this.forward.mouseChildren = false;
	
	// create the button that moves the unit forward
	if(this.unit.jumpJets > 0) {
		// only shows if the unit has jump jets
		this.jump = new PlayerControl(PlayerControl.TYPE_JUMP);
		this.jump.init();
		this.addChild(this.jump);
		this.height += this.jump.height;
		// add mouse event listener
		this.jump.on("click", handleControls);
		this.jump.mouseChildren = false;
	}
	
	this.updateActionPoints();
	this.updateMoveActionPoints();
	this.updateJumpPoints();
	
	this.update();
}

c.update = function() {
	this.uncache();
	
	// position the backward button at the bottom center
	this.backward.x = (this.width - this.backward.width) / 2;
	this.backward.y = this.height - this.backward.height;
	this.backward.update();
	
	// position the left button at the left above the backward button
	this.left.x = 0;
	this.left.y = -10+ this.backward.y - this.left.height;
	this.left.update();
	
	// position the right button at the right above the backward button
	this.right.x = this.width - this.right.width;
	this.right.y = -10+ this.backward.y - this.right.height;
	this.right.update();
	
	// position the center button above the backward button
	this.center.x = (this.width - this.center.width) / 2;
	this.center.y = -10+ this.backward.y - this.center.height;
	this.center.update();
	
	// position the forward button above the center button
	this.forward.x = (this.width - this.forward.width) / 2;
	this.forward.y = -10+ this.center.y - this.forward.height;
	this.forward.update();
	
	if(this.jump != null) {
		// position the jump button above the forward button
		this.jump.x = (this.width - this.jump.width) / 2;
		this.jump.y = this.forward.y - this.jump.height;
		this.jump.update();
	}
	
	this.doCache();
}

c.updateMoveActionPoints = function() {
	var forwardAP = this.unit.forwardAP;
	var backwardAP = this.unit.backwardAP;
	var jumping = this.unit.jumping;
	
	var pointsRemaining = (this.unit.jumping) 
			? ((this.unit.apRemaining > this.unit.jpRemaining) ? this.unit.jpRemaining : this.unit.apRemaining) 
				: this.unit.apRemaining;
	
	if(forwardAP) {
		this.forward.setPoints(forwardAP);
		this.forward.setHighlighted((forwardAP > 0 && pointsRemaining >= forwardAP));
	}
	
	if(backwardAP) {
		this.backward.setPoints(backwardAP);
		this.backward.setHighlighted((backwardAP > 0 && pointsRemaining >= backwardAP));
	}
	
	if(jumping) {
		// set rotate controls to 0 AP
		this.left.setPoints(0);
		this.right.setPoints(0);
	}
	else {
		// set rotate controls to 1 AP
		this.left.setPoints(1);
		this.left.setHighlighted((pointsRemaining >= 1));
		
		this.right.setPoints(1);
		this.right.setHighlighted((pointsRemaining >= 1));
	}
	
	if(this.jump != null) {
		this.jump.drawButtonAsActive(jumping);
		this.jump.setHighlighted((jumping || this.unit.jumpCapable));
	}
}

c.updateActionPoints = function() {
	var ap = this.unit.apRemaining;
	this.center.setPoints(ap);
}

c.updateJumpPoints = function(jp) {
	var jp = this.unit.jpRemaining;
	if(this.jump != null) {
		this.jump.setPoints(jp);
	}
}

c.drawCenterAsFireButton = function(drawAsFire) {
	if(this.center == null) return;
	
	this.uncache;
	
	this.center.drawCenterAsFireButton(drawAsFire, false);
	
	this.doCache();
}

c.drawButtonAsActive = function(controlType, active) {
	this.uncache();
	
	var control = null;
	if(PlayerControl.TYPE_BACKWARD == controlType) {
		control = this.backward;
	}
	else if(PlayerControl.TYPE_FORWARD == controlType) {
		control = this.forward;
	}
	else if(PlayerControl.TYPE_LEFT == controlType) {
		control = this.left;
	}
	else if(PlayerControl.TYPE_RIGHT == controlType) {
		control = this.right;
	}
	else if(PlayerControl.TYPE_CENTER == controlType) {
		control = this.center;
	}
	else if(PlayerControl.TYPE_JUMP == controlType) {
		control = this.jump;
	}
	
	if(control != null) {
		control.drawButtonAsActive(active);
	}
	
	this.doCache();
	
	return control;
}

c.doCache = function() {
	if(Settings.get(Settings.GFX_CACHING) == Settings.GFX_PERFORMANCE){
		// caching only at the lowest gfx setting
		this.cache(0,0, this.width,this.height);
	}
}

window.PlayerControlsDisplay = createjs.promote(PlayerControlsDisplay, "Container");
}());