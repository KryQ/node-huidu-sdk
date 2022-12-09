/* eslint-disable no-async-promise-executor */
/* eslint-disable no-control-regex */
/* eslint-disable indent */

import fs from "fs";
import crypto from "crypto";
import EventEmitter from "events";

import { ConnectionState, DisplayCommunicator } from "./DisplayCommunicator.js";

import logger from "./utils/logger.js";
import { ErrorCode, SuccessCode } from "./utils/ReturnCodes.js";
import { DeviceFile, DeviceFont } from "./utils/Types.js";
import { Program } from "./ProgramPlanner/Program.js";

class DisplayDevice extends EventEmitter {
	name: string;
	model: string;
	private comm: DisplayCommunicator;
	address: string;

	constructor(address: string, port: number, model: string = null) {
		super();

		this.model = model;

		this.comm = new DisplayCommunicator(address, port);
		this.address = this.comm.address;
		this.comm.on("uploadProgress", progress => this.emit("uploadProgress", progress));
		this.comm.on("connectionStateChange", async state => {
			switch (state) {
				case ConnectionState.CONNECTED: this.name = await this.getName();
			}

			this.emit("connectionStateChange", state);
		});
	}

	init = (): void => {
		if (this.comm.connectionState === ConnectionState.SETTING_UP || this.comm.connectionState === ConnectionState.CONNECTED) {
			throw new Error(ErrorCode.ALREADY_CONNECTING);
		}

		this.comm.connect();
	};

	deinit = (): void => {
		if (this.comm.connectionState === ConnectionState.DISCONNECTED) {
			throw new Error(ErrorCode.ALREADY_DISCONNECTED);
		}

		this.comm.disconnect();
	};

	getName = async (): Promise<string> => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			throw new Error(ErrorCode.BUSY);
			return;
		}

		try {
			const obj = await this.comm.sdkCmdGet("GetDeviceName", 600);
			return (obj.name["@_value"]);
		}
		catch (e) {
			throw new Error(e);
		}
	};

	setName = async (name: string): Promise<boolean> => new Promise<boolean>(async (resolve, reject) => {
		if (!name.length || name.length > 15) {
			reject(new Error(ErrorCode.ARGUMENT_INVALID));
			return;
		}

		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
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
			await this.comm.socketWritePromise(packet);
		}
		catch (e) {
			reject(e);
		}

	});

	setBrightness = (brigth: number) => new Promise<number>(async (resolve, reject) => {
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
			await this.comm.socketWritePromise(packet);
		}
		catch (e) {
			reject(e);
		}
	});

	getBrightness = () => new Promise<number>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(ErrorCode.BUSY);
			return;
		}

		try {
			const obj = await this.comm.sdkCmdGet("GetLuminancePloy", 600);
			resolve(obj.default["@_value"]);
		}
		catch (e) {
			reject(e);
		}
	});

	getDeviceInfo = () => new Promise<object>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(ErrorCode.BUSY);
			return;
		}

		try {
			const obj = await this.comm.sdkCmdGet("GetDeviceInfo", 600);
			resolve(obj);
		}
		catch (e) {
			reject(e);
		}
	});

	getNetworkInfo = () => new Promise<number>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(ErrorCode.BUSY);
			return;
		}

		try {
			const obj = await this.comm.sdkCmdGet("GetNetworkInfo", 600);
			resolve(obj);
		}
		catch (e) {
			reject(e);
		}
	});

	//TODO: Create interface for eth settings
	setEth = () => new Promise<boolean>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
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
			await this.comm.socketWritePromise(packet);
		}
		catch (e) {
			reject(e);
		}

	});

	getProgram = () => new Promise<string>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(ErrorCode.BUSY);
			return;
		}

		try {
			const obj = await this.comm.sdkCmdGet("GetProgram", 600);
			resolve(JSON.stringify(obj));
		}
		catch (e) {
			reject(e);
		}
	});

	switchProgram = (programGuid: string, programIndex: number) => new Promise<boolean>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
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
			await this.comm.socketWritePromise(packet);
		}
		catch (e) {
			reject(e);
		}

	});

	addProgram = (program: Program) => new Promise<boolean>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(new Error(ErrorCode.BUSY));
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

		this.comm.queue.push("AddProgram", reject, resolver, 500);
		await this.comm.socketWritePromise(packet)
			.catch(() => reject(new Error(ErrorCode.GENERIC)));
	});

	updateProgram = (program: Program) => new Promise<boolean>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(new Error(ErrorCode.BUSY));
			return;
		}

		const payload = {
			"@_method": "UpdateProgram",
			"program": program.generateUpdate()
		};

		const resolver = () => {
			resolve(true);
		};

		const packet = this.comm.constructSdkTckPacket(payload);

		this.comm.queue.push("UpdateProgram", reject, resolver, 500);
		await this.comm.socketWritePromise(packet)
			.catch(() => reject(new Error(ErrorCode.GENERIC)));
	});

	setBootLogo = async (name: string): Promise<boolean> => new Promise<boolean>(async (resolve, reject) => {
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
			await this.comm.socketWritePromise(packet);
		}
		catch (e) {
			reject(e);
		}

	});

	listFonts = () => new Promise<DeviceFont[]>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(ErrorCode.BUSY);
			return;
		}

		try {
			const obj = await this.comm.sdkCmdGet("GetAllFontInfo", 600);
			const fonts: DeviceFont[] = [];

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
	});

	reloadAllFonts = () => new Promise<number>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(ErrorCode.BUSY);
			return;
		}

		try {
			const obj = await this.comm.sdkCmdGet("ReloadAllFonts", 600);
			resolve(obj);
		}
		catch (e) {
			reject(e);
		}
	});

	listFiles = async (): Promise<DeviceFile[]> => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			throw new Error(ErrorCode.BUSY);
		}

		try {
			const result: DeviceFile[] = [];
			const arr = await this.comm.sdkCmdGet("GetFiles", 600);
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
	};

	uploadFile = (filePath: string | Buffer, fileName: string = null) => new Promise<string>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED || this.comm.queue.exist("AddFiles")) {
			reject(ErrorCode.BUSY);
			return;
		}

		let file: Buffer = null;
		if (typeof filePath === "string") {
			try {
				file = await fs.promises.readFile(filePath);

				if (!fileName) {
					logger.debug("Filename not predefined - creating");

					const tmpFilePath = filePath.split(/[\\/]/);
					fileName = tmpFilePath[tmpFilePath.length - 1];
					fileName = fileName.replace(/[^\x00-\x7F]/g, "");
					console.log("Created filename: " + fileName);
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

		let fileType: number = null;
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

		const resolver = async () => {
			try {
				await this.comm.transferFile(file);
				await this.comm.endFileTransfer();

				resolve(SuccessCode.FILE_TRANSFER_OK);
			} catch (e) {
				reject(e);
			}
			finally {
				this.comm.changeConnectionState(ConnectionState.CONNECTED);
			}
		};

		try {
			this.comm.changeConnectionState(ConnectionState.BUSY);
			this.comm.queue.push("AddFiles", reject, resolver, 10000);
			await this.comm.socketWritePromise(packet, true);
		}
		catch (e) {
			reject(e);
		}
	});

	//TODO: Handle multiple files
	deleteFiles = (files: string | Array<string>): Promise<boolean> => new Promise(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(ErrorCode.BUSY);
			return;
		}

		const createFilesList = (files: string | Array<string>) => {
			if (typeof (files) === "string") {
				return [{ "@_name": files }];
			}
			else {
				const array: { "@_name": string }[] = [];
				files.forEach((file: string) => {
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

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const resolver = (data: any) => {
			if (data["@_result"] === "kFileNotFound") {
				reject(ErrorCode.FILE_NOT_FOUND); // file not found
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
			await this.comm.socketWritePromise(packet);
		}
		catch (e) {
			reject(e);
			return;
		}
	});

	reboot = (delay = 10) => new Promise<boolean>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(ErrorCode.BUSY);
			return;
		}

		const payload = {
			"@_method": "Reboot",
			"@_delay": delay,
		};

		const resolver = () => {
			resolve(true);
		};

		const packet = this.comm.constructSdkTckPacket(payload);

		try {
			this.comm.queue.push("Reboot", reject, resolver, 10000);
			await this.comm.socketWritePromise(packet);
		}
		catch (e) {
			reject(e);
		}

	});

	turnOff = () => new Promise<boolean>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(ErrorCode.BUSY);
			return;
		}

		try {
			const obj = await this.comm.sdkCmdGet("CloseScreen", 600);
			resolve(obj);
		}
		catch (e) {
			reject(e);
		}
	});

	turnOn = () => new Promise<boolean>(async (resolve, reject) => {
		if (this.comm.connectionState !== ConnectionState.CONNECTED) {
			reject(ErrorCode.BUSY);
			return;
		}

		try {
			const obj = await this.comm.sdkCmdGet("OpenScreen", 600);
			resolve(obj);
		}
		catch (e) {
			reject(e);
		}
	});
}

export default DisplayDevice;