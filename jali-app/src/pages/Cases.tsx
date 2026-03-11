import React, { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, MapPin, Phone, Plus, X, Loader2 } from "lucide-react";

export default function Cases() {
    const cases = [
        { id: "CAS-1029", name: "Grace Wanjiku", type: "Prenatal Care", status: "Active", urgency: "High", phone: "+254 712 345678", location: "Kibera, Zone B", lastVisit: "2 days ago" },
        { id: "CAS-1030", name: "Samuel Oduor", type: "Growth Monitoring", status: "Active", urgency: "Medium", phone: "+254 722 987654", location: "Mathare, Section 3", lastVisit: "1 week ago" },
        { id: "CAS-1031", name: "Fatuma Ali", type: "Immunization", status: "Pending", urgency: "Low", phone: "+254 733 112233", location: "Eastleigh, 1st Ave", lastVisit: "2 weeks ago" },
        { id: "CAS-1032", name: "John Doe", type: "TB Treatment", status: "Completed", urgency: "Low", phone: "+254 744 556677", location: "Kawangware", lastVisit: "1 month ago" },
    ];

    // State for modal and form
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [chvs, setChvs] = useState<any[]>([]);
    
    // Form fields
    const [formData, setFormData] = useState({
        chv_id: "",
        county_name: "Nairobi",
        constituency_name: "Kibra",
        ward_name: "Laini Saba",
        cbo_id: "CBO-001"
    });

    // Fetch CHVs when modal opens
    useEffect(() => {
        if (isAddModalOpen && chvs.length === 0) {
            fetch("http://localhost:8000/api/chvs")
                .then(res => res.json())
                .then(data => {
                    if (data.chvs) setChvs(data.chvs);
                    if (data.chvs?.length > 0) setFormData(prev => ({ ...prev, chv_id: data.chvs[0].id }));
                })
                .catch(err => console.error("Failed to fetch CHVs", err));
        }
    }, [isAddModalOpen]);

    const handleAddFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("http://localhost:8000/api/households", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert("Family successfully registered and synced to Kafka!");
                setIsAddModalOpen(false);
            } else {
                alert("Failed to register family.");
            }
        } catch (error) {
            alert("Error connecting to server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">My Cases</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage and track your assigned families</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Search cases..." className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm w-full sm:w-64" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 shadow-sm transition-colors shrink-0">
                        <Filter className="h-4 w-4" /> Filter
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg text-sm hover:bg-primary/90 shadow-sm transition-colors shrink-0">
                        <Plus className="h-4 w-4" /> New Family
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <tr>
                            <th className="px-6 py-4">Case Details</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Location & Contact</th>
                            <th className="px-6 py-4">Status & Urgency</th>
                            <th className="px-6 py-4">Last Visit</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {cases.map((c) => (
                            <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="font-semibold text-slate-900 text-base">{c.name}</p>
                                    <p className="font-mono text-xs text-slate-400 mt-0.5">{c.id}</p>
                                </td>
                                <td className="px-6 py-5 text-slate-700 font-medium">{c.type}</td>
                                <td className="px-6 py-5">
                                    <p className="flex items-center gap-1.5 text-slate-700"><MapPin className="h-3.5 w-3.5 text-primary/70" /> {c.location}</p>
                                    <p className="flex items-center gap-1.5 text-slate-500 text-xs mt-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> {c.phone}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex gap-2">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${c.status === 'Active' ? 'bg-blue-50 text-blue-700 border-blue-100 border' : c.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100 border' : 'bg-emerald-50 text-emerald-700 border-emerald-100 border'}`}>
                                            {c.status}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${c.urgency === 'High' ? 'bg-red-50 text-red-700 border-red-100 border' : c.urgency === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-100 border' : 'bg-slate-100 text-slate-600 border-slate-200 border'}`}>
                                            {c.urgency}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-slate-500 whitespace-nowrap">{c.lastVisit}</td>
                                <td className="px-6 py-5 text-right">
                                    <button className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Family Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">Register New Family</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddFamily} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assign CHV</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5 outline-none transition-shadow"
                                    value={formData.chv_id}
                                    onChange={(e) => setFormData({...formData, chv_id: e.target.value})}
                                    required
                                >
                                    {chvs.length === 0 ? (
                                        <option value="">Loading CHVs...</option>
                                    ) : (
                                        chvs.map(chv => (
                                            <option key={chv.id} value={chv.id}>{chv.name}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">County</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.county_name}
                                        onChange={(e) => setFormData({...formData, county_name: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5 outline-none transition-shadow" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Constituency</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.constituency_name}
                                        onChange={(e) => setFormData({...formData, constituency_name: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5 outline-none transition-shadow" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ward / Location</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.ward_name}
                                    onChange={(e) => setFormData({...formData, ward_name: e.target.value})}
                                    placeholder="e.g. Makina, Kibra"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5 outline-none transition-shadow" 
                                />
                            </div>

                            <div className="pt-4 mt-2 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || !formData.chv_id}
                                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isSubmitting ? 'Registering...' : 'Register Family'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
