'use client';

import Link from 'next/link';
import { Search, Home, TrendingUp, Shield, ArrowRight } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm mb-6">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                        Trusted by 1000+ customers
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                        Find Your
                        <span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                            {' '}Dream Home
                        </span>
                    </h1>

                    <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
                        Discover the perfect property with our trusted platform.
                        Thousands of listings, personalized recommendations, and expert guidance.
                    </p>

                    {/* Search Bar */}
                    
                            <div className="flex justify-center">
                                <Link
                                    href="/properties"
                                    className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition transform hover:scale-105 flex items-center gap-2"
                                >
                                    Explore Properties
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
                        <div className="glass-card p-6 text-center border border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20 hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-500/20">
                            <Home className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-yellow-300">500+</div>
                            <div className="text-yellow-100">Properties Available</div>
                        </div>

                        <div className="glass-card p-6 text-center border-2 border-yellow-400 bg-yellow-500/20 scale-105 shadow-xl shadow-yellow-500/30">
                            <TrendingUp className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-yellow-200">50+</div>
                            <div className="text-yellow-100">Happy Customers</div>
                        </div>

                        <div className="glass-card p-6 text-center border border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20 hover:scale-105 transition-all duration-300 shadow-lg shadow-yellow-500/20">
                            <Shield className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-yellow-300">100%</div>
                            <div className="text-yellow-100">Secure Transactions</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}