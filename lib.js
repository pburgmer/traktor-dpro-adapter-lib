var midi = require('midi');

var input = new midi.input();
var output = new midi.output();

// receive MIDI Clock
input.ignoreTypes(true, false, true);

// set up receiving messages, transform and send
// remember last send value
(function () {
  var previousSendValue;

  input.on('message', function(deltaTime, message) {
    // midi clock message
    if (message[0] === 248) {
      // var bpm = 60 / (24 * deltaTime)
      var bpm = 2.5 / deltaTime;

      if (bpm < 60) {
        bpm = bpm * 2;
      }
      else if (bpm > 187) {
        bpm = bpm / 2;
      }

      var value = Math.round(bpm - 60);
      if (value != previousSendValue) {
        output.sendMessage([config.message.status, config.message.control, value]);
        previousSendValue = value;
      }
    }
  });
}());

var isRunning = false;

var config = {
  message: {
    command: 176, // control change
    control: 1,
    status: calcStatus(0) // default channel: 0
  },
  ports: {
    in: undefined,
    out: undefined
  }
};

module.exports = {
  setChannel: setChannel,
  setControl: setControl,
  getInputPorts: getInputPorts,
  getOutputPorts: getOutputPorts,
  setInputPort: setInputPort,
  setOutputPort: setOutputPort,
  start: start,
  stop: stop
};

function calcStatus(channel) {
  return (176 & 0xF0) | (channel & 0x0F);
}

function setControl(control) {
  config.message.control = control;
}

function setChannel(channel) {
  config.message.status = calcStatus(channel);
}

function getInputPorts() {
  return getPorts(input);
}

function getOutputPorts() {
  return getPorts(output);
}

function getPorts(inOrOut) {
  var inputPortCount = inOrOut.getPortCount();

  var ports = [];
  for (var i = 0; i < inputPortCount; i++) {
    ports.push({ id: i, name: inOrOut.getPortName(i)});
  }

  return ports;
}

function setInputPort(port) {
  var portId = port.id || port;

  if (config.ports.in !== portId) {
    config.ports.in = portId;
  }

  if (isRunning) {
    stop();
    start();
  }
}

function setOutputPort(port) {
  var portId = port.id || port;

  if (config.ports.out !== portId) {
    config.ports.out = portId;
  }

  if (isRunning) {
    stop();
    start();
  }
}

function start() {
  if (isRunning === false && config.ports.in !== undefined && config.ports.out !== undefined) {
    input.openPort(config.ports.in);
    output.openPort(config.ports.out);

    isRunning = true;
  }
}

function stop() {
  if (isRunning) {
    input.closePort();
    output.closePort();

    isRunning = false;
  }
}
