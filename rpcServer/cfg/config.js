var config = {};

config.LOGGER = {};
config.LOGGER.name = 'rpcServer';
config.LOGGER.infoFile = './log/rpcServerInfo.log';
config.LOGGER.debugFile = './log/rpcServerDebug.log';
config.LOGGER.errorFile = './log/rpcServerError.log';

config.FILE = {};
config.FILE.options = {
    flags: 'w',
    defaultEncoding: 'utf8',
    fd: null,
    mode: 0666,
    autoClose: true
};
config.FILE.defaultCaptureFile = './log/capture.txt';

//config.USER = {};
//config.USER.DUZ = 60;
//
//config.FACILITY = {};
//config.FACILITY.ID = 2957;

// rpc server socket
config.rpcServer = {};
config.rpcServer.port = 9011;

// nodeVISTAManager socket
config.nodeVISTAManager = {};
config.nodeVISTAManager.host = '10.2.2.100';
config.nodeVISTAManager.port = 9021;

config.client = {};
config.client.defaultName = "CPRS";

config.workerQ = {};
config.workerQ.size = 1;

config.lockers = [{
    name: 'Clinical Emulator',
    path: 'mvdm/cRPCL',
    models: ['./modelsClinical'],
}, {
    name: 'Non-Clinical Emulator',
    path: '../../VDM/prototypes/ncRPCL',
    models: ['../../nonClinicalRPCs/prototypes'],
    routinePath: '../../VDM/prototypes',
}, {
    name: 'JS Utility Emulator',
    path: '../../VDM/prototypes/ncRPCL',
    models: ['../../nonClinicalRPCs/prototypes/utility'],
}, {
    name: 'Out-Of-Scope Emulator',
    path: '../../VDM/prototypes/ncRPCL',
    models: ['../../nonClinicalRPCs/prototypes/outofscope'],
}];

try {
    module.exports = config;
}
catch(exception) {
    //will fail in browser - config is referenced by browser client for convenience
}

