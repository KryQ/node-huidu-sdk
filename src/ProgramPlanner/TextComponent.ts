import { v4 as uuidv4 } from "uuid";
import { ComponentInterface } from "./BaseComponent.js";

class TextComponent implements ComponentInterface {
	x:number;
	y:number;
	width:number;
	height:number;
	alpha:number;
	text:string;

	private scrollable = false;

	constructor(x:number,y:number,width:number,height:number,alpha:number, text:string) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.alpha = alpha;

		this.text = text;
	}

	setScrollable = (state:boolean) => {
		this.scrollable = state;
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
					"@_singleLine": this.scrollable,
					"style": {
						"@_valign": "middle",
						"@_align": "left",
					},
					"string": this.text,
					"font": {
						"@_name": "9x18B",
						"@_italic": false,
						"@_bold": false,
						"@_underline": false,
						"@_size": 8,
						"@_color": "#ffffff",
					},
					"effect": {
						"@_in": 26,
						"@_out": 0,
						"@_inSpeed": 8,
						"@_outSpeed": 8,
						"@_duration": 10,
					}
				}
			}
		};
	};
}

export default TextComponent;