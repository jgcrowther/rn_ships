Seabed = function(){
    this.speed = 1;
    this.bedH = 30;
    this.baseH = 15;
    this.offset = (this.bedH/2) + (this.baseH/2);
    this.components = [];

    this.make = function(){
        var options = {
            isStatic: true,
            friction: 0
        }
        this.components.push(Bodies.rectangle(width/2, height, width*3, this.baseH, options));

        var options = {
            isStatic: true
        }
        this.components.push(Bodies.rectangle(width/2, height-this.offset, width, this.bedH, options));
        this.components.push(Bodies.rectangle(width/2 - width, height-this.offset, width, this.bedH, options));

        for (var i = 0; i < this.components.length; i++) {
            World.add(world, this.components[i]);
        }
    }
}

Seabed.prototype.update = function(){
    var seabase = this.components[0];
    // Draw seabase
    rectMode(CENTER);
    fill(0, 127, 0);
    rect(seabase.position.x, seabase.position.y, width, this.baseH);

    // Draw background for seabed to hide seam between two segments
    fill(127);
    rect(width/2, height-this.offset, width, this.bedH);

    // Draw / render seabed
    for (var i = 1; i < this.components.length; i++) {
        // Manually update position for visuals and velocity for static friction / conveyer belt movement of ships
        Body.setVelocity(this.components[i], createVector(this.speed, 0));
        Body.setPosition(this.components[i], createVector(this.components[i].position.x + this.speed, height-this.offset));

        // move seabed back to begining if its gone fully offscreen on right
        if(this.components[i].position.x > width/2 + width){
            Body.setPosition(this.components[i], createVector(width/2-width, this.components[i].position.y))
        }

        // draw seabed
        rect(this.components[i].position.x, this.components[i].position.y, width, this.bedH);
    }
}
