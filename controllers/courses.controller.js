const Course = require('../models/course.model');
const coursesService = require('../services/courses.service');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

module.exports.create = async (req, res) => {
  const { statusCode, payload } = await coursesService.create(
    req.user,
    req.body
  );
  res.status(statusCode).json(payload);
};

module.exports.getByTeacher = async (req, res) => {
  const { statusCode, payload } = await coursesService.getByTeacher(
    req.params.id
  );
  res.status(statusCode).json(payload);
};

module.exports.getAll = async (req, res) => {
  const { statusCode, payload } = await coursesService.getAll(req.query);
  res.status(statusCode).json(payload);
};

module.exports.getById = async (req, res) => {
  const { statusCode, payload } = await coursesService.getById(req.params.id);
  res.status(statusCode).json(payload);
};

module.exports.receiveFeedback = async (req, res) => {
  const { statusCode, payload } = await coursesService.receiveFeedback(
    req.params.id,
    req.user.userId,
    req.body
  );
  res.status(statusCode).json(payload);
};

module.exports.update = async (req, res) => {
  const { statusCode, payload } = await coursesService.update(
    req.params.id,
    req.body
  );
  res.status(statusCode).json(payload);
};
