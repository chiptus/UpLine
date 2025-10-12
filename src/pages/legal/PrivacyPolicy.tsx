import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      <TopBar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to App
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Data Controller</h2>
              <p className="text-muted-foreground">
                This festival voting application is operated by Chaim Lev-Ari.
                For any data protection inquiries, please contact us at
                upline@getupline.com.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Data We Collect</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium">Account Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Email address, username, account creation date
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Voting Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Your votes on festival artists, voting timestamps
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Personal Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    Notes you create about artists
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Group Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Group memberships, roles, and related activity
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Technical Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Browser preferences (sidebar state), offline cached data
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                3. Legal Basis for Processing
              </h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium">Contract Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Processing necessary to provide the voting service you
                    requested
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Legitimate Interest</h3>
                  <p className="text-sm text-muted-foreground">
                    Improving the app functionality and user experience
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Consent</h3>
                  <p className="text-sm text-muted-foreground">
                    For optional features like preference cookies
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                4. How We Use Your Data
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide the festival voting and rating functionality</li>
                <li>Enable collaboration through groups and shared voting</li>
                <li>Remember your preferences and settings</li>
                <li>
                  Provide offline functionality for better user experience
                </li>
                <li>Ensure security and prevent misuse of the service</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Data Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell or share your personal data with third parties
                for marketing purposes. Data is only shared within your voting
                groups as necessary for the collaborative features you use.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your data for as long as your account is active.
                Voting data and notes are kept for the duration of the festival
                season and may be retained for historical purposes unless you
                request deletion.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                7. Your Rights Under GDPR
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Right of Access:</strong> Request a copy of your
                  personal data
                </li>
                <li>
                  <strong>Right of Rectification:</strong> Correct inaccurate
                  personal data
                </li>
                <li>
                  <strong>Right of Erasure:</strong> Request deletion of your
                  personal data
                </li>
                <li>
                  <strong>Right of Portability:</strong> Receive your data in a
                  portable format
                </li>
                <li>
                  <strong>Right to Object:</strong> Object to processing of your
                  personal data
                </li>
                <li>
                  <strong>Right to Restrict:</strong> Request restriction of
                  processing
                </li>
                <li>
                  <strong>Right to Withdraw Consent:</strong> Withdraw consent
                  for optional processing
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                8. Cookies and Local Storage
              </h2>
              <p className="text-muted-foreground">
                We use essential cookies and local browser storage to remember
                your preferences (like sidebar state) and provide offline
                functionality. You can manage cookie preferences through our
                cookie consent banner.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures
                to protect your personal data against unauthorized access,
                alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                10. International Transfers
              </h2>
              <p className="text-muted-foreground">
                Your data is processed within the EU/EEA. Any transfers to third
                countries are subject to appropriate safeguards.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                11. Contact Information
              </h2>
              <p className="text-muted-foreground">
                For any questions about this privacy policy or to exercise your
                rights, please contact us at:
                <br />
                Email: upline@getupline.com
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                12. Updates to This Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will
                notify you of any significant changes by posting the new policy
                on this page with an updated effective date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
