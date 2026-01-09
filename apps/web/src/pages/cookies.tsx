import Link from 'next/link'

const LegalLayout = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100">{title}</h1>
            <div className="prose prose-blue max-w-none text-gray-600">
                {children}
            </div>
        </div>
    </div>
)

export default function CookiesPage() {
    return (
        <LegalLayout title="Cookie Policy">
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. What Are Cookies?</h2>
                <p>Cookies are small text files that are placed on your device by websites that you visit. They are widely used to make websites work more efficiently and provide information to the owners of the site.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
                <p>We use cookies to authenticate users, remember user preferences, analyze site traffic, and understand online behaviors.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Managing Cookies</h2>
                <p>Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit www.aboutcookies.org or www.allaboutcookies.org.</p>
            </section>

            <p className="text-sm text-gray-400 mt-12">Last updated: {new Date().toLocaleDateString()}</p>
        </LegalLayout>
    )
}
