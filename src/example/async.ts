import { Program } from "../ProgramPlanner/Program.js";
import TextComponent from "../ProgramPlanner/TextComponent.js";
import ImageComponent from "../ProgramPlanner/ImageComponent.js";

const main = async () => {
	const program = new Program();

	const parkingLogo = new ImageComponent(0,0,16,16,255,"parking.jpg");
	const parkingName = new TextComponent(16,0,47,8,255,"ul.Gdańska");
	const parkingSpaces = new TextComponent(16,8,47,8,255,"wolnych miejsc 20");

	program.addComponent(parkingLogo);
	program.addComponent(parkingName);
	program.addComponent(parkingSpaces);

	console.log(JSON.stringify(program.generate(), null, 2));
};

main();