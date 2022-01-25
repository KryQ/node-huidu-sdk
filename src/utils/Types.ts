type DeviceFile = {
	type: string,
	size: number,
	md5: string,
	name: string
};

//<font name="##value" file="##value" bold="##value" italic="##value" underline="##value"/>
type DeviceFont = {
	name: string,
	file: string,
	bold: boolean,
	italic: boolean,
	underline: boolean
}

export {DeviceFile, DeviceFont};