import { useSuspenseQuery } from "@tanstack/react-query";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { festivalInfoQuery } from "@/api/festival-info/useFestivalInfo";
import { PageTitle } from "@/components/PageTitle/PageTitle";
import { EditionTitle } from "./InfoTab/EditionTitle";
import { InfoText } from "./InfoTab/InfoText";
import { CustomLinks } from "./InfoTab/CustomLinks";
import { NoInfo } from "./InfoTab/NoInfo";
import { SocialLinkItem } from "./InfoTab/SocialLinkItem";
import { customLinksQuery } from "@/api/custom-links/useCustomLinks";

export function InfoTab() {
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
      <PageTitle title="Info" prefix={festival?.name} />
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
