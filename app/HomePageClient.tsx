'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import Image from 'next/image';
import { 
    ArrowRight, 
    Star, 
    Clock, 
    Flame, 
    ChefHat,
    Leaf,
    Beef,
    Coffee,
    Sparkles,
    Quote,
    CheckCircle2,
    MousePointerClick
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Assets
import bgVeg from '@/assets/images/homepage/bg-veg.jpg';
import bgNonVeg from '@/assets/images/homepage/bg-non-veg.jpg';
import bgDrinks from '@/app/bg-healthyDrinks.avif';
import bgCustom from '@/app/bg-customizeMeals.jpg';
import heroBg from '@/assets/images/homepage/bg-image.jpg'; 

// --- COMPONENTS ---

const TiltCard = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left - width / 2);
        y.set(clientY - top - height / 2);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    return (
        <motion.div
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
                rotateX: useTransform(mouseY, [-300, 300], [5, -5]),
                rotateY: useTransform(mouseX, [-300, 300], [-5, 5]),
                transformStyle: "preserve-3d",
            }}
            onClick={onClick}
            className={`relative transition-all duration-200 ease-out ${className}`}
        >
            {children}
        </motion.div>
    );
};

const ParallaxText = ({ children, baseVelocity = 100 }: { children: string, baseVelocity?: number }) => {
    const baseX = useMotionValue(0);
    const { scrollY } = useScroll();
    const scrollVelocity = useSpring(scrollY, { damping: 50, stiffness: 400 });
    const velocityFactor = useTransform(scrollVelocity, [0, 1000], [0, 5], { clamp: false });
    const x = useTransform(baseX, (v) => `${v}%`); // Wrap logic would be needed for true infinite, simplified here

    const directionFactor = useRef<number>(1);
    useSpring(scrollY, { damping: 50, stiffness: 400 }).onChange((v) => {
        // Logic to update direction based on scroll delta could go here
    });

    // Simplified marquee for this demo
    return (
        <div className="overflow-hidden whitespace-nowrap flex flex-nowrap">
            <motion.div 
                className="flex flex-nowrap text-6xl md:text-9xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300/50"
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            >
                <span className="mr-12">{children}</span>
                <span className="mr-12">{children}</span>
                <span className="mr-12">{children}</span>
                <span className="mr-12">{children}</span>
            </motion.div>
        </div>
    );
};

export default function HomePageClient({ user }: { user: any }) {
    const router = useRouter();
    const { scrollYProgress } = useScroll();
    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-green-200 selection:text-green-900">
            
            {/* --- HERO SECTION --- */}
            <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
                <motion.div style={{ scale }} className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-white z-10" />
                    <Image src={heroBg} alt="Hero" fill className="object-cover" priority />
                </motion.div>

                <div className="relative z-20 container mx-auto px-4">
                    <div className="max-w-5xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            
                            
                            <h1 className="text-6xl md:text-9xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
                                EAT <span className="text-green-500">REAL.</span><br />
                                LIVE <span className="italic font-serif font-light text-white/90">BETTER.</span>
                            </h1>
                            
                            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                                No hidden fees. No tiny portions. <br/>
                                Just honest food for honest people.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                                <Button 
                                    onClick={() => router.push('/meals')}
                                    className="h-16 px-12 rounded-full bg-green-600 hover:bg-green-500 text-white font-bold text-lg shadow-2xl shadow-green-900/50 transition-all hover:scale-105 hover:shadow-green-500/30"
                                >
                                    Order Now
                                </Button>
                                <div className="flex items-center gap-4 text-white/80">
                                    <div className="flex -space-x-3">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="w-10 h-10 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center text-xs font-bold text-black">
                                                {String.fromCharCode(64+i)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-left">
                                        <div className="flex text-yellow-400 text-xs">
                                            {[...Array(5)].map((_,i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                        </div>
                                        <div className="text-xs font-medium">5k+ Happy Eaters</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] uppercase tracking-widest">Scroll</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-white/0 via-white/50 to-white/0" />
                </motion.div>
            </section>

            {/* --- MARQUEE --- */}
            <div className="py-12 bg-white border-b border-gray-100">
                <ParallaxText>FRESH INGREDIENTS • TRANSPARENT PRICING • MACRO COUNTED • </ParallaxText>
            </div>

            {/* --- MENU GRID (TILT EFFECT) --- */}
            <section className="py-20 md:py-32 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-16">
                        <div className="max-w-xl">
                            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
                                CURATED <span className="text-green-600">MENU</span>
                            </h2>
                            <p className="text-gray-500 text-lg">
                                Designed by nutritionists, cooked by chefs. Choose the plan that fits your goals.
                            </p>
                        </div>
                        <Button variant="ghost" className="hidden md:flex gap-2 text-lg hover:bg-transparent hover:text-green-600" onClick={() => router.push('/meals')}>
                            View Full Menu <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Mobile: Horizontal Scroll Snap */}
                    <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-4 pb-8 scrollbar-hide">
                        {/* Veg Card Mobile */}
                        <div className="snap-center shrink-0 w-[85vw] h-[500px] relative rounded-[2rem] overflow-hidden shadow-lg" onClick={() => router.push('/meals?diet=veg')}>
                            <Image src={bgVeg} alt="Veg" fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider">Bestseller</span>
                                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">₹60</span>
                                </div>
                                <h3 className="text-4xl font-bold text-white mb-2">Vegetarian</h3>
                                <p className="text-gray-300 text-sm line-clamp-2">Wholesome, plant-based meals rich in fiber and essential nutrients.</p>
                                <div className="mt-4 flex items-center text-green-400 text-sm font-bold">
                                    Tap to Explore <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        </div>

                        {/* Non-Veg Card Mobile */}
                        <div className="snap-center shrink-0 w-[85vw] h-[500px] relative rounded-[2rem] overflow-hidden shadow-lg" onClick={() => router.push('/meals?diet=non-veg')}>
                            <Image src={bgNonVeg} alt="Non-Veg" fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                <div className="flex justify-between items-end mb-2">
                                    <h3 className="text-3xl font-bold text-white">Non-Veg</h3>
                                    <span className="text-white font-bold text-xl">₹85</span>
                                </div>
                                <p className="text-gray-300 text-sm mb-4">High protein, premium cuts for muscle gain.</p>
                                <div className="flex items-center text-red-400 text-sm font-bold">
                                    Tap to Explore <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        </div>

                        {/* Drinks Card Mobile */}
                        <div className="snap-center shrink-0 w-[70vw] h-[500px] relative rounded-[2rem] overflow-hidden shadow-lg bg-blue-950" onClick={() => router.push('/meals?diet=healthy-drinks')}>
                            <Image src={bgDrinks} alt="Drinks" fill className="object-cover opacity-80" />
                            <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply" />
                            <div className="absolute inset-0 flex flex-col justify-end p-6">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                                    <Coffee className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-1">Elixirs</h3>
                                <p className="text-blue-100 text-sm">Detox & Energy drinks.</p>
                            </div>
                        </div>

                        {/* Custom Card Mobile */}
                        <div className="snap-center shrink-0 w-[70vw] h-[500px] relative rounded-[2rem] overflow-hidden shadow-lg bg-gray-900" onClick={() => router.push('/customize-meal')}>
                            <Image src={bgCustom} alt="Custom" fill className="object-cover opacity-50" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-4 text-white">
                                    <ChefHat className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Custom</h3>
                                <p className="text-gray-400 text-sm mt-2">Build your own meal plan.</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop: Bento Grid */}
                    <div className="hidden md:grid grid-cols-12 gap-6 h-[700px]">
                        {/* Main Feature - Veg */}
                        <div className="col-span-7 h-full">
                            <TiltCard className="h-full w-full rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer group" onClick={() => router.push('/meals?diet=veg')}>
                                <Image src={bgVeg} alt="Veg" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />
                                <div className="absolute bottom-0 left-0 p-12 w-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-4 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold uppercase tracking-wider">Bestseller</span>
                                        <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">₹60 / Meal</span>
                                    </div>
                                    <h3 className="text-6xl font-bold text-white mb-2">Vegetarian</h3>
                                    <p className="text-gray-300 text-lg max-w-md">Wholesome, plant-based meals rich in fiber and essential nutrients.</p>
                                </div>
                                <div className="absolute top-8 right-8 w-16 h-16 bg-white rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                            </TiltCard>
                        </div>

                        <div className="col-span-5 flex flex-col gap-6 h-full">
                            {/* Non-Veg */}
                            <div className="flex-1">
                                <TiltCard className="h-full w-full rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer group" onClick={() => router.push('/meals?diet=non-veg')}>
                                    <Image src={bgNonVeg} alt="Non-Veg" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-0 left-0 p-8 w-full">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h3 className="text-3xl font-bold text-white mb-1">Non-Veg</h3>
                                                <p className="text-gray-300 text-sm">High protein, premium cuts</p>
                                            </div>
                                            <div className="text-white font-bold text-xl">₹85</div>
                                        </div>
                                    </div>
                                </TiltCard>
                            </div>

                            {/* Split Row */}
                            <div className="flex-1 grid grid-cols-2 gap-6">
                                <TiltCard className="h-full w-full rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer group bg-blue-950" onClick={() => router.push('/meals?diet=healthy-drinks')}>
                                    <Image src={bgDrinks} alt="Drinks" fill className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-blue-900/30 mix-blend-multiply" />
                                    <div className="absolute inset-0 flex flex-col justify-between p-6">
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <Coffee className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Elixirs</h3>
                                            <p className="text-blue-100 text-xs">Detox & Energy</p>
                                        </div>
                                    </div>
                                </TiltCard>

                                <TiltCard className="h-full w-full rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer group bg-gray-900" onClick={() => router.push('/customize-meal')}>
                                    <Image src={bgCustom} alt="Custom" fill className="object-cover opacity-50 transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                        <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center mb-4 group-hover:border-green-500 group-hover:text-green-500 text-white transition-colors">
                                            <ChefHat className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Custom</h3>
                                        <p className="text-gray-400 text-xs mt-1">You're the chef</p>
                                    </div>
                                </TiltCard>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- STICKY FEATURES SECTION --- */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                        <div className="lg:sticky lg:top-32 h-fit">
                            <span className="text-green-600 font-bold tracking-widest uppercase text-sm mb-4 block">The Honest Difference</span>
                            <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
                                WE DON'T <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-800">HIDE</span> ANYTHING.
                            </h2>
                            <p className="text-xl text-gray-500 mb-12 leading-relaxed max-w-md">
                                Most delivery apps hide fees and shrink portions. We do the opposite. 
                                See exactly what you're paying for and exactly what you're eating.
                            </p>
                            <Button size="lg" className="rounded-full px-8 bg-gray-900 text-white hover:bg-gray-800">
                                Read Our Manifesto
                            </Button>
                        </div>

                        <div className="space-y-24">
                            {[
                                {
                                    title: "Transparent Pricing",
                                    desc: "We show you the breakdown. Market cost + small service fee. No hidden markups, no surprise taxes.",
                                    icon: Star,
                                    color: "bg-yellow-100 text-yellow-700"
                                },
                                {
                                    title: "Macro-Counted",
                                    desc: "Every meal comes with a detailed nutritional breakdown. Protein, carbs, fats - we measure it all so you don't have to.",
                                    icon: Flame,
                                    color: "bg-orange-100 text-orange-700"
                                },
                                {
                                    title: "Real Portions",
                                    desc: "No more 'diet' portions that leave you hungry. Our standard meals are 450g-500g, designed to actually fuel an adult human.",
                                    icon: ChefHat,
                                    color: "bg-green-100 text-green-700"
                                }
                            ].map((feature, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.5 }}
                                    className="group"
                                >
                                    <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                    <p className="text-lg text-gray-500 leading-relaxed">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIALS (Horizontal Scroll) --- */}
            <section className="py-32 bg-gray-900 text-white overflow-hidden">
                <div className="container mx-auto px-4 mb-16 text-center">
                    <h2 className="text-4xl font-bold mb-4">Don't just take our word for it</h2>
                    <div className="flex justify-center gap-2 text-green-500">
                        {[...Array(5)].map((_,i) => <Star key={i} className="fill-current w-5 h-5" />)}
                    </div>
                </div>
                
                <div className="relative w-full">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-900 to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-900 to-transparent z-10" />
                    
                    <motion.div 
                        className="flex gap-8 px-4"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                        style={{ width: "fit-content" }}
                    >
                        {[...Array(2)].map((_, setIndex) => (
                            <React.Fragment key={setIndex}>
                                {[
                                    { text: "The protein portions are actually insane. I've stopped cooking entirely.", author: "Rahul K.", role: "Bodybuilder" },
                                    { text: "Finally a service that doesn't hide taxes at checkout. What you see is what you pay.", author: "Priya M.", role: "Student" },
                                    { text: "The smoothies are a lifesaver for my morning commute. Fresh and not sugary.", author: "Amit S.", role: "Developer" },
                                    { text: "Honest Meals lives up to the name. Quality ingredients you can taste.", author: "Sarah J.", role: "Yoga Instructor" },
                                ].map((t, i) => (
                                    <div key={i} className="w-[400px] bg-gray-800/50 p-8 rounded-3xl border border-gray-700 flex-shrink-0">
                                        <Quote className="w-8 h-8 text-green-500 mb-6 opacity-50" />
                                        <p className="text-xl text-gray-300 mb-8 leading-relaxed">"{t.text}"</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
                                            <div>
                                                <div className="font-bold">{t.author}</div>
                                                <div className="text-sm text-gray-500">{t.role}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="relative py-32 bg-green-600 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/assets/pattern.svg')] opacity-10" />
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-900 to-transparent opacity-20" />
                
                <div className="container mx-auto px-4 text-center relative z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter">
                            READY TO EAT?
                        </h2>
                        <p className="text-2xl text-green-100 mb-12 max-w-2xl mx-auto font-light">
                            Your first honest meal is just a click away.
                        </p>
                        <Button 
                            onClick={() => router.push('/meals')}
                            className="h-24 px-16 rounded-full bg-white text-green-700 hover:bg-gray-100 font-black text-2xl shadow-2xl transition-transform hover:scale-105"
                        >
                            Get Started
                        </Button>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
