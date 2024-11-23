import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { BleManager } from "react-native-ble-plx";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useAppStore } from "@/stores/useAppStore";

const BLEBeacon = () => {
    const [bluetoothState, setBluetoothState] = useState("unknown");
    const [serverUrl, setServerUrl] = useState("");
    const [registerId, setRegisterId] = useState("");
    const [uuid, setUuid] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [allowedRadius, setAllowedRadius] = useState("");
    const [config, setConfig] = useState(null);
    const [manager] = useState(new BleManager());
    const { appId } = useAppStore();

    useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            setBluetoothState(state);
        }, true);

        loadConfig();

        return () => subscription.remove();
    }, []);

    const loadConfig = async () => {
        try {
            const storedConfig = await AsyncStorage.getItem("config");
            if (storedConfig) {
                const parsedConfig = JSON.parse(storedConfig);
                setConfig(parsedConfig);
                setUuid(parsedConfig.uuid);
                setRegisterId(parsedConfig.registerId);
                setServerUrl(parsedConfig.serverUrl);
                setLatitude(parsedConfig.location.latitude.toString());
                setLongitude(parsedConfig.location.longitude.toString());
                setAllowedRadius(parsedConfig.location.allowedRadius.toString());
            }
        } catch (error) {
            console.error("Failed to load config:", error.message);
        }
    };

    const startBeacon = async () => {
        if (bluetoothState !== "PoweredOn") {
            Alert.alert("Bluetooth is not powered on. Cannot start beacon.");
            return;
        }

        if (!uuid) {
            Alert.alert("No UUID found. Register before starting the beacon.");
            return;
        }

        try {
            manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
                if (error) {
                    console.error("BLE Scan Error:", error.message);
                    return;
                }
                console.log("Broadcasting UUID:", uuid);
            });
        } catch (error) {
            console.error("Failed to start beacon:", error.message);
        }
    };

    const registerDevice = async () => {
        if (!serverUrl || !registerId || !latitude || !longitude || !allowedRadius) {
            Alert.alert("All fields are required.");
            return;
        }

        try {
            const response = await axios.post(`${serverUrl}/api/local-device/register`, {
                deviceId: appId,
                registerId,
                location: {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    allowedRadius: parseFloat(allowedRadius),
                },
            });

            if (response.data.success) {
                const newUUID = response.data.msg.uuid;
                const newConfig = {
                    serverUrl,
                    registerId,
                    uuid: newUUID,
                    location: {
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                        allowedRadius: parseFloat(allowedRadius),
                    },
                };

                await AsyncStorage.setItem("config", JSON.stringify(newConfig));
                setConfig(newConfig);
                setUuid(newUUID);

                Alert.alert("Device registered successfully.");
                startBeacon();
            } else {
                throw new Error(response.data.msg || "Failed to register device.");
            }
        } catch (error) {
            Alert.alert("Registration Failed", error.message || "An error occurred.");
        }
    };

    const unregisterDevice = async () => {
        if (!config) {
            Alert.alert("No device registered.");
            return;
        }

        try {
            const response = await axios.post(`${config.serverUrl}/api/local-device/unregister`, {
                registerId: config.registerId,
                uuid: config.uuid,
            });

            if (response.data.success) {
                await AsyncStorage.removeItem("config");
                setConfig(null);
                setUuid("");
                Alert.alert("Device unregistered successfully.");
            } else {
                throw new Error(response.data.msg || "Failed to unregister device.");
            }
        } catch (error) {
            Alert.alert("Unregistration Failed", error.message || "An error occurred.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>BLE Beacon Manager</Text>

            {!config ? (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Server URL"
                        value={serverUrl}
                        onChangeText={setServerUrl}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Register ID"
                        value={registerId}
                        onChangeText={setRegisterId}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Latitude"
                        value={latitude}
                        onChangeText={setLatitude}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Longitude"
                        value={longitude}
                        onChangeText={setLongitude}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Allowed Radius"
                        value={allowedRadius}
                        onChangeText={setAllowedRadius}
                    />
                    <Button title="Register Device" onPress={registerDevice} />
                </>
            ) : (
                <>
                    <Text>Device UUID: {uuid}</Text>
                    <Button title="Start Beacon" onPress={startBeacon} />
                    <Button title="Unregister Device" onPress={unregisterDevice} />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 20,
        marginBottom: 20,
    },
    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
});

export default BLEBeacon;
