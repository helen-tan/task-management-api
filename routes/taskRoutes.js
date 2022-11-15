const express = require('express')
const router = express.Router()
const { createTask } = require('../controllers/taskController')

router.post('/createTask', createTask)

module.exports = router