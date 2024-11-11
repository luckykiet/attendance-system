const { default: axios } = require("axios")
const _ = require('lodash')
const jwt = require('jsonwebtoken')
const { CONFIG } = require("../configs")

const utils = {
    fetchAresWithTin: async (tin) => {
        try {
            console.log(`Fetching ARES: ${tin}`)
            const response = await axios.get(
                `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${tin}`,
                { timeout: 5000 }
            )
            const data = response.data
            if (!data) {
                return { success: false, msg: `srv_ares_failed` }
            }
            if (!_.isEmpty(data.kod)) {
                return { success: false, msg: data.subKod ? data.subKod : data.kod }
            }
            const cpFull = !_.isEmpty(data.sidlo?.cisloOrientacni)
                ? `${data.sidlo?.cisloDomovni}/${data.sidlo.cisloOrientacni}`
                : data.sidlo.cisloDomovni

            return {
                success: true,
                msg: {
                    tin: data.ico,
                    name: data.obchodniJmeno,
                    vin: data.dic ? data.dic : '',
                    address: {
                        street: `${!_.isEmpty(data.sidlo.nazevUlice)
                            ? data.sidlo.nazevUlice
                            : data.sidlo.nazevObce
                            } ${cpFull}`,
                        city: data.sidlo.nazevObce,
                        zip: data.sidlo.psc ? data.sidlo.psc.toString() : '',
                    },
                },
            }
        } catch (error) {
            console.log(error.response?.data)
            return { success: false, msg: error.response?.data || `srv_ares_failed` }
        }
    },
    // Helper function to calculate distance (Haversine formula)
    calculateDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * (Math.PI / 180);
        const φ2 = lat2 * (Math.PI / 180);
        const Δφ = (lat2 - lat1) * (Math.PI / 180);
        const Δλ = (lon2 - lon1) * (Math.PI / 180);

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    },
    regex: {
        username: /^[a-z0-9]{4,}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
        simpleTinRegex: /^\d{7,8}$/,
    },
    signItemToken: (item, time) => {
        return time
            ? jwt.sign(item, CONFIG.jwtSecret, { expiresIn: time })
            : jwt.sign(item, CONFIG.jwtSecret)
    },
}

module.exports = utils