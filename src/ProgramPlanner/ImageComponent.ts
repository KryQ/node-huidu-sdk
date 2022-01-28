import BaseComponent from "./BaseComponent.js";

class ImageComponent extends BaseComponent {
	readonly type = "image";

	image:string;
	
	constructor(x:number,y:number,width:number,height:number,alpha:number, image:string, guid?:string) {
		super(x,y,width,height,alpha, guid);

		this.image = image;
	}

	setImage = (image:string) => {
		this.image = image;
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
				"image": {
					"@_guid": this.guid+"Image",
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