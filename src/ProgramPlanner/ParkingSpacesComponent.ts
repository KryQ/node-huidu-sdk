import { v4 as uuidv4 } from "uuid";
import { ComponentInterface } from "./BaseComponent.js";
import TextComponent from "./TextComponent.js";

class ParkingSpacesComponent implements ComponentInterface {
	x:number;
	y:number;
	width:number;
	height:number;
	alpha:number;
	
	text:string;
	freeSpaces:number;
	maxSpaces:number;

	messageComponent: TextComponent;
	spacesComponent: TextComponent;

	constructor(x:number,y:number,width:number,height:number,alpha:number, text:string, freeSpaces:number, maxSpaces:number) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.alpha = alpha;

		this.text = text;
		this.freeSpaces = freeSpaces;
		this.maxSpaces = maxSpaces;

		this.messageComponent = new TextComponent(x, y, this.width-15, this.height, 255, text);
		this.spacesComponent = new TextComponent(this.x+(this.width-14), y, 14, this.height, 255, freeSpaces.toString());
		this.spacesComponent.setJustify("right");
		this.spacesComponent.setColor("#FFFF11");
	}

	generate = ():object => {
		return [this.messageComponent.generate(), this.spacesComponent.generate()];
	};
}

export default ParkingSpacesComponent;