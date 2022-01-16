/* eslint-disable no-case-declarations */
/* eslint-disable indent */
import blessed from "blessed";
import logger from "../utils/logger.js";
import { DisplayCommunicator, CandidateDevice, ConnectionState } from "../DisplayCommunicator.js";
import DisplayDevice from "../DisplayDevice.js";

import { Program } from "../ProgramPlanner/Program.js";
import TextComponent from "../ProgramPlanner/TextComponent.js";
import ImageComponent from "../ProgramPlanner/ImageComponent.js";

import readline from "readline";
function askQuestion(query: string): Promise<number | string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise(resolve => rl.question(query, (ans: string) => {
		rl.close();
		resolve(ans);
	}));
}

async function main() {
	const devicesList = await DisplayCommunicator.searchForDevices("192.168.1.255", 10001, 2000);

	if (devicesList.length) {
		if (devicesList.length > 1) {
			logger.log({
				level: "info",
				message: "More than 1 device found. Selecting first from list",
				devices: devicesList.length
			});
		}

		//Selecting first card
		const displayCard: CandidateDevice = devicesList[0];

		const card: DisplayDevice = new DisplayDevice(displayCard.address, displayCard.port);

		card.on("uploadProgress", p => {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(`Progress: ${p}\r`);
		});

		//This reconnection is going to blow in somebody face. Maybe somebody will wind better option
		card.on("connectionStateChange", async (state) => {
			logger.debug(`Connection state: ${state}`);

			if(state===ConnectionState.DISCONNECTED) {
				const handle = setInterval(async () => {
					logger.debug("start init");
					try {
						if(await card.init()) {
							clearInterval(handle);
						}
					}
					catch (e) {
						logger.error(e);
					}
					logger.debug("stop init");
				},1000);
			}

			if(state===ConnectionState.LOST_COMMUNICATION) {
				card.deinit();
			}
		});

		try {
			await card.init();
		}
		catch (e) {
			logger.error(e);
		}
		
		//await card.init();
		logger.info(`Card name: ${card.name}`);

		// eslint-disable-next-line no-constant-condition
		while (true) {
			console.log("0 - Get Status");
			console.log("1 - Get Brightness");
			console.log("2 - Set Brightness");
			console.log("3 - List file");
			console.log("4 - Delete file");
			console.log("5 - Upload file");
			console.log("6 - Start video program");

			const ans: number = parseInt(await askQuestion("Please select desired option:  "));
			switch (ans) {
				case 0:
					console.log(card.getState());
					break;
				case 1:
					try {
						console.log(`Current brightness: ${await card.getBrightness()}`);
					}
					catch (e) {
						console.log("Error while fetching data");
					}
					break;
				case 2:
					const brightness: number = await askQuestion("How bright: ");
					await card.setBrightness(brightness);
					break;
				case 3:
					const fileList = await card.listFiles();
					console.log(fileList);
					break;
				case 4:
					const fileList = await card.listFiles();
					console.log(fileList);

					try {
						const file: string = await askQuestion("Which file? : ");
						const ret = await card.deleteFiles(file);
						console.log(ret);
					}
					catch (e) {
						console.log(`Error: ${e}`);
					}
					break;
				case 5:
					const uploadFile: string = await askQuestion("Input file path: ");
					await card.uploadFile(uploadFile);
					break;
				case 6:
					await card.addVideoProgram();
					break;
				case 7:
					const program = new Program();

					const parkingLogo = new ImageComponent(0,0,16,16,255, "image.jpg");

					const parkingName = new TextComponent(17,0,47,8,255, "ul.Gdańska 1234     ");

					const parkingSpaces = new TextComponent(17,8,47,8,255, "ul.Gdańska 1234     ");
					
					program.addComponent(parkingLogo);
					program.addComponent(parkingName);
					program.addComponent(parkingSpaces);
					try {
						await card.addProgram(program);
					}
					catch(e) {
						logger.error(e.toString());
					}
				break;
				default: console.log("UNKNOWN OPTION"); process.exit(0);
			}
		}
	}
	else {
		console.error("No device found!");
	}
}

main();