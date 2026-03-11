import React from "react";
import { Mail, Phone, Activity } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Team() {
    const team = [
        { name: "Amara Kimani", role: "CHV - Kibera", activeCases: 42, healthScore: 94, status: "Online", email: "amara@jali.ai", phone: "+254 711 223344" },
        { name: "David Ochieng", role: "CHV - Mathare", activeCases: 38, healthScore: 88, status: "In Field", email: "david@jali.ai", phone: "+254 722 334455" },
        { name: "Sarah Wanjala", role: "CHV - Eastleigh", activeCases: 51, healthScore: 97, status: "Offline", email: "sarah@jali.ai", phone: "+254 733 445566" },
        { name: "John Ngugi", role: "CHV - Kibera", activeCases: 29, healthScore: 91, status: "Online", email: "john@jali.ai", phone: "+254 744 556677" },
    ];

    return (
        <div className="max-w-[1200px] mx-auto animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Field Team</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor your Community Health Volunteers and their activity</p>
                </div>
                <button className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:bg-primary/90 transition-colors shadow-sm">
                    + Add New Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map((member, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${member.status === 'Online' ? 'bg-emerald-500' : member.status === 'In Field' ? 'bg-blue-500' : 'bg-slate-300'}`} />

                        <div className="flex items-start justify-between mb-5 mt-1">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 border border-slate-100 shadow-sm">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors">{member.name}</h3>
                                    <p className="text-xs font-medium text-slate-500">{member.role}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] px-2.5 py-1 rounded inline-flex font-bold uppercase tracking-wider ${member.status === 'Online' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50' : member.status === 'In Field' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/50'}`}>
                                {member.status}
                            </span>
                        </div>

                        <div className="space-y-3 mb-6 p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                <Mail className="h-4 w-4 text-slate-400" /> {member.email}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                <Phone className="h-4 w-4 text-slate-400" /> {member.phone}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pb-6 mb-2 border-b border-slate-100">
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Active Cases</p>
                                <p className="text-2xl font-bold text-slate-800">{member.activeCases}</p>
                            </div>
                            <div className="w-px h-12 bg-slate-200" />
                            <div className="flex-1 text-right">
                                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Performance</p>
                                <p className="text-2xl font-bold flex items-center justify-end gap-1.5 text-emerald-600">
                                    {member.healthScore}% <Activity className="h-5 w-5 opacity-60" />
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                                View Profile
                            </button>
                            <button className="py-2.5 text-sm font-semibold text-primary border border-primary/20 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors shadow-sm">
                                Direct Message
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
