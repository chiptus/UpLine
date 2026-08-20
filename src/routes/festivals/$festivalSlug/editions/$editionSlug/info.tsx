import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { festivalInfoQuery } from "@/api/festival-info/useFestivalInfo";
import { pageMeta } from "@/lib/pageHead";
import { EditionTitle } from "@/pages/EditionView/tabs/InfoTab/EditionTitle";
import { InfoText } from "@/pages/EditionView/tabs/InfoTab/InfoText";
import { CustomLinks } from "@/pages/EditionView/tabs/InfoTab/CustomLinks";
import { NoInfo } from "@/pages/EditionView/tabs/InfoTab/NoInfo";
import { SocialLinkItem } from "@/pages/EditionView/tabs/InfoTab/SocialLinkItem";
import { customLinksQuery } from "@/api/custom-links/useCustomLinks";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/info",
)({
  component: InfoTab,
  head: ({ match }) => ({
    meta: pageMeta({ title: "Info", prefix: match.context.festival.name }),
  }),
});

function InfoTab() {
  const { edition, festival } = useFestivalEdition();
  const { data: festivalInfo } = useSuspenseQuery(
    festivalInfoQuery(festival.id),
  );
  const { data: customLinks } = useSuspenseQuery(customLinksQuery(festival.id));

  const noInfoAvailable =
    !festivalInfo?.info_text &&
    !festivalInfo?.facebook_url &&
    !festivalInfo?.instagram_url &&
    customLinks.length === 0;

  return (
    <>
      <div className="space-y-8">
        <EditionTitle name={edition?.name} />

        {festivalInfo?.info_text && (
          <InfoText infoText={festivalInfo.info_text} />
        )}

        {customLinks.length > 0 && <CustomLinks links={customLinks} />}

        {festivalInfo?.facebook_url ? (
          <SocialLinkItem
            link={{ title: "Facebook", url: festivalInfo.facebook_url }}
          />
        ) : null}

        {festivalInfo?.instagram_url ? (
          <SocialLinkItem
            link={{ title: "Instagram", url: festivalInfo.instagram_url }}
          />
        ) : null}

        {noInfoAvailable && <NoInfo />}
      </div>
    </>
  );
}
