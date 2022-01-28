import createGuid from "../helpers/CreateGUID.js";
import { ComponentInterface } from "./BaseComponent.js";

class VideoComponent extends ComponentInterface {
	readonly type = "video";

	video:string;

	constructor(x:number,y:number,width:number,height:number,alpha:number, video:string, guid?:string) {
		super(guid);

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
			"@_guid": this.guid,
			"rectangle": {
				"@_x": this.x,
				"@_height": this.height,
				"@_width": this.width,
				"@_y": this.y
			},
			"resources": {
				"video": {
					"@_guid": this.guid+"Video",
					"file": {
						"@_name": this.video
					}
				}
			}
		};
	};
}

export default VideoComponent;