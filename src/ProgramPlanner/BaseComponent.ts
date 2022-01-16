import { v4 as uuidv4 } from "uuid";

interface ComponentInterface {
	x:number;
	y:number;
	width:number;
	height:number;
	alpha:number;

	generate(): object;
}

export {ComponentInterface};