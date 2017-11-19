Lane = function(pos){
    this.max = 20;
    this.ships = [];
    this.pos = pos;
    this.spacing = 10;
}

// Checks if there is available space to fit this ship in this lane
Lane.prototype.checkSpace = function(w){
    //return(this.max + w + this.spacing + 50 < width);
    var inFront = this.ships[this.ships.length-1];
    return inFront.body.position.x + (inFront.w / 2) + w < width - (width * 0.05);
}

Lane.prototype.shipInfront = function(){
    // return this.ships[this.ships.length-1].body.position.x > width - (this.ships[this.ships.length-1].w/2);
    return this.ships.length == 0 || this.ships[this.ships.length-1].body.position.x > (((width/30)-2)*30);
}

// Add ship to this lane, add to max for future checks
Lane.prototype.addShip = function(s){
    this.ships.push(s);
    this.max += s.w + this.spacing;
    s.create();
}

// Removes sunk/decom ship from lane, freeing up space for more ships
Lane.prototype.removeShip = function(i, s){
    if(this.max - (s.w + this.spacing) > 20){
        this.max -= s.w + this.spacing;
    }
    if(this.max < 20){
        this.max = 20;
    }
    this.ships.splice(i, 1);
}
