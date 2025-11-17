export const metadata = {
  title: "Privacy Policy - TOTL Agency",
  description: "Privacy Policy for TOTL Agency - How we protect your data",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black pt-40 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16 text-center">
            <h1 className="text-6xl lg:text-7xl font-bold mb-8 text-white animate-apple-fade-in">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-apple-slide-up">
              Last Updated: October 19, 2025
            </p>
          </div>

          <div className="apple-glass rounded-2xl p-8 lg:p-12 shadow-lg space-y-8 text-white">
            {/* Introduction */}
            <section>
              <p className="text-gray-300 leading-relaxed">
                At TOTL Agency (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our platform and services.
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                By using TOTL Agency, you consent to the practices described in this Privacy Policy.
              </p>
            </section>

            {/* 1. Information We Collect */}
            <section>
              <h2 className="text-3xl font-bold mb-4">1. Information We Collect</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <h3 className="text-xl font-semibold text-white">Information You Provide</h3>
                <p>When you register and use our Services, we collect information you provide directly:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Account Information:</strong> Name, email address, password, phone number</li>
                  <li><strong className="text-white">Profile Information:</strong> Bio, experience, measurements (for talent), company details (for clients)</li>
                  <li><strong className="text-white">Portfolio Content:</strong> Photos, videos, and descriptions you upload</li>
                  <li><strong className="text-white">Communications:</strong> Messages, application letters, and other communications through the platform</li>
                  <li><strong className="text-white">Payment Information:</strong> If we process payments, we collect billing information (handled securely through third-party processors)</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mt-6">Information Collected Automatically</h3>
                <p>We automatically collect certain information when you use our Services:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Usage Data:</strong> Pages viewed, features used, time spent, click patterns</li>
                  <li><strong className="text-white">Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                  <li><strong className="text-white">Location Data:</strong> General location based on IP address</li>
                  <li><strong className="text-white">Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mt-6">Information from Third Parties</h3>
                <p>We may receive information from:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Authentication providers (if you sign in with third-party services)</li>
                  <li>Analytics services (Google Analytics, Sentry error tracking)</li>
                  <li>Other users who interact with you on the platform</li>
                </ul>
              </div>
            </section>

            {/* 2. How We Use Your Information */}
            <section>
              <h2 className="text-3xl font-bold mb-4">2. How We Use Your Information</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Provide Services:</strong> Create and manage your account, facilitate bookings, process applications</li>
                  <li><strong className="text-white">Communications:</strong> Send transactional emails (application updates, booking confirmations)</li>
                  <li><strong className="text-white">Personalization:</strong> Recommend relevant gigs, improve user experience</li>
                  <li><strong className="text-white">Platform Improvement:</strong> Analyze usage patterns, fix bugs, develop new features</li>
                  <li><strong className="text-white">Security:</strong> Detect fraud, prevent abuse, enforce our Terms of Service</li>
                  <li><strong className="text-white">Legal Compliance:</strong> Comply with applicable laws and regulations</li>
                  <li><strong className="text-white">Marketing:</strong> Send newsletters and promotional content (with your consent)</li>
                </ul>
              </div>
            </section>

            {/* 3. How We Share Your Information */}
            <section>
              <h2 className="text-3xl font-bold mb-4">3. How We Share Your Information</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We may share your information in the following circumstances:</p>

                <h3 className="text-xl font-semibold text-white">With Other Users</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Talent profiles and portfolios are visible to clients</li>
                  <li>Client company information is visible to talent</li>
                  <li>Application details are shared between talent and clients</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mt-6">With Service Providers</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Hosting and infrastructure (Vercel, Supabase)</li>
                  <li>Email delivery (Resend)</li>
                  <li>Analytics and monitoring (Sentry, Google Analytics)</li>
                  <li>Payment processing (if applicable)</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mt-6">For Legal Reasons</h3>
                <p>We may disclose information if required by law or to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Comply with legal obligations or court orders</li>
                  <li>Protect our rights, property, or safety</li>
                  <li>Prevent fraud or abuse</li>
                  <li>Investigate violations of our Terms</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mt-6">Business Transfers</h3>
                <p>
                  If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
                </p>
              </div>
            </section>

            {/* 4. Data Security */}
            <section>
              <h2 className="text-3xl font-bold mb-4">4. Data Security</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We implement industry-standard security measures to protect your information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encrypted data transmission (SSL/TLS)</li>
                  <li>Secure password hashing</li>
                  <li>Row-level security on database</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Access controls and authentication</li>
                </ul>
                <p className="mt-4">
                  However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </div>
            </section>

            {/* 5. Your Rights and Choices */}
            <section>
              <h2 className="text-3xl font-bold mb-4">5. Your Rights and Choices</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
                  <li><strong className="text-white">Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong className="text-white">Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing emails (transactional emails will continue)</li>
                  <li><strong className="text-white">Data Portability:</strong> Request your data in a portable format</li>
                  <li><strong className="text-white">Restrict Processing:</strong> Limit how we use your data</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at privacy@thetotlagency.com.
                </p>
              </div>
            </section>

            {/* 6. Data Retention */}
            <section>
              <h2 className="text-3xl font-bold mb-4">6. Data Retention</h2>
              <p className="text-gray-300 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide Services. We may retain certain information after account closure for legal, regulatory, or legitimate business purposes, such as fraud prevention, resolving disputes, or enforcing our Terms.
              </p>
            </section>

            {/* 7. Children's Privacy */}
            <section>
              <h2 className="text-3xl font-bold mb-4">7. Children&apos;s Privacy</h2>
              <p className="text-gray-300 leading-relaxed">
                Our Services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information.
              </p>
            </section>

            {/* 8. International Users */}
            <section>
              <h2 className="text-3xl font-bold mb-4">8. International Users</h2>
              <p className="text-gray-300 leading-relaxed">
                TOTL Agency is based in the United States. If you access our Services from outside the United States, your information may be transferred to, stored, and processed in the United States. By using our Services, you consent to such transfer and processing.
              </p>
            </section>

            {/* 9. Cookies and Tracking */}
            <section>
              <h2 className="text-3xl font-bold mb-4">9. Cookies and Tracking Technologies</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We use cookies and similar tracking technologies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Remember your preferences and settings</li>
                  <li>Keep you logged in</li>
                  <li>Analyze how you use our Services</li>
                  <li>Improve performance and user experience</li>
                </ul>
                <p className="mt-4">
                  You can control cookies through your browser settings. However, disabling cookies may affect your ability to use certain features of our Services.
                </p>
              </div>
            </section>

            {/* 10. California Privacy Rights */}
            <section>
              <h2 className="text-3xl font-bold mb-4">10. California Privacy Rights (CCPA)</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Right to know what personal information we collect and how we use it</li>
                  <li>Right to request deletion of your personal information</li>
                  <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
                  <li>Right to non-discrimination for exercising your privacy rights</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at privacy@thetotlagency.com with &quot;California Privacy Rights&quot; in the subject line.
                </p>
              </div>
            </section>

            {/* 11. GDPR Rights */}
            <section>
              <h2 className="text-3xl font-bold mb-4">11. GDPR Rights (European Users)</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Right of access to your personal data</li>
                  <li>Right to rectification of inaccurate data</li>
                  <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
                  <li>Right to restrict processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                  <li>Right to withdraw consent</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact our Data Protection Officer at dpo@thetotlagency.com.
                </p>
              </div>
            </section>

            {/* 12. Changes to Privacy Policy */}
            <section>
              <h2 className="text-3xl font-bold mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. We will notify you of material changes by email or by posting a notice on our platform. The &quot;Last Updated&quot; date at the top indicates when this policy was last revised.
              </p>
            </section>

            {/* 13. Third-Party Services */}
            <section>
              <h2 className="text-3xl font-bold mb-4">13. Third-Party Services</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We use the following third-party services that may collect information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Supabase:</strong> Database and authentication (privacy policy: supabase.com/privacy)</li>
                  <li><strong className="text-white">Vercel:</strong> Hosting and deployment (privacy policy: vercel.com/legal/privacy-policy)</li>
                  <li><strong className="text-white">Resend:</strong> Email delivery (privacy policy: resend.com/legal/privacy-policy)</li>
                  <li><strong className="text-white">Sentry:</strong> Error tracking and monitoring (privacy policy: sentry.io/privacy)</li>
                </ul>
                <p className="mt-4">
                  These third-party services have their own privacy policies governing their use of your information.
                </p>
              </div>
            </section>

            {/* 14. Do Not Track */}
            <section>
              <h2 className="text-3xl font-bold mb-4">14. Do Not Track Signals</h2>
              <p className="text-gray-300 leading-relaxed">
                Some browsers support &quot;Do Not Track&quot; signals. Currently, we do not respond to Do Not Track signals, as there is no industry standard for compliance. We will continue to monitor developments in this area.
              </p>
            </section>

            {/* 15. Contact Us */}
            <section>
              <h2 className="text-3xl font-bold mb-4">15. Contact Us About Privacy</h2>
              <div className="text-gray-300 leading-relaxed space-y-2">
                <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
                <p className="mt-4">
                  <strong className="text-white">TOTL Agency - Privacy Team</strong><br />
                  Email: privacy@thetotlagency.com<br />
                  Data Protection Officer: dpo@thetotlagency.com<br />
                  General Support: support@thetotlagency.com<br />
                  Website: <a href="https://www.thetotlagency.com" className="text-blue-400 hover:text-blue-300 underline">www.thetotlagency.com</a>
                </p>
                <p className="mt-6">
                  For GDPR-related inquiries (European users), please contact our Data Protection Officer at dpo@thetotlagency.com.
                </p>
                <p>
                  For CCPA-related inquiries (California residents), please email privacy@thetotlagency.com with &quot;California Privacy Rights&quot; in the subject line.
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="border-t border-white/20 pt-8">
              <p className="text-gray-300 leading-relaxed italic">
                By using TOTL Agency, you acknowledge that you have read and understood this Privacy Policy and agree to our collection, use, and disclosure of your information as described herein.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

