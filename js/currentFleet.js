ExistingFleet = function(){
    this.spawned = false
    this.total;
    this.ships = {}
    this.spawnMonth = 0;
}

ExistingFleet.prototype.collect = function(){
    var beforeYears = Object.keys(testShips);
    for (var i = 0; i < beforeYears.length; i++) {
        if (beforeYears[i] < clock.year){
            var beforeMonths = Object.keys(testShips[beforeYears[i]]);
            for (var j = 0; j < beforeMonths.length; j++) {
                var m = testShips[beforeYears[i]][beforeMonths[j]];
                for (var k = 0; k < m.length; k++) {
                    if (m[k].stages.year > clock.year){
                        this.addShips(beforeMonths[j], m[k]);
                    }
                }
            }
        }
    }

}

ExistingFleet.prototype.addShips = function(month, ship){
    if (!this.ships[month]){
        this.ships[month] = [ship];
    } else {
        this.ships[month].push(ship);
    }
}

ExistingFleet.prototype.spawnShips = function(){
    var m = this.ships[clock.months[this.spawnMonth]]
    if (m.length >= 6){
        spawner.preSpawn(m.splice(0, 6))
    }
    else if(spawner.preSpawn(m)){
        this.spawnMonth++
    }
    if (this.spawnMonth === 12){
        this.collected = true;
        this.spawnMonth = 0;
    }
}
