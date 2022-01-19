/* eslint-disable no-async-promise-executor */
/* eslint-disable no-control-regex */
/* eslint-disable indent */

import fs from "fs";
import crypto from "crypto";
import EventEmitter from "events";

import { XMLBuilder } from "fast-xml-parser";
import { v4 as uuidv4 } from "uuid";

import { ConnectionState, DisplayCommunicator } from "./DisplayCommunicator.js";

import logger from "./utils/logger.js";
import { Program } from "./ProgramPlanner/Program.js";

class DisplayDevice extends EventEmitter {
	name: string;
	model: string;
	private comm: DisplayCommunicator;

	constructor(address: string, port: number, model: string = null) {
		super();

		this.model = model;

		this.comm = new DisplayCommunicator(address, port);
		this.comm.on("uploadProgress", progress => this.emit("uploadProgress", progress));
		this.comm.on("connectionStateChange", state => this.emit("connectionStateChange", state));
	}

	init = async (): Promise<boolean> => new Promise(async (resolve, reject) => {
		if(this.comm.connectionState===ConnectionState.SETTING_UP || this.comm.connectionState===ConnectionState.CONNECTED) {
			reject("Already connecting");
		}

		logger.debug("dd init 1");
		try {
			await this.comm.connect();
			logger.debug("dd init 2");
			this.name = await this.getName();
		}
		catch (e) {
			logger.error("dd error 1");
			reject(e);
		}
		
		logger.debug("dd init 3");
		resolve(true);
	});

	deinit = async(): Promise<boolean> => {
		this.comm.disconnect();
		return true;
	};

	getName = async (): Promise<string> => {
		try {
			const obj = await this.comm.sdkCmdGet("GetDeviceName", 1000);
			return (obj.sdk?.out?.name["@_value"]);
		}
		catch (e) {
			throw new Error(e);
		}
	};

	setBrightness = (brigth: number) => new Promise<number>((resolve, reject) => {
		const setBrightnessXML = (guid: string, pBrightness: number): string => {
			const kSDKServiceAsk = {
				sdk: {
					"@_guid": guid,
					in: {
						"@_method": "SetLuminancePloy",
						"mode": {
							"@_value": "default"
						},
						"default": {
							"@_value": pBrightness
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
					}
				},

			};

			const builder = new XMLBuilder({
				ignoreAttributes: false,
				suppressEmptyNode: true
			});
			return "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + builder.build(kSDKServiceAsk);
		};

		const resolver = (data: any) => {
			resolve(brigth);
		};

		const data = setBrightnessXML(this.comm.guid, brigth);
		const packet = this.comm.constructSdkTckPacket(data);

		try {
			this.comm.queue.push("SetLuminancePloy", reject, resolver, 1000);
		}
		catch (e) {
			reject(e);
		}
		this.comm.socket.write(packet);
	});

	getBrightness = () => new Promise<number>(async (resolve, reject) => {
		try {
			const obj = await this.comm.sdkCmdGet("GetLuminancePloy", 1000);
			resolve(obj.sdk?.out?.default["@_value"]);
		}
		catch (e) {
			reject(e);
		}
	});

	getNetworkInfo = () => new Promise<number>(async (resolve, reject) => {
		try {
			const obj = await this.comm.sdkCmdGet("GetNetworkInfo", 1000);
			resolve(obj.sdk?.out);
		}
		catch (e) {
			reject(e);
		}
	});

	setEth = () => new Promise<string>(async (resolve, reject) => {
		const setEth0InfoXML = (guid: string): string => {
			const kSDKServiceAsk = {
				sdk: {
					"@_guid": guid,
					in: {
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
					}
				},

			};

			const builder = new XMLBuilder({
				ignoreAttributes: false,
				suppressEmptyNode: true
			});
			return "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + builder.build(kSDKServiceAsk);
		};

		const resolver = (data: any) => {
			resolve(data);
		};

		const data = setEth0InfoXML(this.comm.guid);
		console.log(data);
		const packet = this.comm.constructSdkTckPacket(data);

		try {
			this.comm.queue.push("SetEth0Info", reject, resolver, 10000);
		}
		catch (e) {
			reject(e);
		}
		this.comm.socket.write(packet);
	});

	getProgram = () => new Promise<string>(async (resolve, reject) => {
		try {
			const obj = await this.comm.sdkCmdGet("GetProgram", 1000);
			resolve(obj.sdk);
		}
		catch (e) {
			reject(e);
		}
	});

	switchProgram = (program_guid: string, program_index: number) => new Promise<string>(async (resolve, reject) => {
		const switchProgramXML = (guid: string): string => {
			const kSDKServiceAsk = {
				sdk: {
					"@_guid": guid,
					in: {
						"@_method": "SwitchProgram",
						"program": {
							"@_guid": program_guid,
							"@_index": program_index,
						},

					}
				},

			};

			const builder = new XMLBuilder({
				ignoreAttributes: false,
				suppressEmptyNode: true
			});
			return "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + builder.build(kSDKServiceAsk);
		};

		const resolver = (data: any) => {
			resolve(data);
		};

		const data = switchProgramXML(this.comm.guid);
		const packet = this.comm.constructSdkTckPacket(data);

		try {
			this.comm.queue.push("SwitchProgram", reject, resolver, 10000);
		}
		catch (e) {
			reject(e);
		}
		this.comm.socket.write(packet);
	});

	addProgram = (program:Program) => new Promise<boolean>(async (resolve, reject) => {
		const addProgramXML = (guid: string): string => {
			const kSDKServiceAsk = {
				sdk: {
					"@_guid": guid,
					in: {
						"@_method": "AddProgram",
						"screen": program.generate()
					},
				}
			};

			const builder = new XMLBuilder({
				ignoreAttributes: false,
				suppressEmptyNode: true
			});

			return "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + builder.build(kSDKServiceAsk);
		};

		const resolver = (data: any) => {
			resolve(true);
		};

		const data = addProgramXML(this.comm.guid);
		const packet = this.comm.constructSdkTckPacket(data);

		try {
			this.comm.queue.push("AddProgram", reject, resolver, 10000);
		}
		catch (e) {
			reject(e);
		}

		this.comm.socket.write(packet, "utf-8");
	});

	getAllFonts = () => new Promise<string>(async (resolve, reject) => {
		try {
			const obj = await this.comm.sdkCmdGet("GetAllFontInfo", 1000);
			resolve(obj.sdk);
		}
		catch (e) {
			reject(e);
		}
	});

	reloadAllFonts = () => new Promise<number>(async (resolve, reject) => {
		try {
			const obj = await this.comm.sdkCmdGet("ReloadAllFonts", 1000);
			resolve(obj.sdk?.out);
		}
		catch (e) {
			reject(e);
		}
	});

	listFiles = async (): Promise<Array<object>> => {
		try {
			const arr = await this.comm.sdkCmdGet("GetFiles", 1000);
			if (arr) {
				for (const obj of arr.sdk.out.files.file) {
					delete Object.assign(obj, { ["type"]: obj["@_type"] })["@_type"];
					delete Object.assign(obj, { ["size"]: obj["@_size"] })["@_size"];
					delete obj["@_existSize"];
					delete Object.assign(obj, { ["md5"]: obj["@_md5"] })["@_md5"];
					delete Object.assign(obj, { ["name"]: obj["@_name"] })["@_name"];
				}
			}
			return arr.sdk.out.files.file;
		}
		catch (e) {
			throw new Error(e);
		}
	};

	uploadFile = (filePath: string, fileName: string = null) => new Promise<string>(async (resolve, reject) => {
		let file: Buffer = null;
		try {
			file = await fs.promises.readFile(filePath);
		}
		catch (e) {
			reject(e);
			return;
		}

		if (!fileName) {
			logger.debug("Filename not predefined - creating");

			const tmpFilePath = filePath.split(/[\\/]/);
			fileName = tmpFilePath[tmpFilePath.length - 1];
			fileName = fileName.replace(/[^\x00-\x7F]/g, "");
		}

		if (fileName.match(/[^\x00-\x7F]/g)) {
			reject("Filename contains illegal characters");
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
				fileType = key;
				break;
			}
		}

		if (fileType === null) {
			reject("Unknown file type: ." + fileExt);
			return;
		}

		const fileMd5 = crypto.createHash("md5").update(file).digest("hex");
		const packet = this.comm.constructFileTransferPacket(fileName, file.length, fileType, fileMd5);

		const resolver = async (data: any) => {
			try {
				await this.comm.transferFile(file);
				await this.comm.endFileTransfer();

				resolve("file transfer ok");
			} catch (e) {
				reject(e);
			}
		};

		try {
			this.comm.queue.push("AddFiles", reject, resolver, 10000);
		}
		catch (e) {
			reject(e);
		}

		this.comm.socket.write(packet);
	});

	//TODO: Handle multiple files
	deleteFiles = (files: string | Array<string>): Promise<boolean> => new Promise((resolve, reject) => {
		const createFilesList = (files: string | Array<string>) => {
			if (typeof (files) === "string") {
				return [{ "@_name": files }];
			}
			else {
				const array = [];
				files.forEach((file: string) => {
					array.push({ "@_name": file });
				});
				return array;
			}
		};

		const deleteFilesXML = (guid: string, files: string | Array<string>): string => {
			const kSDKServiceAsk = {
				sdk: {
					"@_guid": guid,
					in: {
						"@_method": "DeleteFiles",
						"files": {
							"file": createFilesList(files)
						}
					},
				}
			};

			const builder = new XMLBuilder({
				ignoreAttributes: false,
				suppressEmptyNode: true
			});

			return "<?xml version=\"1.0\" encoding=\"utf-8\"?>" + builder.build(kSDKServiceAsk);
		};

		const resolver = (data: any) => {
			if (data.sdk.out.files.file["@_result"] === "kFileNotFound") {
				reject("kFileNotfound"); // file not found
				return;
			}
			else {
				resolve(true);
				return;
			}
		};

		const data = deleteFilesXML(this.comm.guid, files);
		const packet = this.comm.constructSdkTckPacket(data);

		try {
			this.comm.queue.push("DeleteFiles", reject, resolver, 10000);
		}
		catch (e) {
			reject(e);
			return;
		}

		this.comm.socket.write(packet, "utf-8");
	});
}

export default DisplayDevice;