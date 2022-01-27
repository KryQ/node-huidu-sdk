import TextComponent from "./TextComponent.js";
class ParkingSpacesComponent {
    constructor(x, y, width, height, alpha, font, text, status, freeSpaces, maxSpaces) {
        this.setColor = (color) => {
            this.messageComponent.setColor(color);
        };
        this.generate = () => {
            return [this.messageComponent.generate(), this.status !== "closed" ? this.spacesComponent.generate() : null];
        };
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.alpha = alpha;
        this.font = font;
        this.text = text;
        this.status = status;
        this.freeSpaces = freeSpaces;
        this.maxSpaces = maxSpaces;
        const fontWidth = 8;
        let freeSpacesStr = "";
        let freeSpacesWidth = 1;
        if (status !== "closed") {
            freeSpacesStr = String(freeSpaces);
            freeSpacesWidth = (freeSpacesStr.length * fontWidth) + freeSpacesStr.length;
            this.spacesComponent = new TextComponent(this.x + (this.width - freeSpacesWidth), y, freeSpacesWidth, this.height, 255, this.font, freeSpaces.toString());
            this.spacesComponent.setSlidingText(false);
            this.spacesComponent.setJustify("right");
            const spaceRatio = freeSpaces / maxSpaces;
            if (spaceRatio > .66) {
                this.spacesComponent.setColor("#1fff01");
            }
            else if (spaceRatio > .33) {
                this.spacesComponent.setColor("#ffc801");
            }
            else {
                this.spacesComponent.setColor("#ff0e01");
            }
        }
        this.messageComponent = new TextComponent(x, y, this.width - freeSpacesWidth - 1, this.height, 255, this.font, text);
    }
}
export default ParkingSpacesComponent;
