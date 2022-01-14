class TcpQueue {
    private _queue: {
        [key: string]: {
            resolve: any;
            reject: any,
            timeout: any
        }
    } = {};

    push = (cmd: string, reject: any, resolve: any, timeout: number = 2000): void => {
        const entry = Object.entries(this._queue).find(x => x[0] === cmd);

        if (entry) {
            throw new Error("Request is already pending");
        }
        else {
            const timeout_handle = setTimeout(() => {
                this.read(cmd);
                reject(`timeout: ${cmd}`)
            }, timeout);

            Object.assign(this._queue, { [cmd]: { reject: reject, resolve: resolve, timeout: timeout_handle } })
        }
    }

    read = (cmd: string): any => {
        const obj = Object.entries(this._queue).find(x => x[0] === cmd);
        if (obj) {
            clearTimeout(obj[1].timeout)
            delete this._queue[cmd];

            return obj[1];
        }

        return undefined;
    }

    print = (): string => {
        return JSON.stringify(Object.keys(this._queue));
    }
}

export { TcpQueue }