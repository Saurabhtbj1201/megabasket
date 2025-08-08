const mongoose = require('mongoose');

const offerSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['DEAL_OF_THE_DAY', 'CUSTOM_OFFER'],
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Use a mongoose middleware to handle the removal method that's being used in the controller
offerSchema.pre('remove', function (next) {
  next();
});

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
