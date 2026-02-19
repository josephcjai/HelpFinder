import Head from 'next/head'
import Link from 'next/link'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { getUserProfile, removeToken } from '../utils/api'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { UserProfile } from '@helpfinder/shared'

export default function HowItWorks() {
    const router = useRouter()
    const [user, setUser] = useState<UserProfile | null>(null)

    useEffect(() => {
        getUserProfile().then(setUser).catch(() => setUser(null))
    }, [])

    const handleLogout = () => {
        removeToken()
        setUser(null)
        router.push('/')
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background-dark font-sans text-gray-900 dark:text-gray-100">
            <Head>
                <title>How it Works | HelpFinder4U</title>
            </Head>

            <Navbar user={user} onLogout={handleLogout} />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="bg-white dark:bg-card-dark py-20 border-b border-gray-100 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">
                            Get anything done, <span className="text-primary">fast.</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
                            HelpFinder4U connects you with trusted local experts for any task.
                            From home repairs to tech support, we've got you covered.
                        </p>
                        <div className="flex justify-center gap-4">
                            {user ? (
                                <Link href="/" className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all transform hover:-translate-y-1">
                                    Post a Task
                                </Link>
                            ) : (
                                <Link href="/register" className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all transform hover:-translate-y-1">
                                    Get Started
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* Steps Section */}
                <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>

                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-24 h-24 bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <span className="material-icons-round text-4xl text-primary">post_add</span>
                            </div>
                            <div className="relative">
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-6xl font-black text-gray-100 dark:text-gray-800 -z-10">1</span>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Post a Task</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                Tell us what you need done. Be specific about the details, your budget, and when you need it finished. It's free to post!
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-24 h-24 bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300 delay-100">
                                <span className="material-icons-round text-4xl text-accent">forum</span>
                            </div>
                            <div className="relative">
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-6xl font-black text-gray-100 dark:text-gray-800 -z-10">2</span>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Review Offers</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                Local experts will view your task and place bids. Review their profiles, ratings, and past work to choose the best fit.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-24 h-24 bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300 delay-200">
                                <span className="material-icons-round text-4xl text-success">check_circle</span>
                            </div>
                            <div className="relative">
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-6xl font-black text-gray-100 dark:text-gray-800 -z-10">3</span>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Get it Done</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                Accept an offer to start the job. Once the work is completed to your satisfaction, mark it as done. Simple as that!
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ Teaser */}
                <section className="bg-primary/5 dark:bg-primary/10 py-20 rounded-3xl mx-4 sm:mx-6 lg:mx-8 mb-20">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Safety & Trust</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                            Your safety is our priority. We verify user emails and provide a rating system to ensure a trustworthy community.
                        </p>
                        <div className="flex flex-wrap justify-center gap-8 text-left">
                            <div className="bg-white dark:bg-card-dark p-6 rounded-xl shadow-sm flex items-start gap-4 flex-1 min-w-[300px]">
                                <span className="material-icons-round text-2xl text-primary mt-1">verified_user</span>
                                <div>
                                    <h4 className="font-bold text-lg mb-2">Verified Experts</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">We verify emails and encourage profile completion.</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-card-dark p-6 rounded-xl shadow-sm flex items-start gap-4 flex-1 min-w-[300px]">
                                <span className="material-icons-round text-2xl text-yellow-500 mt-1">star</span>
                                <div>
                                    <h4 className="font-bold text-lg mb-2">Transparent Ratings</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">See feedback from real users before you hire.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
