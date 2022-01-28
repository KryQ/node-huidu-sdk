import createGuid from "../helpers/CreateGUID.js";
class ComponentBase {
	x:number;
	y:number;
	width:number;
	height:number;
	alpha:number;
	guid:string;

	constructor (guid?: string) {
		if(typeof guid == undefined || !guid) {
			this.guid = createGuid();
		}
		else 
		{
			this.guid = guid;
		}
	}

	generate(): object {
		throw new Error("METHOD_NOT_IMPLEMENTED");
	}
}

export {ComponentBase as ComponentInterface};