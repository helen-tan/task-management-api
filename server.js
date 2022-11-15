const express = require('express')
const dotenv = require('dotenv').config()
const PORT = process.env.PORT || 3000

// Route imports
const taskRoutes = require('./routes/taskRoutes')

const app = express()

// Routes
app.get('/', (req, res) => {
    res.status(200).send({ message: 'Welcome to the Task Management API' })
})

// Middlewares
app.use(express.json()) // allow to send raw json
app.use(express.urlencoded({ extended: false })) // accept urlencoded form

app.use('/api/tasks', taskRoutes)

app.listen(PORT, () => console.log(`Server start on port ${PORT}`))