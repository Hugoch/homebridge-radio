var spawn = require('child_process').spawn;

var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-radio", "Radio", RadioAccessory);
}

function RadioAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.url = config["url"];

  this.player = null;
  this.state = false;
  
  this.service = new Service.Switch(this.name);
  
  this.service
    .getCharacteristic(Characteristic.On)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));
}

RadioAccessory.prototype.getState = function(callback) {
    this.log("Getting current state");
    callback(null, this.state);
}

RadioAccessory.prototype.setState = function(state, callback) {
    this.log("Set state to %s", state);
    var killPlayer = function(){
        this.player.kill('SIGHUP');
    }
    if(state){
        if(this.player != null){
            killPlayer.apply(this);
        }
        this.log("spawning a new player");
        this.player = spawn('mplayer', [this.url]);
        this.player.on('close', function(code, signal){
            this.log('child process terminated due to receipt of signal ' + signal);
        });
        this.player.stdout.setEncoding('utf8');
        var getData = function (data) {
            //stdout handling for debugging
            //var str = data.toString();
            //var lines = str.split(/(\r?\n)/g);
            //this.log(lines.join(""));
        }
        this.player.stdout.on('data', getData.bind(this));
        this.state = true;
    }else{
        if(this.player != null){
            killPlayer.apply(this);
        }
        this.state = false;
    }
    callback(null); //success
}

RadioAccessory.prototype.getServices = function(){
    return [this.service];
}