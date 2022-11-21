const express = require('express')
const router = express.Router()
const { createTask, getTasksByState, promoteTask2Done } = require('../controllers/taskController')

router.post('/createTask', createTask)
router.post('/getTasksByState', getTasksByState)
router.post('/promoteTask2Done', promoteTask2Done)

module.exports = router