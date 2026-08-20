import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { LEGAL_DOCS_LAST_UPDATED } from "@/lib/constants/legal";
import { PageTitle } from "@/components/PageTitle/PageTitle";

export const Route = createFileRoute("/cookies")({
  component: CookiePolicy,
});

function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20">
      <PageTitle title="Cookie Policy" />
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
            <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
            <p className="text-muted-foreground">
              Last updated: {LEGAL_DOCS_LAST_UPDATED}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. What Are Cookies</h2>
              <p className="text-muted-foreground">
                Cookies are small text files that are stored on your device when
                you visit our website. They help us provide you with a better
                experience by remembering your preferences and improving
                functionality.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. How We Use Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to enhance your
                experience on our festival voting application. Our approach is
                privacy-first - we only use essential cookies required for the
                app to function properly.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                3. Types of Cookies We Use
              </h2>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    Essential Cookies
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    These cookies are necessary for the website to function and
                    cannot be switched off in our systems.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Cookie Name:</strong> <code>sidebar:state</code>
                    </div>
                    <div>
                      <strong>Purpose:</strong> Remembers whether you prefer the
                      sidebar expanded or collapsed
                    </div>
                    <div>
                      <strong>Duration:</strong> 7 days
                    </div>
                    <div>
                      <strong>Type:</strong> Local Storage
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    Preference Cookies
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    These cookies allow the website to remember choices you make
                    and provide enhanced features.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Cookie Name:</strong> <code>gdpr-consent</code>
                    </div>
                    <div>
                      <strong>Purpose:</strong> Remembers your cookie consent
                      preferences
                    </div>
                    <div>
                      <strong>Duration:</strong> Permanent (until revoked)
                    </div>
                    <div>
                      <strong>Type:</strong> Local Storage
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    Offline Storage
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    We use browser storage to provide offline functionality for
                    a better user experience.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Storage Types:</strong> IndexedDB, Local Storage
                    </div>
                    <div>
                      <strong>Purpose:</strong> Cache artist data, votes, and
                      notes for offline access
                    </div>
                    <div>
                      <strong>Duration:</strong> Until manually cleared or app
                      uninstalled
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. What We Don't Use</h2>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-muted-foreground">
                  We want to be transparent about what we <strong>don't</strong>{" "}
                  use:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-1 text-muted-foreground">
                  <li>No analytics or tracking cookies</li>
                  <li>No advertising or marketing cookies</li>
                  <li>No third-party tracking scripts</li>
                  <li>No social media tracking pixels</li>
                  <li>No cross-site tracking</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                5. Managing Your Cookie Preferences
              </h2>
              <p className="text-muted-foreground">
                You have several options for managing cookies:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Cookie Consent Banner:</strong> When you first visit,
                  you can choose which cookies to accept
                </li>
                <li>
                  <strong>Cookie Preferences:</strong> Use the "Cookie
                  Preferences" button in the footer to change your settings
                </li>
                <li>
                  <strong>Reset Consent:</strong> Use the "Reset Consent" button
                  to clear all stored preferences
                </li>
                <li>
                  <strong>Browser Settings:</strong> Configure your browser to
                  block or delete cookies
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                6. Impact of Blocking Cookies
              </h2>
              <p className="text-muted-foreground">
                If you choose to block our essential cookies:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>The app will still function normally</li>
                <li>
                  Your sidebar preference won't be remembered between sessions
                </li>
                <li>Offline functionality may be limited</li>
                <li>You may need to re-enter preferences each visit</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Third-Party Cookies</h2>
              <p className="text-muted-foreground">
                We do not use any third-party cookies or tracking technologies.
                All data storage is handled directly by our application and
                stored locally in your browser or on our secure servers.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                8. Updates to This Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time to reflect
                changes in technology or legal requirements. We will notify you
                of any significant changes by updating the date at the top of
                this policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about our use of cookies or this
                Cookie Policy, please contact us at:
                <br />
                Email: upline@getupline.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
