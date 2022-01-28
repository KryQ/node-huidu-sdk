import crypto from "crypto";

const createGuid = () => crypto.randomBytes(6).toString("hex");

export default createGuid;