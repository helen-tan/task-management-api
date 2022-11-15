const db = require('../config/database')
const catchAsyncErrors = require('../middleware/catchAsyncErrors')

// @desc    Create a task
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
        task_name,
        task_description,
        task_notes_input
    } = req.body

    // Get app_acronym (app identifier) of app of interest (from the params)
    const task_app_acronym = req.params.app_acronym

    // Get existing task_ids of tasks in the app
    let tasksArr = await getAppTaskIds(task_app_acronym) //  [ { task_id: 'NewTestApp_57' }, { task_id: 'NewTestApp_58' } ]
    //console.log(tasksArr)

    let taskIdRnumArr = []
    tasksArr.forEach((task) => {
        taskIdRnumArr.push(parseInt(task.task_id.split("_")[1]))
    })
    //console.log(taskIdRnumArr)

    let r_num
    if (taskIdRnumArr.length < 1) {
        // Get r_number of app with helper method
        r_num = await getRnumber(task_app_acronym) + 1
        // console.log(r_num)
    } else {
        r_num = Math.max(...taskIdRnumArr) + 1 // Increment the Rnumber based on the largest exisitng one
    }

    // Construct task_id: <app_acronym>_<app_rnumber>
    let task_id = `${task_app_acronym}_${r_num}`;

    // task_creator is the loggedInUser (from unique username in jwt token authMiddleware)
    const loggedInUser = req.username

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

    if (!task_name.match(task_nameRegexp)) {
        return res.status(200).send({
            success: false,
            message: 'Please give a valid task name'
        })
    }

    // Construct task notes string
    let task_notes = ""
    // If no user input for task
    if (!task_notes_input) {
        task_notes = `${loggedInUser} has created the task: ${task_name} [${today} ${hours}:${mins}:${seconds}]`
    } else {
        task_notes = `${loggedInUser} has created the task: ${task_name} [${today} ${hours}:${mins}:${seconds}]\n\n--------\n\n${loggedInUser} [${today} ${hours}:${mins}:${seconds}]: \n${task_notes_input}`
    }

    let task_plan = "" // At task creation, there will be no plan
    let task_state = "open"
    let task_creator = loggedInUser
    let task_owner = loggedInUser
    let task_createdate = today

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
            res.status(400).send({
                success: false,
                message: err.code
            })
        } else {
            res.status(201).send({
                success: true,
                message: 'Task created successfully',
                data: new_task,
            })
            console.log(new_task)
        }
    })
})

// Helper method to return R_number of application
const getRnumber = (app_acronym) => {
    return new Promise((resolve, reject) => {
        db.query('select app_rnumber from applications where app_acronym = ?', [app_acronym], (err, results) => {
            if (err) {
                reject(false)
            } else {
                try {
                    resolve(results[0].app_rnumber)
                } catch (err) {
                    reject(false)
                }
            }
        })
    })
}

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

module.exports = {
    createTask
}