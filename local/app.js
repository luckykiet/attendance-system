const express = require("express");
const bodyParser = require("body-parser");
const bleno = require("@stoprocent/bleno");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const open = require("open");
const validUrl = require("valid-url");
const crypto = require("crypto");
const cron = require("node-cron");

const app = express();
const PORT = 3872;

const configFile = path.join(__dirname, "config.json");
const deviceFile = path.join(__dirname, "device.json");

let bluetoothState = "unknown";

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

const startBeacon = (uuid, customText = 'beacon') => {
    if (!uuid) {
        console.log("No UUID provided. Beacon will not start.");
        return;
    }

    if (bluetoothState !== "poweredOn") {
        console.log("Bluetooth is not powered on. Cannot start beacon.");
        return;
    }

    console.log(`Attempting to start beacon with UUID: ${uuid} and custom text: "${customText}"`);

    bleno.startAdvertising(customText, [uuid], (err) => {
        if (err) {
            console.error("Failed to start advertising:", err);
        } else {
            console.log(`Broadcasting UUID: ${uuid}`);
        }
    });
};

bleno.on("stateChange", async (state) => {
    bluetoothState = state;
    if (state === "poweredOn") {
        console.log("Bluetooth is powered on.");
        checkAndStartBeacon();
    } else {
        console.log("Bluetooth is not powered on. Stopping advertising...");
        bleno.stopAdvertising();
    }
});

bleno.on("advertisingStop", () => {
    console.log("Advertising stopped.");
});

async function getOrGenerateDeviceId() {
    try {
        if (await fs.pathExists(deviceFile)) {
            const deviceData = await fs.readJson(deviceFile);
            if (deviceData.id) return deviceData.id;
        }
    } catch { }
    const newId = crypto.randomUUID();
    await fs.writeJson(deviceFile, { id: newId }, { spaces: 2 });
    return newId;
}

async function checkAndStartBeacon() {
    const deviceId = await getOrGenerateDeviceId();
    if (bluetoothState !== "poweredOn") {
        console.log("Bluetooth is off. Waiting for it to be turned on.");
        return;
    }

    if (await fs.pathExists(configFile)) {
        const config = await fs.readJson(configFile);
        if (config.serverUrl && config.uuid && config.location) {
            console.log("Valid configuration found. Starting beacon...");
            startBeacon(config.uuid, deviceId);
        } else {
            console.log("Incomplete configuration. Beacon will not start.");
        }
    } else {
        console.log("No configuration found. Beacon will not start.");
    }
}

const renewUUID = async () => {
    if (!(await fs.pathExists(configFile))) {
        console.log("Configuration file not found. Cannot renew UUID.");
        return;
    }

    const config = await fs.readJson(configFile);

    try {
        const deviceId = await getOrGenerateDeviceId();
        const response = await axios.post(`${config.serverUrl}/api/local-device/renew`, {
            deviceId,
            registerId: config.registerId,
            uuid: config.uuid,
        });

        if (response.data.success) {
            const newUUID = response.data.msg;
            config.uuid = newUUID;
            await fs.writeJson(configFile, config, { spaces: 2 });

            console.log("UUID renewed successfully. Restarting beacon...");
            // Ensure the current advertising is stopped before starting a new one
            bleno.stopAdvertising(() => {
                startBeacon(newUUID);
            });
        } else {
            console.error("Failed to renew UUID:", response.data.msg);
        }
    } catch (error) {
        console.error("Error during UUID renewal:", error.message);
    }
};


// TODO: Change the schedule to run once a day
// cron.schedule("0 * * * *", async () => {
//     console.log("Running hourly UUID renewal task...");
//     await renewUUID();
// });

app.get("/", async (req, res) => {
    const deviceId = await getOrGenerateDeviceId();
    const configExists = await fs.pathExists(configFile);

    const config = configExists ? await fs.readJson(configFile) : {};

    if (config.serverUrl && config.uuid && config.location) {
        return res.render("unregister", {
            title: "Device Registered",
            message: bluetoothState !== "poweredOn" ? "Bluetooth is off. Beacon not running." : "",
            config,
            deviceId,
        });
    }

    res.render("form", {
        title: "Register and Start Beacon",
        deviceId,
        message: "",
        serverUrl: config.serverUrl || "",
        registerId: config.registerId || "",
        allowedRadius: config.location?.allowedRadius || "",
    });
});

app.post("/register", async (req, res) => {
    let { registerId, serverUrl, latitude, longitude, allowedRadius } = req.body;
    const deviceId = await getOrGenerateDeviceId();
    const errors = [];

    if (!serverUrl) {
        errors.push("Server URL is required.");
    } else {
        serverUrl = serverUrl.trim().replace(/\/+$/, "");
        if (!validUrl.isUri(serverUrl)) {
            errors.push("Server URL must be valid and include the protocol (http:// or https://).");
        }
    }

    if (!registerId || typeof registerId !== "string" || !registerId.trim()) {
        errors.push("Register ID is required and must not be empty.");
    } else {
        registerId = registerId.trim();
    }

    if (latitude && longitude) {
        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);
        if (isNaN(latitude) || isNaN(longitude)) {
            errors.push("Invalid latitude or longitude values.");
        }
    } else {
        latitude = longitude = '';
    }

    if (allowedRadius) {
        allowedRadius = parseFloat(allowedRadius);
        if (isNaN(allowedRadius) || allowedRadius < 0) {
            errors.push("Invalid allowed radius value.");
        }
    }

    if (errors.length > 0) {
        return res.render("form", {
            title: "Register and Start Beacon",
            message: errors.join(" "),
            deviceId,
            serverUrl,
            registerId,
            allowedRadius,
        });
    }

    try {
        const response = await axios.post(`${serverUrl}/api/local-device/register`, {
            deviceId,
            registerId,
            location: { latitude, longitude, allowedRadius },
        });

        if (response.data.success) {
            const { uuid, location } = response.data.msg;
            const config = { serverUrl, uuid, registerId, location };
            await fs.writeJson(configFile, config, { spaces: 2 });

            startBeacon(uuid);

            return res.redirect("/");
        }

        throw new Error(response.data.msg || "Failed to register device with the server.");
    } catch (error) {
        const message = error.response && error.response.data ? error.response.data.msg : error.message;
        console.error("Error during registration:", message);
        res.render("form", {
            title: "Register and Start Beacon",
            message: message || "Failed to register device. Please check the server URL.",
            deviceId,
            serverUrl,
            registerId,
        });
    }
});

app.post("/unregister", async (req, res) => {
    const configExists = await fs.pathExists(configFile);
    const deviceId = await getOrGenerateDeviceId();
    if (!configExists) {
        return res.redirect("/");
    }

    const config = await fs.readJson(configFile);

    try {
        const response = await axios.post(`${config.serverUrl}/api/local-device/unregister`, { deviceId, registerId: config.registerId, uuid: config.uuid });
        if (response.data.success) {
            await fs.remove(configFile);
            bleno.stopAdvertising();
            return res.redirect("/");
        }

        throw new Error(response.data.msg || "Failed to unregister device.");
    } catch (error) {
        const message = error.response && error.response.data ? error.response.data.msg : error.message;
        console.error("Error during registration:", message);
        await fs.remove(configFile);
        bleno.stopAdvertising();
        return res.redirect("/");
    }
});

(async () => {
    try {
        if (await fs.pathExists(configFile)) {
            const config = await fs.readJson(configFile);
            if (config.serverUrl && config.uuid && config.location) {
                checkAndStartBeacon();
            } else {
                open(`http://localhost:${PORT}`);
            }
        } else {
            open(`http://localhost:${PORT}`);
        }
    } catch (error) {
        console.error("Error during startup:", error.message);
    }
})();

(async () => {
    try {
        if (await fs.pathExists(configFile)) {
            const config = await fs.readJson(configFile);
            if (config.serverUrl && config.uuid && config.location) {
                checkAndStartBeacon();
            } else {
                open(`http://localhost:${PORT}`);
            }
        } else {
            open(`http://localhost:${PORT}`);
        }
    } catch (error) {
        console.error("Error during startup:", error.message);
    }
})();

app.use('*', (req, res) => {
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
