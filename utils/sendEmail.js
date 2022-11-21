const nodemailer = require("nodemailer")
const db = require('../config/database')
const catchAsyncErrors = require('../middleware/catchAsyncErrors')

// Create transporter object - contains the sender's info/ credentials for our server
const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASSWORD
    }
})

// Verify SMTP connection
transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take our messages');
    }
});

// Send an email - to the project leader (everyone in the group 'projectleader') when a team member has promoted a task to "Done" state
const sendEmail = catchAsyncErrors(async (req, res) => {
    // Get taskID, task_name, username of logged in user
    const { taskID, username } = req.body

    // Get username, email of users in the group 'projectleads'
    const response = await getEmailUsername() // [ { "username": "projectlead", "email" : "projectlead@gmail.com" }, { "username": "projectlead2", "email" : "projectlead2@gmail.com" }]

    response.forEach((item) => {
        // mailOptions object
        const mailOptions = {
            from: '"Task Management System" <smtp.mailtrap.io>', // sender address
            to: `${item["email"]}`, // list of receivers
            subject: "Task Done Notification", // Subject line
            text: "Message sent with Nodemailer", // plain text body
            html: `<p><strong>Hi ${item["username"]}</strong></p>
                    <p>The user ${username} has promoted the task ${taskID} to the "Done" state.<p/>
                    <p>- The Task Management System</p>`, // html body
        }

        try {
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
            })
            
            console.log("Email sent")
            console.log(response)
            // res.status(200).send({
            //     success: true,
            //     message: "Email sent",
            //     response: response
            // })
    
        } catch (err) {
            console.log("Email could not be sent")
            console.log(err)
            // res.status(400).send({
            //     success: false,
            //     message: "Something went wrong"
            // })
        }
    })
})

// Helper method to return the email & username of users in the group "projectlead"
const getEmailUsername = () => {
    return new Promise((resolve, reject) => {
        db.query(`SELECT username, email FROM users WHERE JSON_EXTRACT(groupz, '$[0]') = "projectlead"`, (err, results) => {
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
    sendEmail
}