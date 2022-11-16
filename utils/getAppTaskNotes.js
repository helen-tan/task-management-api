const db = require('../config/database')

// Helper method to return the task_notes of a task of an App
const getAppTaskNotes = (task_id) => {
    return new Promise((resolve, reject) => {
        db.query('select task_notes from tasks where task_id = ?', [task_id], (err, results) => {
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

module.exports = { getAppTaskNotes }