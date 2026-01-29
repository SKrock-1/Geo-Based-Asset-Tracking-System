const express = require('express');
const router = express.Router();
const { getAssets, createAsset, getNearbyAssets, getAssetsInZone, updateAsset, deleteAsset, getAssetHistory } = require('../controllers/assetController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAssets)
    .post(protect, admin, createAsset);

router.get('/nearby', protect, getNearbyAssets);
router.post('/within-zone', protect, getAssetsInZone);

router.route('/:id')
    .put(protect, admin, updateAsset)
    .delete(protect, admin, deleteAsset);

router.get('/:id/history', protect, getAssetHistory);

module.exports = router;
