type ConnectedDevice = {
	device: {
		address:string,
		name: string
	}
}

type ConnectedDevices = {
	[key:string]: ConnectedDevice
}

const connectedDevices:ConnectedDevices = {
	"192.168.1.2": {
		device: {
			address: "192.168.1.2",
			name: "DISP_1"
		}
	},
	"192.168.1.20": {
		device: {
			address: "192.168.1.20",
			name: "DISP_2"
		}
	}
};

const findDeviceAddress = (id:number):string => {
	const device = Object.entries(connectedDevices).find(device => device[1].device.name === `DISP_${id}`);
	return device[0];
};

const main = () => {
	console.log(findDeviceAddress(2));
};

main();