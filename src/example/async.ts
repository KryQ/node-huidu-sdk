import blessed from "blessed";
import chalk from 'chalk';
import { DisplayCommunicator, CandidateDevice, ConnectionState } from "../DisplayCommunicator.js";
import DisplayDevice from "../DisplayDevice.js";

const main = async () => {
	const screen = blessed.screen({
		smartCSR:true,
		dockBorders: true
	});

	screen.title = "Huidu dashboard";

	const devicesListComponent = blessed.list({
		parent: screen,
		top: 0,
		left: 0,
		width: "30%",
		height: "40%",
		mouse: true,
		style: {
			item: {
				hover: {
					bg: "#555555"
				}
			}
		},
		items: [],
		border: {
			type: "line"
		}
	});

	const commandsList = blessed.list({
		parent: screen,
		top: "40%-1",
		left: 0,
		width: "30%",
		shrink: false,
		mouse: true,
		style: {
			selected: {
				fg: "#aa4444"
			},
			item: {
				hover: {
					bg: "#555555"
				}
			}
		},
		items: ["Get Brightness", "Set Brightness", "Run Video Program", "Run Parking"],
		border: {
			type: "line"
		}
	});

	const logList = blessed.log({
		parent: screen,
		top: "0",
		left: "30%-1",
		width: "70%",
		height: "100%",
		border: {
			type: "line"
		}
	});

	commandsList.on("select", (item) => {
		logList.add(item.content);
	});

	const prompt = blessed.prompt({
		parent: screen,
		
		left: "center",
		top: "center",
		height: "shrink",
		width: "shrink",
		border: "line",
	});

	const connectedDevices:Array<DisplayDevice> = [];
	screen.key("s", function() {
		prompt.input("Search:", "192.168.1.255", (err, ip) => {
			const devicesList = DisplayCommunicator.searchForDevices(ip, 10001, 2000);

			devicesList.then(devices => {
				devicesListComponent.clearItems();
				const devicesList:Promise<DisplayDevice>[] = devices.map(async d => {
					const card = new DisplayDevice(d.address, d.port, d.name);
					await card.init();
					return card;
				});

				logList.add(`${devicesList.length} devices found`);
			
				Promise.allSettled(devicesList)
					.then(promise => {
						promise.forEach((d,i) => {
							if(d.status === "fulfilled") {
								
								devicesListComponent.add(`${d.value.model} - ${d.value.name} `);
							}
						}
					});

				screen.render();
			});
		});
	});

	screen.key("q", function() {
		return screen.destroy();
	});

	screen.render();
};

main();