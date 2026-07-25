import ReactMarkdown from 'react-markdown';
import { PageHeader } from '../components/PageHeader';
import readmeContent from '../../README.md?raw';
import licenseContent from '../../LICENSE.md?raw';
import changelogContent from '../../CHANGELOG.md?raw';

function MarkdownContainer({ title, content }: { title: string; content: string }) {
  return (
    <div className="flex flex-1 flex-col h-full min-h-0 overflow-y-auto bg-gray-50">
      <PageHeader title={title} />
      <div className="md:p-8 lg:p-12 flex-1 w-full text-left">
        <div className="md:max-w-4xl md:mx-auto w-full bg-white md:rounded-lg md:shadow-sm md:border md:border-gray-100 overflow-hidden">
          <div className="p-4 md:p-8">
            <div className="prose prose-blue max-w-none text-gray-700">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-bold text-primary mb-6" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-xl font-semibold text-primary mt-8 mb-4 border-b pb-2"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-lg font-semibold text-primary mt-6 mb-3" {...props} />
                  ),
                  p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc ml-6 mb-4 space-y-2" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  code: ({ node, ...props }) => (
                    <code
                      className="bg-gray-100 px-1 py-0.5 rounded font-mono text-sm"
                      {...props}
                    />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function About() {
  return <MarkdownContainer title="About" content={readmeContent} />;
}

export function License() {
  return <MarkdownContainer title="License" content={licenseContent} />;
}

export function Changelog() {
  return <MarkdownContainer title="Changelog" content={changelogContent} />;
}

export function Privacy() {
  return (
    <div className="flex flex-1 flex-col h-full min-h-0 overflow-y-auto bg-gray-50 text-left">
      <PageHeader title="Privacy Policy" />
      <div className="md:p-8 lg:p-12 flex-1 w-full text-left">
        <div className="md:max-w-4xl md:mx-auto w-full bg-white md:rounded-lg md:shadow-sm md:border md:border-gray-100 overflow-hidden">
          <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-primary mb-6">Privacy Policy</h1>
            <div className="space-y-6">
              <p className="text-base text-gray-700 mb-4 leading-6">
                At Runestone Safari, we take your privacy seriously. This policy describes how we
                collect, use, and protect your personal information.
              </p>

              <h2 className="text-xl font-semibold text-primary mt-8 mb-4 border-b pb-2">
                Information We Collect
              </h2>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li className="text-gray-700">
                  Account information (email, password) when you create an account
                </li>
                <li className="text-gray-700">Usage data to improve our services</li>
                <li className="text-gray-700">Location data when you use the map features</li>
              </ul>

              <h2 className="text-xl font-semibold text-primary mt-8 mb-4 border-b pb-2">
                How We Use Your Information
              </h2>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li className="text-gray-700">To provide and maintain our service</li>
                <li className="text-gray-700">To notify you about changes to our service</li>
                <li className="text-gray-700">To provide customer support</li>
                <li className="text-gray-700">
                  To gather analysis or valuable information to improve our service
                </li>
                <li className="text-gray-700">To monitor the usage of our service</li>
                <li className="text-gray-700">To detect, prevent and address technical issues</li>
              </ul>

              <h2 className="text-xl font-semibold text-primary mt-8 mb-4 border-b pb-2">
                Data Storage and Security
              </h2>
              <p className="text-base text-gray-700 mb-4 leading-6">
                We use Supabase for secure data storage and authentication. Your data is protected
                using industry-standard security measures.
              </p>

              <h2 className="text-xl font-semibold text-primary mt-8 mb-4 border-b pb-2">
                Third-Party Services
              </h2>
              <p className="text-base text-gray-700 mb-4 leading-6">
                We use the following third-party services:
              </p>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li className="text-gray-700">Supabase for database and authentication</li>
                <li className="text-gray-700">Cloudflare for hosting and security</li>
                <li className="text-gray-700">OpenFreeMap for map tiles</li>
              </ul>

              <h2 className="text-xl font-semibold text-primary mt-8 mb-4 border-b pb-2">
                Your Rights
              </h2>
              <p className="text-base text-gray-700 mb-4 leading-6">You have the right to:</p>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li className="text-gray-700">Access your personal data</li>
                <li className="text-gray-700">Correct inaccurate data</li>
                <li className="text-gray-700">Request deletion of your data</li>
                <li className="text-gray-700">Object to processing of your data</li>
                <li className="text-gray-700">Request restriction of processing your data</li>
                <li className="text-gray-700">Request transfer of your data</li>
                <li className="text-gray-700">Withdraw consent</li>
              </ul>

              <h2 className="text-xl font-semibold text-primary mt-8 mb-4 border-b pb-2">
                Contact Us
              </h2>
              <p className="text-base text-gray-700 mb-4 leading-6">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <a
                href="mailto:privacy.runestonesafari.1atjf@simplelogin.com"
                className="text-primary hover:underline"
              >
                privacy.runestonesafari.1atjf@simplelogin.com
              </a>

              <p className="text-sm text-gray-500 mt-8">Last updated: February 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
