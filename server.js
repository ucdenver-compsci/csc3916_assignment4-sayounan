/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authController = require('./auth');
const authJwtController = require('./auth_jwt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./Users');
const Movie = require('./Movies');
const Review = require('./Reviews');
const res = require("express/lib/response");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

const router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    const json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        const user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code === 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    const userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                const userToken = {id: user.id, username: user.username};
                const token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/movies')
    .all(passport.authenticate('jwt', {session : false}))
    .get(function(req, res) {
        if (req.query.reviews === 'true') {
            Movie.aggregate([
                /*
                {
                    $match: { _id: orderId } // replace orderId with the actual order id
                },
                 */

                {
                    $lookup: {
                        from: "Review", // name of the foreign collection
                        localField: "_id", // field in the orders collection
                        foreignField: "movieId", // field in the items collection
                        as: "Reviews" // output array where the joined items will be placed
                    }
                }
            ]).exec(function(err, result) {
                if (err) {
                    // handle error
                    if (err)
                        res.status(500).send({success: false, msg: 'Failed to get reviews.'});
                } else {
                    res.json(result);
                    console.log(result);
                }
            });
        } else {
            Movie.find({}, function(err, result) {
                if (err) {
                    // handle error
                    if (err)
                        res.status(500).send({success: false, msg: 'Failed to get reviews.'});
                } else {
                    res.json(result);
                    console.log(result);
                }
            })
        }})

    .post(function(req, res) {
        const movie = new Movie(req.body);
        movie.save((err, result) => {
            if (err) {
                // handle error
                if (err)
                    res.status(500).send({success: false, msg: 'Failed to save.'});
            } else {
                res.json(result);
                console.log(result);
            }
        })
    })

    .put(function(req, res) {
        Movie.findByIdAndUpdate(req.body._id, req.body, {new: true}, (err,
                                                                      result) => {
            if (err) {
                // handle error
                res.status(500).send({success: false, msg: 'Failed to update.'});
            } else {
                res.json(result);
                console.log(result);
            }
        });
    })

    .delete(function(req, res) {
        Movie.findByIdAndDelete(req.body._id, (err, result) => {
            if (err) {
                // handle error
                res.status(500).send({success: false, msg: 'Failed to delete.'});
            } else {
                res.json(result);
                console.log(result);
            }
        });
    })

    .post(function(req, res) {
        const review = new Review(req.body);
        review.save((err, result) => {
            if (err) {
                res.status(500).send({success: false, msg: 'Failed to get reviews.'});
            } else {
                res.json(result);
                console.log(result);
            }
        });
    })

    .delete(function(req, res) {
        Review.findByIdAndDelete(req.body._id, (err, result) => {
            if (err) {
                res.status(500).send({success: false, msg: 'Failed to delete review.'});
            } else {
                res.json(result);
                console.log(result);
            }
        });
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


