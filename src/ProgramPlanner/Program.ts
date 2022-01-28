import createGuid from "../helpers/CreateGUID.js";
import { ErrorCode } from "../utils/ReturnCodes.js";
import BaseComponent from "./BaseComponent.js";

interface ComponentsArray {
    [key: string]: BaseComponent;
}

class Program {
	components: ComponentsArray = {};
	timestamp: number;
	guid: string;

	constructor() {
		this.timestamp = Math.round(Date.now() / 1000);
		this.guid = createGuid();
	}

	generate = () => {
		const createList = () => Object.keys(this.components).map(componentKey => this.components[componentKey].generate()).flat();
		return {
			"@_timeStamps": this.timestamp,
			"program": {
				"@_guid": this.guid,
				"@_type": "normal",
				// "playControl": {
				// 	"@_count": 1,
				// 	"@_disabled": false,
				// },
				"area": createList()
			}
		};
	};

	generateUpdate = () => {
		const createList = () => Object.keys(this.components).map(componentKey => this.components[componentKey].generate()).flat();
		return {
			"@_guid": this.guid,
			"@_type": "normal",
			"area": createList()
		};
	};

	addComponent = (key:string, component:BaseComponent): boolean => {
		if(!key) 
			throw new Error(ErrorCode.INVALID_COMPONENT_KEY);

		if(this.components[key]) 
			throw new Error(ErrorCode.COMPONENT_KEY_EXISTS);

		this.components[key] = component;
		return true;
	};
}

export {Program};