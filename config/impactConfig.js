var config = {}

config.mqttPort = 1883;
config.mqttServer = "messagesight.demos.ibm.com";
config.interval = 120000;
config.timeout = 1000;
config.iterations = 100;

config. stations = [
    {"latitude":39.528521,"longitude":-119.812123}, // Reno, NV
    {"latitude":34.839964,"longitude":-114.604635}, // Needles, CA
    {"latitude":34.904820,"longitude":-117.025435}, // Barstow, CA
    {"latitude":40.836483,"longitude":-115.750530}, // Elko, NV
    {"latitude":35.188279,"longitude":-114.052816}, // Kingman, AZ
    {"latitude":40.225957,"longitude":-111.664001}, // Provo, UT
];

module.exports = config;
