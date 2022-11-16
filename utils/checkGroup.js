const db = require('../config/database')

const checkGroup = (username, groupname) => {
    return new Promise((resolve, reject) => {
        db.query('select * from users where username = ?', [username], (err, results) => {
            if (err) {
                reject(false)
            } else {
                try {
                    let user_groups = results[0].groupz
                    // check if the array contains groupname
                    if (user_groups.includes(groupname)) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                } catch (err) {
                    reject(false)
                }
            }
        })
    })
}

module.exports = { checkGroup }