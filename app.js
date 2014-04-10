/******************************************************************************
 * Copyright (c) 2014 IBM Corporation and other Contributors.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 ******************************************************************************/

var mqtt = require('mqtt');
var mqttPort = (process.env.mqttPort || 1883);
var mqttServer = (process.env.mqttServer || '192.168.56.12');
var mqttClient = mqtt.createClient(mqttPort, mqttServer);
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

var stations = [
    {"latitude":50.992717,"longitude":-1.493298}, // Romsey
    {"latitude":51.067247,"longitude":-1.319999}, // Winchester
    {"latitude":51.070636,"longitude":-1.806272}, // Salisbury
    {"latitude":51.211563,"longitude":-1.492233}, // Andover
    {"latitude":50.907377,"longitude":-1.414023}, // Southampton Central
    {"latitude":50.796968,"longitude":-1.107684}, // Portsmouth Harbour
];

var number_of_stations = stations.length;
var start_station = null;
var end_station = null;
var id = 0;

var interval = (process.env.interval || 120000);
var timeout = (process.env.timeout || 500);
var iterations = (process.env.iterations || 200);
for (var i = 0; i < number_of_stations; i++) {
    start_station = stations[i];
    for (var j = 0; j < number_of_stations; j++) {
        if (i != j) {
            end_station = stations[j];
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
    idConfig.latitudeDelta = (end_station.latitude - start_station.latitude) / iterations;
    idConfig.longitudeDelta = (end_station.longitude - start_station.longitude) / iterations;
    configMap[id] = idConfig;
    if (interval) {
        setInterval(publishFirstMessage, interval, id);
    }
    // Kick off the first run immediately
    publishFirstMessage(id);
}
function publishMessage(id) {
    var payload = {};
    // Populate message apart from location and speed
    payload.temperature = 17.3;
    payload.weight = 509.92;
    payload.light = 57.6;
    payload.distance = 50.98;
    var d = new Date();
    payload.timestamp = d.toISOString();
    if (configMap[id].messagesPublished == 0) {
        // Publish start location
        payload.location = configMap[id].start;
        payload.speed = 0;
        payload.status = 'at_start_station';
        configMap[id].status = payload.status; // Store this to support commands
        configMap[id].messagesPublished++;
        setTimeout(publishMessage, timeout, id);
    } else if (configMap[id].messagesPublished == (iterations - 1)) {
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
            // Need to add support for commands to stop and start the train
            // which will control the speed
            payload.speed = 47.29;
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
        setTimeout(publishMessage, timeout, id);
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
