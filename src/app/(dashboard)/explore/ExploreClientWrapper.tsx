"use client";

interface ExploreClientWrapperProps {
  onboardingDone: boolean;
  userName: string;
}

export default function ExploreClientWrapper({
  onboardingDone,
  userName,
}: ExploreClientWrapperProps) {
  return (
    <div>
      <h1>Welcome {userName}</h1>

      {!onboardingDone && (
        <div>
          Please complete onboarding to access all features.
        </div>
      )}
    </div>
  );
}
