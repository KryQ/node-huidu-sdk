var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dgram from "dgram";
import net from "net";
import EventEmitter from "events";
import { CmdType, SdkErrorCode } from "./SdkConstants.js";
import { TcpQueue } from "./helpers/TcpQueue.js";
import { ErrorCode, SuccessCode } from "./utils/ReturnCodes.js";
import logger from "./utils/logger.js";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
const parser = new XMLParser({ ignoreAttributes: false });
var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["DISCONNECTED"] = 0] = "DISCONNECTED";
    ConnectionState[ConnectionState["SETTING_UP"] = 1] = "SETTING_UP";
    ConnectionState[ConnectionState["CONNECTED"] = 2] = "CONNECTED";
    ConnectionState[ConnectionState["LOST_COMMUNICATION"] = 3] = "LOST_COMMUNICATION";
    ConnectionState[ConnectionState["BUSY"] = 4] = "BUSY";
    ConnectionState[ConnectionState["ERROR"] = 5] = "ERROR";
})(ConnectionState || (ConnectionState = {}));
class DisplayCommunicator extends EventEmitter {
    constructor(address, port) {
        super();
        this.TCP_VERSION = 0x1000007;
        this.heartbeatTimeoutHandle = null;
        this.heartbeatCheckInterval = 2;
        this.maxPacketSize = 8000;
        this.changeConnectionState = (state) => {
            if (state !== this.connectionState) {
                this.connectionState = state;
                this.emit("connectionStateChange", state);
            }
        };
        this.connect = () => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.changeConnectionState(ConnectionState.SETTING_UP);
                if (this.connectionState === ConnectionState.CONNECTED) {
                    reject(ErrorCode.ALREADY_CONNECTED);
                    return;
                }
                this.socket.connect(this.port, this.address, () => __awaiter(this, void 0, void 0, function* () { return this.init(resolve, reject); }));
            });
        });
        this.disconnect = () => {
            this.socket.destroy();
        };
        this.init = (resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                logger.debug("dc conn 1");
                const serviceRequest = yield this.askServiceVersion();
                logger.info(`TCP ver: ${serviceRequest}`);
                this.tcpVersion = serviceRequest;
                this.guid = yield this.askGuid();
                logger.info(`GUID: ${this.guid}`);
                this.heartbeatTimeoutHandle = setTimeout(() => {
                    this.changeConnectionState(ConnectionState.LOST_COMMUNICATION);
                }, (this.heartbeatCheckInterval + 2) * 60 * 1000);
                this.changeConnectionState(ConnectionState.CONNECTED);
                resolve(true);
                return;
            }
            catch (e) {
                this.changeConnectionState(ConnectionState.ERROR);
                reject(e);
            }
        });
        this.deinit = () => {
            this.tcpVersion = null;
            this.guid = null;
            if (this.heartbeatTimeoutHandle !== null) {
                clearTimeout(this.heartbeatTimeoutHandle);
            }
        };
        this.responseListener = (data) => {
            var _a, _b, _c;
            if (this.receivingPacketLength > this.receivedBytes) {
                logger.info(`Data added ${data.length} `);
                data.copy(this.receivingBuffer, this.receivedBytes);
                this.receivedBytes += data.length;
                if (this.receivingPacketLength > this.receivedBytes) {
                    return;
                }
                this.receivingPacketLength = 0;
                this.receivedBytes = 0;
                data = this.receivingBuffer;
            }
            const responseLen = data[1] << 8 | data[0];
            if (data.length !== responseLen) {
                if (responseLen > data.length) {
                    this.receivingBuffer = Buffer.alloc(responseLen);
                    this.receivingPacketLength = responseLen;
                    this.receivedBytes = data.length;
                    data.copy(this.receivingBuffer, 0);
                    logger.info(`Data chunked ${this.receivingPacketLength} ${this.receivedBytes}`);
                    return;
                }
                logger.error("Recieved malformed input");
                return;
            }
            const tcpResponse = { cmd: 0, data: null };
            tcpResponse.cmd = data[3] << 8 | data[2];
            switch (tcpResponse.cmd) {
                case CmdType.kSDKServiceAnswer:
                    {
                        tcpResponse.data = Buffer.alloc(responseLen - 4);
                        data.copy(tcpResponse.data, 0, 4);
                        const obj = this.queue.read("kSDKServiceAnswer");
                        if (obj) {
                            obj.resolve(tcpResponse.data.readUInt32LE());
                        }
                    }
                    break;
                case CmdType.kSDKCmdAnswer:
                    {
                        tcpResponse.data = Buffer.alloc(responseLen - 12);
                        data.copy(tcpResponse.data, 0, 12);
                        const guidObj = parser.parse(tcpResponse.data);
                        const req = this.queue.read((_a = guidObj === null || guidObj === void 0 ? void 0 : guidObj.sdk) === null || _a === void 0 ? void 0 : _a.out["@_method"]);
                        if (req) {
                            if (((_b = guidObj === null || guidObj === void 0 ? void 0 : guidObj.sdk) === null || _b === void 0 ? void 0 : _b.out["@_result"]) != "kSuccess") {
                                if (((_c = guidObj === null || guidObj === void 0 ? void 0 : guidObj.sdk) === null || _c === void 0 ? void 0 : _c.out["@_result"]) == "kDownloadingFile") {
                                    req.reject("required file not found");
                                    return;
                                }
                                req.reject(guidObj);
                            }
                            else {
                                req.resolve(guidObj);
                            }
                        }
                    }
                    break;
                case CmdType.kErrorAnswer:
                    {
                        tcpResponse.data = Buffer.alloc(2);
                        data.copy(tcpResponse.data, 0, 4, 6);
                        logger.error(`Got error anwser ${SdkErrorCode[tcpResponse.data.readUInt16LE()]} ${tcpResponse.data.readUInt16LE()}`);
                    }
                    break;
                case CmdType.kFileStartAnswer:
                    {
                        const responseErrorBuffer = Buffer.alloc(2);
                        data.copy(responseErrorBuffer, 0, 4, 6);
                        const responseSizeBuffer = Buffer.alloc(8);
                        data.copy(responseSizeBuffer, 0, 6, 14);
                        const req = this.queue.read("AddFiles");
                        if (req) {
                            if (responseSizeBuffer.readUInt16LE() || responseErrorBuffer.readUInt16LE()) {
                                req.reject(ErrorCode.FILE_ALREADY_EXISTS);
                            }
                            else {
                                req.resolve(SuccessCode.OK);
                            }
                        }
                    }
                    break;
                case CmdType.kFileEndAnswer:
                    {
                        const req = this.queue.read("kFileEndAsk");
                        if (req) {
                            req.resolve();
                        }
                        else {
                            req.reject();
                        }
                    }
                    break;
                case CmdType.kTcpHeartbeatAnswer:
                    {
                        this.lastHeartbeat = new Date();
                        if (this.heartbeatTimeoutHandle !== null) {
                            clearTimeout(this.heartbeatTimeoutHandle);
                            this.heartbeatTimeoutHandle = setTimeout(() => {
                                this.changeConnectionState(ConnectionState.LOST_COMMUNICATION);
                            }, this.heartbeatCheckInterval * 60 * 1000);
                        }
                        const heartbeatAsk = Buffer.alloc(4);
                        heartbeatAsk[0] = (heartbeatAsk.length & 0xff);
                        heartbeatAsk[1] = ((heartbeatAsk.length >> 8) & 0xff);
                        heartbeatAsk[2] = (CmdType.kTcpHeartbeatAsk & 0xff);
                        heartbeatAsk[3] = ((CmdType.kTcpHeartbeatAsk >> 8) & 0xff);
                        this.socket.write(heartbeatAsk);
                    }
                    break;
                default: {
                    logger.error({ message: "Unknown error", cmd: tcpResponse.cmd.toString(16) });
                }
            }
        };
        this.constructSdkTckPacket = (data, guid) => {
            const countUnicode = (str) => {
                let count = 0;
                for (let i = 0; i < str.length; i++) {
                    if (str.charCodeAt(i) > 127)
                        count++;
                }
                return count;
            };
            const usedGuid = guid ? guid : this.guid;
            const kSDKServiceAsk = {
                sdk: {
                    "@_guid": usedGuid,
                    in: data
                },
            };
            const builder = new XMLBuilder({
                ignoreAttributes: false,
                suppressEmptyNode: true
            });
            const payload = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + builder.build(kSDKServiceAsk);
            const xmlStrLen = payload.length + countUnicode(payload);
            const buff = Buffer.alloc(12 + xmlStrLen, 0, "utf8");
            buff[0] = (buff.length & 0xff);
            buff[1] = ((buff.length >> 8) & 0xff);
            buff[2] = CmdType.kSDKCmdAsk & 0xff;
            buff[3] = (CmdType.kSDKCmdAsk >> 8) & 0xff;
            buff[4] = (xmlStrLen & 0xff);
            buff[5] = ((xmlStrLen >> 8) & 0xff);
            buff[6] = ((xmlStrLen >> 16) & 0xff);
            buff[7] = ((xmlStrLen >> 24) & 0xff);
            const index = 0;
            buff[8] = (index & 0xff);
            buff[9] = ((index >> 8) & 0xff);
            buff[10] = ((index >> 16) & 0xff);
            buff[11] = ((index >> 24) & 0xff);
            Buffer.from(payload).copy(buff, 12);
            return buff;
        };
        this.sdkCmdGet = (cmd, timeout = 1000) => new Promise((resolve, reject) => {
            const packet = this.constructSdkTckPacket({
                "@_method": cmd
            });
            const resolver = (data) => {
                resolve(data.sdk.out);
                return;
            };
            try {
                this.queue.push(cmd, reject, resolver, timeout);
                this.socket.write(packet);
            }
            catch (e) {
                reject(ErrorCode.REQUEST_PENDING);
            }
        });
        this.socketWritePromise = (buff) => new Promise((resolve, reject) => {
            this.socket.write(buff, (err => {
                if (err)
                    reject(err);
                else
                    resolve(true);
            }));
        });
        this.constructFileTransferPacket = (filename, filesize, filetype, md5) => {
            const xmlStrLen = 47 + (filename.length + 1);
            const buff = Buffer.alloc(xmlStrLen, 0, "utf8");
            buff[0] = (buff.length & 0xff);
            buff[1] = ((buff.length >> 8) & 0xff);
            buff[2] = CmdType.kFileStartAsk & 0xff;
            buff[3] = (CmdType.kFileStartAsk >> 8) & 0xff;
            for (let i = 0; i < md5.length; i++) {
                buff[4 + i] = md5.charCodeAt(i);
            }
            buff[37] = (filesize & 0xff);
            buff[38] = ((filesize >> 8) & 0xff);
            buff[39] = ((filesize >> 16) & 0xff);
            buff[40] = ((filesize >> 24) & 0xff);
            buff[45] = (filetype & 0xff);
            buff[46] = ((filetype >> 8) & 0xff);
            for (let i = 0; i < filename.length; i++) {
                buff[47 + i] = filename.charCodeAt(i);
            }
            buff[47 + filename.length] = 0;
            return buff;
        };
        this.transferFile = (file) => __awaiter(this, void 0, void 0, function* () {
            const fileSize = file.length;
            for (let s = 0; s < fileSize; s += this.maxPacketSize) {
                const packetSize = (s + this.maxPacketSize > fileSize) ? fileSize - s : this.maxPacketSize;
                const buff = Buffer.alloc(packetSize + 4, 0);
                buff[0] = (buff.length & 0xff);
                buff[1] = ((buff.length >> 8) & 0xff);
                buff[2] = CmdType.kFileContentAsk & 0xff;
                buff[3] = (CmdType.kFileContentAsk >> 8) & 0xff;
                file.copy(buff, 4, s, s + packetSize);
                this.emit("uploadProgress", Math.round(((s + packetSize) / fileSize) * 100));
                yield this.socketWritePromise(buff);
            }
        });
        this.endFileTransfer = () => new Promise((resolve, reject) => {
            const buff = Buffer.alloc(4, 0);
            buff[0] = (4 & 0xff);
            buff[1] = ((4 >> 8) & 0xff);
            buff[2] = CmdType.kFileEndAsk & 0xff;
            buff[3] = (CmdType.kFileEndAsk >> 8) & 0xff;
            this.queue.push("kFileEndAsk", reject, resolve, 10000);
            this.socket.write(buff);
        });
        this.askServiceVersion = () => new Promise((resolve, reject) => {
            const serviceAsk = Buffer.alloc(8);
            serviceAsk[0] = (serviceAsk.length & 0xff);
            serviceAsk[1] = ((serviceAsk.length >> 8) & 0xff);
            serviceAsk[2] = (CmdType.kSDKServiceAsk & 0xff);
            serviceAsk[3] = ((CmdType.kSDKServiceAsk >> 8) & 0xff);
            serviceAsk[4] = (this.TCP_VERSION & 0xff);
            serviceAsk[5] = ((this.TCP_VERSION >> 8) & 0xff);
            serviceAsk[6] = ((this.TCP_VERSION >> 16) & 0xff);
            serviceAsk[7] = ((this.TCP_VERSION >> 24) & 0xff);
            this.queue.push("kSDKServiceAnswer", reject, resolve, 1000);
            this.socket.write(serviceAsk);
        });
        this.askGuid = () => new Promise((resolve, reject) => {
            const packet = this.constructSdkTckPacket({
                "@_method": "GetIFVersion",
                "version": {
                    "@_value": this.tcpVersion.toString(16)
                }
            }, "##GUID");
            const resolver = (result) => {
                resolve(result.sdk["@_guid"]);
            };
            try {
                this.queue.push("GetIFVersion", reject, resolver, 1000);
                this.socket.write(packet);
            }
            catch (e) {
                reject(ErrorCode.REQUEST_PENDING);
            }
        });
        this.address = address;
        this.port = port;
        this.lastHeartbeat = new Date();
        this.queue = new TcpQueue();
        this.socket = new net.Socket();
        this.socket.on("data", this.responseListener);
        this.socket.on("close", (error) => {
            this.changeConnectionState(ConnectionState.DISCONNECTED);
            this.deinit();
        });
        this.socket.on("error", error => {
            logger.error(error);
        });
    }
    static decodeUdpResponse(data) {
        const version = data[3] << 24 | data[2] << 16 | data[1] << 8 | data[0];
        const header = data[5] << 8 | data[4];
        const payload = data.toString("utf-8", 6, 15);
        const changeNumber = data[19] << 24 | data[18] << 16 | data[17] << 8 | data[16];
        return ({ version: version, header: header, payload: payload, changeNumber: changeNumber });
    }
    static searchForDevices(network, port, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const _LOCAL_UDP_VERSION = 0x1000007;
            const devices = [];
            const message = Buffer.from([
                _LOCAL_UDP_VERSION & 0xff,
                (_LOCAL_UDP_VERSION >> 8) & 0xff,
                (_LOCAL_UDP_VERSION >> 16) & 0xff,
                (_LOCAL_UDP_VERSION >> 24) & 0xff,
                CmdType.kSearchDeviceAsk & 0xff,
                (CmdType.kSearchDeviceAsk >> 8) & 0xff,
            ]);
            const discoverySocket = dgram.createSocket("udp4");
            discoverySocket.bind(function () {
                discoverySocket.setBroadcast(true);
                discoverySocket.send(message, 0, message.length, port, network, function (err) {
                    if (err)
                        reject(err);
                });
            });
            setTimeout(() => {
                discoverySocket.close();
                resolve(devices);
            }, timeout);
            discoverySocket.on("message", function (rawResponse, remote) {
                const response = DisplayCommunicator.decodeUdpResponse(rawResponse);
                if (response.header === CmdType.kSearchDeviceAnswer) {
                    devices.push({ name: response.payload, address: remote.address, port: remote.port });
                }
            });
        });
    }
}
export { DisplayCommunicator, ConnectionState };
