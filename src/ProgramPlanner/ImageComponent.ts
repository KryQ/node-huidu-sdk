import BaseComponent from "./BaseComponent.js";

type TImage = { name: string, md5?: string };

class ImageComponent extends BaseComponent {
	readonly type = "image";

	name: string;
	md5?: string;

	constructor(x: number, y: number, width: number, height: number, alpha: number, image: TImage, guid?: string) {
		super(x, y, width, height, alpha, guid);

		if (image.name === undefined) {
			throw new Error("Component need either name or md5 hash of image!");
		}

		this.name = image.name;
		this.md5 = image.md5;
	}

	setImage = (image: TImage) => {
		if (image.name === undefined) {
			throw new Error("Component need either name or md5 hash of image!");
		}

		this.name = image.name;
		this.md5 = image.md5;
	};

	generate = (): object => ({
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
				"@_guid": this.guid + "Image",
				"@_fit": "fill",
				"file": {
					"@_name": this.name,
					...(this.md5 && { "@_md5": this.md5 }),
				}
			}
		}
	});
}

export default ImageComponent;