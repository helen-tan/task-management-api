const db = require('../config/database')

// Helper method to get the app_acronym of a task
const getAppAcronym = (task_id) => {
    return new Promise((resolve, reject) => {
        db.query('select task_app_acronym from tasks where task_id = ?', [task_id], (err, results) => {
            if (err) {
                reject(false)
            } else {
                try {
                    resolve(results[0].task_app_acronym)
                } catch (err) {
                    reject(false)
                }
            }
        })
    })
}

module.exports = { getAppAcronym }