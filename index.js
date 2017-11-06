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
  
  this.service = new Service.Speaker(this.name);
  
  this.service
    .getCharacteristic(Characteristic.Mute)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));

  this.service
    .getCharacteristic(Characteristic.Volume)
    .on('get', this.setVolume.bind(this))
    .on('set', this.setVolume.bind(this));
}

RadioAccessory.prototype.getVolume = function(callback) {
  this.log('getting current volume');
  this.amixer = 'awk -F"[][]" \'/dB/ { print $2 }\' <(amixer sget PCM)';
  this.amixer.stdout.setEncoding('utf8');
  this.player.stdout.on('data', function(data){callback(null, data.replace('%',''));});
}

RadioAccessory.prototype.setVolume = function(volume, callback) {
  this.log('setting volume to ' + volume + '%');
  this.amixer = 'amixer cset numid=1 ' + volume + '%';
  callback(null);
}

RadioAccessory.prototype.getState = function(callback) {
    this.log("Getting current state");
    callback(null, this.state);
}

RadioAccessory.prototype.setState = function(state, callback) {
    this.log("Set state to %s", state);
    var killPlayer = function(){
        this.player.kill('SIGINT');
    }
    if(state){
        if(this.player != null){
            killPlayer.apply(this);
        }
        this.log("spawning a new player");
        this.player = spawn('cvlc', [this.url]);
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