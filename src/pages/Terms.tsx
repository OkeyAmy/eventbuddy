import { useEffect } from 'react';

const Terms = () => {
  useEffect(() => {
    document.title = 'Terms of Service | EventBuddy AI';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600 mb-8">
            Effective date: {new Date().toISOString().slice(0, 10)}
          </p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Agreement</h2>
            <p className="text-gray-700 mb-6">
              These Terms govern your use of EventBuddy AI, including the website and the EventBuddy
              Discord application (the "Service"). By using the Service, you agree to these Terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Access and Eligibility</h2>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>You must comply with Discord's Terms, Community Guidelines, and Developer Policy.</li>
              <li>You must be at least 13 years old or the minimum digital consent age in your region.</li>
              <li>Server administrators are responsible for configuring permissions and deciding where
              the bot can operate.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Use of the Service</h2>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Do not misuse the Service, interfere with its operation, or attempt to access it using
              methods other than the interfaces provided.</li>
              <li>You will not upload or share unlawful content, spam, or malicious code.</li>
              <li>You agree to follow rate limits and respect other users in shared channels.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data and Privacy</h2>
            <p className="text-gray-700 mb-6">
              Our <a href="/privacy" className="text-purple-600 hover:text-purple-700 underline">Privacy Policy</a> explains what information we process and why.
              By using the Service, you consent to that processing. Server admins should ensure they
              have a lawful basis before uploading attendee data (e.g., CSV files) to the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. AI and Third‑Party Services</h2>
            <p className="text-gray-700 mb-6">
              EventBuddy integrates with Discord, Supabase, and Google Generative AI. Your use of those
              services is subject to their terms. We are not responsible for third‑party outages or
              changes.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Acceptable Use and Safety</h2>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Do not attempt to prompt‑inject, exfiltrate secrets, or bypass safety systems.</li>
              <li>Do not use the Service to harass, discriminate, or violate intellectual property.</li>
              <li>Request only the permissions your server needs; least‑privilege is recommended.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Availability and Changes</h2>
            <p className="text-gray-700 mb-6">
              We may modify, suspend, or discontinue the Service or any feature at any time. We may also
              update these Terms; material changes will be reflected by updating the date on this page.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Disclaimers</h2>
            <p className="text-gray-700 mb-6">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. AI‑GENERATED CONTENT MAY
              BE INACCURATE OR UNSUITABLE; USE DISCRETION BEFORE ACTING ON IT.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-6">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR REVENUE.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Termination</h2>
            <p className="text-gray-700 mb-6">
              You may stop using the Service at any time, including removing the bot from your server.
              We may suspend or terminate your access if you violate these Terms or pose a risk to users
              or the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 mb-6">
              These Terms are governed by the laws of your place of residence or our place of business
              (to be specified by you). Disputes will be resolved in the competent courts of that venue.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Contact</h2>
            <p className="text-gray-700 mb-6">Questions? Contact: <strong>amaobiokeoma@gmail.com</strong></p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <a 
              href="/" 
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
