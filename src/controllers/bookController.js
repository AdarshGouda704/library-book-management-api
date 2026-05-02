const mongoose = require('mongoose');
const Book = require('../models/Book');
const Author = require('../models/Author');
const Category = require('../models/Category');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hasField = (object, field) => Object.prototype.hasOwnProperty.call(object, field);

const resolveAuthor = async (body) => {
  const authorValue = body.author || body.authorId;

  if (authorValue && mongoose.isValidObjectId(authorValue)) {
    const existingAuthor = await Author.findById(authorValue);

    if (!existingAuthor) {
      throw createHttpError(404, 'Author not found');
    }

    return existingAuthor._id;
  }

  let name = normalizeString(body.authorName);
  let bio = normalizeString(body.authorBio);

  if (!name && body.author && typeof body.author === 'object') {
    name = normalizeString(body.author.name);
    bio = normalizeString(body.author.bio);
  }

  if (!name && typeof body.author === 'string') {
    name = normalizeString(body.author);
  }

  if (!name) {
    throw createHttpError(400, 'Author name or valid author id is required');
  }

  const author = await Author.findOneAndUpdate(
    { name },
    {
      $setOnInsert: {
        name,
        bio,
      },
    },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return author._id;
};

const resolveCategory = async (body) => {
  const categoryValue = body.category || body.categoryId;

  if (categoryValue && mongoose.isValidObjectId(categoryValue)) {
    const existingCategory = await Category.findById(categoryValue);

    if (!existingCategory) {
      throw createHttpError(404, 'Category not found');
    }

    return existingCategory._id;
  }

  let name = normalizeString(body.categoryName);
  let description = normalizeString(body.categoryDescription);

  if (!name && body.category && typeof body.category === 'object') {
    name = normalizeString(body.category.name);
    description = normalizeString(body.category.description);
  }

  if (!name && typeof body.category === 'string') {
    name = normalizeString(body.category);
  }

  if (!name) {
    throw createHttpError(400, 'Category name or valid category id is required');
  }

  const category = await Category.findOneAndUpdate(
    { name },
    {
      $setOnInsert: {
        name,
        description,
      },
    },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return category._id;
};

const populateBook = (query) =>
  query.populate('author', 'name bio').populate('category', 'name description');

const registerBook = asyncHandler(async (req, res) => {
  const authorId = await resolveAuthor(req.body);
  const categoryId = await resolveCategory(req.body);

  const totalCopies = Number(req.body.totalCopies ?? 1);
  const availableCopies = Number(req.body.availableCopies ?? totalCopies);

  const existingBook = await Book.findOne({
    isbn: normalizeString(req.body.isbn).toUpperCase(),
  });

  if (existingBook) {
    throw createHttpError(409, 'A book with this ISBN already exists');
  }

  const book = await Book.create({
    title: req.body.title,
    isbn: req.body.isbn,
    author: authorId,
    category: categoryId,
    publishedYear: req.body.publishedYear,
    description: req.body.description,
    totalCopies,
    availableCopies,
  });

  const populatedBook = await populateBook(Book.findById(book._id));

  res.status(201).json({
    success: true,
    message: 'Book registered successfully',
    data: populatedBook,
  });
});

const getBooks = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.search) {
    const searchRegex = new RegExp(escapeRegex(normalizeString(req.query.search)), 'i');

    filter.$or = [{ title: searchRegex }, { isbn: searchRegex }];
  }

  if (req.query.isbn) {
    filter.isbn = new RegExp(escapeRegex(normalizeString(req.query.isbn)), 'i');
  }

  if (req.query.author && mongoose.isValidObjectId(req.query.author)) {
    filter.author = req.query.author;
  }

  if (req.query.category && mongoose.isValidObjectId(req.query.category)) {
    filter.category = req.query.category;
  }

  const [books, totalBooks] = await Promise.all([
    populateBook(Book.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Book.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: books.length,
    pagination: {
      totalBooks,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit),
      limit,
    },
    data: books,
  });
});

const getBookById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw createHttpError(400, 'Invalid book id');
  }

  const book = await populateBook(Book.findById(req.params.id));

  if (!book) {
    throw createHttpError(404, 'Book not found');
  }

  res.status(200).json({
    success: true,
    data: book,
  });
});

const getBookByIsbn = asyncHandler(async (req, res) => {
  const isbn = normalizeString(req.params.isbn || req.query.isbn).toUpperCase();

  if (!isbn) {
    throw createHttpError(400, 'ISBN is required');
  }

  const book = await populateBook(Book.findOne({ isbn }));

  if (!book) {
    throw createHttpError(404, 'Book not found with this ISBN');
  }

  res.status(200).json({
    success: true,
    data: book,
  });
});

const updateBook = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw createHttpError(400, 'Invalid book id');
  }

  const book = await Book.findById(req.params.id);

  if (!book) {
    throw createHttpError(404, 'Book not found');
  }

  if (hasField(req.body, 'title')) {
    book.title = req.body.title;
  }

  if (hasField(req.body, 'isbn')) {
    const newIsbn = normalizeString(req.body.isbn).toUpperCase();

    const existingBook = await Book.findOne({
      isbn: newIsbn,
      _id: { $ne: book._id },
    });

    if (existingBook) {
      throw createHttpError(409, 'Another book with this ISBN already exists');
    }

    book.isbn = req.body.isbn;
  }

  if (
    hasField(req.body, 'author') ||
    hasField(req.body, 'authorId') ||
    hasField(req.body, 'authorName')
  ) {
    book.author = await resolveAuthor(req.body);
  }

  if (
    hasField(req.body, 'category') ||
    hasField(req.body, 'categoryId') ||
    hasField(req.body, 'categoryName')
  ) {
    book.category = await resolveCategory(req.body);
  }

  if (hasField(req.body, 'publishedYear')) {
    book.publishedYear = req.body.publishedYear;
  }

  if (hasField(req.body, 'description')) {
    book.description = req.body.description;
  }

  if (hasField(req.body, 'totalCopies')) {
    book.totalCopies = Number(req.body.totalCopies);
  }

  if (hasField(req.body, 'availableCopies')) {
    book.availableCopies = Number(req.body.availableCopies);
  }

  await book.save();

  const updatedBook = await populateBook(Book.findById(book._id));

  res.status(200).json({
    success: true,
    message: 'Book updated successfully',
    data: updatedBook,
  });
});

const deleteBook = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw createHttpError(400, 'Invalid book id');
  }

  const book = await Book.findByIdAndDelete(req.params.id);

  if (!book) {
    throw createHttpError(404, 'Book not found');
  }

  res.status(200).json({
    success: true,
    message: 'Book deleted successfully',
    data: {
      id: book._id,
      title: book.title,
      isbn: book.isbn,
    },
  });
});

module.exports = {
  registerBook,
  getBooks,
  getBookById,
  getBookByIsbn,
  updateBook,
  deleteBook,
};
