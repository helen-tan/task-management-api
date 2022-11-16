const db = require('../config/database')

// Helper method to return the task_ids of an application
const getAppTaskIds = (app_acronym) => {
    return new Promise((resolve, reject) => {
        db.query('select task_id from tasks where task_app_acronym = ?', [app_acronym], (err, results) => {
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

module.exports = { getAppTaskIds }