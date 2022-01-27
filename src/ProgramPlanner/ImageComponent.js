import { v4 as uuidv4 } from "uuid";
class ImageComponent {
    constructor(x, y, width, height, alpha, image) {
        this.generate = () => {
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
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.alpha = alpha;
        this.image = image;
    }
}
export default ImageComponent;
