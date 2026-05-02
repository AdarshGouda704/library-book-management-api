const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const Book = require('../src/models/Book');
const Author = require('../src/models/Author');
const Category = require('../src/models/Category');

let mongoServer;
let createdBookId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Book.deleteMany({});
  await Author.deleteMany({});
  await Category.deleteMany({});
});

describe('Library Book Management API', () => {
  test('GET /api/health should return API health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('OK');
  });

  test('POST /api/books should register a new book', async () => {
    const response = await request(app)
      .post('/api/books')
      .send({
        title: 'Clean Code',
        isbn: '9780132350884',
        authorName: 'Robert C. Martin',
        categoryName: 'Programming',
        publishedYear: 2008,
        description: 'A handbook of agile software craftsmanship.',
        totalCopies: 5,
        availableCopies: 5,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Clean Code');
    expect(response.body.data.author.name).toBe('Robert C. Martin');
    expect(response.body.data.category.name).toBe('Programming');

    createdBookId = response.body.data._id;
    expect(createdBookId).toBeDefined();
  });

  test('GET /api/books should list books with pagination', async () => {
    await request(app)
      .post('/api/books')
      .send({
        title: 'The Pragmatic Programmer',
        isbn: '9780201616224',
        authorName: 'Andrew Hunt',
        categoryName: 'Programming',
        publishedYear: 1999,
        totalCopies: 3,
        availableCopies: 3,
      });

    const response = await request(app).get('/api/books?page=1&limit=10');

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
    expect(response.body.pagination.currentPage).toBe(1);
    expect(response.body.data[0].title).toBe('The Pragmatic Programmer');
  });

  test('GET /api/books/isbn/:isbn should search book by ISBN', async () => {
    await request(app)
      .post('/api/books')
      .send({
        title: 'Design Patterns',
        isbn: '9780201633610',
        authorName: 'Erich Gamma',
        categoryName: 'Software Engineering',
        publishedYear: 1994,
        totalCopies: 2,
        availableCopies: 2,
      });

    const response = await request(app).get('/api/books/isbn/9780201633610');

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.isbn).toBe('9780201633610');
  });

  test('PUT /api/books/:id should update a book', async () => {
    const createResponse = await request(app)
      .post('/api/books')
      .send({
        title: 'Refactoring',
        isbn: '9780201485677',
        authorName: 'Martin Fowler',
        categoryName: 'Programming',
        publishedYear: 1999,
        totalCopies: 4,
        availableCopies: 4,
      });

    const bookId = createResponse.body.data._id;

    const updateResponse = await request(app)
      .put(`/api/books/${bookId}`)
      .send({
        title: 'Refactoring Updated',
        totalCopies: 6,
        availableCopies: 6,
      });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.title).toBe('Refactoring Updated');
    expect(updateResponse.body.data.totalCopies).toBe(6);
  });

  test('DELETE /api/books/:id should delete a book', async () => {
    const createResponse = await request(app)
      .post('/api/books')
      .send({
        title: 'Domain-Driven Design',
        isbn: '9780321125217',
        authorName: 'Eric Evans',
        categoryName: 'Software Design',
        publishedYear: 2003,
        totalCopies: 1,
        availableCopies: 1,
      });

    const bookId = createResponse.body.data._id;

    const deleteResponse = await request(app).delete(`/api/books/${bookId}`);

    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.body.success).toBe(true);

    const getResponse = await request(app).get(`/api/books/${bookId}`);
    expect(getResponse.statusCode).toBe(404);
  });
});
