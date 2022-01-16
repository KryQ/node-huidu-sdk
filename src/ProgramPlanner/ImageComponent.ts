import { v4 as uuidv4 } from "uuid";
import { ComponentInterface } from "./BaseComponent.js";

class ImageComponent implements ComponentInterface {
	x:number;
	y:number;
	width:number;
	height:number;
	alpha:number;
	image:string;

	constructor(x:number,y:number,width:number,height:number,alpha:number, image:string) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.alpha = alpha;

		this.image = image;
	}

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
				"image": {
					"@_guid": uuidv4(),
					"@_fit": "fill",
					"file": {
						"@_name": this.image
					}
				}
			}
		};
	};
}

export default ImageComponent;