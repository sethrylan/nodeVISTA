#!/usr/bin/env node
'use strict';

var net = require('net');
var fs = require('fs');
var util = require('util');
var _ = require('lodash');
var LOGGER = require('./logger.js');
var CONFIG = require('./cfg/config.js');
var mvdmManagement = require('./mvdmManagement');
var EventManager = require('./eventManager');
var ProcessAdapter = require('./processAdapter');

// ************************************ TESTING ASYNC EMULATOR *************************************
const parser = require('nodevista-rpcparser/rpcParser.js');
const RPCAsyncEmulator = require('./rpcAsyncEmulator');
const utilityRPCLModels = require('../../nonClinicalRPCs/prototypes/utility').rpcLModel;

const isTestingAsync = !!process.env.ASYNC_TEST;
const isUsingDeferred = !!process.env.DEFERRED;

if (isTestingAsync) {
    LOGGER.info('*** Testing Asychronous Execution Model for Emulators ***');
}

// We create a copy of the utility RPC models, then inject invocation methods with
// asynchronous call structure to them for our async emulator.
LOGGER.info('=> Initializing Utility RPCs with asynchronous invocation methods...');
const asyncModels = utilityRPCLModels.map(model => (_.extend(model, {

    // We can wrap the utility RPC emulator models in two ways to give it an asynchronous
    // execution model signature:
    //    Deferred: We push the execution of the invocation function to the back of the
    //              call stack to model true asynchronous processing.
    //      Inline: We handle the execution of the invocation function directly and just
    //              present the facade of an asynchronous execution model with the function
    //              signature.
    //
    invokeRPCAsync: (rpcArgs, callback) => {
        // === DEFERRED ===
        if (isUsingDeferred) {
            _.defer(() => {
                let res = null;
                try {
                    res = model.processRPCInvocation(rpcArgs);
                } catch (e) {
                    callback(e.message, null);
                }
                callback(null, res);
            });
        } else {
            // === INLINE ===
            let res = null;
            try {
                res = model.processRPCInvocation(rpcArgs);
            } catch (e) {
                callback(e.message, null);
            }
            callback(null, res);
        }
    },
})));

LOGGER.info('=> Initializing Asynchronous RPC Emulator');
const asyncEmulator = new RPCAsyncEmulator();
asyncEmulator.addModels(asyncModels);

const ASYNC_METHOD = isUsingDeferred ? 'Deferred' : 'Inline';
const TIMING_FILE_NAME = isTestingAsync ? `async${ASYNC_METHOD}TimingCounts.txt` : 'queueTimingCounts.txt';
// *************************************************************************************************

// import for multiprocess management
var qoper8 = require('ewd-qoper8');
var processQueue = new qoper8.masterProcess();

var server;

var NUL = '\u0000';
var SOH = '\u0001';
var EOT = '\u0004';
var ENQ = '\u0005';


// check for command line overrides
if (process.argv.length > 2) {
    for (var argnum = 2; argnum < process.argv.length; argnum++) {
        if (process.argv[argnum].indexOf("from=") > -1) {
            // from=something
            fromName = process.argv[argnum].substring(5);
            LOGGER.info("Using '%s' as the from in the capture", fromName);
        } else if (process.argv[argnum].indexOf("captureFile=") > -1) {
            // captureFile=path
            capturePath = process.argv[argnum].substring(12);
            LOGGER.info("Capture file being written to %s", capturePath);
        } else if (process.argv[argnum].indexOf("snifferPort=") > -1) {
            // snifferPort=port
            port = parseInt(process.argv[argnum].substring(12));
            if (isNaN(port)) {
                port = CONFIG.rpcServer.port;
            }
            LOGGER.info("Setting sniffer port to %s", port);
        }
    }
}

var fromName = CONFIG.client.defaultName;
var capturePath = CONFIG.FILE.defaultCaptureFile;
var port = CONFIG.rpcServer.port;

processQueue.on('started', function() {
    this.worker.module = __dirname + '/rpcQWorker';
});

processQueue.on('start', function() {
    this.setWorkerPoolSize(CONFIG.workerQ.size);
});


processQueue.start();

// = Initialize the process adapter which spawns and links the nodeVISTAManager in a new process ==
const processAdapter = new ProcessAdapter();
processAdapter.bindEventManager(EventManager);
processAdapter.registerChildEventHandler('isRPCLocked', (isRPCLocked) => {
    mvdmManagement.isRPCLocked = isRPCLocked;
});
// =================================================================================================

var captureFile = fs.createWriteStream(capturePath, CONFIG.FILE.options);
// wait until the captureFile is open before continuing
captureFile.on("open", function (fd) {
    LOGGER.info("Capture file %s opened for writing", capturePath);
    captureFile.write("[\n");

    // Start up the server
    server = net.createServer();
    server.on('connection', handleConnection);
    server.listen(port, function () {
        LOGGER.info('RPCServer listening to %j', server.address());

        //get locked rpc list
        processQueue.handleMessage({method: 'lockedRPCList'}, function(responseObject) {
            EventManager.emit(responseObject.message.eventType, responseObject.message.event);
        });
    });
});

// main function to handle the connection from the client
function handleConnection(conn) {
    var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
    LOGGER.info('New client connection from %s', remoteAddress);
    var chunk = '';

    conn.on('data', onConnectedData);
    conn.on('close', onConnectedClose);
    conn.on('error', onConnectedError);

    // handle data coming from the client
    function onConnectedData(data) {
        chunk += data;
        // find the end of a RPC packet
        var eotIndex = chunk.indexOf(EOT);

        // loop for each packet in the data chunk
        while (eotIndex > -1) {
            var response = '';

            // get a packet from the chunk (without the EOT)
            var rpcPacket = chunk.substr(0, eotIndex + 1);
            // remove the RPC packet from the chunk
            chunk = chunk.substring(eotIndex + 1)
            // find the end of the next RPC packet
            eotIndex = chunk.indexOf(EOT);

            // process the packet
            LOGGER.info('RECEIVED RPC from %s: %s', remoteAddress, data);


            //response = callRPC(rpcObject, rpcPacket);
            //
            //// write the response back to the client
            //LOGGER.info("SENDING RESPONSE to client: " + response);
            //var responseBuffer = new Buffer(response, 'binary');
            //
            //conn.write(responseBuffer);

            var messageObject = {};
            messageObject.method = 'callRPC';
            messageObject.ipAddress = conn.remoteAddress;
            messageObject.rpcPacket = rpcPacket;
            messageObject.isRPCLocked = mvdmManagement.isRPCLocked;
            messageObject.contextId = remoteAddress;
            processQueue.handleMessage(messageObject, function(responseObject) {
                LOGGER.debug("in rpcServer handleMessage from rpc responseObject = %j", responseObject);

                if (!responseObject.finished) {
                    // send() from worker handler
                    if (responseObject.type === 'emitRpcEvent') {
                        EventManager.emit('rpcCall', responseObject.message.event);
                    } else if (responseObject.type === 'emitMvdmEvent') {
                        EventManager.emit(responseObject.message.eventType, responseObject.message.event);
                    }
                } else {
                    // finished() from worker handler
                    if (responseObject.message.type === 'rpcResponse') {
                        // write out the rpc to a capture log
                        captureFile.write(JSON.stringify(responseObject.message.rpcObject, null, 2) + ",\n");

                        // write the response back to the client
                        LOGGER.info("SENDING RESPONSE to client: %j", responseObject.message.response);
                        var responseBuffer = new Buffer(responseObject.message.response, 'binary');

                        conn.write(responseBuffer);
                    }
                }
            });

        }
    }


    function onConnectedClose() {

        var messageObject = {};
        messageObject.method = 'dbReinit';
        processQueue.handleMessage(messageObject, function(responseObject) {
            LOGGER.debug("in rpcServer onConnectedClose after reinit");

        });


        //loggedIn = false;
        //USER = null;
        //FACILITY = null;
        LOGGER.info('CONNECTION from %s CLOSED', remoteAddress);
        conn.removeAllListeners();
        conn.end();
        conn.destroy();
    }

    function onConnectedError(err) {
        //loggedIn = false;
        //USER = null;
        //FACILITY = null;
        LOGGER.error('CONNECTION %s ERROR: %s', remoteAddress, err.message);
        conn.removeAllListeners();
        conn.end();
        conn.destroy();
    }
}


