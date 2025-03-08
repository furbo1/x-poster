import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { Post } from "@shared/schema";

export default function Home() {
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Twitter Posting Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Listings</p>
              <p className="text-2xl font-bold">{posts?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Posted</p>
              <p className="text-2xl font-bold">
                {posts?.filter(p => p.posted).length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {posts?.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{post.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {post.category} • {post.location}
                        </p>
                      </div>
                      <Badge variant={post.posted ? "success" : post.error ? "destructive" : "secondary"}>
                        {post.posted ? (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        ) : post.error ? (
                          <XCircle className="h-4 w-4 mr-1" />
                        ) : (
                          "Pending"
                        )}
                        {post.posted ? "Posted" : post.error ? "Failed" : "Pending"}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <p><strong>Revenue:</strong> {post.revenue}</p>
                      <p><strong>Monthly Profit:</strong> {post.monthlyProfit}</p>
                      <p><strong>Profit Margin:</strong> {post.profitMargin}</p>
                    </div>
                    {post.error && (
                      <p className="mt-2 text-sm text-destructive">{post.error}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
