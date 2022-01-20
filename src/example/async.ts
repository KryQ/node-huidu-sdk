//import blessed from "blessed";
//import chalk from "chalk";
import { Program, TextComponent, ParkingSpacesComponent } from "../index.js";

/*
const bless = async () => {
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
};*/

const frame = {
	"fields": {
		"arrow": {
			"type": "arrow",
			"x": 0,
			"y": 0,
			"width": 20,
			"height": 20
		},
		"parking_name": {
			"type": "text",
			"x": 20,
			"y": -2,
			"width": 60,
			"font": "8x13"
		},
		"parking_status": {
			"type": "parking_status",
			"x": 20,
			"y": 9,
			"width": 60,
			"font": "8x13"
		}
	},
	"data": {
		"arrow": {
			"direction": "straight"
		},
		"parking_name": {
			"text": "ul. Gdańska",
			"color": {
				"r": 255,
				"g": 100,
				"b": 10
			}
		},
		"parking_status": {
			"status": "working_msg",
			"color": {
				"r": 222,
				"g": 222,
				"b": 255
			},
			"message": "Niska zajętość",
			"free_spaces": 987,
			"max_spaces": 1223
		}
	}
};

const convertProgram = (framedata:object) => {
	const prog = new Program();
	const fields = Object.entries(frame.fields);
	const data = Object.entries(frame.data);

	fields.forEach((d,i) => {
		const component = Object.assign(d[1], data[i][1]);

		switch (component.type) {
		case "text":
			prog.addComponent(new TextComponent(component.x, component.y, component.width, 8, 255, component.text));
			break;
		case "parking_status":
			prog.addComponent(new ParkingSpacesComponent(component.x, component.y, component.width, 8, 255, component.message, component.free_spaces, component.max_spaces));
			break;
		default:
			console.error("unknown component");
		}
	});

	return prog.generate();
};

const main = () => {
	console.log(convertProgram(frame));
};

main();