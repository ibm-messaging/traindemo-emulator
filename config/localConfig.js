var config = {}

config.mqttPort = 1883;
config.mqttServer = "192.168.56.12";
config.interval = 120000;
config.timeout = 1000;
config.iterations = 100;

config. stations = [
    {"latitude":50.992717,"longitude":-1.493298}, // Romsey
    {"latitude":51.067247,"longitude":-1.319999}, // Winchester
    {"latitude":51.070636,"longitude":-1.806272}, // Salisbury
    {"latitude":51.211563,"longitude":-1.492233}, // Andover
    {"latitude":50.907377,"longitude":-1.414023}, // Southampton Central
    {"latitude":50.796968,"longitude":-1.107684}, // Portsmouth Harbour
];

module.exports = config;
