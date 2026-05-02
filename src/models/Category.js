const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [80, 'Category name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Category description cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
