import { createFileRoute } from "@tanstack/react-router";
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
import { useGroupAnalyticsQuery } from "@/api/analytics/useGroupAnalyticsQuery";
import { useUserAnalyticsQuery } from "@/api/analytics/useUserAnalyticsQuery";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(groupAnalyticsQuery());
    void context.queryClient.ensureQueryData(userAnalyticsQuery());
  },
});

function AdminAnalytics() {
  const { data: groupAnalytics } = useGroupAnalyticsQuery();
  const { data: userAnalytics } = useUserAnalyticsQuery();

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5" />
            Groups Analytics
          </CardTitle>
          <CardDescription className="text-white/70">
            Groups with member counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white">Group Name</TableHead>
                <TableHead className="text-white">Members</TableHead>
                <TableHead className="text-white">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupAnalytics.map((group) => (
                <TableRow key={group.id} className="border-white/10">
                  <TableCell className="text-white font-medium">
                    {group.name}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {group.member_count}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {new Date(group.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Vote className="h-5 w-5" />
            Users Analytics
          </CardTitle>
          <CardDescription className="text-white/70">
            Users with vote counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white">Username</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Votes</TableHead>
                <TableHead className="text-white">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userAnalytics.map((user) => (
                <TableRow key={user.id} className="border-white/10">
                  <TableCell className="text-white font-medium">
                    {user.username || "No username"}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {user.email || "No email"}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {user.vote_count}
                  </TableCell>
                  <TableCell className="text-white/80">
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
