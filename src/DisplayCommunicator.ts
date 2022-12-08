import dgram from "dgram";
import net from "net";

import EventEmitter from "events";

import { CmdType, SdkErrorCode } from "./SdkConstants.js";
import { TcpQueue } from "./helpers/TcpQueue.js";
import { ErrorCode, SuccessCode } from "./utils/ReturnCodes.js";
import { AsyncTask } from "./helpers/AsyncTask.js";

import logger from "./utils/logger.js";

import { XMLParser, XMLBuilder } from "fast-xml-parser";
const parser = new XMLParser({ ignoreAttributes: false });

type TcpResponsePacket = {
	cmd: CmdType | number,
	data: Buffer
}

type CandidateDevice = {
	model: string,
	address: string,
	port: number
}

type UdpPacket = {
	version: number,
	header: number,
	payload: string,
	serialNumber: string
}

enum ConnectionState {
	DISCONNECTED,
	SETTING_UP,
	CONNECTED,
	LOST_COMMUNICATION,
	BUSY,
	ERROR
}

class DisplayCommunicator extends EventEmitter {
	readonly TCP_VERSION: number = 0x1000007;
	static readonly UDP_VERSION: number = 0x1000007;
	readonly HEARTBEAT_INTERVAL_TRESHOLD = 2; //in minutes

	address: string;
	port: number;

	private tcpVersion: number;
	private guid: string;
	socket: net.Socket;
	connectionState: ConnectionState;
	queue: TcpQueue;

	//Health check
	lastHeartbeat: Date;
	heartbeatTimeoutHandle: ReturnType<typeof setInterval> = null;
	consecutiveErrors = 0;

	private maxPacketSize = 8000; //bytes (if your network doesn't handle jumbo frames change it to 1400)

	private receivingBuffer: Buffer;
	private receivingPacketLength: number;
	private receivedBytes: number;

	constructor(address: string, port: number) {
		super();

		this.address = address;
		this.port = port;

		this.lastHeartbeat = new Date();
		this.queue = new TcpQueue();
		this.socket = new net.Socket();

		this.setupSocketEvents(this.socket);
	}

	setupSocketEvents = (socket: net.Socket): void => {
		socket.on("data", this.responseListener);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		socket.on("close", (error) => {
			this.changeConnectionState(ConnectionState.DISCONNECTED);
			this.deinit();
		});
		socket.on("error", error => {
			this.changeConnectionState(ConnectionState.DISCONNECTED);
			this.deinit();
			logger.error(error);
		});

		socket.on("connect", this.init);
	};

	changeConnectionState = (state: ConnectionState) => {
		if (state !== this.connectionState) {
			this.connectionState = state;
			this.emit("connectionStateChange", state);
		}
	};

	connect = () => {
		if (this.connectionState === ConnectionState.CONNECTED || this.connectionState === ConnectionState.SETTING_UP) {
			throw new Error(ErrorCode.ALREADY_CONNECTING);
		}

		this.changeConnectionState(ConnectionState.SETTING_UP);

		this.socket.connect(this.port, this.address);
	};

	disconnect = () => {
		this.socket.destroy();
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private init = async (): Promise<boolean> => {
		const [serviceRequestError, serviceRequest] = await AsyncTask(this.askServiceVersion());
		if (serviceRequestError) {
			throw new Error(ErrorCode.GENERIC);
		}
		logger.info(`TCP ver: ${serviceRequest}`);

		this.tcpVersion = serviceRequest;

		const [guidRequestError, guidRequest] = await AsyncTask(this.askGuid());

		if (guidRequestError) {
			throw new Error(ErrorCode.GENERIC);
		}
		this.guid = guidRequest;

		logger.info(`GUID: ${this.guid}`);

		this.changeConnectionState(ConnectionState.CONNECTED);
		this.resetCommWatchdog(5);

		return true;
	};

	private deinit = () => {
		this.tcpVersion = null;
		this.guid = null;
		if (this.heartbeatTimeoutHandle !== null) {
			clearTimeout(this.heartbeatTimeoutHandle);
		}
	};

	responseListener = (data: Buffer) => {
		this.resetCommWatchdog();

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

		const responseLen: number = data[1] << 8 | data[0];

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

		const tcpResponse: TcpResponsePacket = { cmd: 0, data: null };
		tcpResponse.cmd = data[3] << 8 | data[2];

		switch (tcpResponse.cmd) {
			case CmdType.kSDKServiceAnswer: {
				tcpResponse.data = Buffer.alloc(responseLen - 4);
				data.copy(tcpResponse.data, 0, 4);

				const obj = this.queue.read("kSDKServiceAnswer");
				if (obj) {
					obj.resolve(tcpResponse.data.readUInt32LE());
				}
			}
				break;
			case CmdType.kSDKCmdAnswer: {
				tcpResponse.data = Buffer.alloc(responseLen - 12);
				data.copy(tcpResponse.data, 0, 12);

				const guidObj = parser.parse(tcpResponse.data);

				const req = this.queue.read(guidObj?.sdk?.out["@_method"]);

				if (req) {
					if (guidObj?.sdk?.out["@_result"] != "kSuccess") {
						if (guidObj?.sdk?.out["@_result"] == "kDownloadingFile") {
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
			case CmdType.kErrorAnswer: {
				tcpResponse.data = Buffer.alloc(2);
				data.copy(tcpResponse.data, 0, 4, 6);
				logger.error(`Got error anwser ${SdkErrorCode[tcpResponse.data.readUInt16LE()]} ${tcpResponse.data.readUInt16LE()}`);
			}
				break;
			case CmdType.kFileStartAnswer: {
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
			case CmdType.kFileEndAnswer: {
				const req = this.queue.read("kFileEndAsk");

				if (req) {
					req.resolve();
				}
				else {
					req.reject();
				}
			}
				break;
			case CmdType.kTcpHeartbeatAnswer: {
				this.resetCommWatchdog();

				const heartbeatAsk: Buffer = Buffer.alloc(4);

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

	resetCommWatchdog = (interval: number = this.HEARTBEAT_INTERVAL_TRESHOLD) => {
		if (this.heartbeatTimeoutHandle) clearInterval(this.heartbeatTimeoutHandle);

		this.lastHeartbeat = new Date();
		this.heartbeatTimeoutHandle = setTimeout(() => {
			this.changeConnectionState(ConnectionState.LOST_COMMUNICATION);
		}, interval * 60 * 1000);
	};

	constructSdkTckPacket = (data: object, guid?: string): Buffer => {
		const countUnicode = (str: string) => {
			let count = 0;
			for (let i = 0; i < str.length; i++) {
				if (str.charCodeAt(i) > 127) count++;
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

		const xmlStrLen: number = payload.length + countUnicode(payload);
		//if (countUnicode(payload) > 0) console.log("found unicodes: ", countUnicode(payload));

		const buff: Buffer = Buffer.alloc(12 + xmlStrLen, 0, "utf8");

		buff[0] = (buff.length & 0xff);
		buff[1] = ((buff.length >> 8) & 0xff);

		buff[2] = CmdType.kSDKCmdAsk & 0xff;
		buff[3] = (CmdType.kSDKCmdAsk >> 8) & 0xff;

		buff[4] = (xmlStrLen & 0xff);
		buff[5] = ((xmlStrLen >> 8) & 0xff);
		buff[6] = ((xmlStrLen >> 16) & 0xff);
		buff[7] = ((xmlStrLen >> 24) & 0xff);

		//TODO: SDK paging. max packet size is 9kb
		const index = 0;
		buff[8] = (index & 0xff);
		buff[9] = ((index >> 8) & 0xff);
		buff[10] = ((index >> 16) & 0xff);
		buff[11] = ((index >> 24) & 0xff);

		Buffer.from(payload).copy(buff, 12);
		return buff;
	};

	//TODO: Change return type from any to something more suitable
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sdkCmdGet = (cmd: string, timeout = 1000): Promise<any> => new Promise<any>((resolve, reject) => {
		if (this.connectionState !== ConnectionState.CONNECTED) {
			reject(new Error(ErrorCode.NOT_CONNECTED));
			return;
		}

		const packet = this.constructSdkTckPacket({
			"@_method": cmd
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const resolver = (data: any): any => {
			resolve(data.sdk.out);
			return;
		};

		try {
			this.queue.push(cmd, reject, resolver, timeout);
			this.socket.write(packet);
		} catch (e) {
			this.changeConnectionState(ConnectionState.ERROR);
			reject(ErrorCode.REQUEST_PENDING);
		}
	});

	socketWritePromise = (buff: Buffer, ignoreState = false): Promise<boolean> =>
		new Promise((resolve, reject) => {
			if (!ignoreState && this.connectionState !== ConnectionState.CONNECTED) {
				reject(new Error(ErrorCode.NOT_CONNECTED));
				return;
			}

			this.socket.write(buff, (err => {
				if (err) reject(err);
				else resolve(true);
			}));
		});

	constructFileTransferPacket = (filename: string, filesize: number, filetype: number, md5: string): Buffer => {
		const xmlStrLen: number = 47 + (filename.length + 1);
		const buff: Buffer = Buffer.alloc(xmlStrLen, 0, "utf8");

		buff[0] = (buff.length & 0xff);
		buff[1] = ((buff.length >> 8) & 0xff);

		buff[2] = CmdType.kFileStartAsk & 0xff;
		buff[3] = (CmdType.kFileStartAsk >> 8) & 0xff;

		for (let i = 0; i < md5.length; i++) {
			buff[4 + i] = md5.charCodeAt(i);
		}
		//buff[4 + md5.length] = 0;

		buff[37] = (filesize & 0xff);
		buff[38] = ((filesize >> 8) & 0xff);
		buff[39] = ((filesize >> 16) & 0xff);
		buff[40] = ((filesize >> 24) & 0xff);
		// buff[41] = ((filesize >> 32) & 0xff);
		// buff[42] = ((filesize >> 40) & 0xff);
		// buff[43] = ((filesize >> 48) & 0xff);
		// buff[44] = ((filesize >> 56) & 0xff);

		buff[45] = (filetype & 0xff);
		buff[46] = ((filetype >> 8) & 0xff);

		for (let i = 0; i < filename.length; i++) {
			buff[47 + i] = filename.charCodeAt(i);
		}
		buff[47 + filename.length] = 0;

		//Buffer.from(payload).copy(buff, 12);
		return buff;
	};

	transferFile = async (file: Buffer) => {
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

			await this.socketWritePromise(buff, true);
		}
	};

	endFileTransfer = () => new Promise((resolve, reject) => {
		const buff = Buffer.alloc(4, 0);

		buff[0] = (4 & 0xff);
		buff[1] = ((4 >> 8) & 0xff);

		buff[2] = CmdType.kFileEndAsk & 0xff;
		buff[3] = (CmdType.kFileEndAsk >> 8) & 0xff;

		this.queue.push("kFileEndAsk", reject, resolve, 10000);
		this.socketWritePromise(buff, true);
	});

	private askServiceVersion = (): Promise<number> =>
		new Promise<number>((resolve, reject) => {
			const serviceAsk: Buffer = Buffer.alloc(8);

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

	private askGuid = (): Promise<string> =>
		new Promise<string>((resolve, reject) => {
			const packet = this.constructSdkTckPacket({
				"@_method": "GetIFVersion",
				"version": {
					"@_value": this.tcpVersion.toString(16)
				}
			}, "##GUID");

			const resolver = (result: { sdk: { "@_guid": string } }): void => {
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

	static decodeUdpResponse(data: Buffer): UdpPacket {
		const version: number = data[3] << 24 | data[2] << 16 | data[1] << 8 | data[0];
		const header: number = data[5] << 8 | data[4];
		const payload: string = data.toString("utf-8", 6, 15);
		const serialNumber: string = data.toString("utf-8", 15, 19);

		return ({ version: version, header: header, payload: payload, serialNumber: serialNumber });
	}

	static searchForDevices = (network: string, port: number, timeout = 10000): Promise<Array<CandidateDevice>> =>
		new Promise((resolve, reject) => {
			const devices: Array<CandidateDevice> = [];

			const message = Buffer.from([
				this.UDP_VERSION & 0xff,
				(this.UDP_VERSION >> 8) & 0xff,
				(this.UDP_VERSION >> 16) & 0xff,
				(this.UDP_VERSION >> 24) & 0xff,
				CmdType.kSearchDeviceAsk & 0xff,
				(CmdType.kSearchDeviceAsk >> 8) & 0xff,
			]);

			const discoverySocket = dgram.createSocket("udp4");

			discoverySocket.bind(function () {
				discoverySocket.setBroadcast(true);

				discoverySocket.send(
					message,
					0,
					message.length,
					port,
					network,
					function (err) {
						if (err) reject(err);
					}
				);
			});

			setTimeout(() => {
				discoverySocket.close();
				resolve(devices);
			}, timeout);

			discoverySocket.on("message", function (rawResponse, remote) {
				const response = DisplayCommunicator.decodeUdpResponse(rawResponse);

				if (response.header === CmdType.kSearchDeviceAnswer) {
					const uniqueCheck = devices.findIndex(device => device.model === response.payload);
					if (uniqueCheck >= 0) return;

					devices.push({ model: response.payload + response.serialNumber, address: remote.address, port: remote.port });
				}
			});
		});
}

export { DisplayCommunicator, CandidateDevice, ConnectionState };