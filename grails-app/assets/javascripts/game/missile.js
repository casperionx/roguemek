/**
 * Generates a missile with some effects
 */
function Missile(x, y, angle, config) {
	this.conf = {
		missileLength: 10,
		missileWidth: 2,
		missileColor: "#333333",
		burnerRadius: 2.5,
		burnerColor: "#FF9900",
		burnerGlowSize: 20,
		burnerGlowColor: "#FF3300"
	};
	this.initialize(x, y, angle, config);
}
Missile.prototype = new createjs.Container();
Missile.prototype.Container_initialize = Missile.prototype.initialize;
Missile.prototype.initialize = function(x, y, angle, config) {
	this.Container_initialize();
	this.x = x;
	this.y = y;
	this.angle = angle;
	
	//copying configuration
	for(var opt in config){
		this.conf[opt] = config[opt];
	}
	
	// TODO: update needs to be run on tick to give LRMs a curved flight path
	//this.on("tick", this.update);
	this.update();
}
Missile.prototype.update = function() {
	// draw the missile body as a small line
	var ordinance = new createjs.Shape();
	var ordDestination = getMovementDestination(0, 0, this.conf.missileLength, this.angle);
	ordinance.graphics.setStrokeStyle(this.conf.missileWidth, "round").beginStroke(this.conf.missileColor).moveTo(0, 0).lineTo(ordDestination.x, ordDestination.y).endStroke();
	this.addChild(ordinance);
	
	// draw the afterburner with a glow (shadow)
	var burner = new createjs.Shape();
	var burnLength = -1*(this.conf.burnerRadius);
	var burnDestination = getMovementDestination(0, 0, burnLength, this.angle);
	burner.shadow = new createjs.Shadow(this.conf.burnerGlowColor, burnDestination.x, burnDestination.y, this.conf.burnerLength);
	burner.graphics.beginStroke(this.conf.burnerColor).beginFill(this.conf.burnerColor).drawCircle(0, 0, this.conf.burnerRadius).endStroke();
	this.addChild(burner);
}
