import { v4 as uuidv4 } from "uuid";
class Program {
    constructor() {
        this.components = [];
        this.generate = () => {
            const createList = () => this.components.map(component => component.generate()).flat();
            return {
                "@_timeStamps": Math.round(Date.now() / 1000),
                "program": {
                    "@_guid": uuidv4(),
                    "@_type": "normal",
                    "area": createList()
                }
            };
        };
        this.addComponent = (component) => {
            this.components.push(component);
            return true;
        };
    }
}
export { Program };
