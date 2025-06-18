export const ADMIN_EMAILS = [
  "shjeeafridi2004@gmail.com",
  "animeempire10@gmail.com"
];

export function isAdmin(user: { email?: string | null }) {
  return !!user?.email && ADMIN_EMAILS.includes(user.email);
}