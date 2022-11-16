const db = require('../config/database')

// Helper method to return the app_permit_doing of an application
const getAppPermitDoing = (app_acronym) => {
    return new Promise((resolve, reject) => {
        db.query('select app_permit_doing from applications where app_acronym = ?', [app_acronym], (err, results) => {
            if (err) {
                reject(false)
            } else {
                try {
                    resolve(results[0].app_permit_doing)
                } catch (err) {
                    reject(false)
                }
            }
        })
    })
}

module.exports = { getAppPermitDoing }