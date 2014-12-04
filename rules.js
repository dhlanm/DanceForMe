// Credit to Simon Sarris for initial framework. 
// www.simonsarris.com

var myState;
var jumpStr=10;		   //default to 10
var maxProj=3;		   //default to 3
var playerSpeed=8;	   //default to 5
var deathfloattime=40; //time the player can hang in the air at their starting spot before falling
var maxhp=5;
var maxlives=5;
var ruleFrequency=10; //time in seconds
var gracePeriod=1; //time in seconds
var subscribedEvents = {
	'jump': [],
}

shapeProtoGen = function(type) {
	p = {
		draw: function(ctx) {
			ctx.fillStyle = this.fill;
			ctx.fillRect(this.x, this.y, this.w, this.h);
		}, 
		collides: function(shape, debug) {
			if(XCollision(this, shape) && YCollision(this, shape)) {
				if(softXCollision(new Shape(this.lastx, this.lasty, this.w, this.h), shape) || this.lastx==shape.x || this.lastx+this.w==shape.x+shape.w) {
					if(this.y<shape.y)
						return 'top';
					return 'bottom';
				}
				return 'side';
			}
			return false;
		}
	}
	if(type == "player") {
		p.willjump = function() {
			if(this.yv==0 && this.ya==0) {
				this.yv-=jumpStr;
				sendEvent('jump', p.player);
			}
			this.jumping=true;
		}
		p.leftkeypress = function() {
			this.direction='left';
			this.left=true;
		}
		p.down = function() {
			//go thru platform?
		}
		p.rightkeypress = function() {
			this.direction='right';
			this.right=true;
		}
		p.fire = function() {
			if(this.direction=='left') this.fireleft();
			else this.fireright();
		}
		p.fireright = function() {
			if(this.projectiles < maxProj) {
				myState.addProjectile(new Projectile(this.x+this.w, this.y+this.h/2-5, 10, 10, 'rgba('+String(255*(1-this.player))+',50,'+String(255*this.player)+',.8)', 6, this.player));
				this.projectiles++;
			}
		}
		p.fireleft = function() {
			if(this.projectiles < maxProj) {
				myState.addProjectile(new Projectile(this.x, this.y+this.h/2-5, 10, 10, 'rgba('+String(255*(1-this.player))+',50,'+String(255*this.player)+',.8)', -6, this.player));
				this.projectiles++;
			}
			//console.log(this.player, this.projectiles)
		}
		p.unjump = function() {
			this.jumping=false;
		}
		p.leftkeyup = function() {
			this.left=false;
		}
		p.rightkeyup = function() {
			this.right=false;
		}
	}
	return p
}

Shape = function(x, y, w, h, fill, mobile, speed) {
	this.x = x || 0;
	this.y = y || 0;
	this.w = w || 20;
	this.h = h || 20;
	this.fill = fill || '#AAAAAA';
	this.speed = speed || 5; 
	this.mobile = mobile || false; 
}
Shape.prototype = shapeProtoGen("shape")


Projectile = function(x, y, w, h, fill, xv, player){
	this.x = x || 0;
	this.y = y || 0;
	this.w = w || 1;
	this.h = h || 1;
	this.fill = fill || '#AAAAAA';
	this.xv = xv || 1;
	this.player = player || 0;
}
Projectile.prototype = shapeProtoGen("projectile"); 

Player = function(x, y, w, h, fill, speed, player) {
	Shape.apply(this,arguments)
	this.x = x || 0;
	this.y = y || 0;
	this.w = w || 20;
	this.h = h || 20;
	this.fill = fill || '#AAAAAA';
	this.speed = speed || 5; 
	this.player = player || 0;
	this.yv = 0;
	this.ya = .05*this.h;
	this.lastx = x;
	this.lasty = y;
	this.startx = x;
	this.starty = y;
	this.projectiles = 0;
	this.hp = maxhp;
	this.lives = maxlives;
	this.left = false;
	this.right = false;
	this.jumping = false;
	this.mobile = true;
}
Player.prototype = shapeProtoGen("player"); 

function between(x, min, max) {
	return x > min && x < max;
}
function exbetween(x, min, max) {
	return x >= min && x <= max;
}


softXCollision = function(shape0, shape1) {
	if((between(shape0.x, shape1.x, shape1.x+shape1.w) || between(shape1.x, shape0.x, shape0.x+shape0.w) || shape0.x==shape1.x || shape0.x+shape0.w==shape1.x+shape1.w))
		return true;
	return false
}
XCollision = function(shape0, shape1) {
	if((exbetween(shape0.x, shape1.x, shape1.x+shape1.w) || exbetween(shape1.x, shape0.x, shape0.x+shape0.w)))// || (exbetween(shape0.x, shape1.x, shape1.x+shape1.w) && exbetween(shape1.x, shape0.x, shape0.x+shape0.w))) 
		return true;
	return false
}
YCollision = function(shape0, shape1) {
	if(exbetween(shape0.y, shape1.y, shape1.y+shape1.h) || exbetween(shape1.y, shape0.y, shape0.y+shape0.h))
		return true;
	return false;
}


function CanvasState(canvas) {
  
	this.canvas = canvas;
	this.width = canvas.width;
	this.height = canvas.height;
	this.ctx = canvas.getContext('2d');
	// This complicates things a little but but fixes mouse co-ordinate problems
	// when there's a border or padding. See getMouse for more detail
	var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
	if (document.defaultView && document.defaultView.getComputedStyle) {
		this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
		this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
		this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
		this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
	}
	// Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
	// They will mess up mouse coordinates and this fixes that
	var html = document.body.parentNode;
	this.htmlTop = html.offsetTop;
	this.htmlLeft = html.offsetLeft;

	this.collidables = [];  // the collections of things to be drawn
	this.projectiles = [];
	this.noncollidables = [];
	this.players = [];
	this.ruleText = '';
	
	myState = this;
	var sX;
	var sY;
	//fixes a problem where double clicking causes text to get selected on the canvas
	canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
	this.addPlayer(new Player(10,100,20,20,'rgba(255,0,0,.6)', playerSpeed, 0));
	this.addPlayer(new Player(canvas.width-10,100,20,20,'rgba(0,0,255,.6)', playerSpeed, 1));
	this.blitHp(this.players[0]);
	this.blitHp(this.players[1]);
	this.addCollidable(new Shape(370,550,80,20,'rgba(0,0,0,.6)'));
	this.addCollidable(new Shape(460,500,80,20,'rgba(0,0,0,.6)'));
	this.addCollidable(new Shape(550,550,80,20,'rgba(0,0,0,.6)'));
	
	this.drawFrequency = 30;
	this.drawInterval = setInterval(function() { myState.draw(); }, myState.drawFrequency);

	this.physFrequency = 30;
	this.physInterval = setInterval(function() { myState.update(myState.physFrequency/1000); }, myState.physFrequency); 
	
	this.ruleFrequency = ruleFrequency*1000;
	this.ruleInterval = setInterval(function() { pushRule(); }, myState.ruleFrequency);
	//pushRule();

}

CanvasState.prototype.addCollidable = function(shape) {
	this.collidables.push(shape);
}
CanvasState.prototype.addProjectile = function(shape) {
	this.projectiles.push(shape);
}
CanvasState.prototype.addPlayer = function(shape) {
	this.players.push(shape);
}
CanvasState.prototype.addNonCollidable = function(shape) {
	this.noncollidables.push(shape);
}
CanvasState.prototype.addRuleText = function(text) {
	this.ruleText = { text: text, alpha: 1 };
} 

CanvasState.prototype.blitHp = function(player) {
	for(var i=0; i<player.hp; i++) {
		this.addNonCollidable(new Shape(10+915*player.player+15*i, 40, 10, 10, 'rgba('+String(255*(1-player.player))+',0,'+String(255*player.player)+', .4)'));
	}
	for(var i=0; i<player.lives; i++) {
		this.addNonCollidable(new Shape(10+915*player.player+15*i, 55, 10, 10, 'rgba('+String(255*(1-player.player))+',100,'+String(255*player.player)+', .4)'));
	}
}

CanvasState.prototype.clear = function() {
	this.ctx.clearRect(0, 0, this.width, this.height);
}


CanvasState.prototype.update = function(dt) {
	var ctx = this.ctx;
	var collidables = this.collidables;
	var noncollidables = this.noncollidables;
	var projectiles = this.projectiles
	var players = this.players;
	for(var i=0; i<players.length; i++) {
		if(players[i].jumping) {
			if(players[i].yv==0 && players[i].ya==0) {
				players[i].yv-=jumpStr;
				sendEvent('jump', p.player);
			}
		}
	}
	for (var i = 0; i < players.length+collidables.length; i++) {
		incoll=false;
		if(i>=players.length)
			shape = collidables[i-players.length];
		else
			shape = players[i];
		if(shape.mobile) {
			shape.lastx=shape.x;
			shape.lasty=shape.y;
			shape.yv+=shape.ya;
			shape.y+=shape.yv;
			if(shape.yv>19)
				shape.yv=19; //no falling through blocks!
			if(shape.left) {
				shape.x-=shape.speed;
			}
			else if(shape.right) {
				shape.x+=shape.speed;
			}
			for (var j = 0; j < players.length+collidables.length; j++) {
				if(j>=players.length)
					collider = collidables[j-players.length];
				else
					collider = players[j];
				if(j!=i) {
					coll=shape.collides(collider)
					if(coll) {
						if(coll=='top') {
							shape.y=collider.y-shape.h;
							shape.yv=0;
							shape.ya=0;
							incoll=true;
						}
						else if(coll=='bottom') {
							shape.y=collider.y+collider.h;
							shape.yv=0;
							shape.ya=.05*shape.h;
						}
						else {
							if(shape.x<collider.x) 
								shape.x=collider.x-shape.w;
							else
								shape.x=collider.x+collider.w;
						}
					}
					
				}					
			}
			//thisrps=shape.getRotPoints()
			if(shape.y<0) {
				shape.y=0;
				shape.yv=0;
				shape.ya=.05*shape.h;
				incoll=true;
			}
			if(shape.y+shape.h>=this.height) {
				shape.y=this.height-shape.h;
				shape.yv=0;
				shape.ya=0;
				incoll=true;
				//console.log("Shape hit ground");
			}
			if(shape.x+shape.w>=this.width) {
				shape.x=this.width-shape.w;
			}
			if(shape.x<0) {
				shape.x=0;
			}
			if(!incoll) {
				shape.ya=.05*shape.h;
			}
		}
	}
	for(var i=0; i<projectiles.length; i++) {
		proj=projectiles[i];
		proj.x+=proj.xv;
		for (var j = 0; j < players.length+collidables.length; j++) { 
			if(j<players.length)
				coll = proj.collides(players[j])
			else
				coll = proj.collides(collidables[j-players.length])
			if(coll) {
				if(j==0 && proj.player==1) { //THIS ASSUMES ONLY 2 PLAYERS!
					players[0].hp--;
					projectiles.splice(i,1);
					players[proj.player].projectiles--;
					this.noncollidables=[];
					this.blitHp(players[0]);
					this.blitHp(players[1]);
					noncollidables=this.noncollidables;
				}
				else if(j==1 && proj.player==0) {
					players[1].hp--;
					projectiles.splice(i,1);
					players[proj.player].projectiles--;
					this.noncollidables=[];
					this.blitHp(players[0]);
					this.blitHp(players[1]);
					noncollidables=this.noncollidables;
				}
				else if(j!=proj.player) {
					projectiles.splice(i,1);
					players[proj.player].projectiles--;
				}
			}				
		}
		//console.log(proj)	
		
	}
	for(var i=0; i<players.length; i++) {
		if(players[i].hp<=0) {
			if(players[i].lives>0) {
				players[i].lives--;
				players[i].hp = 5;
				players[i].x=players[i].startx;
				players[i].y=players[i].starty;
				players[i].mobile=false;
				players[i].floatticks=deathfloattime;
				this.noncollidables=[];
				this.blitHp(players[0]);
				this.blitHp(players[1]);
				noncollidables=this.noncollidables;
				console.log(players[i], "lost a life");
			}
			else players[i].fill = 'rgba(255, 255, 255, .6)';
		}
		if(players[i].floatticks==0) {
			players[i].mobile=true;
			players[i].ya=.05*players[i].h;
			players[i].floatticks=-1;
		} else if(players[i].floatticks<deathfloattime*.75) {
			players[i].mobile=true;
		} else if(players[i].floatticks>0) {
			players[i].floatticks--;
		}
	}
}
CanvasState.prototype.draw = function() {
	this.clear();
	drawobjects(this.collidables)
	drawobjects(this.noncollidables)
	drawobjects(this.projectiles)
	drawobjects(this.players)
	if(this.ruleText && this.ruleText.alpha>0) {
		this.ctx.textAlign="center";
		this.ctx.font = "italic 20pt Arial";
		this.ctx.fillStyle= 'rgba(0,0,0,'+String(this.ruleText.alpha)+')';
		this.ctx.fillText(this.ruleText.text, this.canvas.width/2, this.canvas.height/2);
		this.ruleText.alpha-=.005;
	}
	//console.log(players[0].ya);
}
drawobjects = function (array) {
	var length = array.length;
	for (var i = 0; i < length; i++) {
		var shape = array[i];
		// We can skip the drawing of elements that have moved off the screen:
		if (shape.x > myState.width || shape.y > myState.height ||
			shape.x + shape.w < 0 || shape.y + shape.h < 0) {
			x=array[i]
			if(x.player!=null)
				myState.players[x.player].projectiles--;
			array.splice(i,1);
			console.log("Out of bounds shape removed");
			continue;
		}
		array[i].draw(myState.ctx);
	}
}

sendEvent = function(event, player) {
	if(subscribedEvents[event]) {
		var eList=subscribedEvents[event];
		for(var i=0; i<eList.length; i++) {
			if(eList[i](event, player)) {
				console.log("Rule Broken!");
			}
		}
	}
}

pushRule = function() {
	var rule = getRule();
	console.log(rule, rule.sublist); 
	myState.addRuleText(rule.flavortext);
	grace = setInterval( function() { 
		for(var i=0; i<rule.sublist.length; i++) { 
			subscribedEvents[rule.sublist[i]].push(rule.rulebreak);
		}
		clearInterval(grace);
	}, (rule.gracePeriod || gracePeriod)*1000);
	
}

// Creates an object with x and y defined, set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about padding and borders
CanvasState.prototype.getMouse = function(e) {
	var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
	
	// Compute the total offset
	if (element.offsetParent !== undefined) {
		do {
			offsetX += element.offsetLeft;
			offsetY += element.offsetTop;
		} while ((element = element.offsetParent));
	}

	// Add padding and border style widths to offset
	// Also add the <html> offsets in case there's a position:fixed bar
	offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
	offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

	mx = e.pageX - offsetX;
	my = e.pageY - offsetY;
	
	// We return a simple javascript object (a hash) with x and y defined
	return {x: mx, y: my};
}

// If you dont want to use <body onLoad='init()'>
// You could uncomment this init() reference and place the script reference inside the body tag
//init();
function keypress(e) {
	//console.log(e.keyCode)
	player0=myState.players[0];
	player1=myState.players[1];
	if(e.keyCode==87) //w
		player0.willjump();
	if(e.keyCode==65) //a
		player0.leftkeypress();
	if(e.keyCode==83) //s
		player0.down();
	if(e.keyCode==68) //d
		player0.rightkeypress();
	if(e.keyCode==32) //space
		player0.fire();
	if(e.keyCode==37) //left
		player1.leftkeypress();
	if(e.keyCode==38) //up
		player1.willjump();
	if(e.keyCode==39) //right 	
		player1.rightkeypress();
	if(e.keyCode==40) //down
		player1.down();
	if(e.keyCode==13) //enter
		player1.fire()
}
function keyup(e) {
	player0=myState.players[0];
	if(e.keyCode==87) //w
		player0.unjump();
	if(e.keyCode==65) //a
		player0.leftkeyup();
	if(e.keyCode==68) //d
		player0.rightkeyup();
	if(e.keyCode==37) //left
		player1.leftkeyup();
	if(e.keyCode==38) //up
		player1.unjump();
	if(e.keyCode==39) //right
		player1.rightkeyup();
}

function getRotationPoint(x, y, x0, y0, phi) {
	xp=x0+(x-x0)*Math.cos(phi)+(y-y0)*Math.sin(phi);
	yp=y0-(x-x0)*Math.sin(phi)+(y-y0)*Math.cos(phi);
	return [xp,yp]; 
}


function init() {
	var s = new CanvasState(document.getElementById('canvas1'));
	$(document).keydown(keypress);
	$(document).keyup(keyup);
}
