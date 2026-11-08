const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const { Resend } = require('resend')
require('dotenv').config()

const Email = require('./models/Email')

const app = express()

// Resend Setup
const resend = new Resend(process.env.RESEND_API_KEY)

// Middleware
app.use(cors())
app.use(express.json())

// Home Route
app.get('/', (req, res) => {
    res.send('Bulk Mail App Backend is Running!')
})

// Health Check API
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Backend API is working!'
    })
})

// Send Email API
app.post('/api/send', async (req, res) => {
    try {
        const { subject, recipients, message } = req.body

        if (!subject?.trim() || !recipients || !message?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required!'
            })
        }

        const emailList = (Array.isArray(recipients)
            ? recipients
            : recipients.split(',')
        )
            .map(email => email.trim())
            .filter(email => email !== '')

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (
            emailList.length === 0 ||
            emailList.some(email => !emailPattern.test(email))
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please enter valid email addresses!'
            })
        }

        const emailRecord = new Email({
            subject,
            body: message,
            recipients: emailList,
            status: 'Failed'
        })

        await emailRecord.save()

        // Send Email using Resend
        const { data, error } = await resend.emails.send({
            from: 'Bulk Mail App <onboarding@resend.dev>',
            to: emailList,
            subject: subject,
            text: message
        })

        if (error) {
            throw new Error(error.message)
        }

        emailRecord.status = 'Sent'
        await emailRecord.save()

        res.json({
            success: true,
            message: 'Emails sent successfully!',
            data: emailRecord
        })

    } catch (error) {
        console.error('Email Sending Error:', error.message)

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send emails!'
        })
    }
})

// Email History API
app.get('/api/history', async (req, res) => {
    try {
        const emails = await Email.find().sort({ sentAt: -1 })

        res.json({
            success: true,
            data: emails
        })

    } catch (error) {
        console.error('History Error:', error.message)

        res.status(500).json({
            success: false,
            message: 'Unable to fetch email history'
        })
    }
})

// Connect MongoDB and Start Server
const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully!')

        app.listen(PORT, () => {
            console.log(`Bulk Mail Backend running on port ${PORT}`)
        })
    })
    .catch(error => {
        console.log('MongoDB Connection Error:', error.message)
    })