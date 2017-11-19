Spawner = function(){
    this.lanes = [];
    this.freeLane = null;
    this.noLane = [];
    this.offScreen = [];
    this.decommissioned = [];
    this.sunkShipsTotal = 0;
    this.allShips = [];
    // Margin from top and spacing between lanes
    this.laneTopMargin = 40;
    this.laneYSpacing = 20;

    // Ships get added here after they have left the screen in main animation
    this.sunkShips = {
        1800: [],
        1825: [],
        1850: [],
        1875: [],
        1900: [],
        1925: [],
        1950: [],
        1975: [],
        2000: [],
        2025: []
    };
}

Spawner.prototype.checkLanes = function(s){
    // Checks if any current lanes can fit ship.
    for (var lane = 0; lane < this.lanes.length; lane++) {
        if (this.lanes[lane].ships.length == 0){
            this.freeLane = lane;
            break;
        } else if(this.lanes[lane].checkSpace(s.w) && !this.lanes[lane].shipInfront()){
            this.freeLane = lane;
            break;
        }
    }
}

Spawner.prototype.addToLane = function(s){
    // Adds ship to existing lane with space, or adds it to a new lane.
    if(this.freeLane != null){
        s.y = this.lanes[this.freeLane].pos;
        this.lanes[this.freeLane].addShip(s);
    } else {
        this.lanes.push(new Lane((this.lanes.length * this.laneYSpacing) + this.laneTopMargin));
        s.y = this.lanes[this.lanes.length - 1].pos;
        this.lanes[this.lanes.length - 1].addShip(s);
    }
}

Spawner.prototype.spawn = function(s){
    // Creates a new ship and adds to a lane.
    this.freeLane = null;
    this.checkLanes(s);
    this.addToLane(s);
    this.allShips.push(s);
}

Spawner.prototype.preSpawn = function(m){
    var allSpawned = 0;
    for (var i = 0; i < m.length; i++) {
        var s = m[i];
        var beforeShipsTest = s.stages.year >= clock.year

        if(!s.spawned && beforeShipsTest){
            this.spawn(s);
            s.spawned = true;
        }

        if(beforeShipsTest && s.body.position.x < width - (s.w/2 + (s.w * 0.1))){
            allSpawned += 1;
        }
    }
    return allSpawned == m.length;
}

Spawner.prototype.listSunkShip = function(s){
    //Loop through keys in this.sunkShips to find a match with s.stages.endYear
    var sunkShips = this.sunkShips
    for(var key in sunkShips){
        if(!sunkShips.hasOwnProperty(key)){
            continue;
        } else if(parseInt(key) <= s.stages.year && parseInt(key)+24 >= s.stages.year){
            sunkShips[key].push(s);
        }
    }
}

Spawner.prototype.update = function(){
    // Triggers update function in ship objects, updating positions etc
    for (var i =  this.noLane.length-1; i >= 0; i--) {
        this.noLane[i].update(null, i);
    }

    for (var i = this.offScreen.length-1; i >= 0; i--) {
        if (this.offScreen[i].stage == "sunk"){
            this.listSunkShip(this.offScreen[i]);
        }

        this.offScreen.splice(i ,1);
    }

    for (var lane = 0; lane < this.lanes.length; lane++) {
        for (var i = this.lanes[lane].ships.length - 1; i >= 0; i--) {
            this.lanes[lane].ships[i].update(lane, i);
        }
        // for (var i = 0; i < this.lanes[lane].length; i++) {
        //     this.lanes[lane].ships[i].update(lane, i);
        // }
    }

}

Spawner.prototype.reset = function(){
    // removes all ships from world and overwrites arrays
    for (var i =  this.noLane.length-1; i >= 0; i--) {
        var s = this.noLane[i];
        World.remove(world, s.body);
    }
    for (var lane = 0; lane < this.lanes.length; lane++) {
        for (var i = this.lanes[lane].ships.length - 1; i >= 0; i--) {
            var s = this.lanes[lane].ships[i];
            World.remove(world, s.body);
        }
    }
    for (key in this.sunkShips){
        this.sunkShips[key] = [];
    }    
    this.sunkShipsTotal = 0;
    this.allShips = [];
    this.lanes = [];
    this.noLane = [];
    this.offScreen = [];
    this.decommissioned = [];
}
