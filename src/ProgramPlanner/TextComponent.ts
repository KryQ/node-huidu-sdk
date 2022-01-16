import { v4 as uuidv4 } from "uuid";
import { ComponentInterface } from "./BaseComponent.js";

class TextComponent implements ComponentInterface {
	x:number;
	y:number;
	width:number;
	height:number;
	alpha:number;
	text:string;

	private singleLine = false;
	private effectIn = 0;
	private justify = "left";
	private color = "#FFFFFF";

	constructor(x:number,y:number,width:number,height:number,alpha:number, text:string) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.alpha = alpha;

		this.text = text;
		if(text.length>10) {
			this.setSlidingText(true);
		}
	}

	setSingleLine = (state:boolean) => {
		this.singleLine = state;
	};

	setSlidingText = (state: boolean) => {
		if(state) {
			this.effectIn = 26;
			this.text = this.text+"       ";
		}
		else {
			this.effectIn =0;
			this.text = this.text.trimEnd();
		}
	};

	setJustify = (justify: string) => {
		this.justify = justify;
	};

	setColor = (color: string) => {
		this.color = color;
	};

	generate = ():object => {
		return {
			"@_alpha": this.alpha,
			"@_guid": uuidv4(),
			"rectangle": {
				"@_x": this.x,
				"@_height": this.height,
				"@_width": this.width,
				"@_y": this.y
			},
			"resources": {
				"text": {
					"@_guid": uuidv4(),
					"@_singleLine": this.singleLine,
					"style": {
						"@_valign": "middle",
						"@_align": this.justify,
					},
					"string": this.text,
					"font": {
						"@_name": "5x8.bdf",
						"@_italic": false,
						"@_bold": false,
						"@_underline": false,
						"@_size": 8,
						"@_color": this.color,
					},
					"effect": {
						"@_in": this.effectIn,
						"@_out": 0,
						"@_inSpeed": 8,
						"@_outSpeed": 0,
						"@_duration": 10,
					}
				}
			}
		};
	};
}

export default TextComponent;