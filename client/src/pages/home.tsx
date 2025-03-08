import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Send } from "lucide-react";
import type { Post } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const { data: posts, isLoading, refetch } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const testPostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/posts/test");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tweet posted successfully!",
      });
      refetch(); // Refresh the posts list
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
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
                      <Badge 
                        variant={post.posted ? "default" : post.error ? "destructive" : "secondary"}
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