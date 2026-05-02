const express = require('express');
const { body, param, query } = require('express-validator');
const {
  registerBook,
  getBooks,
  getBookById,
  getBookByIsbn,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  return next();
};

const createBookValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Title must be between 2 and 150 characters'),

  body('isbn')
    .trim()
    .notEmpty()
    .withMessage('ISBN is required')
    .isLength({ min: 10, max: 17 })
    .withMessage('ISBN must be between 10 and 17 characters'),

  body()
    .custom((value) => {
      const hasAuthor =
        value.author || value.authorId || value.authorName || (value.author && value.author.name);
      const hasCategory =
        value.category ||
        value.categoryId ||
        value.categoryName ||
        (value.category && value.category.name);

      if (!hasAuthor) {
        throw new Error('Author name or author id is required');
      }

      if (!hasCategory) {
        throw new Error('Category name or category id is required');
      }

      return true;
    }),

  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: 2100 })
    .withMessage('Published year must be valid'),

  body('totalCopies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total copies must be a non-negative number'),

  body('availableCopies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies must be a non-negative number'),
];

const updateBookValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Title must be between 2 and 150 characters'),

  body('isbn')
    .optional()
    .trim()
    .isLength({ min: 10, max: 17 })
    .withMessage('ISBN must be between 10 and 17 characters'),

  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: 2100 })
    .withMessage('Published year must be valid'),

  body('totalCopies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total copies must be a non-negative number'),

  body('availableCopies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies must be a non-negative number'),
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid book id'),
];

const isbnValidation = [
  param('isbn')
    .trim()
    .notEmpty()
    .withMessage('ISBN is required')
    .isLength({ min: 10, max: 17 })
    .withMessage('ISBN must be between 10 and 17 characters'),
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1 to 100'),
];

router
  .route('/')
  .post(createBookValidation, validateRequest, registerBook)
  .get(listValidation, validateRequest, getBooks);

router.get('/isbn/:isbn', isbnValidation, validateRequest, getBookByIsbn);

router
  .route('/:id')
  .get(idValidation, validateRequest, getBookById)
  .put(idValidation, updateBookValidation, validateRequest, updateBook)
  .delete(idValidation, validateRequest, deleteBook);

module.exports = router;
