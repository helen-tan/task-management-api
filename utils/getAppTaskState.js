const db = require('../config/database')

// Helper method to return the task_state of a task of an App
const getAppTaskState = (task_id) => {
    return new Promise((resolve, reject) => {
        db.query('select task_state from tasks where task_id = ?', [task_id], (err, results) => {
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

module.exports = { getAppTaskState }