if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SERCET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripe = require('stripe')(stripeSecretKey)
const express = require('express')
const nodemailer = require('nodemailer')
const ejs = require('ejs')
const path = require('path')
const qrcode = require('qrcode')
const exp = require('constants')
const bodyParser = require('body-parser')
// const path = require("path");
const mongoose = require('mongoose')
const app = express()

const port = process.env.port || 7070

// var mongoose = require("mongoose");
mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/node-demo')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public/'))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'view'))

// app.use(require("./routes/form"));

app.get('/', (req, res) => {
  res.render('index', {
    key: stripePublicKey,
  })
})

app.post('/scan', async (req, res, next) => {
  const input_text =
    'Name: ' +
    req.body.firstname +
    ' ' +
    req.body.lastname +
    '\r\n' +
    'Phone: ' +
    req.body.Phone +
    '\r\n' +
    'Email: ' +
    req.body.email +
    '\r\n' +
    'Airport of Depart: ' +
    req.body.Aird +
    '\r\n' +
    'Airport of Destination: ' +
    req.body.Airds
  // console.log(input_text)

  try {
    let img = await qrcode.toDataURL(input_text)
    qrcode.toDataURL(input_text, async (err, src) => {
      if (err) res.send('Something went wrong!!')
      res.render('end')
      let mailTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
      let details = {
        from: 'mohtashamahmed2005@gmail.com',
        to: req.body.email,
        subject: 'Here is your QRcode',
        // text: "Halo ini dari node js",
        attachDataUrls: true,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your QR Code</title>
  <style>
    body {
      font-family: 'Poppins', sans-serif;
      background-color: #f4f4f4;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #198754;
      margin-bottom: 20px;
    }
    p {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 30px;
    }
    .qr-code {
      margin: 20px 0;
    }
    .footer {
      font-size: 12px;
      color: #777;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
   <h1 style="color: #ff7a01;">Payment Successful!</h1>

    <p>Thank you for your payment. Your QR code for the flight is below. Please save it and show it at the airport.</p>
    <div class="qr-code">
      <img src="${img}" alt="Your QR Code" width="250" height="250">
    </div>
    <p>Safe travels! ✈️</p>
    <div class="footer">
      &copy; 2025 Secure Bagages. All rights reserved.
    </div>
  </div>
</body>
</html>`,
      }
      mailTransporter.sendMail(details, (err, info) => {
        if (err) {
          console.log('It has an Error', err)
        } else {
          console.log('Email has been sent')
        }
      })
    })
  } catch {
    res.redirect('/')
  }
})

app.post('/payment', async (req, res, next) => {
  stripe.customers
    .create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken,
      name: 'Secrue Bagages',
    })

    .then((customer) => {
      return stripe.charges.create({
        amount: 100,
        description: 'QRcode',
        currency: 'USD',
        customer: customer.id,
      })
    })
    .then((charge) => {
      res.render('scan')
    })

    .catch((err) => {
      res.redirect('/')
    })
})

app.listen(port, console.log(`Listening on port ${port}`))
