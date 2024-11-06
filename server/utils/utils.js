const { default: axios } = require("axios")
const _ = require('lodash')

const utils = {
    fetchAresWithTin: async (tin) => {
        try {
            console.log(`Fetching ARES: ${tin}`)
            const response = await axios.get(
                `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${tin}`,
                { timeout: 5000 }
            )
            const data = response.data
            console.log(data)
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
                    fullName: data.obchodniJmeno,
                    vin: data.dic ? data.dic : '',
                    address: {
                        street: `${!_.isEmpty(data.sidlo.nazevUlice)
                            ? data.sidlo.nazevUlice
                            : data.sidlo.nazevObce
                            } ${cpFull}`,
                        city: data.sidlo.nazevObce,
                        postalCode: data.sidlo.psc ? data.sidlo.psc.toString() : '',
                    },
                },
            }
        } catch (error) {
            console.log(error.response?.data)
            return { success: false, msg: error.response?.data || `srv_ares_failed` }
        }
    },
}

module.exports = utils