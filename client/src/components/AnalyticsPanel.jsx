import { useState, useEffect } from 'react';
import api from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Package, MapPin, TrendingUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

const AnalyticsPanel = ({ isOpen, onClose }) => {
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchAnalytics();
        }
    }, [isOpen]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/analytics/summary');
            setAnalytics(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load analytics');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const statusData = analytics ? [
        { name: 'Active', value: analytics.activeAssets, color: '#22c55e' },
        { name: 'Inactive', value: analytics.inactiveAssets, color: '#ef4444' },
        { name: 'Maintenance', value: analytics.maintenanceAssets, color: '#f59e0b' }
    ].filter(d => d.value > 0) : [];

    const regionData = analytics?.regionDistribution || [];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-slate-800/95 backdrop-blur z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                        </div>
                        Analytics Dashboard
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-red-400">{error}</div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-500/20 rounded-lg">
                                            <Package className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="text-xs text-slate-400 uppercase tracking-wider">Total</span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{analytics.totalAssets}</p>
                                </div>
                                <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                                            <Activity className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <span className="text-xs text-slate-400 uppercase tracking-wider">Active</span>
                                    </div>
                                    <p className="text-3xl font-bold text-emerald-400">{analytics.activeAssets}</p>
                                </div>
                                <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-red-500/20 rounded-lg">
                                            <Activity className="w-4 h-4 text-red-400" />
                                        </div>
                                        <span className="text-xs text-slate-400 uppercase tracking-wider">Inactive</span>
                                    </div>
                                    <p className="text-3xl font-bold text-red-400">{analytics.inactiveAssets}</p>
                                </div>
                                <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-purple-500/20 rounded-lg">
                                            <MapPin className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <span className="text-xs text-slate-400 uppercase tracking-wider">Recent</span>
                                    </div>
                                    <p className="text-3xl font-bold text-purple-400">{analytics.recentActivity}</p>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Pie Chart - Status Distribution */}
                                <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Status Distribution</h3>
                                    {statusData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                                    labelStyle={{ color: '#fff' }}
                                                />
                                                <Legend
                                                    formatter={(value) => <span className="text-slate-300">{value}</span>}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-slate-500">No data</div>
                                    )}
                                </div>

                                {/* Bar Chart - Region Distribution */}
                                <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Top Regions</h3>
                                    {regionData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={regionData.slice(0, 5)} layout="vertical">
                                                <XAxis type="number" stroke="#64748b" />
                                                <YAxis type="category" dataKey="region" stroke="#64748b" width={80} tick={{ fontSize: 10 }} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                                    labelStyle={{ color: '#fff' }}
                                                />
                                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-slate-500">No region data</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AnalyticsPanel;
