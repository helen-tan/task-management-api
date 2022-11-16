const express = require('express')
const router = express.Router()
const { createTask, getTasksByState } = require('../controllers/taskController')

router.post('/createTask', createTask)
router.get('/getTasksByState', getTasksByState)

module.exports = router