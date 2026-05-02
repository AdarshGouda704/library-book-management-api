const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      minlength: [2, 'Book title must be at least 2 characters'],
      maxlength: [150, 'Book title cannot exceed 150 characters'],
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      trim: true,
      uppercase: true,
      minlength: [10, 'ISBN must be at least 10 characters'],
      maxlength: [17, 'ISBN cannot exceed 17 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Author is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    publishedYear: {
      type: Number,
      min: [1000, 'Published year must be valid'],
      max: [2100, 'Published year must be valid'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [0, 'Total copies cannot be negative'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies is required'],
      min: [0, 'Available copies cannot be negative'],
      default: 1,
      validate: {
        validator(value) {
          return value <= this.totalCopies;
        },
        message: 'Available copies cannot exceed total copies',
      },
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.index({ isbn: 1 }, { unique: true });
bookSchema.index({ title: 'text', isbn: 'text' });

module.exports = mongoose.model('Book', bookSchema);
