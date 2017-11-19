// matter.js aliases
var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Vertices = Matter.Vertices,
    Svg = Matter.Svg,
    Body = Matter.Body,
    Render = Matter.Render,
    Runner = Matter.Runner;

// matter.js script specific variables
var engine, world, mRender, mRunner;

// collision categories
var defaultCategory = 0x0001,
    sunkCategory = 0x0002,
    comCategory = 0x0004,
    ignoreCategory = 0x0008;


//script variables
var ships = [];
var lanes = [];
var currentCallout;
var spawner = new Spawner();
var clock = new Clock(1800, "12-01-" + String(new Date().getFullYear()));
var existingFleet = new ExistingFleet;
var backgroundTile,
    seabed,
    seabedImage,
    shipData,
    displayFrom,
    displayTo,
    displayTime,
    inputFromTime,
    inputToTime,
    textShipsDecom,
    textShipsSunk,
    textShipsTotal;
var mouseIsDragged = false;
var userRun = false;
var testShips = {};
var shipBodies = {
    "1600-sm": {},
    "1600-md": {},
    "1600-bg": {},
    "1890-sm": {},
    "1890-md": {},
    "1890-bg": {},
    "1890-car": {},
    "1890-sub": {},
    "1930-sm": {},
    "1930-md": {},
    "1930-bg": {},
    "1930-car": {},
    "1930-sub": {},
    "2000-sm": {},
    "2000-md": {},
    "2000-bg": {},
    "2000-car": {},
    "2000-sub": {}
}

function getVectors(svg){
    // returns a vertexset from an svg, which acts as the collider shape for ships
    var vertexSets = [];
    $.get(svg).done(function(data){
        $(data).find('path').each(function(i, path){
            var points = Svg.pathToVertices(path);
            vertexSets.push(points);
        });
    });
    return vertexSets;
}

function loadShipBodies(){
    // load graphics and colliders into shipBodies object
    for(key in shipBodies){
        var sb = shipBodies[key];
        sb.graphic = loadImage("images/" + str(key) + ".png");
        sb.collider = getVectors("vectors/" + str(key) + ".svg");
        //sb.graphic = loadImage("1600-sm.png");
        //sb.collider = getVectors("1600-sm.svg");
    }
}

function preload(){
    loadShipBodies();
    shipData = loadJSON("js/ships.json");
}

function setGraphic(year, length, type){
    // assigns graphic / collider element of ship by checking year, size and keywords
    var graphics = {
        1600: {"md": 100, "sm": 30},
        1890: {"md": 150, "sm": 60},
        1930: {"md": 150, "sm": 60},
        2000: {"md": 100, "sm": 90}
    }
    var selectedYear;
    var selectedGraphic;
    for (var key in graphics) {
        if (graphics.hasOwnProperty(key) && year > parseInt(key)) {
            selectedYear = key;
        }
    }

    // for (var key in graphics[selectedYear]) {
    //     var sizeCheck = graphics[selectedYear][key];
    //     if (graphics[selectedYear].hasOwnProperty(key)) {
    //         if(length < sizeCheck){
    //             selectedGraphic = str(selectedYear) + "-" + key;
    //         } else if (/submarine/i.test(type)){
    //             selectedGraphic = str(selectedYear) + "-sub"
    //         } else if (/carrier/i.test(type)){
    //             selectedGraphic = str(selectedYear) + "-car"
    //         } else {
    //             selectedGraphic = str(selectedYear) + "-bg"
    //         }
    //     }
    // }

    // Assign file name based on ship length:
    if (length < graphics[selectedYear].sm){
        selectedGraphic = str(selectedYear) + "-sm"
    } else if (length < graphics[selectedYear].md) {
        selectedGraphic = str(selectedYear) + "-md"
    } else {
        selectedGraphic = str(selectedYear) + "-bg"
    }
    if (/submarine/i.test(type)){
        selectedGraphic = str(selectedYear) + "-sub"
    }
    if (/carrier/i.test(type)){
        selectedGraphic = str(selectedYear) + "-car"
    }

    return selectedGraphic;
}

function createShips(){

    for(var key in shipData){
        var ship = shipData[key];

        // Find months and years in data
        var spawnMonth = ship.start.match(/\w+/);
        var spawnYear = ship.start.match(/\d+/);
        var endMonth = ship.end.match(/\w+/);
        var endYear = ship.end.match(/\d+/);

        // Ships in service have an end month of unknown, to stop it skipping we set date in future.
        if (endMonth == "Unknown"){
            endMonth = "January";
            endYear = 2050;
        }

        // Skip if no endYear is found.
        if (!endYear){
            continue;
        }

        spawnMonth = str(spawnMonth[0]);
        spawnYear = parseInt(spawnYear[0]);
        endMonth = str(endMonth[0]);
        endYear = parseInt(endYear[0]);

        // Sometimes end year is before spawn year, skip these cases
        if(spawnYear > endYear){
            continue;
        }

        // Fetch graphic
        var graphic = setGraphic(spawnYear, ship.length, ship.type);

        // Check if spawnMonth and endMonth are months in the clock object
        if (clock.months.indexOf(spawnMonth) == -1){
            spawnMonth = "January";
        } else if (clock.months.indexOf(endMonth) == -1){
            endMonth = "December";
        }

        // Regex added as previous if statement doesn't seem to catch all cases.
        if(!endMonth.match(/January|February|March|April|May|June|July|August|September|October|November|December/g)){
            endMonth = "December";
        }

        var s = new Ship(
            ship.length/4,
            width+15,
            height/2,
            {stage: ship.fate, year: endYear, month: endMonth},
            ship.name,
            ship.type,
            graphic
        );

        if (!testShips[spawnYear]){
            testShips[spawnYear] = {};
        }

        if(!testShips[spawnYear][spawnMonth]){
            testShips[spawnYear][spawnMonth] = [s];
        } else {
            testShips[spawnYear][spawnMonth].push(s);
        }
    }
}

function calcTime(){
    var y = parseInt(inputFromTime.value());
    var t = parseInt(inputToTime.value());
    return y + t;
}

function updateDisplayTime(from){
    // update displayed time for animation to run to in browser
    inputFromTimeValue = inputFromTime.value();
    inputToTimeValue = inputToTime.value();

    if(inputToTimeValue < inputFromTimeValue && from === true){
        inputToTimeValue = inputFromTimeValue;
        inputToTime.value(inputFromTimeValue);
    } else if (inputToTimeValue < inputFromTimeValue && from === false){
        inputFromTimeValue = inputToTimeValue;
        inputFromTime.value(inputToTimeValue);
    }

    displayFrom.html(inputFromTimeValue);
    displayTo.html(inputToTimeValue);
}

function inputToTimeSnap(){
    if(inputToTime.value() < inputFromTime.value()){
        inputToTime.value(inputFromTime.value());
    }
}

function setInput(){
    // starts/restarts animation with chosen start date and run time
    userRun = !userRun;
    if(inputPlay.value() == "Play"){
        // reset clock to selected time and restart animation
        inputPlay.value("Stop");
        inputPlay.addClass("playing");
        clock = new Clock(
            parseInt(displayFrom.html()),
            "12-12-" + str(displayTo.html())
        );
    } else {
        inputPlay.value("Play");
        inputPlay.removeClass("playing")
        // remove everything from engine and on screen
        spawner.reset();
        testShips = {};
        createShips();
    }
}

function renderBackground(){
    var bgTileX = Math.ceil(width/500);
    var bgTileY = Math.ceil(height/500);
    var TileLoopCount = bgTileX * bgTileY;
    var bgXPos = 0;
    var bgYPos = 0;
    for (var i = 0; i < TileLoopCount; i++) {
        if(i !== 0){
            if(i % bgTileX === 0){
                bgXPos = 0;
            } else {
                bgXPos += 500;
            }
            if(bgXPos === 0){
                bgYPos += 500;
            }
        }

        image(backgroundTile, bgXPos, bgYPos, 500, 500);
    }
}

function setup(){
    var canvas = createCanvas(800, 2500);
    backgroundTile = loadImage("images/wave_background.jpg");
    seabedImage = loadImage("images/seabed.png");
    canvas.parent('canvas-content');
    inputFromTime = select('#from-slider');
    inputToTime = select('#to-slider');
    inputPlay = select('#nav-wheel');
    displayTime = select("#year-number");
    displayFrom = select("#from-date-no");
    displayTo = select("#to-date");
    textShipsDecom = select("#decom-number");
    textShipsSunk = select("#sunk-number");
    textShipsTotal = select("#total-number");

    inputToTime.mousePressed(function(){mouseIsDragged = true});
    inputToTime.mouseReleased(function(){mouseIsDragged = false;});
    inputToTime.mouseMoved(function(){if(mouseIsDragged) updateDisplayTime(false)});

    inputFromTime.mousePressed(function(){mouseIsDragged = true});
    inputFromTime.mouseReleased(function(){mouseIsDragged = false});
    inputFromTime.mouseMoved(function(){if(mouseIsDragged) updateDisplayTime(true)});


    inputPlay.mouseClicked(setInput);

    updateDisplayTime();

    engine = Engine.create({
        enableSleeping: true,
    });
    world = engine.world;

    // mRender = Render.create({
    //     element: document.body,
    //     canvas: document.getElementById("#defaultCanvas0"),
    //     engine: engine,
    //     options: {
    //             width: width,
    //             height: height
    //         }
    // });

    mRunner = Runner.create();


    //initiate first ship lane
    lanes.push(new Lane(50));

    // add a seabed to stop things falling off the canvas
    seabed = new Seabed();
    seabed.make();

    // makeShips();
    createShips();

    // Example testShip
    // test = {
    //     "1800": {
    //         "January": [
    //             new Ship(width+5, height/2, {stage: "sunk", year: 1800, month:"July"})
    //         ],
    //         "March": [
    //             new Ship(width+5, height/2, {stage: "sunk", year: 1806, month:"December"}),
    //             new Ship(width+5, height/2, {stage: "sunk", year: 1804, month:"May"}),
    //             new Ship(width+5, height/2, {stage: "sunk", year: 1809, month:"July"}),
    //             new Ship(width+5, height/2, {stage: "sunk", year: 1810, month:"January"}),
    //             new Ship(width+5, height/2, {stage: "sunk", year: 1807, month:"March"})
    //         ]
    //     }
    // }
}

function draw(){
    background(125, 165, 175);
    renderBackground();
    //Engine.update(engine);

    Runner.tick(mRunner, engine);
    //Render.run(mRender);

    // month advances every 5 frames / 1 year per second
    if(frameCount % 5 == 0 && userRun){
        var shipsYear;

        // Spawn ships that were commissioned and still in service before selected year
        if (spawner.allShips.length === 0){
            console.log("x")
            existingFleet.collect();
        }
        if (!existingFleet.spawned){
            existingFleet.spawnShips();
        }

        if(testShips[clock.year]){
            shipsYear = testShips[clock.year];
        } else {
            shipsYear = {}
        }

        /* Spawn ships in current year/month, time will not progress until
        they are on screen */
        if(existingFleet.collected && shipsYear[clock.months[clock.month]]
        && shipsYear[clock.months[clock.month]].length > 0
        ){
            var m = shipsYear[clock.months[clock.month]]
            if(spawner.preSpawn(m)){
                delete shipsYear[clock.months[clock.month]];
            }
            // var s = shipsYear[clock.months[clock.month]][0];
            //
            // if(!s.spawned){
            //     spawner.spawn(s);
            //     s.spawned = true;
            // }
            //
            // if(s.body.position.x < width - (s.w/2)){
            //     shipsYear[clock.months[clock.month]].splice(0, 1);
            // }

        }

        /* Update year and month in clock.js*/
        clock.update(shipsYear);
    }

    // Do stuff if user has seleted play or stop.
    if(userRun){
        spawner.update();
        seabed.update();
        displayTime.html(clock.year);
        displayTime.style("color", "Seagreen")
    }

    if(!userRun){
        existingFleet.spawned = false;
        displayTime.style("color", "Darkred")
        displayTime.html(displayFrom.html());
    }

    // draw location of current callout
    for (var i = 0; i < spawner.allShips.length; i++) {
        ship = spawner.allShips[i];
        if (ship.callout){
            ship.drawCallout();
        }
    }

    // update figure for total active ships
    var totalActive = 0;
    for (var i = 0; i < spawner.lanes.length; i++) {
        lane = spawner.lanes[i];
        for (var j = 0; j < lane.ships.length; j++) {
            ship = lane.ships[j];
            totalActive++;
        }
    }

    textShipsDecom.html(spawner.decommissioned.length);
    textShipsSunk.html(spawner.sunkShipsTotal);
    textShipsTotal.html(totalActive);

    // Visual representation of seabed
    image(seabedImage, 0, height-80);

}

function mousePressed(){
    found = false;
    for (var i = 0; i < spawner.allShips.length; i++) {
        ship = spawner.allShips[i];
        if(ship.clicked(found)){
            found = true;
        }
    }
}
