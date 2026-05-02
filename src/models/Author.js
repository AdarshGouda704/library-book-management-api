const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      minlength: [2, 'Author name must be at least 2 characters'],
      maxlength: [100, 'Author name cannot exceed 100 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Author bio cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

authorSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Author', authorSchema);
