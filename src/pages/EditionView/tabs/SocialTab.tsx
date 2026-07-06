import { useSuspenseQuery } from "@tanstack/react-query";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { festivalInfoQuery } from "@/api/festival-info/useFestivalInfo";
import { PageTitle } from "@/components/PageTitle/PageTitle";
import { ExternalLinkIcon } from "lucide-react";

export function SocialTab() {
  const { festival } = useFestivalEdition();
  const { data: festivalInfo } = useSuspenseQuery(
    festivalInfoQuery(festival.id),
  );

  const facebook_url = festivalInfo?.facebook_url;
  const instagram_url = festivalInfo?.instagram_url;
  if (!facebook_url && !instagram_url) {
    return (
      <>
        <PageTitle title="Social" prefix={festival?.name} />
        <div className="text-center text-purple-300 py-12">
          <p>Social feeds not available yet.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Social" prefix={festival?.name} />
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Follow Us</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Facebook Embed */}
          {facebook_url && (
            <div className="bg-white/5 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Facebook</h3>
                <a
                  href={facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
                >
                  <span className="text-sm">View on Facebook</span>
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </div>

              <div className="relative">
                <iframe
                  src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebook_url)}&tabs=timeline&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false&appId=1064955115428877`}
                  width="100%"
                  height="500"
                  style={{ border: "none", overflow: "hidden" }}
                  scrolling="no"
                  frameBorder="0"
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
