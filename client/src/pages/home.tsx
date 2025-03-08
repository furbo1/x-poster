import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Send } from "lucide-react";
import type { Post } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const testPostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/posts/test");
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tweet posted successfully!",
      });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: any) => {
      let errorMessage = error.message;
      // Try to parse the error message if it's JSON
      try {
        const parsed = JSON.parse(error.message);
        errorMessage = parsed.details?.[0]?.message || parsed.message || error.message;
      } catch (e) {
        // If parsing fails, use the original message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Twitter Posting Dashboard</CardTitle>
          <Button
            onClick={() => testPostMutation.mutate()}
            disabled={testPostMutation.isPending}
          >
            {testPostMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Test Post Now
          </Button>
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
                {posts?.filter((p) => p.posted).length || 0}
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
                      <Badge
                        variant={
                          post.posted
                            ? "default"
                            : post.error
                            ? "destructive"
                            : "secondary"
                        }
                        className="flex items-center"
                      >
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
                    <div className="mt-4 bg-muted p-4 rounded-md">
                      <p className="text-sm font-mono whitespace-pre-wrap">
                        {post.promoText}
                      </p>
                    </div>
                    {post.error && (
                      <div className="mt-2 p-3 bg-destructive/10 text-destructive rounded-md">
                        <p className="text-sm font-medium">Error posting tweet:</p>
                        <p className="text-sm whitespace-pre-wrap">{post.error}</p>
                      </div>
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