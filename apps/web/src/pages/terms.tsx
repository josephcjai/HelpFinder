import Link from 'next/link'

// Layout wrapper for legal pages (optional, reused from previous implementation pattern)
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

export default function TermsPage() {
    return (
        <LegalLayout title="Terms of Service">
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p>By accessing and using HelpFinder ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. User Accounts</h2>
                <p>To use certain features of the Platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to keep your account information up to date.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Conduct</h2>
                <p>You agree not to use the Platform for any unlawful purpose or in any way that interrupts, damages, impairs, or renders the Platform less efficient.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Limitation of Liability</h2>
                <p>HelpFinder is a marketplace connecting Requesters and Helpers. We are not responsible for the conduct of any user or the quality of services provided.</p>
            </section>

            <p className="text-sm text-gray-400 mt-12">Last updated: {new Date().toLocaleDateString()}</p>
        </LegalLayout>
    )
}
