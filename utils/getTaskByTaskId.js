const db = require('../config/database')

// Helper method to return the task_ids of an application
const getTaskByTaskId = (task_id) => {
    return new Promise((resolve, reject) => {
        db.query('select * from tasks where task_id = ?', [task_id], (err, results) => {
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

module.exports = { getTaskByTaskId }