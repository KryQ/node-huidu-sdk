//import { v4 as uuidv4 } from "uuid";
import createGuid from "../helpers/CreateGUID.js";
import { ComponentInterface } from "./BaseComponent.js";

class TextComponent extends ComponentInterface {
	readonly type = "text";

	font: string;
	text:string;

	private singleLine = false;
	private effectIn = 0;
	private justify = "left";
	private color = "#FFFFFF";

	constructor(x:number, y:number, width:number, height:number, alpha:number, font: string, text:string, guid?:string) {
		super(guid);

		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.alpha = alpha;
		
		this.font = font;

		this.setText(text);

		if(typeof guid == undefined || !guid) {
			this.guid = createGuid();
		}
		else 
		{
			this.guid = guid;
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

	setText = (text:string) => {
		this.text = text;

		const fontWidth = 9;
		if(text.length>=(this.width/fontWidth)-1) {
			this.setSlidingText(true);
		}
		else {
			this.setSlidingText(false);
		}
	};

	setSize = (x:number, y:number, width: number, height: number) => {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		this.setText(this.text);
	};

	setAlpha = (alpha:number) => {
		this.alpha = alpha;
	};

	generate = ():object => {
		return {
			"@_alpha": this.alpha,
			"@_guid": this.guid,
			"rectangle": {
				"@_x": this.x,
				"@_height": this.height,
				"@_width": this.width,
				"@_y": this.y
			},
			"resources": {
				"text": {
					"@_guid": this.guid+"Text",
					"@_singleLine": this.singleLine,
					"style": {
						"@_valign": "middle",
						"@_align": this.justify,
					},
					"string": this.text,
					"font": {
						"@_name": this.font,
						"@_italic": false,
						"@_bold": false,
						"@_underline": false,
						"@_size": this.height,
						"@_color": this.color,
					},

					"effect": {
						"@_in": this.effectIn,
						"@_out": 0,
						"@_inSpeed": 5,
						"@_outSpeed": 0,
						"@_duration": 10,
					}
				}
			}
		};
	};
}

export default TextComponent;