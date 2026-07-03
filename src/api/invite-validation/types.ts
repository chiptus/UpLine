export const inviteValidationKeys = {
  all: ["invites", "validation"] as const,
  byToken: (token: string) => ["invites", "validation", token] as const,
};
