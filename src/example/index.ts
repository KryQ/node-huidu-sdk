/* eslint-disable no-case-declarations */
/* eslint-disable indent */
import logger from "../utils/logger.js";
import { DisplayCommunicator, CandidateDevice } from "../DisplayCommunicator.js";
import DisplayDevice from "../DisplayDevice.js";

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
	const devicesList = await DisplayCommunicator.searchForDevices("192.168.10.255", 10001, 2000);

	if (devicesList.length) {
		if (devicesList.length > 1) {
			logger.log({
				level: "info",
				message: "More than 1 device found. Selecting first from list",
				devices: devicesList.length
			});
		}

		const displayCard: CandidateDevice = devicesList[0];

		const card: DisplayDevice = new DisplayDevice(displayCard.address, displayCard.port);
		await card.init();
		logger.info(`Card name: ${card.name}`);

		// eslint-disable-next-line no-constant-condition
		while (true) {
			console.log("0 - Get Status");
			console.log("1 - Get Brightness");
			console.log("2 - Set Brightness");
			console.log("3 - List file");

			const ans: number = parseInt(await askQuestion("Please select desired option:  "));
			switch (ans) {
				case 0:
					console.log(card.getState());
					break;
				case 1:
					console.log(`Current brightness: ${await card.getBrightness()}`);
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
				default: console.log("UNKNOWN OPTION Device state: " + card.getState());
			}
		}

		// setInterval(async () => {
		//     try {
		//         await this.setBrightness(Math.floor(Math.random() * (100 - 10)) + 10);
		//     }
		//     catch (e) {
		//         logger.error(e.toString())
		//     }
		// }, 300);

		// try {
		// 	const obj: any = await this.listFiles();
		// 	console.log(JSON.stringify(obj));
		// }
		// catch (e) {
		// 	logger.error(e);
		// }


		// try {
		// 	const obj: any = await this.deleteFiles("test_video.mp4");
		// 	console.log(JSON.stringify(obj));
		// }
		// catch (e) {
		// 	logger.error(e.toString());
		// }

		card.comm.on("progress", p => {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(`Progress: ${p}\r`);
		});

		// try {
		// 	const obj: any = await this.uploadFile("./assets/9x18B.bdf");
		// 	console.log(JSON.stringify(obj));
		// }
		// catch (e) {
		// 	logger.error(e);
		// }

		// try {
		// 	const obj: any = await this.addProgram();
		// 	console.log(obj.out);
		// }
		// catch (e) {
		// 	logger.error(e);
		// }
	}
	else {
		console.error("No device found!");
	}
}

main();