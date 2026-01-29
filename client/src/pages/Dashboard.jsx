import { useState, useEffect, useContext, useCallback } from 'react';
import AuthContext from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import MapComponent from '../components/MapComponent';
import { useNavigate } from 'react-router-dom';
import {
    Map as MapIcon,
    LogOut,
    Plus,
    Search,
    UserCircle,
    Package,
    Activity,
    Menu,
    X,
    Loader2,
    History,
    MapPin,
    BarChart2,
    Wifi,
    WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnalyticsPanel from '../components/AnalyticsPanel';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const { socket, isConnected } = useSocket();
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // History State
    const [selectedAssetId, setSelectedAssetId] = useState(null);
    const [selectedAssetHistory, setSelectedAssetHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Analytics State
    const [showAnalytics, setShowAnalytics] = useState(false);

    // New Asset Form State
    const [newAsset, setNewAsset] = useState({
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        status: 'active'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch assets on mount
    useEffect(() => {
        fetchAssets();
    }, []);

    // Socket.io real-time event listeners
    useEffect(() => {
        if (!socket) return;

        // Handle new asset creation
        const handleAssetCreated = (newAsset) => {
            console.log('🔔 New asset created:', newAsset.name);
            setAssets(prev => [...prev, newAsset]);
        };

        // Handle asset updates (including location changes)
        const handleAssetUpdated = (updatedAsset) => {
            console.log('🔔 Asset updated:', updatedAsset.name);
            setAssets(prev => prev.map(asset =>
                asset._id === updatedAsset._id ? updatedAsset : asset
            ));
        };

        socket.on('asset:created', handleAssetCreated);
        socket.on('asset:updated', handleAssetUpdated);

        // Cleanup listeners on unmount
        return () => {
            socket.off('asset:created', handleAssetCreated);
            socket.off('asset:updated', handleAssetUpdated);
        };
    }, [socket]);

    const fetchAssets = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/assets');
            setAssets(res.data);
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAddAsset = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/assets', newAsset);
            setShowModal(false);
            setNewAsset({ name: '', description: '', latitude: '', longitude: '', status: 'active' });
            fetchAssets();
        } catch (error) {
            alert('Failed to add asset: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssetClick = async (assetId) => {
        if (selectedAssetId === assetId) {
            // Toggle off
            setSelectedAssetId(null);
            setSelectedAssetHistory([]);
            return;
        }

        setSelectedAssetId(assetId);
        setIsLoadingHistory(true);
        try {
            const res = await api.get(`/assets/${assetId}/history`);
            setSelectedAssetHistory(res.data);
        } catch (error) {
            console.error('Error fetching asset history:', error);
            setSelectedAssetHistory([]);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedAsset = assets.find(a => a._id === selectedAssetId);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {!isSidebarOpen && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg shadow-lg md:hidden"
                    >
                        <Menu className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                className={`bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50 flex-shrink-0 flex flex-col z-40 ${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}
                animate={{ width: isSidebarOpen ? 320 : 0 }}
            >
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                            <MapIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">GeoTracker</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-700/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assets</h2>
                        <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full font-medium">{assets.length} Total</span>
                    </div>

                    {user?.role === 'admin' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowModal(true)}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 font-medium hover:shadow-blue-500/40 transition-shadow"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Asset
                        </motion.button>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAnalytics(true)}
                        className="w-full py-3 px-4 bg-slate-700/50 border border-slate-600 text-white rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-slate-700 transition"
                    >
                        <BarChart2 className="w-5 h-5 text-indigo-400" />
                        View Analytics
                    </motion.button>

                    <div className="space-y-2 mt-4">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : (
                            <AnimatePresence>
                                {filteredAssets.map(asset => (
                                    <motion.div
                                        key={asset._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        onClick={() => handleAssetClick(asset._id)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedAssetId === asset._id
                                            ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/30'
                                            : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-semibold truncate ${selectedAssetId === asset._id ? 'text-blue-400' : 'text-white'}`}>
                                                    {asset.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-1 truncate">{asset.description || 'No description'}</p>
                                            </div>
                                            <div className={`p-1.5 rounded-full flex-shrink-0 ml-2 ${asset.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                <Activity className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        {selectedAssetId === asset._id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3 pt-3 border-t border-blue-500/20"
                                            >
                                                <div className="flex items-center gap-2 text-xs text-blue-400">
                                                    <History className="w-3.5 h-3.5" />
                                                    <span>{selectedAssetHistory.length} history points</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                                {filteredAssets.length === 0 && !isLoading && (
                                    <p className="text-center text-slate-500 text-sm py-4">No assets found</p>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full">
                                <UserCircle className="w-5 h-5 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Main Content (Map) */}
            <div className="flex-grow relative h-full w-full">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`absolute top-4 left-4 z-[400] p-3 bg-slate-800/90 backdrop-blur text-white rounded-xl shadow-xl hover:bg-slate-700 transition md:block hidden border border-slate-700`}
                >
                    {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Selected Asset Info Panel */}
                <AnimatePresence>
                    {selectedAsset && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[400] bg-slate-800/95 backdrop-blur border border-slate-700 rounded-xl px-4 py-3 shadow-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <MapPin className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{selectedAsset.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {isLoadingHistory ? 'Loading history...' : `${selectedAssetHistory.length} movement records`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSelectedAssetId(null); setSelectedAssetHistory([]); }}
                                    className="ml-2 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <MapComponent
                    assets={assets}
                    selectedAssetHistory={selectedAssetHistory}
                    onAssetClick={handleAssetClick}
                />
            </div>

            {/* Add Asset Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-lg m-4"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Package className="w-5 h-5 text-blue-400" />
                                    </div>
                                    Add New Asset
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded-lg transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddAsset} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Asset Name</label>
                                    <input
                                        type="text" placeholder="e.g. Delivery Truck #42"
                                        className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                                        value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                                    <textarea
                                        placeholder="Add details about this asset..." rows={3}
                                        className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition"
                                        value={newAsset.description} onChange={e => setNewAsset({ ...newAsset, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Latitude</label>
                                        <input
                                            type="number" step="any" placeholder="0.0000"
                                            className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                                            value={newAsset.latitude} onChange={e => setNewAsset({ ...newAsset, latitude: e.target.value })} required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Longitude</label>
                                        <input
                                            type="number" step="any" placeholder="0.0000"
                                            className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                                            value={newAsset.longitude} onChange={e => setNewAsset({ ...newAsset, longitude: e.target.value })} required
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Asset'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Analytics Panel */}
            <AnimatePresence>
                {showAnalytics && (
                    <AnalyticsPanel isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
