const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bookRoutes = require('./routes/bookRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Library Book Management API is running',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    service: 'Library Book Management API',
  });
});

app.use('/api/books', bookRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
