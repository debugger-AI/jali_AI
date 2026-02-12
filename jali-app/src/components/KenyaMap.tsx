import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import countyPaths from "@/data/county_paths.json";

interface KenyaMapProps {
    selectedCounty?: string;
    onCountySelect?: (county: string) => void;
    className?: string;
}

const NAME_MAPPING: Record<string, string> = {
    "Tharaka-Nithi": "Tharaka",
    "Elgeyo/Marakwet": "Keiyo-Marakwet",
    "Nairobi City": "Nairobi",
    "Taita/Taveta": "Taita Taveta"
};

const KenyaMap: React.FC<KenyaMapProps> = ({ selectedCounty, className }) => {
    const normalizedSelectedCounty = useMemo(() => {
        if (!selectedCounty) return "";
        return NAME_MAPPING[selectedCounty] || selectedCounty;
    }, [selectedCounty]);

    return (
        <div className={cn("relative w-full aspect-[458/580] flex items-center justify-center p-4", className)}>
            <svg
                viewBox="0 0 458 580"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="15" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                <g className="transition-all duration-700">
                    {Object.entries(countyPaths).map(([name, path]) => {
                        const isSelected = normalizedSelectedCounty === name;
                        return (
                            <path
                                key={name}
                                d={path as string}
                                className={cn(
                                    "transition-all duration-500 cursor-pointer",
                                    isSelected
                                        ? "fill-primary stroke-white stroke-[2] shadow-2xl"
                                        : "fill-primary/10 stroke-primary/20 hover:fill-primary/30 hover:stroke-primary/40 stroke-[0.5]"
                                )}
                                style={{
                                    transformOrigin: "center",
                                    transform: isSelected ? "scale(1.02) translateY(-2px)" : "none",
                                    filter: isSelected ? "url(#glow)" : "none"
                                }}
                            >
                                <title>{name}</title>
                            </path>
                        );
                    })}
                </g>

                {selectedCounty && (
                    <g className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <rect
                            x="129"
                            y="530"
                            width="200"
                            height="40"
                            rx="20"
                            className="fill-background/80 backdrop-blur-md stroke-primary/20 stroke-[1]"
                        />
                        <text
                            x="229"
                            y="556"
                            textAnchor="middle"
                            className="fill-primary font-bold text-lg uppercase tracking-wider"
                        >
                            {selectedCounty}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
};

export default KenyaMap;
