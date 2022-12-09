import { ErrorCode } from "../utils/ReturnCodes.js";
class TcpQueue {
	private _queue: {
		[key: string]: {
			resolve: any;
			reject: any,
			timeout: any
		}
	} = {};

	push = (cmd: string, reject: any, resolve: any, timeout = 2000): void => {
		const entry = Object.entries(this._queue).find(x => x[0] === cmd);

		if (entry) {
			reject(ErrorCode.REQUEST_PENDING);
			return;
		}
		else {
			const timeoutHandle = setTimeout(() => {
				this.read(cmd);
				reject(new Error(ErrorCode.RESPONSE_TIMEOUT));
				return;
			}, timeout);

			Object.assign(this._queue, { [cmd]: { reject: reject, resolve: resolve, timeout: timeoutHandle } });
		}
	};

	read = (cmd: string): any => {
		const obj = Object.entries(this._queue).find(x => x[0] === cmd);
		if (obj) {
			clearTimeout(obj[1].timeout);
			delete this._queue[cmd];

			return obj[1];
		}

		return undefined;
	};

	print = (): string => {
		return JSON.stringify(Object.keys(this._queue));
	};

	exist = (key: string): boolean => {
		return this._queue.hasOwnProperty(key);
	};
}

export { TcpQueue };