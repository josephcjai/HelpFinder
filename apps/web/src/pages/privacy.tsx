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

export default function PrivacyPage() {
    return (
        <LegalLayout title="Privacy Policy">
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                <p>We collect information you provide directly to us, such as when you create an account, post a task, bid on a task, or communicate with other users.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <p>We use the information we collect to operate, maintain, and improve our services, facilitate transactions, and communicate with you.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
                <p>We may share your information with other users as necessary to provide our services (e.g., sharing a Requester's location with a hired Helper).</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
                <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            </section>

            <p className="text-sm text-gray-400 mt-12">Last updated: {new Date().toLocaleDateString()}</p>
        </LegalLayout>
    )
}
