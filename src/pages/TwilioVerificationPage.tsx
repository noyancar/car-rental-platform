import { Helmet } from 'react-helmet-async';

const TwilioVerificationPage = () => {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Twilio Account Verification - NYN Rentals</title>
      </Helmet>
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">NYN Rentals</h1>
            <p className="text-lg text-gray-500">Twilio Account Verification</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Business Information</h2>
              <ul className="space-y-2 text-gray-700">
                <li><span className="font-medium">Company Name:</span> Noyan Trade LLC dba NYN Rentals</li>
                <li><span className="font-medium">Website:</span> <a href="https://nynrentals.com" className="text-blue-600 hover:underline">https://nynrentals.com</a></li>
                <li><span className="font-medium">Industry:</span> Car Rental Services</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Twilio Usage</h2>
              <p className="text-gray-700">
                NYN Rentals will use Twilio for SMS notifications related to our car rental platform, including booking confirmations,
                reservation reminders, and customer support communications. Our platform is a legitimate car rental service
                operating at <a href="https://nynrentals.com" className="text-blue-600 hover:underline">nynrentals.com</a>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Account Reference</h2>
              <ul className="space-y-2 text-gray-700">
                <li><span className="font-medium">Twilio Account SID:</span> AC67bf7a0207b2a0a475b3566e021c02bd</li>
                <li><span className="font-medium">Support Ticket:</span> #24922202</li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">
                This page serves as verification that the Twilio account referenced above is owned and operated by NYN Rentals.
                This page is hosted on our official domain to confirm our association with this account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TwilioVerificationPage;
