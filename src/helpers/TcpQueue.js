import { ErrorCode } from "../utils/ReturnCodes.js";
class TcpQueue {
    constructor() {
        this._queue = {};
        this.push = (cmd, reject, resolve, timeout = 2000) => {
            const entry = Object.entries(this._queue).find(x => x[0] === cmd);
            if (entry) {
                reject(ErrorCode.REQUEST_PENDING);
            }
            else {
                const timeout_handle = setTimeout(() => {
                    this.read(cmd);
                    reject(`timeout: ${cmd}`);
                }, timeout);
                Object.assign(this._queue, { [cmd]: { reject: reject, resolve: resolve, timeout: timeout_handle } });
            }
        };
        this.read = (cmd) => {
            const obj = Object.entries(this._queue).find(x => x[0] === cmd);
            if (obj) {
                clearTimeout(obj[1].timeout);
                delete this._queue[cmd];
                return obj[1];
            }
            return undefined;
        };
        this.print = () => {
            return JSON.stringify(Object.keys(this._queue));
        };
    }
}
export { TcpQueue };
