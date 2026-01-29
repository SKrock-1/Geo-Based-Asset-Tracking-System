const Asset = require('../models/Asset');

// @desc    Get analytics summary
// @route   GET /api/analytics/summary
// @access  Private
exports.getAnalyticsSummary = async (req, res) => {
    try {
        // Use MongoDB aggregation pipeline for efficient querying
        const [summary] = await Asset.aggregate([
            {
                $facet: {
                    // Total count
                    totalAssets: [{ $count: 'count' }],

                    // Status distribution
                    statusDistribution: [
                        { $group: { _id: '$status', count: { $sum: 1 } } },
                        { $project: { status: '$_id', count: 1, _id: 0 } }
                    ],

                    // Assets by approximate region (using coordinate rounding)
                    // This groups assets by their rounded lat/lng to create "regions"
                    regionDistribution: [
                        {
                            $project: {
                                // Round coordinates to 1 decimal place for rough regions
                                region: {
                                    lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 0] },
                                    lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 0] }
                                }
                            }
                        },
                        {
                            $group: {
                                _id: { lat: '$region.lat', lng: '$region.lng' },
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                region: {
                                    $concat: [
                                        'Region (',
                                        { $toString: '$_id.lat' },
                                        ', ',
                                        { $toString: '$_id.lng' },
                                        ')'
                                    ]
                                },
                                count: 1,
                                _id: 0
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 } // Top 10 regions
                    ],

                    // Recent activity (assets updated in last 7 days)
                    recentActivity: [
                        {
                            $match: {
                                updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                            }
                        },
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        // Format the response
        const result = {
            totalAssets: summary.totalAssets[0]?.count || 0,
            statusDistribution: summary.statusDistribution || [],
            regionDistribution: summary.regionDistribution || [],
            recentActivity: summary.recentActivity[0]?.count || 0
        };

        // Add derived stats
        const activeCount = result.statusDistribution.find(s => s.status === 'active')?.count || 0;
        const inactiveCount = result.statusDistribution.find(s => s.status === 'inactive')?.count || 0;
        const maintenanceCount = result.statusDistribution.find(s => s.status === 'maintenance')?.count || 0;

        result.activeAssets = activeCount;
        result.inactiveAssets = inactiveCount;
        result.maintenanceAssets = maintenanceCount;

        res.status(200).json(result);
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: error.message });
    }
};
