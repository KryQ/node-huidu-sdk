import createGuid from "../helpers/CreateGUID.js";

abstract class BaseComponent {
	abstract type: string;
	x:number;
	y:number;
	width:number;
	height:number;
	alpha:number;
	
	guid:string;

	constructor (x:number, y:number, width:number, height:number, alpha:number, guid?: string) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.alpha = alpha;

		if(typeof guid == undefined || !guid) {
			this.guid = createGuid();
		}
		else 
		{
			this.guid = guid;
		}
	}

	abstract generate(): object
}

export default BaseComponent;