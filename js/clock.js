Clock = function(year, time){
    this.year = year;
    this.month = 0;
    this.date = new Date(time);
    this.months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    this.changeTime = function(){
        // Don't allow clock to go passed current date
        if(this.year == this.date.getFullYear() && this.month == this.date.getMonth()){
            return;
        }

        // cycle through months and years
        if(this.month >= 11){
            this.year += 1;
            this.month = 0;
        } else {
            this.month += 1;
        }
    }

    this.update = function(ships){
        /* Change date/year only if all ships commissioned in current
        timeframe are on screen */
        if(!Object.keys(ships).length
        || !ships[this.months[this.month]]
        || !ships[this.months[this.month]].length
        ){
            this.changeTime();
        }
    }
}
