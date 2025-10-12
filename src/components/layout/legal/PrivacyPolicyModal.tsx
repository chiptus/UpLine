import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({
  open,
  onOpenChange,
}: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>
            Read our complete privacy policy to understand how we collect, use,
            and protect your personal data.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-6 pr-4">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. Data Controller</h3>
              <p className="text-sm text-muted-foreground">
                This festival voting application is operated by Chaim Lev-Ari.
                For any data protection inquiries, please contact us at
                upline@getupline.com.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Data We Collect</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Account Information:</strong> Email address, username,
                  account creation date
                </p>
                <p>
                  <strong>Voting Data:</strong> Your votes on festival artists,
                  voting timestamps
                </p>
                <p>
                  <strong>Personal Notes:</strong> Notes you create about
                  artists
                </p>
                <p>
                  <strong>Group Data:</strong> Group memberships, roles, and
                  related activity
                </p>
                <p>
                  <strong>Technical Data:</strong> Browser preferences (sidebar
                  state), offline cached data
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                3. Legal Basis for Processing
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Contract Performance:</strong> Processing necessary to
                  provide the voting service you requested
                </p>
                <p>
                  <strong>Legitimate Interest:</strong> Improving the app
                  functionality and user experience
                </p>
                <p>
                  <strong>Consent:</strong> For optional features like
                  preference cookies
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                4. How We Use Your Data
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Provide the festival voting and rating functionality</li>
                <li>Enable collaboration through groups and shared voting</li>
                <li>Remember your preferences and settings</li>
                <li>
                  Provide offline functionality for better user experience
                </li>
                <li>Ensure security and prevent misuse of the service</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Data Sharing</h3>
              <p className="text-sm text-muted-foreground">
                We do not sell or share your personal data with third parties
                for marketing purposes. Data is only shared within your voting
                groups as necessary for the collaborative features you use.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Data Retention</h3>
              <p className="text-sm text-muted-foreground">
                We retain your data for as long as your account is active.
                Voting data and notes are kept for the duration of the festival
                season and may be retained for historical purposes unless you
                request deletion.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                7. Your Rights Under GDPR
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
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

            <section>
              <h3 className="text-lg font-semibold mb-3">
                8. Cookies and Local Storage
              </h3>
              <p className="text-sm text-muted-foreground">
                We use essential cookies and local browser storage to remember
                your preferences (like sidebar state) and provide offline
                functionality. You can manage cookie preferences through our
                cookie consent banner.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">9. Data Security</h3>
              <p className="text-sm text-muted-foreground">
                We implement appropriate technical and organizational measures
                to protect your personal data against unauthorized access,
                alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                10. International Transfers
              </h3>
              <p className="text-sm text-muted-foreground">
                Your data is processed within the EU/EEA. Any transfers to third
                countries are subject to appropriate safeguards.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                11. Contact Information
              </h3>
              <p className="text-sm text-muted-foreground">
                For any questions about this privacy policy or to exercise your
                rights, please contact us at:
                <br />
                Email:{" "}
                <a href="mailto:upline@getupline.com">upline@getupline.com</a>
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">
                12. Updates to This Policy
              </h3>
              <p className="text-sm text-muted-foreground">
                We may update this privacy policy from time to time. We will
                notify you of any significant changes by posting the new policy
                on this page with an updated effective date.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Effective Date:</strong>{" "}
                {new Date().toLocaleDateString()}
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
