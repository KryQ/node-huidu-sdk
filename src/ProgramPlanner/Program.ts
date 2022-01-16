import { v4 as uuidv4 } from "uuid";

import {ComponentInterface} from "./BaseComponent.js";

class Program {
	private components: Array<ComponentInterface> = [];
	generate = () => {
		const createList = () => this.components.map(component => component.generate());
		return {
			"@_timeStamps": Math.round(Date.now() / 1000),
			"program": {
				"@_guid": uuidv4(),
				"@_type": "normal",
				"playControl": {
					"@_count": 1,
					"@_disabled": false,
				},
				"area": createList()
			}
			
		};
	};

	addComponent = (component:ComponentInterface):boolean => {
		this.components.push(component);
		return true;
	};
}

export {Program};