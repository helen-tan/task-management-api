const db = require('../config/database')

// Helper method to return the app_permit_create of an application
const getAppPermitCreate = (app_acronym) => {
    return new Promise((resolve, reject) => {
        db.query('select app_permit_create from applications where app_acronym = ?', [app_acronym], (err, results) => {
            if (err) {
                reject(false)
            } else {
                try {
                    resolve(results[0].app_permit_create)
                } catch (err) {
                    reject(false)
                }
            }
        })
    })
}

module.exports = { getAppPermitCreate }