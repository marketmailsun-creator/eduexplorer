// src/app/privacy/page.tsx — CREATE NEW

export const metadata = {
  title: 'Privacy Policy - EduExplorer',
  description: 'EduExplorer Privacy Policy - How we collect, use, and protect your data',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-gray max-w-none space-y-6">
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed">
              We collect the following information when you use EduExplorer:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Phone Number:</strong> Collected during signup for authentication and login purposes</li>
              <li><strong>Name:</strong> To personalize your learning experience</li>
              <li><strong>Learning Data:</strong> Topics explored, quiz scores, progress, and study history</li>
              <li><strong>Device Information:</strong> Browser type, IP address, and usage patterns for analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Your information is used to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Send you login OTPs via WhatsApp or SMS</li>
              <li>Provide personalized educational content and recommendations</li>
              <li>Track your learning progress and quiz performance</li>
              <li>Send educational notifications (quiz reminders, progress updates) with your consent</li>
              <li>Improve our services and user experience</li>
              <li>Prevent fraud and ensure platform security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. WhatsApp Communications</h2>
            <p className="text-gray-700 leading-relaxed">
              By signing up, you consent to receive:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-3">
              <li><strong>OTP Messages:</strong> One-time passwords for login verification</li>
              <li><strong>Educational Notifications:</strong> Quiz reminders, weekly progress summaries, and study group updates (you can opt out anytime)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You can disable WhatsApp notifications in your profile settings at any time. OTP messages are essential for login and cannot be disabled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We do NOT sell your personal data. We share data only with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>MSG91:</strong> Our SMS/WhatsApp provider, solely for delivering OTPs and notifications</li>
              <li><strong>Vercel:</strong> Our hosting provider for platform infrastructure</li>
              <li><strong>AI APIs:</strong> Google Gemini and Groq for generating educational content (no personal data is shared, only your questions)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We never share your data with advertisers or third-party marketers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data is stored securely on servers located in India and the United States. We use industry-standard encryption and security measures to protect your information. Your phone number and personal data are encrypted in transit and at rest.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where required by law to retain certain information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of WhatsApp notifications (except OTPs)</li>
              <li>Export your learning data</li>
              <li>Lodge a complaint with data protection authorities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Data Deletion Requests</h2>
            <p className="text-gray-700 leading-relaxed">
              To delete your account and all associated data, go to Profile → Settings → Delete Account, or email us at <a href="mailto:privacy@eduexplorer.ai" className="text-indigo-600 hover:underline">privacy@eduexplorer.ai</a> with the subject "Data Deletion Request". We will process your request within 7 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is intended for users aged 13 and above. We do not knowingly collect data from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via WhatsApp or email. Continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For privacy concerns or data requests, contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-3">
              <p className="text-gray-700"><strong>Email:</strong> admin@eduexplorer.ai</p>
              <p className="text-gray-700"><strong>Support:</strong> admin@eduexplorer.ai</p>
              <p className="text-gray-700"><strong>Address:</strong> [Hyderabad]</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
