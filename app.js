/******************************************************************************
 * Copyright (c) 2014 IBM Corporation and other Contributors.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 ******************************************************************************/

var mqtt = require('mqtt');

// Read specified config file, or defaultConfig.js if none specified
var configFileName = (process.env.CONFIG_FILE_NAME || 'defaultConfig.js');
var configFilePath = "./config/" + configFileName;
console.log("Reading config file " + configFilePath);
var config = require(configFilePath);
console.log("config: " + JSON.stringify(config));

var mqttClient = mqtt.createClient(config.mqttPort, config.mqttServer);
mqttClient.subscribe('TrainDemo/train/+/command');
mqttClient.on('message', function (topic, message) {
    console.log("Have got a message on topic " + topic);
    var topicParts = topic.split("/");
    var trainId = topicParts[2];
    if (trainId > 0) {
      if (message == "Stop") {
          configMap[trainId].status = 'stopped'
      } else if (message == "Start") {
          configMap[trainId].status = 'moving'
      } else {
          alert("Unexpected message: " + message);
      }
    }
});

var configMap = {};

var number_of_stations = config.stations.length;
var start_station = null;
var end_station = null;
var id = 0;

for (var i = 0; i < number_of_stations; i++) {
    start_station = config.stations[i];
    for (var j = 0; j < number_of_stations; j++) {
        if (i != j) {
            end_station = config.stations[j];
            id++;
            start_journey(start_station, end_station, id);
        }
    }
}

function start_journey(start_station, end_station, id) {
    var idConfig = {};
    idConfig.start = start_station;
    idConfig.end = end_station;
    idConfig.messagesPublished = 0;
    idConfig.latitudeDelta = (end_station.latitude - start_station.latitude) / config.iterations;
    idConfig.longitudeDelta = (end_station.longitude - start_station.longitude) / config.iterations;
    configMap[id] = idConfig;
    if (config.interval) {
        setInterval(publishFirstMessage, config.interval, id);
    }
    // Kick off the first run immediately
    publishFirstMessage(id);
}

function random_temperature() {
    var min = 5;
    var max = 60;

    return Math.random() * (max - min) + min;
}

function random_weight() {
    var min = 100;
    var max = 600;

    return Math.random() * (max - min) + min;
}

function random_light() {
    var min = 100;
    var max = 600;

    return Math.random() * (max - min) + min;
}

function random_distance() {
    var min = 20;
    var max = 60;

    return Math.random() * (max - min) + min;
}

function random_speed() {
    var min = 20;
    var max = 60;

    return Math.random() * (max - min) + min;
}

function publishMessage(id) {
    var payload = {};
    payload.temperature = random_temperature();
    payload.weight = random_weight();
    payload.light = random_light();
    payload.distance = random_distance();
    var d = new Date();
    payload.timestamp = d.toISOString();
    if (configMap[id].messagesPublished == 0) {
        // Publish start location
        payload.location = configMap[id].start;
        payload.speed = 0;
        payload.status = 'at_start_station';
        configMap[id].status = payload.status; // Store this to support commands
        configMap[id].messagesPublished++;
        setTimeout(publishMessage, config.timeout, id);
    } else if (configMap[id].messagesPublished == (config.iterations - 1)) {
        // Publish end location
        payload.speed = 0;
        payload.status = 'at_end_station';
        configMap[id].status = payload.status;
        payload.location = configMap[id].end;
    } else {
        if (configMap[id].status == 'at_start_station') {
            // Switch to moving status
            configMap[id].status = 'moving';
        }
        if (configMap[id].status == 'moving') {
            // Calculate new position
            var latitude = configMap[id].start.latitude + (configMap[id].messagesPublished * configMap[id].latitudeDelta);
            var longitude = configMap[id].start.longitude + (configMap[id].messagesPublished * configMap[id].longitudeDelta);
            var location = {};
            // Use fixed size of 6 in the following to keep Infowindow fixed size
            location.latitude = latitude.toFixed(6);
            location.longitude = longitude.toFixed(6);
            payload.location = location;
            payload.speed = random_speed();
            payload.status = 'moving';
            configMap[id].messagesPublished++;
        } else if (configMap[id].status == 'stopped') {
            var latitude = configMap[id].start.latitude + (configMap[id].messagesPublished * configMap[id].latitudeDelta);
            var longitude = configMap[id].start.longitude + (configMap[id].messagesPublished * configMap[id].longitudeDelta);
            var location = {};
            // Use fixed size of 6 in the following to keep Infowindow fixed size
            location.latitude = latitude.toFixed(6);
            location.longitude = longitude.toFixed(6);
            payload.location = location;
            payload.speed = 0;
            payload.status = 'stopped';
        }
        setTimeout(publishMessage, config.timeout, id);
    }
    var message = JSON.stringify(payload);
    var topic = "TrainDemo/train/" + id + "/telemetry";
    mqttClient.publish(topic, message , {qos: 0, retain: true});
}

function publishFirstMessage(id) {
    // Reset number of messages published
    configMap[id].messagesPublished = 0;
    publishMessage(id);
}

// The following is the original code from the starter application download
// It seems that BlueMix requires every application to listen on the port
// it is given

var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3003);

var http = require('http');

var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('This is the TrainEmulator application\n');
});
server.listen(port, host);
console.log('App started on port ' + port);
