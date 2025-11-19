import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-800 mb-6">
            Terms of Service
          </h1>

          <p className="text-sm text-secondary-600 mb-8">
            Last Updated: November 13, 2024
          </p>

          <div className="space-y-6 text-secondary-700 leading-relaxed">
            <div>
              <p className="font-semibold text-primary-700 mb-2">Operated by Noyan Trade LLC</p>
              <p>200 N Vineyard Blvd, Ste A325-5522, Honolulu HI 96817</p>
              <p>Email: nynrentals@gmail.com</p>
              <p>Website: www.nynrentals.com</p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                1. Introduction
              </h2>
              <p>
                These Terms of Service ("Terms") govern your use of the website www.nynrentals.com
                ("Site"), and the vehicle rental and related services ("Services") provided by Noyan Trade
                LLC, doing business as NYN Rentals ("Company," "we," "us," or "our"). By accessing or using
                our Site or Services, you agree to be bound by these Terms. If you do not agree, please do
                not use our Site or Services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                2. Eligibility
              </h2>
              <p>
                You must be at least 21 years old and possess a valid driver's license and a major credit
                card to rent vehicles from NYN Rentals. International customers must provide a valid passport
                and an International Driving Permit (if required by Hawaii law).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                3. Reservations and Payments
              </h2>
              <p>
                All reservations are subject to availability and confirmation by NYN Rentals. Payments are
                processed securely through Stripe, our third-party payment processor. By making a payment,
                you authorize us and Stripe to charge your selected payment method for all applicable fees,
                taxes, and deposits. A reservation is not considered confirmed until payment has been
                successfully processed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                4. Security Deposits
              </h2>
              <p>
                A refundable security deposit may be required at the time of booking or vehicle pickup. The
                deposit amount and refund conditions will be clearly stated during the reservation process.
                Refunds will be processed after the vehicle has been inspected and found free of damage,
                excessive wear, or violations of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                5. Vehicle Use and Responsibility
              </h2>
              <p>
                The renter is fully responsible for the vehicle during the rental period. Vehicles must only
                be used for lawful, personal, or business transportation; by authorized drivers listed on the
                rental agreement; and within the geographical limits stated in your rental contract. Any
                damage, theft, or loss resulting from misuse, negligence, unauthorized drivers, or violation
                of law may result in full financial liability to the renter.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                6. Prohibited Uses
              </h2>
              <p className="mb-3">You may not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Operate the vehicle under the influence of drugs or alcohol</li>
                <li>Use the vehicle in any race, competition, or illegal activity</li>
                <li>Allow an unauthorized person to drive the vehicle</li>
                <li>Transport hazardous materials</li>
                <li>Exceed manufacturer-recommended weight or passenger limits</li>
              </ul>
              <p className="mt-3">
                Violation of these restrictions may result in termination of the rental agreement and
                forfeiture of deposits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                7. Insurance and Liability
              </h2>
              <p>
                NYN Rentals maintains required commercial insurance coverage as mandated by Hawaii law.
                Renters are strongly encouraged to carry their own supplemental insurance or verify coverage
                through their credit card or travel provider. The renter is responsible for any damages,
                fines, or third-party claims not covered by insurance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                8. Cancellations and Refunds
              </h2>
              <p>
                Cancellations made within 48 hours of the scheduled rental start time may be subject to a
                cancellation fee. Refund eligibility will be determined based on the timing of the
                cancellation and the rental terms displayed during booking. No-shows or early returns may
                not be eligible for a full refund.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                9. Maintenance and Breakdown
              </h2>
              <p>
                In the unlikely event of a mechanical issue, contact NYN Rentals immediately at the phone
                or email provided in your rental confirmation. Unauthorized repairs or modifications to the
                vehicle are strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                10. Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by law, NYN Rentals and Noyan Trade LLC shall not be liable
                for any indirect, incidental, special, or consequential damages arising from the use of our
                vehicles or Services, including but not limited to loss of income, data, or enjoyment. Our
                total liability shall not exceed the total rental fee paid by the customer for the specific
                transaction giving rise to the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                11. Indemnification
              </h2>
              <p>
                You agree to indemnify and hold harmless NYN Rentals, Noyan Trade LLC, and their members,
                employees, and agents from and against any claims, damages, liabilities, costs, or expenses
                arising from your use of our Services or breach of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                12. Governing Law and Jurisdiction
              </h2>
              <p>
                These Terms are governed by and construed under the laws of the State of Hawaii, United
                States, without regard to conflict of law principles. Any disputes shall be resolved
                exclusively in the state or federal courts located in Honolulu County, Hawaii.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                13. Amendments
              </h2>
              <p>
                NYN Rentals reserves the right to modify these Terms at any time. Updates will be posted on
                this page with the revised "Last Updated" date. Continued use of the Site or Services
                constitutes acceptance of any revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-800 mb-3 mt-8">
                14. Contact
              </h2>
              <p>
                Questions regarding these Terms may be directed to: NYN Rentals, nynrentals@gmail.com,
                200 N Vineyard Blvd, Ste A325-5522, Honolulu HI 96817.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
