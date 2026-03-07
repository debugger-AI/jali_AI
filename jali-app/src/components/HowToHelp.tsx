import { HandCoins, Users, HeartHandshake } from "lucide-react";

const steps = [
    {
        icon: HandCoins,
        title: "Give donation",
        description: "Your donation supports essential programs and helps communities in need. Every contribution makes a difference!",
        color: "bg-teal-50",
        iconColor: "text-teal-600",
    },
    {
        icon: Users,
        title: "Become volunteer",
        description: "Join us in making a difference! Volunteer and be a part of our community projects—every effort matters!",
        color: "bg-pink-50",
        iconColor: "text-pink-600",
    },
    {
        icon: HeartHandshake,
        title: "Support families",
        description: "Provide essential supplies and guidance to families in underserved areas to help them combat health challenges.",
        color: "bg-teal-50",
        iconColor: "text-teal-600",
    },
];

const HowToHelp = () => {
    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <p className="text-slate-500 text-lg mb-4 italic">What we do for them</p>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900">
                        How can you help us?
                    </h2>
                    <div className="w-24 h-1.5 bg-secondary mx-auto mt-6 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    {steps.map((step, index) => (
                        <div
                            key={step.title}
                            className="flex flex-col items-center text-center group bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <div className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                <step.icon size={40} className={step.iconColor} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">
                                {step.title}
                            </h3>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowToHelp;
