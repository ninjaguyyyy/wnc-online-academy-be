const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.mdw');
const role = require('../middlewares/role.mdw');
const categoriesController = require('../controllers/categories.controller');
const { ROLE } = require('../constants/models.constant');

router.post('/', auth, role(ROLE.ADMIN), categoriesController.create);
router.get('/', categoriesController.getAll);
router.get('/tree', categoriesController.getTree);
router.patch('/:id', auth, role(ROLE.ADMIN), categoriesController.update);
router.delete('/:id', auth, role(ROLE.ADMIN), categoriesController.delete);

module.exports = router;
