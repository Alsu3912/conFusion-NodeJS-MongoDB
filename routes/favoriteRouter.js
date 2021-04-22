const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Favorites = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200) })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err) {
        return next(err);
      } else {
        if (favorite != null) {
          Favorites.findById(favorite._id)
            .populate('user')
            .populate('dishes')
            .then((favoriteList) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favoriteList);
            }, (err) => next(err))
        } else {
          err = new Error('There are no favorites for the user ' + req.user.username);
          err.statusCode = 404;
          return next(err);
        }
      }
    })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err) {
        return next(err);
      } else {
        if (favorite != null) {
          req.body.map((element) => {
            if (favorite.dishes.indexOf(element._id) == -1) {
              favorite.dishes.push(element._id);
            };
          });
          favorite.save()
            .then((fav) => {
              Favorites.findById(fav._id)
                .populate('user')
                .populate('dishes')
                .then((favoriteList) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favoriteList);
                })
            }, (err) => next(err));
        } else {
          let favDishes = [];
          req.body.map((element) => {
            favDishes.push(element._id);
          });
          Favorites.create({ user: req.user._id, dishes: favDishes })
            .then((favorite) => {
              console.log('Your favorites created ', favorite);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorite);
            }, (err) => next(err));
        }
      }
    })
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorites');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err) {
        return next(err);
      } else {
        if (favorite != null) {
          Favorites.findByIdAndRemove(favorite._id)
            .then((resp) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(resp);
            }, (err) => next(err))
        } else {
          err = new Error('There are no favorites for you to delete');
          err.statusCode = 404;
          return next(err);
        }
      }
    })
      .catch((err) => next(err));
  });

favoriteRouter.route('/:dishId')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200) })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err) {
        return next(err);
      } else {
        if (favorite != null) {
          if (favorite.dishes.indexOf(req.params.dishId) != -1) {
            err = new Error('The dish ' + req.params.dishId + ' already exists in your favorites');
            err.statusCode = 404;
            return next(err);
          } else {
            favorite.dishes.push(req.params.dishId);
            favorite.save()
              .then((fav) => {
                Favorites.findById(fav._id)
                  .populate('user')
                  .populate('dishes')
                  .then((favoriteList) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favoriteList);
                  })
              }, (err) => next(err))
          }
        } else {
          Favorites.create({ user: req.user._id, dishes: [req.params.dishId] })
            .then((favorite) => {
              console.log('Your favorites created ', favorite);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorite);
            }, (err) => next(err));
        }
      }
    })
      .catch((err) => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }, (err, favorite) => {
      if (err) {
        return next(err);
      } else {
        if (favorite != null) {
          const indexOfDish = favorite.dishes.indexOf(req.params.dishId);
          if (indexOfDish != -1) {
            favorite.dishes.splice(indexOfDish, 1);
            favorite.save()
              .then((fav) => {
                Favorites.findById(fav._id)
                  .populate('user')
                  .populate('dishes')
                  .then((favoriteList) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favoriteList);
                  })
              }, (err) => next(err))
          } else {
            err = new Error('The dish ' + req.params.dishId + ' does not exist in your favorites');
            err.statusCode = 404;
            return next(err);
          }
        } else {
          err = new Error('There are no favorites for you to delete');
          err.statusCode = 404;
          return next(err);
        }
      }
    })
      .catch((err) => next(err));
  })

module.exports = favoriteRouter;