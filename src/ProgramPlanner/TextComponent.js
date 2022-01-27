import { v4 as uuidv4 } from "uuid";
class TextComponent {
    constructor(x, y, width, height, alpha, font, text) {
        this.singleLine = false;
        this.effectIn = 0;
        this.justify = "left";
        this.color = "#FFFFFF";
        this.setSingleLine = (state) => {
            this.singleLine = state;
        };
        this.setSlidingText = (state) => {
            if (state) {
                this.effectIn = 26;
                this.text = this.text + "       ";
            }
            else {
                this.effectIn = 0;
                this.text = this.text.trimEnd();
            }
        };
        this.setJustify = (justify) => {
            this.justify = justify;
        };
        this.setColor = (color) => {
            this.color = color;
        };
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
                    "text": {
                        "@_guid": uuidv4(),
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
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.alpha = alpha;
        this.font = font;
        this.text = text;
        const fontWidth = 8;
        if (text.length >= (this.width / fontWidth) - 1) {
            this.setSlidingText(true);
        }
    }
}
export default TextComponent;
