import BaseComponent from "./BaseComponent.js";

class VideoComponent extends BaseComponent {
	readonly type = "video";

	video:string;

	constructor(x:number,y:number,width:number,height:number,alpha:number, video:string, guid?:string) {
		super(x,y,width,height,alpha, guid);

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