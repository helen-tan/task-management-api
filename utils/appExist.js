const db = require('../config/database')

// Helper method to check if an app exist in the db
const appExist = (app_acronym) => {
    return new Promise((resolve, reject) => {
        db.query('select * from applications where app_acronym = ?', [app_acronym], (err, results) => {
            if (err) {
                reject(false)
            } else {
                try {
                    resolve(results)
                } catch (err) {
                    reject(false)
                }
            }
        })
    })
}

module.exports = { appExist }