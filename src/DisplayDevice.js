var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from "fs";
import crypto from "crypto";
import EventEmitter from "events";
import { ConnectionState, DisplayCommunicator } from "./DisplayCommunicator.js";
import logger from "./utils/logger.js";
import { ErrorCode, SuccessCode } from "./utils/ReturnCodes.js";
class DisplayDevice extends EventEmitter {
    constructor(address, port, model = null) {
        super();
        this.init = () => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this.comm.connectionState === ConnectionState.SETTING_UP || this.comm.connectionState === ConnectionState.CONNECTED) {
                    reject(ErrorCode.ALREADY_CONNECTING);
                }
                logger.debug("dd init 1");
                try {
                    yield this.comm.connect();
                    logger.debug("dd init 2");
                    this.name = yield this.getName();
                }
                catch (e) {
                    logger.error("dd error 1");
                    reject(e);
                }
                logger.debug("dd init 3");
                resolve(true);
            }));
        });
        this.deinit = () => __awaiter(this, void 0, void 0, function* () {
            this.comm.disconnect();
            return true;
        });
        this.getName = () => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                throw new Error(ErrorCode.BUSY);
                return;
            }
            try {
                const obj = yield this.comm.sdkCmdGet("GetDeviceName", 600);
                return (obj.name["@_value"]);
            }
            catch (e) {
                throw new Error(e);
            }
        });
        this.setName = (name) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!name.length || name.length > 15) {
                    reject(new Error(ErrorCode.ARGUMENT_INVALID));
                    return;
                }
                if (this.comm.connectionState === ConnectionState.BUSY) {
                    reject(ErrorCode.BUSY);
                    return;
                }
                const payload = {
                    "@_method": "SetDeviceName",
                    "name": {
                        "@_value": name
                    }
                };
                const resolver = () => {
                    resolve(true);
                };
                const packet = this.comm.constructSdkTckPacket(payload);
                try {
                    this.comm.queue.push("SetDeviceName", reject, resolver, 600);
                    yield this.comm.socketWritePromise(packet);
                }
                catch (e) {
                    reject(e);
                }
            }));
        });
        this.setBrightness = (brigth) => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (brigth < 1 || brigth > 100) {
                reject(new Error(ErrorCode.ARGUMENT_INVALID));
                return;
            }
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            const payload = {
                "@_method": "SetLuminancePloy",
                "mode": {
                    "@_value": "default"
                },
                "default": {
                    "@_value": brigth
                },
                "ploy": {
                    "item": {
                        "@_enable": "false",
                        "@_start": "08:00:00",
                        "@_percent": 100
                    }
                },
                "sensor": {
                    "@_max": 100,
                    "@_time": 5,
                    "@_min": 1
                }
            };
            const resolver = () => {
                resolve(brigth);
            };
            const packet = this.comm.constructSdkTckPacket(payload);
            try {
                this.comm.queue.push("SetLuminancePloy", reject, resolver, 600);
                yield this.comm.socketWritePromise(packet);
            }
            catch (e) {
                reject(e);
            }
        }));
        this.getBrightness = () => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            try {
                const obj = yield this.comm.sdkCmdGet("GetLuminancePloy", 600);
                resolve(obj.default["@_value"]);
            }
            catch (e) {
                reject(e);
            }
        }));
        this.getDeviceInfo = () => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            try {
                const obj = yield this.comm.sdkCmdGet("GetDeviceInfo", 600);
                resolve(obj);
            }
            catch (e) {
                reject(e);
            }
        }));
        this.getNetworkInfo = () => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            try {
                const obj = yield this.comm.sdkCmdGet("GetNetworkInfo", 600);
                resolve(obj);
            }
            catch (e) {
                reject(e);
            }
        }));
        this.setEth = () => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            const payload = {
                "@_method": "SetEth0Info",
                eth: {
                    "@_valid": true,
                    enable: {
                        "@_value": true,
                    },
                    dhcp: {
                        "@_auto": true,
                    },
                    address: {}
                }
            };
            const resolver = () => {
                resolve(true);
            };
            const packet = this.comm.constructSdkTckPacket(payload);
            try {
                this.comm.queue.push("SetEth0Info", reject, resolver, 10000);
                yield this.comm.socketWritePromise(packet);
            }
            catch (e) {
                reject(e);
            }
        }));
        this.getProgram = () => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            try {
                const obj = yield this.comm.sdkCmdGet("GetProgram", 600);
                resolve(JSON.stringify(obj));
            }
            catch (e) {
                reject(e);
            }
        }));
        this.switchProgram = (programGuid, programIndex) => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            const payload = {
                "@_method": "SwitchProgram",
                "program": {
                    "@_guid": programGuid,
                    "@_index": programIndex,
                }
            };
            const resolver = () => {
                resolve(true);
            };
            const packet = this.comm.constructSdkTckPacket(payload);
            try {
                this.comm.queue.push("SwitchProgram", reject, resolver, 10000);
                yield this.comm.socketWritePromise(packet);
            }
            catch (e) {
                reject(e);
            }
        }));
        this.addProgram = (program) => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            const payload = {
                "@_method": "AddProgram",
                "screen": program.generate()
            };
            const resolver = () => {
                resolve(true);
            };
            const packet = this.comm.constructSdkTckPacket(payload);
            try {
                this.comm.queue.push("AddProgram", reject, resolver, 10000);
                yield this.comm.socketWritePromise(packet);
            }
            catch (e) {
                reject(e);
            }
        }));
        this.setBootLogo = (name) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const payload = {
                    "@_method": "SetBootLogoName",
                    "logo": {
                        "@_name": name,
                        "@_md5": ""
                    }
                };
                const resolver = () => {
                    resolve(true);
                };
                const packet = this.comm.constructSdkTckPacket(payload);
                try {
                    this.comm.queue.push("SetBootLogoName", reject, resolver, 600);
                    yield this.comm.socketWritePromise(packet);
                }
                catch (e) {
                    reject(e);
                }
            }));
        });
        this.listFonts = () => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            try {
                const obj = yield this.comm.sdkCmdGet("GetAllFontInfo", 600);
                const fonts = [];
                for (const font of obj.fonts.font) {
                    fonts.push({
                        name: font["@_name"],
                        file: font["@_file"],
                        bold: font["@_bold"] === "true",
                        underline: font["@_underline"] === "true",
                        italic: font["@_italic"] === "true"
                    });
                }
                resolve(fonts);
            }
            catch (e) {
                reject(e);
            }
        }));
        this.reloadAllFonts = () => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            try {
                const obj = yield this.comm.sdkCmdGet("ReloadAllFonts", 600);
                resolve(obj);
            }
            catch (e) {
                reject(e);
            }
        }));
        this.listFiles = () => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                throw new Error(ErrorCode.BUSY);
                return;
            }
            try {
                const result = [];
                const arr = yield this.comm.sdkCmdGet("GetFiles", 600);
                if (arr) {
                    for (const obj of arr.files.file) {
                        result.push({ name: obj["@_name"], size: obj["@_size"], type: obj["@_type"], md5: obj["@_md5"] });
                    }
                }
                return result;
            }
            catch (e) {
                throw new Error(e);
            }
        });
        this.uploadFile = (filePath, fileName = null) => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            let file = null;
            if (typeof filePath === "string") {
                try {
                    file = yield fs.promises.readFile(filePath);
                    if (!fileName) {
                        logger.debug("Filename not predefined - creating");
                        const tmpFilePath = filePath.split(/[\\/]/);
                        fileName = tmpFilePath[tmpFilePath.length - 1];
                        fileName = fileName.replace(/[^\x00-\x7F]/g, "");
                    }
                }
                catch (e) {
                    reject(e);
                    return;
                }
            }
            else {
                file = filePath;
                if (!fileName) {
                    reject(ErrorCode.INVALID_FILENAME);
                    return;
                }
            }
            if (fileName.match(/[^\x00-\x7F]/g)) {
                reject(ErrorCode.INVALID_FILENAME);
                return;
            }
            const allowedExtensions = {
                0: ["bmp", "jpg", "jpeg", "png", "ico", "gif", "tif", "tif"],
                1: ["mp3", "swf", "f4v", "trp", "wmv", "asf", "mpeg", "webm", "asx", "rm", "rmvb", "mp4", "3gp", "mov", "m4v", "avi", "dat", "mkv", "flv", "vob", "ts"],
                2: ["ttc", "ttf", "bdf"],
                3: ["bin"],
                4: ["xml"]
            };
            const tmpFileExt = fileName.split(".");
            const fileExt = tmpFileExt[tmpFileExt.length - 1];
            let fileType = null;
            for (const [key, extensions] of Object.entries(allowedExtensions)) {
                if (extensions.includes(fileExt)) {
                    fileType = parseInt(key);
                    break;
                }
            }
            if (fileType === null) {
                reject(ErrorCode.INVALID_FILETYPE);
                return;
            }
            const fileMd5 = crypto.createHash("md5").update(file).digest("hex");
            const packet = this.comm.constructFileTransferPacket(fileName, file.length, fileType, fileMd5);
            const resolver = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.comm.transferFile(file);
                    yield this.comm.endFileTransfer();
                    resolve(SuccessCode.FILE_TRANSFER_OK);
                }
                catch (e) {
                    reject(e);
                }
                finally {
                    this.comm.changeConnectionState(ConnectionState.CONNECTED);
                }
            });
            try {
                this.comm.changeConnectionState(ConnectionState.BUSY);
                this.comm.queue.push("AddFiles", reject, resolver, 10000);
                yield this.comm.socketWritePromise(packet);
            }
            catch (e) {
                this.comm.changeConnectionState(ConnectionState.CONNECTED);
                reject(e);
            }
        }));
        this.deleteFiles = (files) => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.comm.connectionState === ConnectionState.BUSY) {
                reject(ErrorCode.BUSY);
                return;
            }
            const createFilesList = (files) => {
                if (typeof (files) === "string") {
                    return [{ "@_name": files }];
                }
                else {
                    const array = [];
                    files.forEach((file) => {
                        array.push({ "@_name": file });
                    });
                    return array;
                }
            };
            const payload = {
                "@_method": "DeleteFiles",
                "files": {
                    "file": createFilesList(files)
                }
            };
            const resolver = (data) => {
                if (data["@_result"] === "kFileNotFound") {
                    reject(ErrorCode.FILE_NOT_FOUND);
                    return;
                }
                else {
                    resolve(true);
                    return;
                }
            };
            const packet = this.comm.constructSdkTckPacket(payload);
            try {
                this.comm.queue.push("DeleteFiles", reject, resolver, 10000);
                yield this.comm.socketWritePromise(packet);
            }
            catch (e) {
                reject(e);
                return;
            }
        }));
        this.model = model;
        this.comm = new DisplayCommunicator(address, port);
        this.comm.on("uploadProgress", progress => this.emit("uploadProgress", progress));
        this.comm.on("connectionStateChange", state => this.emit("connectionStateChange", state));
    }
}
export default DisplayDevice;
