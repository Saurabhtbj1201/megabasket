const asyncHandler = require('express-async-handler');
const Offer = require('../models/offerModel.js');

// @desc    Create or update an offer
// @route   POST /api/offers
// @access  Private/Admin
const createOrUpdateOffer = asyncHandler(async (req, res) => {
  try {
    const { title, type, products, offerId } = req.body;
    
    console.log("Received offer request:", { title, type, products, offerId });

    if (!title || !type || !products || !Array.isArray(products)) {
      return res.status(400).json({ message: 'Invalid offer data. Title, type, and products array are required.' });
    }

    if (type === 'DEAL_OF_THE_DAY') {
      // Upsert "Deals of the Day" to ensure only one exists
      const offer = await Offer.findOneAndUpdate(
        { type: 'DEAL_OF_THE_DAY' },
        { title, type, products, isActive: true },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      
      // Populate products for the response
      await offer.populate('products');
      res.status(201).json(offer);
    } else if (type === 'CUSTOM_OFFER') {
      let offer;
      if (offerId) {
        // Update existing custom offer
        offer = await Offer.findById(offerId);
        if (offer) {
          offer.title = title || offer.title;
          offer.products = products || offer.products;
          const updatedOffer = await offer.save();
          await updatedOffer.populate('products');
          res.status(200).json(updatedOffer);
        } else {
          res.status(404);
          throw new Error('Offer not found');
        }
      } else {
        // Create new custom offer
        offer = new Offer({ title, type, products });
        const createdOffer = await offer.save();
        await createdOffer.populate('products');
        res.status(201).json(createdOffer);
      }
    } else {
      res.status(400);
      throw new Error('Invalid offer type');
    }
  } catch (error) {
    console.error("Offer creation error:", error);
    res.status(500).json({ message: error.message || 'Failed to create/update offer' });
  }
});

// @desc    Get all active offers
// @route   GET /api/offers
// @access  Public
const getOffers = asyncHandler(async (req, res) => {
  try {
    // Use a deep populate to ensure all product data is available
    const offers = await Offer.find({ isActive: true }).populate({
      path: 'products',
      select: 'name price discount images' // Select only the fields we need
    });
    res.json(offers);
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ message: error.message || 'Failed to fetch offers' });
  }
});

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private/Admin
const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (offer) {
    await offer.remove();
    res.json({ message: 'Offer removed' });
  } else {
    res.status(404);
    throw new Error('Offer not found');
  }
});

module.exports = { createOrUpdateOffer, getOffers, deleteOffer };
