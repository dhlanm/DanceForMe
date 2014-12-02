// Credit to Simon Sarris for initial framework. 
// www.simonsarris.com

//todo list
//hp counter?
//map? 
//lose a life? 
//actual death? --meh, can be added when menus?
//pseudosocket? 
//RULES THAT MATTER!
//remember, each rule gets its own rulebreak function. How to do this? just for each rule set .rulebreak(), easy. rulelist.js should be its own file. 


//known bugs
//if two players are jumping on one another and the top player stops before the bottom player, the top player will hang in the air. 

var myState;
var jumpStr=10;		   //default to 10
var maxProj=3;		   //default to 3
var playerSpeed=5;	 //less than 20 for no bugs. default to 5
var deathfloattime=40; //time the player can hang in the air at their starting spot before falling
var maxhp=5;
var maxlives=5;

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
			if(this.yv==0 && this.ya==0)
				this.yv-=jumpStr;
			this.jumping=true;
		}
		p.leftkeypress = function() {
			this.xto-=20;
			this.direction='left';
			this.left=true;
		}
		p.down = function() {
			//go thru platform?
		}
		p.rightkeypress = function() {
			this.xto+=20;
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
			this.xto = this.x;
			this.left=false;
		}
		p.rightkeyup = function() {
			this.xto = this.x;
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
	this.xto = this.x;
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
	this.xto = this.x;
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
	
	myState = this;
	var sX;
	var sY;
	//fixes a problem where double clicking causes text to get selected on the canvas
	canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
	this.addPlayer(new Player(10,100,20,20,'rgba(255,0,0,.6)', playerSpeed, 0));
	this.addPlayer(new Player(500,100,20,20,'rgba(0,0,255,.6)', playerSpeed, 1));
	this.blitHp(this.players[0]);
	this.blitHp(this.players[1]);
	this.addCollidable(new Shape(300,550,80,20,'rgba(0,0,0,.6)'));
	
	this.interval = 30;
	setInterval(function() { myState.draw(); }, myState.interval);
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


CanvasState.prototype.draw = function() {
	var ctx = this.ctx;
	var collidables = this.collidables;
	var noncollidables = this.noncollidables;
	var projectiles = this.projectiles
	var players = this.players;
	this.clear();
	for(var i=0; i<players.length; i++) {
		if(players[i].left)
			players[i].xto-=20;
		if(players[i].right)
			players[i].xto+=20;
		if(players[i].jumping) {
			if(players[i].yv==0 && players[i].ya==0)
				players[i].yv-=jumpStr;
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
			if(shape.x>shape.xto) {
				shape.x-=shape.speed;
			}
			else if(shape.x<shape.xto) {
				shape.x+=shape.speed;
			}
			if(shape.yv==0 && shape.ya==0 && shape.x==shape.xto)
				continue
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
							shape.xto=shape.x;
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
				shape.xto=shape.x;
			}
			if(shape.x<0) {
				shape.x=0;
				shape.xto=shape.x;
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
				players[i].xto=players[i].x;
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
	drawobjects(collidables, collidables.length)
	drawobjects(noncollidables, noncollidables.length)
	drawobjects(projectiles, projectiles.length)
	drawobjects(players, players.length)
	//console.log(players[0].ya);
}
drawobjects = function (array, length) {
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
	/*if(e.keyCode==16) //shift	
		player0.fireleft();*/
	if(e.keyCode==37) //left
		player1.leftkeypress();
	if(e.keyCode==38) //up
		player1.willjump();
	if(e.keyCode==39) //right 	
		player1.rightkeypress();
	if(e.keyCode==40) //down
		player1.down();
	if(e.keyCode==96) //numpad0
		player1.fire()
	/*if(e.keyCode==13) //enter
		player1.fireleft();*/
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

function sleep(milliseconds) { //http://stackoverflow.com/questions/16873323/javascript-sleep-wait-before-continuing
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds){
			break;
		}
	}
}

function zeros(dimensions) { //http://stackoverflow.com/questions/3689903/how-to-create-a-2d-array-of-zeroes-in-javascript
	var array = [];

	for (var i = 0; i < dimensions[0]; ++i) {
		array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
	}

	return array;
}

function init() {
	var s = new CanvasState(document.getElementById('canvas1'));
	document.onkeydown=keypress;
	document.onkeyup=keyup;
}

// Now go make something amazing!
