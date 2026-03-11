import React from "react";
import * as LucideIcons from "lucide-react";

interface Props {
    title: string;
    description: string;
    iconName: keyof typeof LucideIcons;
}

export default function GenericPage({ title, description, iconName }: Props) {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Info;

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[75vh] animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-emerald-500/10 text-primary rounded-[2rem] flex items-center justify-center mb-8 shadow-sm rotate-3 hover:rotate-0 transition-transform duration-500">
                <Icon className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-3">{title}</h2>
            <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">{description}</p>

            <div className="mt-12 w-full max-w-3xl">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <div className="h-6 w-6 rounded-full bg-slate-200/60 animate-pulse"></div>
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                            <div className="h-3 bg-slate-50 rounded w-1/6"></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-4 bg-slate-50/80 rounded w-full"></div>
                        <div className="h-4 bg-slate-50/80 rounded w-5/6"></div>
                        <div className="h-4 bg-slate-50/80 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
