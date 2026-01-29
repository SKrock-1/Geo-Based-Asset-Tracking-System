const Asset = require('../models/Asset');

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private (User/Admin)
exports.getAssets = async (req, res) => {
    try {
        const assets = await Asset.find();
        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new asset
// @route   POST /api/assets
// @access  Private (Admin)
exports.createAsset = async (req, res) => {
    const { name, description, status, latitude, longitude, assignedTo } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    try {
        const asset = await Asset.create({
            name,
            description,
            status,
            location: {
                type: 'Point',
                coordinates: [Number(longitude), Number(latitude)] // GeoJSON is [lng, lat]
            },
            assignedTo
        });

        // Emit real-time event for new asset
        const io = req.app.get('io');
        if (io) {
            io.emit('asset:created', asset);
        }

        res.status(201).json(asset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get nearby assets
// @route   GET /api/assets/nearby?lat=...&lng=...&radius=1000
// @access  Private
exports.getNearbyAssets = async (req, res) => {
    const { lat, lng, radius } = req.query;
    const distanceInMeters = radius ? Number(radius) : 1000; // Default 1km

    if (!lat || !lng) {
        return res.status(400).json({ message: 'Please provide lat and lng' });
    }

    try {
        const assets = await Asset.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(lng), Number(lat)]
                    },
                    $maxDistance: distanceInMeters
                }
            }
        });

        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get assets within a polygon zone
// @route   POST /api/assets/within-zone
// @access  Private
exports.getAssetsInZone = async (req, res) => {
    const { coordinates } = req.body; // Expecting an array of arrays [[lng, lat], [lng, lat], ...]

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 4) {
        return res.status(400).json({
            message: 'Please provide a valid polygon. It must be an array of at least 4 coordinates (closed loop).'
        });
    }

    // Ensure the polygon is closed (first and last points must be the same)
    const start = coordinates[0];
    const end = coordinates[coordinates.length - 1];
    if (start[0] !== end[0] || start[1] !== end[1]) {
        return res.status(400).json({ message: 'Polygon must be a closed loop (start and end points must match).' });
    }

    try {
        const assets = await Asset.find({
            location: {
                $geoWithin: {
                    $geometry: {
                        type: 'Polygon',
                        coordinates: [coordinates]
                    }
                }
            }
        });

        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private (Admin)
// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private (Admin)
exports.updateAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Handle location update: Push old location to history if location changes
        if (req.body.latitude && req.body.longitude) {
            // Save current state to history before update
            asset.locationHistory.push({
                location: asset.location,
                timestamp: Date.now()
            });

            // Set new location
            asset.location = {
                type: 'Point',
                coordinates: [Number(req.body.longitude), Number(req.body.latitude)]
            };
        }

        // Update other fields
        if (req.body.name) asset.name = req.body.name;
        if (req.body.description) asset.description = req.body.description;
        if (req.body.status) asset.status = req.body.status;
        if (req.body.assignedTo) asset.assignedTo = req.body.assignedTo;

        const updatedAsset = await asset.save();

        // Emit real-time event for asset update
        const io = req.app.get('io');
        if (io) {
            io.emit('asset:updated', updatedAsset);
            // Also emit to asset-specific room
            io.to(`asset:${updatedAsset._id}`).emit('asset:location', updatedAsset);
        }

        res.status(200).json(updatedAsset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get asset history
// @route   GET /api/assets/:id/history
// @access  Private
exports.getAssetHistory = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id).select('locationHistory name');

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Sort history by timestamp descending (newest first)
        asset.locationHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.status(200).json(asset.locationHistory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private (Admin)
exports.deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findByIdAndDelete(req.params.id);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        res.status(200).json({ message: 'Asset removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
