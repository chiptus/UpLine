import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

function TermsOfService() {
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
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using this festival voting application, you
                accept and agree to be bound by the terms and provision of this
                agreement.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                2. Description of Service
              </h2>
              <p className="text-muted-foreground">
                This application provides a collaborative platform for voting on
                and rating festival artists. Users can create groups, share
                voting lists, and discover new artists through community
                recommendations.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  You must provide accurate and complete information when
                  creating an account
                </li>
                <li>
                  You are responsible for maintaining the security of your
                  account credentials
                </li>
                <li>
                  You must notify us immediately of any unauthorized use of your
                  account
                </li>
                <li>One person may not maintain more than one account</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Acceptable Use</h2>
              <p className="text-muted-foreground">
                You agree to use the service only for lawful purposes and in
                accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  Use the service for any unlawful purpose or to solicit others
                  to perform unlawful acts
                </li>
                <li>
                  Violate any international, federal, provincial, or local laws
                  or regulations
                </li>
                <li>
                  Transmit, or procure the sending of, any advertising or
                  promotional material without our prior written consent
                </li>
                <li>
                  Impersonate or attempt to impersonate another user, person, or
                  entity
                </li>
                <li>
                  Engage in any other conduct that restricts or inhibits
                  anyone's use or enjoyment of the service
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. User Content</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  You retain ownership of any content you submit to the service
                </li>
                <li>
                  By submitting content, you grant us a license to use, modify,
                  and display that content within the service
                </li>
                <li>
                  You are responsible for ensuring you have the right to submit
                  any content you share
                </li>
                <li>
                  We reserve the right to remove any content that violates these
                  terms
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                6. Privacy and Data Protection
              </h2>
              <p className="text-muted-foreground">
                Your privacy is important to us. Please review our Privacy
                Policy, which also governs your use of the service, to
                understand our practices regarding the collection, use, and
                disclosure of personal information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                7. Intellectual Property Rights
              </h2>
              <p className="text-muted-foreground">
                The service and its original content, features, and
                functionality are and will remain the exclusive property of
                Chaim Lev-Ari and its licensors. The service is protected by
                copyright, trademark, and other laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and bar access to the
                service immediately, without prior notice or liability, under
                our sole discretion, for any reason whatsoever including without
                limitation if you breach the Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                9. Disclaimer of Warranties
              </h2>
              <p className="text-muted-foreground">
                The information on this service is provided on an "as is" basis.
                To the fullest extent permitted by law, this Company excludes
                all warranties, representations, or terms relating to this
                service and its use.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                10. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                In no event shall Chaim Lev-Ari, nor its directors, employees,
                partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, special, consequential, or punitive
                damages arising out of your use of the service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be interpreted and governed by the laws of the
                applicable jurisdiction, without regard to its conflict of law
                provisions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right, at our sole discretion, to modify or
                replace these Terms at any time. If a revision is material, we
                will try to provide at least 30 days notice prior to any new
                terms taking effect.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">
                13. Contact Information
              </h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please
                contact us at:
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

export default TermsOfService;
