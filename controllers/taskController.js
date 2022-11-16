const db = require('../config/database')
const bcrypt = require('bcryptjs') // for hashing passswords
const catchAsyncErrors = require('../middleware/catchAsyncErrors')

// utils (Helper methods)
const { getRnumber } = require('../utils/getRnumber')
const { getAppTaskIds } = require('../utils/getAppTaskIds')
const { getAppTaskNotes } = require('../utils/getAppTaskNotes')
const { getAppTaskState } = require('../utils/getAppTaskState')
const { getAppPermitCreate } = require('../utils/getAppPermitCreate')
const { getAppPermitDoing } = require('../utils/getAppPermitDoing')
const { getUserGroups } = require('../utils/getUserGroups')
const { getAppAcronym } = require('../utils/getAppAcronym')
// const { checkGroup } = require('../utils/checkGroup')

// @desc    Create a task (Note: An app must already exist in the DB. Please check in DB)
// @route   /api//tasks/createTask
// @access  Private
const createTask = async (req, res) => {
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

    try {
        // req = abc // Use this to induce the catch all error
        // query database for the user with these login credentials
        db.query('select * from users where username = ? ', [username], async (err, results) => {
            //console.log(results)
            if (err) {
                console.log(err)
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

    } catch (err) {
        console.log('Activated catch all in createTask login')
        console.log(err)
        res.send({
            code: "CT99"
        })
    }


    const createTaskAuthenticated = async () => {
        try {
            // Check and see if user's groups is in the app's app_permit_create. Only users in the group specified by app_permit_create can create tasks
            // Get the app's app_permit_create
            const app_permit_create = await getAppPermitCreate(applicationName)
            // console.log(app_permit_create)

            // Check the user's groups (an array)
            const user_groups = await getUserGroups(username)
            // console.log(user_groups)

            // Check if the group in app_permit_create is in the user's groups
            let permitted = false
            if (user_groups.includes(app_permit_create)) {
                permitted = true
                console.log(`The user ${username} is in the app_permit_create of the app ${applicationName} and hence is allowed to create tasks`)
            } else {
                console.log(`The user ${username} is not in the app_permit_create of the app ${applicationName} and hence cannot create tasks`)
                return res.send({
                    code: "CT01"
                })
            }
            // console.log(permitted)

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
            const task_nameRegexp = /^(?! )[A-Za-z0-9._\s]{0,45}(?<! )$/          // only alphanumeric, dots, underscores, spaces in between, no leading & trailing spaces, max 20 chars

            if (!taskName.match(task_nameRegexp)) {
                console.log("Please provide a valid task name")
                return res.send({
                    code: "CT03"
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
                        code: "CT01"
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
        } catch (err) {
            console.log('Catch all activated in createTaskAuthenticated')
            console.log(err)
            res.send({
                code: "CT99"
            })
        }
    }
}

// @desc    Get tasks by state
// @route   /api//tasks/getTasksByState
// @access  Private
const getTasksByState = catchAsyncErrors(async (req, res) => {
    const {
        username,
        password,
        applicationName,
        taskState
    } = req.body

    // query database for the user with these login credentials
    db.query('select * from users where username = ? ', [username], async (err, results) => {
        //console.log(results)
        if (err) {
            return res.send({
                code: "GT01"
            })
        } else {
            if (results.length > 0) {
                // Validation - Check that the is_active property is true first, otherwise prevent login
                if (!results[0].is_active) {
                    console.log("1")
                    return res.send({
                        code: "GT01"
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

                    getTasksByStateAuthenticated()
                } else {
                    // username & password do not match
                    console.log("3")
                    return res.send({
                        code: "GT01"
                    })
                }
            } else {
                // username does not exist
                console.log("4")
                res.send({
                    code: "GT01"
                })
            }
        }
    })

    const getTasksByStateAuthenticated = async () => {
        db.query(`select * from tasks where task_app_acronym = ? and task_state = ?`, [applicationName, taskState], (err, results) => {
            if (err) {
                res.send({
                    code: "GT01"
                })
            } else {
                res.send({
                    code: "GT00",
                    tasks: results
                })
            }
        })
    }
})

// @desc    Promote Task to Done State
// @route   /api//tasks/promoteTask2Done
// @access  Private
const promoteTask2Done = catchAsyncErrors(async (req, res) => {
    const {
        username,
        password,
        taskID,
        taskNotes
    } = req.body

    // query database for the user with these login credentials
    db.query('select * from users where username = ? ', [username], async (err, results) => {
        //console.log(results)
        if (err) {
            return res.send({
                code: "PT01"
            })
        } else {
            if (results.length > 0) {
                // Validation - Check that the is_active property is true first, otherwise prevent login
                if (!results[0].is_active) {
                    console.log("1")
                    return res.send({
                        code: "PT01"
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

                    promoteTask2DoneAuthenticated()
                } else {
                    // username & password do not match
                    console.log("3")
                    return res.send({
                        code: "PT01"
                    })
                }
            } else {
                // username does not exist
                console.log("4")
                res.send({
                    code: "PT01"
                })
            }
        }
    })

    const promoteTask2DoneAuthenticated = async () => {
        // Check and see if user's groups is in the app's app_permit_doing. Only users in the group specified by app_permit_doing can promote tasks to Done
        // Get app_acronym of the task
        const app_acronym = await getAppAcronym(taskID)
        // console.log(app_acronym)

        // Get the app's app_permit_doing
        const app_permit_doing = await getAppPermitDoing(app_acronym)
        // console.log(app_permit_doing)

        // Check the user's groups (an array)
        const user_groups = await getUserGroups(username)
        // console.log(user_groups)

        // Check if the group in app_permit_doing is in the user's groups
        let permitted = false
        if (user_groups.includes(app_permit_doing)) {
            permitted = true
            console.log(`The user ${username} is in the app_permit_doing of the app ${app_acronym} and hence is able to promote tasks to Done`)
        } else {
            console.log(`The user ${username} is not in the app_permit_doing of the app ${app_acronym} and hence cannot promote tasks to Done`)
            return res.send({
                code: "PT01"
            })
        }

        // Get existing task_notes of the task to append the new_note to the string of task_notes
        const response1 = await getAppTaskNotes(taskID)
        const existing_notes = response1[0].task_notes

        // Get current state of task
        const response2 = await getAppTaskState(taskID)
        const current_state = response2[0].task_state

        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        let yyyy = today.getFullYear();

        let hours = today.getHours()
        let mins = today.getMinutes()
        let seconds = today.getSeconds()

        today = yyyy + '-' + mm + '-' + dd;

        // Check the current task_state
        // Determine updated state + Construct string for new note
        let new_state = ""
        let new_note = ""
        // Task not in doing state (in open state)
        if (current_state === "open") {
            console.log(`The task ${taskID} is in the ${current_state} state and cannot be promoted to Done`)
            res.send({
                code: "PT02"
            })
            // Task not in doing state (in todo state)
        } else if (current_state === "todo") {
            console.log(`The task ${taskID} is in the ${current_state} state and cannot be promoted to Done`)
            res.send({
                code: "PT02"
            })
            // Task not in doing state (in close state) TODO: Change 'closed' to 'close' in Db!!!!!!
        } else if (current_state === "closed") {
            console.log(`The task ${taskID} is in the ${current_state} state and cannot be promoted to Done`)
            res.send({
                code: "PT02"
            })
            // Task not in doing state (in done state)
        } else if (current_state === "done") {
            console.log(`The task ${taskID} is already in the Done state`)
            res.send({
                code: "PT02"
            })
        } if (current_state === "doing") {
            new_state = "done"
            new_note = `\n\n--------\n\n ${username} has promoted the task from "Doing" to "Done" [${today} ${hours}:${mins}:${seconds}]\n\n--------\n\n ${username} [${today} ${hours}:${mins}:${seconds}]: \n${taskNotes}`

            // Append new string to current notes
            const updated_task_notes = existing_notes + new_note

            db.query(`UPDATE tasks 
                SET task_state = ?, task_owner = ?, task_notes = ?
                WHERE task_id = ?`, [new_state, username, updated_task_notes, taskID], (err, results) => {
                if (err) {
                    res.send({
                        code: "PT01"
                    })
                } else {
                    res.send({
                        code: "PT00",
                        data: {
                            task_id: taskID,
                            task_state: new_state,
                            task_owner: username,
                            task_notes: updated_task_notes
                        },
                    })
                }
            })
        }
    }
})

module.exports = {
    createTask,
    getTasksByState,
    promoteTask2Done
}