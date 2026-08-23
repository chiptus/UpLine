import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Vote } from "lucide-react";
import { VOTE_CONFIG } from "@/lib/voteConfig";
import { OnboardingContent } from "../OnboardingContent";
import votingImage from "./voting.png?url";
interface VotingExplanationStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
}

export function VotingExplanationStep({
  onNext,
  onPrevious,
  onSkip,
}: VotingExplanationStepProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header - fixed */}
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Vote className="h-5 w-5" />
          <span>Voting System</span>
        </DialogTitle>
        <DialogDescription>
          Rate artists to help plan your festival and see what your groups
          think!
        </DialogDescription>
      </DialogHeader>

      {/* Scrollable content */}
      <OnboardingContent>
        {/* Voting system screenshot */}
        <div className="rounded-lg overflow-hidden">
          <img
            src={votingImage}
            alt="Voting system showing Must Go, Interested, and Won't Go options"
            className="w-full h-auto max-h-56 sm:max-h-80 object-contain rounded-lg"
          />
        </div>

        {/* Vote Types */}
        <div className="space-y-3">
          {Object.entries(VOTE_CONFIG).map(([key, config]) => {
            const IconComponent = config.icon;
            return (
              <div key={key} className={`${config.bgColor} rounded-lg p-3`}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 ${config.circleColor} rounded-full flex items-center justify-center flex-shrink-0`}
                  >
                    <IconComponent className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4
                      className={`font-medium text-sm sm:text-base ${config.textColor}`}
                    >
                      {config.label}
                    </h4>
                    {/* <p className={`text-xs sm:text-sm ${config.descColor}`}>
                      {config.description}
                    </p> */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-sm sm:text-base text-purple-700 dark:text-purple-300">
            <strong>Pro tip:</strong> Your votes help create group ratings so
            you can quickly see which artists your friends are excited about!
          </p>
        </div> */}
      </OnboardingContent>

      {/* Navigation - fixed at bottom */}
      <div className="flex gap-2 pt-4 mt-4 border-t">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Skip
          </Button>
        )}
        <Button onClick={onNext} className="ml-auto">
          Next: Timeline
        </Button>
      </div>
    </div>
  );
}
