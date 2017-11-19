Ship = function(w, x, y, stages, name, type, graphic){
    this.name = name;
    this.type = type;
    this.vector = shipBodies[graphic].collider;
    this.img = shipBodies[graphic].graphic;
    this.x = x;
    this.y = y;
    this.h = this.img.height;
    this.w = this.img.width;
    // this.h = 10;
    // this.w = 10;
    this.stages = stages;
    this.stage = "commissioned";
    this.stageAction = false;
    this.preAnimation = false;
    this.finishedSinking = false;
    this.callout = false;
}

Ship.prototype.create = function(){
    // create ship after lane is chosen and add to matter.js world
    var options;
    if(this.stage == "commissioned"){
        options = {
            friction: 0,
            collisionFilter:{
                category: comCategory,
                mask: ignoreCategory
            }
        }
    } else if (this.stage == "sunk"){
        options = {
            friction: 1,
            frictionStatic: Infinity,
            collisionFilter:{
                category: sunkCategory,
                mask: defaultCategory | sunkCategory
            },
            render: {
                strokeStyle: '#FF0000',
                lineWidth: 2
            }
        }
    }
    try{
        this.body = Bodies.fromVertices(
            this.x,
            this.y - 10,
            this.vector,
            options
        );
    } catch(e){
        console.log(e);
    }

    //this.body = Bodies.rectangle(this.x, this.y, this.w, this.h, options);
    World.add(world, this.body);
    this.body.mass = 50;

    // Initial force (so it does not slowly accelerate from 0)
    if(this.stage == "commissioned"){
        Body.applyForce(this.body, this.body.position, createVector(-0.5, 0));
    }

}

Ship.prototype.render = function(){
    var pos = this.body.position;
    noStroke();
    fill(255, 255, 255, 0);
    push();
    if(this.stage === "sunk"){
        tint(129, 169, 180, 200);
    }
    if(this.stage === "decommissioned"){
        tint(50, 50, 50, 200);
    }
    if(this.callout){
        tint(134, 25, 25, 240);
    }
    rectMode(CENTER);
    imageMode(CENTER);
    translate(pos.x, pos.y);
    rotate(this.body.angle);
    rect(0, 0, this.w, this.h);
    image(this.img, 0, 0, this.w, this.h);
    pop();
}

Ship.prototype.clicked = function(found){
    var pos = this.body.position;
    var d = dist(mouseX, mouseY, pos.x, pos.y)
    if(d < this.h / 2 && !this.callout && !found){
        this.callout = true;
        currentCallout = this;
        return(true);
    } else if(currentCallout === this){
        this.callout = false;
        currentCallout = null;
        return(false);
    } else {
        this.callout = false;
        return(false);
    }
}

Ship.prototype.drawCallout = function(){
    var pos = this.body.position;

    textAlign(CENTER);
    rectMode(CENTER);
    textSize(15);
    fill(255);
    var calloutPosX, calloutPosY;
    var calloutHeight = 70;
    var calloutTextWidth = textWidth(this.type) > textWidth(this.name) ? textWidth(this.type) : textWidth(this.name) + 20

    // Stop Callout from displaying offscreen when ship is near edge
    if(pos.x - (calloutTextWidth/2) < 0){
        calloutPosX = pos.x + ((pos.x - (calloutTextWidth/2)) * -1);
    } else if (pos.x + (calloutTextWidth/2) > width){
        calloutPosX = pos.x + ((pos.x + (calloutTextWidth/2) - width) * -1);
    } else {
        calloutPosX = pos.x;
    }
    console.log(pos.y);
    if(pos.y - (calloutHeight) < 0){
        calloutPosY = pos.y + ((pos.y - (calloutHeight)) * -1);
    } else {
        calloutPosY = pos.y;
    }

    rect(calloutPosX, calloutPosY - 40, calloutTextWidth, calloutHeight);
    fill(0);
    textSize(15);
    text(this.name, calloutPosX, calloutPosY - 45);
    textSize(10);
    text(this.type, calloutPosX, calloutPosY - 25);
}

Ship.prototype.applyWind = function(lane, i, pos){
    var wind = createVector(-0.005, 0);
    this.stopped = false;
    var slow = createVector(-0.08, 0);
    var currentLane = spawner.lanes[lane];

    //Apply wind until ship is a set distance from ship ahead or edge of canvas
    if(i != 0 && currentLane.ships[i-1].body.position.x + (this.w + (currentLane.spacing*4)) < pos.x){
        Body.applyForce(this.body, this.body.position, wind);
    } else if(i == 0 && pos.x > this.w + (currentLane.spacing*4.5)){
        Body.applyForce(this.body, this.body.position, wind);
    } else if(this.body.velocity.x < -0.05){
        Body.applyForce(this.body, this.body.position, createVector(0.01, 0));
    } else {
        this.stopped = true;
    }

    // Allows ship to continue moving forward to close gap with ship ahead
    if(this.stopped
    && i != 0
    && currentLane.ships[i-1].body.position.x + (this.w + (currentLane.spacing*1.2)) < pos.x
    ){
        Body.applyForce(this.body, this.body.position, slow);
    } else if (this.stopped && i == 0 && pos.x > this.w*2 + (this.w/2)){
        Body.applyForce(this.body, this.body.position, slow);
    }
}

Ship.prototype.applyWave = function(pos){
    var wf;
    var forcePos;
    // Create vector depnding upon how much ship is from it's origional position
    if(pos.y - this.y <= -5){
        wf = random(0, 0.005);
        wave = createVector(0, wf);
    } else if(pos.y - this.y >= 5){
        wf = random(0, -0.005);
        wave = createVector(0, wf);
    } else {
        wf = random(-0.005, 0.005);
        wave = createVector(0, wf);
    }

    // use wave vector to decide where the force is applied
    if(wf < 0){
        var adjustment = createVector(0, -(this.w/2));
        forcePos = createVector(pos.x, pos.y);
        forcePos.sub(adjustment);
    } else if (wf > 0){
        var adjustment = createVector(0, +(this.w/2));
        forcePos = createVector(pos.x, pos.y);
        forcePos.sub(adjustment);
    } else {
        forcePos = pos;
    }

    // add rotation based on y axis movement
    // if(this.stage == "decommissioned"){
    //     this.body.angle = radians(0);
    //     this.body.torque = -(wf);
    // }
    // this.body.torque = -(wf/800);
    this.body.angle -= radians(wf*5);

    Body.applyForce(this.body, forcePos, wave);
}

Ship.prototype.removeGravity = function(){
    var removeGrav = createVector(0, -engine.world.gravity.y*(engine.world.gravity.scale*this.body.mass));
    // remove gravity
    Body.applyForce(this.body, this.body.position, removeGrav);
}

Ship.prototype.setOffScreen = function(i){
    spawner.offScreen.push(this);
    if(i === 0){
        spawner.noLane.splice(i, 1);
    } else {
        spawner.noLane.splice(i, 1);
    }

    World.remove(world, this.body);
}

Ship.prototype.decomActions = function(i, lane, pos){
    var wind = createVector(-0.002, 0);


    if(!this.stageAction){
        this.stageAction = true;
        spawner.noLane.push(this);
        spawner.decommissioned.push(this);
        spawner.lanes[lane].removeShip(i, this);
    }

    if(!(pos.x + this.w < 0)){
        Body.applyForce(this.body, this.body.position, wind);
    } else {
        this.setOffScreen(i);
    }
}

Ship.prototype.sinkingForce = function(){
    // apply upward force to counter gravity, some randomness for each frame
    var sinkAmmount = random(0.97, 0.98);
    var sinkForce = createVector(0, -(engine.world.gravity.y * (engine.world.gravity.scale*this.body.mass)) * sinkAmmount);
    Body.applyForce(this.body, this.body.position, sinkForce);

    // apply random left or right force to simulate current
    if(this.body.velocity.y > 0.02){
        var sinkCurrent = createVector(random(-0.01, 0.01), 0);
        Body.applyForce(this.body, this.body.position, sinkCurrent);
    }
}

Ship.prototype.stageCheck = function(){
    if(this.stages.year == clock.year && this.stages.month == clock.months[clock.month]){
        this.stage = this.stages.stage;
        this.roll = random(0, 1);
    }
}

Ship.prototype.sunkActions = function(lane, i, pos){
    var moveOffScreen = createVector(0.0002, 0);
    Body.applyForce(this.body, this.body.position, moveOffScreen);

    // Check if ship is still on screen, if not set to be removed.
    if(pos.x - this.w > width){
        this.setOffScreen(i);
    } else if(!this.preAnimation){
        // Rotate to left or right before actually sinking, based on 50/50 roll
        if (this.roll < 0.5){
            Body.rotate(this.body, -PI/360);
        } else {
            Body.rotate(this.body, PI/360);
        }

        // Stop rotation at random point
        if (this.body.angle > radians(random(15, 55))
        || this.body.angle < radians(random(-55, -15))){
            this.preAnimation = true;
        }

        this.removeGravity();
        this.applyWave(pos);
    } else if (!this.stageAction){
        // spawner.lanes[lane].ships.splice(i, 1);
        spawner.lanes[lane].removeShip(i, this);
        this.x = pos.x;
        this.y = pos.y;
        this.angle = this.body.angle;
        World.remove(world, this.body);
        this.create();
        Body.rotate(this.body, this.angle);
        spawner.noLane.push(this);
        spawner.sunkShipsTotal += 1;
        this.stageAction = true;
    } else if(this.body.velocity.y > 0.001 && !this.finishedSinking){
        this.sinkingForce();
    } else {
        this.finishedSinking = true;
        // Body.applyForce(this.body, this.body.position, moveOffScreen.mult(90));
    }
}

Ship.prototype.update = function(lane, i){
    // this.lane = spawner.lanes[lane];
    var pos = this.body.position;

    this.stageCheck();

    if(this.stage == "sunk"){
        this.sunkActions(lane, i, pos);
    }

    if(this.stage == "decommissioned"){
        this.removeGravity();
        this.decomActions(i, lane, pos);
        this.applyWave(pos);
    }

    if(this.stage == "commissioned"){
        this.removeGravity();
        this.applyWind(lane, i, pos);
        this.applyWave(pos);
    }

    this.render();

}
