const db = require('../config/database')

// Helper method to return the groups of a user
const getUserGroups = (username) => {
    return new Promise((resolve, reject) => {
        db.query('select groupz from users where username = ?', [username], (err, results) => {
            if (err) {
                reject(false)
            } else {
                try {
                    resolve(results[0].groupz)
                } catch (err) {
                    reject(false)
                }
            }
        })
    })
}

module.exports = { getUserGroups }