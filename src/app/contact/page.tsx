// src/app/contact/page.tsx — CREATE NEW

export const metadata = {
  title: 'Contact Us - EduExplorer',
  description: 'Get in touch with EduExplorer support team',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-600 mb-8">
            Have questions? We're here to help. Reach out to us through any of the channels below.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* General Support */}
            <div className="bg-indigo-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">General Support</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Email:</strong> admin@eduexplorer.ai</p>
                <p><strong>Response Time:</strong> Within 24 hours</p>
                <p className="text-sm text-gray-600">
                  For account issues, technical problems, or general questions about using EduExplorer.
                </p>
              </div>
            </div>

            {/* Privacy & Legal */}
            <div className="bg-purple-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Legal</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Email:</strong> admin@eduexplorer.ai</p>
                <p><strong>Legal:</strong> legal@eduexplorer.ai</p>
                <p className="text-sm text-gray-600">
                  For data deletion requests, privacy concerns, or legal matters.
                </p>
              </div>
            </div>

            {/* Business Inquiries */}
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Inquiries</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Email:</strong> admin@eduexplorer.ai</p>
                <p className="text-sm text-gray-600">
                  For partnerships, institutional licensing, or business proposals.
                </p>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Email:</strong> admin@eduexplorer.ai</p>
                <p className="text-sm text-gray-600">
                  Share your suggestions, feature requests, or report bugs.
                </p>
              </div>
            </div>

          </div>

          {/* Business Information - Critical for Meta WhatsApp */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Business Name:</strong> EduExplorer</p>
              <p><strong>Operated by:</strong> Suman Malipeddi</p>
              <p><strong>Location:</strong> India</p>
              <p><strong>Primary Email:</strong> admin@eduexplorer.ai</p>
              <p><strong>Address:</strong> [Hyderbad, 500089, INDIA]</p>
            </div>
          </div>

          {/* FAQ Link */}
  
        </div>
      </div>
    </div>
  );
}
