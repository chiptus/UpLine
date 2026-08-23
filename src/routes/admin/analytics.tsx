import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Vote } from "lucide-react";
import { groupAnalyticsQuery } from "@/api/analytics/useGroupAnalyticsQuery";
import { userAnalyticsQuery } from "@/api/analytics/useUserAnalyticsQuery";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
  head: () => ({
    meta: pageMeta({ title: "Analytics", prefix: "Admin" }),
  }),
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(groupAnalyticsQuery());
    void context.queryClient.ensureQueryData(userAnalyticsQuery());
  },
});

function AdminAnalytics() {
  const { data: groupAnalytics } = useSuspenseQuery(groupAnalyticsQuery());
  const { data: userAnalytics } = useSuspenseQuery(userAnalyticsQuery());

  return (
    <div className="space-y-6">
      <Card className="bg-surface-raised backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5" />
            Groups Analytics
          </CardTitle>
          <CardDescription className="text-foreground/70">
            Groups with member counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-foreground">Group Name</TableHead>
                <TableHead className="text-foreground">Members</TableHead>
                <TableHead className="text-foreground">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupAnalytics.map((group) => (
                <TableRow key={group.id} className="border-white/10">
                  <TableCell className="text-foreground font-medium">
                    {group.name}
                  </TableCell>
                  <TableCell className="text-foreground/80">
                    {group.member_count}
                  </TableCell>
                  <TableCell className="text-foreground/80">
                    {new Date(group.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-surface-raised backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Vote className="h-5 w-5" />
            Users Analytics
          </CardTitle>
          <CardDescription className="text-foreground/70">
            Users with vote counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-foreground">Username</TableHead>
                <TableHead className="text-foreground">Email</TableHead>
                <TableHead className="text-foreground">Votes</TableHead>
                <TableHead className="text-foreground">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userAnalytics.map((user) => (
                <TableRow key={user.id} className="border-white/10">
                  <TableCell className="text-foreground font-medium">
                    {user.username || "No username"}
                  </TableCell>
                  <TableCell className="text-foreground/80">
                    {user.email || "No email"}
                  </TableCell>
                  <TableCell className="text-foreground/80">
                    {user.vote_count}
                  </TableCell>
                  <TableCell className="text-foreground/80">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
