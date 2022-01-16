import { v4 as uuidv4 } from "uuid";
import { ComponentInterface } from "./BaseComponent.js";

class VideoComponent implements ComponentInterface {
	x:number;
	y:number;
	width:number;
	height:number;
	alpha:number;
	video:string;

	constructor(x:number,y:number,width:number,height:number,alpha:number, video:string) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.alpha = alpha;

		this.video = video;
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
				"video": {
					"@_guid": uuidv4(),
					"file": {
						"@_name": this.video
					}
				}
			}
		};
	};
}

export default VideoComponent;