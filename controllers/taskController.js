const db = require('../config/database')
const bcrypt = require('bcryptjs') // for hashing passswords
const catchAsyncErrors = require('../middleware/catchAsyncErrors')

// utils (Helper methods)
const { getRnumber } = require('../utils/getRnumber')
const { getAppTaskIds } = require('../utils/getAppTaskIds')

// @desc    Create a task (Note: An app must already exist in the DB. Please check in DB)
// @route   /api//tasks/createTask
// @access  Private
const createTask = catchAsyncErrors(async (req, res) => {
    // Upon creation, user (project lead) cannot/don't need to provide: 
    // task_id, task_app_acronym
    // task_plan Can't be assigned yet. Only user of group in app_permit_create can. Default to be ""
    // task_notes - to be seen in view, and added to when task is first created
    // task_state - open by default
    // task_owner - by deafult the user who created
    const {
        username,
        password,
        applicationName,
        taskName,
        taskDescription
    } = req.body

    // query database for the user with these login credentials
    db.query('select * from users where username = ? ', [username], async (err, results) => {
        //console.log(results)
        if (err) {
            return res.send({
                code: "CT01"
            })
        } else {
            if (results.length > 0) {
                // Validation - Check that the is_active property is true first, otherwise prevent login
                if (!results[0].is_active) {
                    console.log("1")
                    return res.send({
                        code: "CT01"
                    })
                }
                // If user is active, begin authenticating
                const comparison = await bcrypt.compare(password, results[0].password)

                if (comparison) {
                    console.log("2")
                    console.log({
                        message: 'Login successful',
                        data: results,
                    });

                    createTaskAuthenticated()
                } else {
                    // username & password do not match
                    console.log("3")
                    return res.send({
                        code: "CT01"
                    })
                }
            } else {
                // username does not exist
                console.log("4")
                res.send({
                    code: "CT01"
                })
            }
        }
    })

    const createTaskAuthenticated = async () => {
        // Get existing task_ids of tasks in the app
        let tasksArr = await getAppTaskIds(applicationName) //  [ { task_id: 'NewTestApp_57' }, { task_id: 'NewTestApp_58' } ]
        //let tasksArr = [ { task_id: 'KlookMVP_1' }, { task_id: 'KlookMVP_2' } ]
        //console.log(tasksArr)
    
        let taskIdRnumArr = []
        tasksArr.forEach((task) => {
            taskIdRnumArr.push(parseInt(task.task_id.split("_")[1]))
        })
        //console.log(taskIdRnumArr)
    
        // Get r_number of app with helper method
        let r_num = await getRnumber(applicationName)
        let new_r_num
        if (taskIdRnumArr.length < 1) {
            new_r_num = r_num + 1
            // console.log(r_num)
        } else {
            new_r_num = Math.max(...taskIdRnumArr) + 1 // Increment the Rnumber based on the largest exisitng one
        }
    
        // Construct task_id: <app_acronym>_<app_rnumber>
        let task_id = `${applicationName}_${new_r_num}`;
    
        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        let yyyy = today.getFullYear();
    
        let hours = today.getHours()
        let mins = today.getMinutes()
        let seconds = today.getSeconds()
    
        today = yyyy + '-' + mm + '-' + dd;
    
        // Validation: Regex to validate user input
        const task_nameRegexp = /^(?! )[A-Za-z0-9._\s]{2,20}(?<! )$/          // only alphanumeric, dots, underscores, spaces in between, no leading & trailing spaces, min 2 mx 20 chars
    
        if (!taskName.match(task_nameRegexp)) {
            return res.status(200).send({
                success: false,
                message: 'Please give a valid task name'
            })
        }
    
        // Construct task notes string
        let task_notes = `${username} has created the task: ${taskName} [${today} ${hours}:${mins}:${seconds}]`
    
        let task_name = taskName
        let task_description = taskDescription
        let task_plan = "" // At task creation, there will be no plan
        let task_app_acronym = applicationName
        let task_state = "open"
        let task_creator = username
        let task_owner = username
        let task_createdate = today
    
        // Increase the current app_rnumber to prep for incrementing the app_rnumber in the db
        let new_app_rnumber = r_num + 1
    
        let new_task = {
            task_id,
            task_name,
            task_description,
            task_notes,
            task_plan,
            task_app_acronym,
            task_state,
            task_creator,
            task_owner,
            task_createdate
        }
        //console.log(new_task)
        //res.send(new_task)
    
        // Create new task
        db.query(`insert into tasks (
            task_id,
            task_name,
            task_description,
            task_notes,
            task_plan,
            task_app_acronym,
            task_state,
            task_creator,
            task_owner,
            task_createdate
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            task_id,
            task_name,
            task_description,
            task_notes,
            task_plan,
            task_app_acronym,
            task_state,
            task_creator,
            task_owner,
            task_createdate
        ], (err, results) => {
            if (err) {
                res.send({
                    code: "CT03"
                })
            } else {
                res.send({
                    code: "CT00",
                    task_id: task_id,
                })
    
                // Increment application r_number
                db.query(`UPDATE applications 
                SET app_rnumber = ?
                WHERE app_acronym = ?`, [new_app_rnumber, task_app_acronym], (err, results) => {
                    if (err) {
                        console.log("Could not increase app_rnumber")
                        console.log(err)
                    } else {
                        //console.log(results)
                        console.log(`r_number of ${task_app_acronym} increased from ${r_num} to ${new_app_rnumber}`)
                    }
                })
    
                console.log(new_task)
            }
        })

    }


})

module.exports = {
    createTask
}