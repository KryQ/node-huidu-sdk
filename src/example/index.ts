/* eslint-disable no-case-declarations */
/* eslint-disable indent */
import logger from "../utils/logger.js";
import {
  DisplayCommunicator,
  CandidateDevice,
} from "../DisplayCommunicator.js";
import DisplayDevice from "../DisplayDevice.js";

import { Program } from "../ProgramPlanner/Program.js";
import TextComponent from "../ProgramPlanner/TextComponent.js";
import ImageComponent from "../ProgramPlanner/ImageComponent.js";
import VideoComponent from "../ProgramPlanner/VideoComponent.js";
import ParkingSpacesComponent from "../ProgramPlanner/ParkingSpacesComponent.js";

import readline from "readline";
import { faker } from "@faker-js/faker";

let card: DisplayDevice = null;

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans: string) => {
      rl.close();
      resolve(ans);
    })
  );
}

const selectDevice = async (
  devicesList: CandidateDevice[],
  id: number = null
) => {
  console.log(devicesList.map((d, i) => `${i} - ${d.address}:${d.port}`));

  let deviceId = 0;
  if (id === null)
    deviceId = Number(await askQuestion("Select device number: "));

  if (card) {
    await card.deinit();
  }

  card = new DisplayDevice(
    devicesList[deviceId].address,
    devicesList[deviceId].port
  );

  try {
    await card.init();
  } catch (e) {
    logger.error(e);
    process.exit(-1);
  }

  logger.info(`Card name: ${card.name}`);

  card.on("uploadProgress", (p) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`Progress: ${p}\r`);
  });
};

async function main() {
  const devicesList = await DisplayCommunicator.searchForDevices(
    "192.168.10.255",
    10001,
    2000
  );

  console.log(devicesList);

  if (!devicesList.length) {
    console.error("No device found!");
    return;
  }

  if (devicesList.length > 1) {
    logger.log({
      level: "info",
      message: "More than 1 device found.",
      devices: devicesList.length,
    });

    await selectDevice(devicesList);
  } else {
    await selectDevice(devicesList, 0);
  }

  card.on("connectionStateChange", async (state) => {
    logger.info("Connection state change: " + state);
  });

  let lastSentProgram: Program;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log("0 - Change device");
    console.log("1 - Get Brightness");
    console.log("2 - Set Brightness");
    console.log("3 - List file");
    console.log("4 - Delete file");
    console.log("5 - Upload file");
    console.log("6 - Start video program");
    console.log("7 - Start parking program");
    console.log("8 - Set ETH to DHCP");
    console.log("9 - Set Device Name");
    console.log("10 - Get Device Name");
    console.log("11 - Get Device Info");
    console.log("12 - Get Programs");
    console.log("13 - Set Boot Logo");
    console.log("14 - Reload all fonts");
    console.log("15 - Realtime Update");
    console.log("99 - Disconnect");

    const ans: number = parseInt(
      await askQuestion("Please select desired option:  ")
    );
    switch (ans) {
      case 0:
        selectDevice(devicesList);
        break;
      case 1:
        try {
          console.log(`Current brightness: ${await card.getBrightness()}`);
        } catch (e) {
          console.log("Error while fetching data");
        }
        break;
      case 2:
        const brightness: number = parseInt(await askQuestion("How bright: "));
        try {
          await card.setBrightness(brightness);
        } catch (e) {
          console.log("Error while fetching data: " + e);
        }
        break;
      case 3:
        console.log(await card.listFiles());
        break;
      case 4:
        const fileList = await card.listFiles();
        console.log(fileList);

        try {
          const file: string = await askQuestion("Which file? : ");
          const ret = await card.deleteFiles(file);
          console.log(ret);
        } catch (e) {
          console.log(`Error: ${e}`);
        }
        break;
      case 5:
        const uploadFile: string = await askQuestion("Input file path: ");
        await card.uploadFile(uploadFile);
        break;
      case 6:
        const program = new Program();

        const videoComponent = new VideoComponent(
          0,
          0,
          192,
          32,
          255,
          "test_video.mp4"
        );

        program.addComponent("video", videoComponent);

        try {
          await card.addProgram(program);
        } catch (e) {
          logger.error(e.toString());
        }
        break;
      case 7: {
        const program = new Program();

        const parkingLogoComponent = new ImageComponent(
          0,
          0,
          32,
          32,
          255,
          "logo.png"
        );
        const parkingNameComponent = new TextComponent(
          33,
          0,
          192 - 33,
          16,
          255,
          "Fixed_9x18B",
          faker.address.streetAddress(false)
        );
        const parkingSpacesComponent = new ParkingSpacesComponent(
          33,
          16,
          192 - 33,
          16,
          255,
          "Fixed_9x18B",
          "miejsc",
          "working",
          10,
          20
        );

        program.addComponent("logo", parkingLogoComponent);
        program.addComponent("name", parkingNameComponent);
        program.addComponent("parking", parkingSpacesComponent);

        try {
          await card.addProgram(program);
          lastSentProgram = program;
        } catch (e) {
          logger.error(e.toString());
        }
        break;
      }
      case 8:
        try {
          await card.setEth();
        } catch (e) {
          console.log(e);
          logger.error(e.toString());
        }
        break;
      case 9:
        try {
          const devName: string = await askQuestion("Device name: ");
          await card.setName(devName);
        } catch (e) {
          console.log(e);
          logger.error(e.toString());
        }
        break;
      case 10:
        try {
          console.log(`Device name: ${await card.getName()}`);
        } catch (e) {
          console.log("Error while fetching data");
        }
        break;
      case 11:
        try {
          console.log(
            `Info: ${JSON.stringify(await card.getDeviceInfo(), null, 2)}`
          );
        } catch (e) {
          console.log(e);
          logger.error(e.toString());
        }
        break;
      case 12:
        try {
          console.log(
            `Info: ${JSON.stringify(await card.getProgram(), null, 2)}`
          );
        } catch (e) {
          console.log(e);
          logger.error(e.toString());
        }
        break;
      case 13:
        {
          const bootLogo: string = await askQuestion("Input file name: ");
          try {
            await card.setBootLogo(bootLogo);
          } catch (e) {
            console.error(e);
          }
        }
        break;
      case 14:
        {
          try {
            await card.reloadAllFonts();
          } catch (e) {
            console.error(e);
          }
        }
        break;
      case 15:
        try {
          (lastSentProgram.components["name"] as TextComponent).setText(
            faker.address.streetAddress(false)
          );
          (
            lastSentProgram.components["parking"] as ParkingSpacesComponent
          ).setStatus(faker.lorem.sentence(3), "closed", 10, 20);
          await card.updateProgram(lastSentProgram).catch(console.error);
        } catch (e) {
          console.log("Error while fetching data");
        }
        break;
        case 98:
          try {
            await card.reboot();
            console.log("Restarted");
          } catch (e) {
            console.log("Error while fetching data");
          }
          break;

        case 99:
        {
          try {
            await card.deinit();
          } catch (e) {
            console.error(e);
          }
        }
        break;
      default: {
        console.log("UNKNOWN OPTION");
        await card.deinit();
        process.exit(0);
      }
    }
  }
}

main();
