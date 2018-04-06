/* eslint-disable new-cap */
const router = require('express').Router()
const argon = require('argon2')
const upload = require('../utils/multerUtil').getInstance()
const Account = require('../models/Account')
const accountUtil = require('../utils/accountUtil')
const hobbyUtil = require('../utils/hobbyUtil')

const accountForms = async (req, res, next) => {
    const step = +req.params.step
    let registrationData = null
    if (req.session.registration) {
        registrationData = req.session.registration
        if (step !== registrationData.step)
            res.redirect(`/account/create/${registrationData.step}`)
    }
    const stepOne = () =>
        res.render('account/create-account/step-1')
    const stepTwo = () =>
        res.render('account/create-account/step-2', {
            partialUser: registrationData
        })
    const stepThree = async () => {
        try {
            const hobbies = await hobbyUtil.find.all()
            res.render('account/create-account/step-3', {
                partialUser: registrationData,
                data: hobbies
            })
        } catch (err) {
            next(err)
        }
    }
    switch (step) {
        case 3:
            stepThree()
            break
        case 2:
            stepTwo()
            break
        default:
            stepOne()
            break
    }
}

const registerUser = (req, res, next) => {
    req.session.registration = Object.assign(req.session.registration, {
        hobbies: typeof req.body.hobbies === 'string'
            ? [req.body.hobbies]
            : req.body.hobbies
    })
    delete req.session.registration.step
    const newUser = new Account(req.session.registration)
    newUser.save((err, user) => {
        if (err) {
            next(err)
        } else {
            delete req.session.registration
            req.session.user = {
                _id: user._id
            }
            res.status(201).redirect('/home')
        }
    })
}

const registerSession = (req, res, next) => {
    const step = +req.params.step
    const stepOne = async () => {
        const { email, password } = req.body
        try {
            const emailExists = await accountUtil.find.byEmail(email)
            if (!emailExists) {
                const hashedPassword = await argon.hash(password)
                req.session.registration = {
                    step: 2,
                    email,
                    password: hashedPassword
                }
                res.status(200).redirect('/account/create/2')
            } else {
                res.status(400).redirect('/account/create/1')
            }
        } catch (err) {
            next(err)
        }
    }
    const stepTwo = () => {
        req.session.registration = Object.assign(req.session.registration, {
            step: 3,
            firstName: req.body.first_name,
            lastName: req.body.last_name,
            age: req.body.age,
            location: req.body.location,
            sex: req.body.sex,
            sexPref: typeof req.body.sex_pref === 'string'
                ? [req.body.sex_pref]
                : req.body.sex_pref,
            ageRange: {
                min: req.body.age_min,
                max: req.body.age_max
            },
            avatar: req.file.filename
        })
        res.status(200).redirect('/account/create/3')
    }
    switch (step) {
        case 2:
            stepTwo()
            break
        default:
            stepOne()
            break
    }
}

module.exports = router
    .get('/', (req, res) => res.redirect('/account/create/1'))
    .get('/:step', accountForms)
    .post('/:step', upload.single('avatar'), registerSession)
    .post('/', registerUser)
