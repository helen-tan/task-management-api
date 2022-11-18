const express = require('express')
const dotenv = require('dotenv').config()
const PORT = process.env.PORT || 8000

// Route imports
const taskRoutes = require('./routes/taskRoutes')

const app = express()

app.get('/', (req, res) => {
    res.status(200).send({ message: 'Welcome to the Task Management API' })
})

// Middlewares
app.use(express.json()) // allow to send raw json
app.use(express.urlencoded({ extended: true })) // accept urlencoded form

// Catch incorrect json format
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error(err);
        return res.status(400).send({ code: "AA88" }); 
        // return res.status(400).send({ status: 404, message: err.message }); // Bad request
    }
    next();
});

// Catch incorrect passing of parameters in URL (catch % in url)
app.use((err, req, res, next) => {
    try {
        decodeURIComponent(req.path)
    } catch (err) {
        return res.send({ code: "AA99" })
    }
    next()
})

// Routes
app.use('/api/tasks', taskRoutes)

// Catch all routes that don't exist (includes special chars. Except % for some reason..)
app.all("*", (req, res, next) => {
    res.send({ code: "AA99" })
})

app.listen(PORT, () => console.log(`Server start on port ${PORT}`))