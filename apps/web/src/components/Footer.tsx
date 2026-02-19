import Link from 'next/link'

export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div className="text-sm text-gray-500">
                        © {new Date().getFullYear()} HelpFinder4U. All rights reserved.
                    </div>

                    <div className="flex space-x-6 text-sm text-gray-500">
                        <Link href="/terms" className="hover:text-gray-900 transition-colors">
                            Terms
                        </Link>
                        <Link href="/privacy" className="hover:text-gray-900 transition-colors">
                            Privacy
                        </Link>
                        <Link href="/cookies" className="hover:text-gray-900 transition-colors">
                            Cookies
                        </Link>
                    </div>

                    <div className="text-sm text-gray-400">
                        Beta Release v0.9
                    </div>
                </div>
            </div>
        </footer>
    )
}
