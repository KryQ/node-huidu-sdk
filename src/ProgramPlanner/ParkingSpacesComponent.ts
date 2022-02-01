import BaseComponent from "./BaseComponent.js";
import TextComponent from "./TextComponent.js";

class ParkingSpacesComponent extends BaseComponent {
	readonly type = "parking_status";
	
	font:string;
	text:string;
	status: string;
	freeSpaces:number;
	maxSpaces:number;

	messageComponent: TextComponent;
	spacesComponent: TextComponent;

	constructor(
		x:number,
		y:number,
		width:number,
		height:number,
		alpha:number, 
		font:string, 
		text:string, 
		status:string, 
		freeSpaces:number, 
		maxSpaces:number, 
		guid?:string
	) {
		super(x,y,width,height,alpha, guid);

		this.font = font;
		this.text = text;
		this.status = status;
		this.freeSpaces = freeSpaces;
		this.maxSpaces = maxSpaces;

		this.messageComponent = new TextComponent(x, y, this.width, this.height, 255, this.font, text, guid+"Message");
		this.spacesComponent = new TextComponent(this.x+(this.width-10), y, 10, this.height, 0, this.font, freeSpaces.toString(), guid+"Spaces");

		this.setStatus(text, status, freeSpaces, maxSpaces);
	}

	setStatus = (text?:string, _status?:string, _freeSpaces?:number, _maxSpaces?:number) => {
		const fontWidth = 8;
		let freeSpacesStr = "";
		let freeSpacesWidth = 1;

		const status = _status? _status : this.status;

		if(status !== "closed") {
			const freeSpaces = _freeSpaces ? _freeSpaces : this.freeSpaces;
			const maxSpaces = _maxSpaces ? _maxSpaces : this.freeSpaces;

			freeSpacesStr = String(freeSpaces);
			freeSpacesWidth = (freeSpacesStr.length*fontWidth)+freeSpacesStr.length;

			this.spacesComponent.setSlidingText(false);
			this.spacesComponent.setJustify("right");

			const spaceRatio = freeSpaces/maxSpaces;
			if(spaceRatio>.66) {
				this.spacesComponent.setColor("#1fff01");
			}
			else if(spaceRatio>.33) {
				this.spacesComponent.setColor("#ffc801");
			}
			else {
				this.spacesComponent.setColor("#ff0e01");
			}

			this.messageComponent.setSize(this.x, this.y, this.width-freeSpacesWidth-1, this.height);
			
			this.spacesComponent.setSize(this.x+(this.width-freeSpacesWidth), this.y, freeSpacesWidth, this.height);
			this.spacesComponent.setAlpha(255);
			this.spacesComponent.setText(freeSpacesStr);
			this.spacesComponent.setSlidingText(false);
		}
		else {
			this.messageComponent.setSize(this.x, this.y, this.width, this.height);
			this.spacesComponent.setAlpha(0);
		}

		this.messageComponent.setText(text ? text : this.text);
	};

	setColor = (color: string) => {
		this.messageComponent.setColor(color);
	};

	generate = ():object => {
		return [this.messageComponent.generate(), this.status !== "closed" ? this.spacesComponent.generate():null];
	};
}

export default ParkingSpacesComponent;