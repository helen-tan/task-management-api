const db = require('../config/database')

// Helper method to return tasks by state
const getTasksByTaskState = (task_state) => {
    return new Promise((resolve, reject) => {
        db.query('select * from tasks where task_state = ?', [task_state], (err, results) => {
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

module.exports = { getTasksByTaskState }