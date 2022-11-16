const db = require('../config/database')

// Helper method to return R_number of application
const getRnumber = (app_acronym) => {
    return new Promise((resolve, reject) => {
        db.query('select app_rnumber from applications where app_acronym = ?', [app_acronym], (err, results) => {
            if (err) {
                reject(false)
            } else {
                try {
                    resolve(results[0].app_rnumber)
                } catch (err) {
                    reject(false)
                }
            }
        })
    })
}

module.exports = { getRnumber }