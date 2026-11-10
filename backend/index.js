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
    let emailRecord

    try {
        const { subject, recipients, message } = req.body

        // Validate fields
        if (
            !subject?.trim() ||
            !recipients ||
            !message?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required!'
            })
        }

        // Convert recipients into array
        const emailList = (
            Array.isArray(recipients)
                ? recipients
                : recipients.split(',')
        )
            .map(email => email.trim())
            .filter(email => email !== '')

        // Email validation
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

        // Check Resend API Key
        if (!process.env.RESEND_API_KEY) {
            throw new Error('Resend API Key is missing!')
        }

        // Save email record in MongoDB
        emailRecord = new Email({
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

        // Update email status
        emailRecord.status = 'Sent'

        await emailRecord.save()

        // Success Response
        res.status(200).json({
            success: true,
            message: 'Emails sent successfully!',
            data: emailRecord
        })

    } catch (error) {

        console.error('Email Sending Error:', error)

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send emails!'
        })
    }
})

// Email History API
app.get('/api/history', async (req, res) => {

    try {

        const emails = await Email.find().sort({
            sentAt: -1
        })

        res.status(200).json({
            success: true,
            data: emails
        })

    } catch (error) {

        console.error('History Error:', error)

        res.status(500).json({
            success: false,
            message: 'Unable to fetch email history'
        })
    }
})

// MongoDB Connection and Server Start
const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGO_URI)

    .then(() => {

        console.log('MongoDB Connected Successfully!')

        app.listen(PORT, () => {
            console.log(
                `Bulk Mail Backend running on port ${PORT}`
            )
        })

    })

    .catch(error => {

        console.log(
            'MongoDB Connection Error:',
            error.message
        )

        process.exit(1)
    })