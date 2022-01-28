import { v4 as uuidv4 } from "uuid";

import {ComponentInterface} from "./BaseComponent.js";

interface ComponentsArray {
    [key: string]: ComponentInterface;
}

class Program {
	components: ComponentsArray = {};
	timestamp: number;
	guid: string;

	constructor() {
		this.timestamp = Math.round(Date.now() / 1000);
		this.guid = uuidv4();
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
			// "playControl": {
			// 	"@_count": 1,
			// 	"@_disabled": false,
			// },
			"area": createList()
		};
	};

	//TODO: Check for key uniqnes
	addComponent = (key:string, component:ComponentInterface):boolean => {
		this.components[key] = component;
		return true;
	};
}

export {Program};