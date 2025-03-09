import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Send, Calendar, SkipForward, Upload } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Post, ScheduleConfig } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface FileUploadResponse {
  message: string;
}

export default function Home() {
  const { toast } = useToast();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [interval, setInterval] = useState("30");

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: scheduleConfig } = useQuery<ScheduleConfig>({
    queryKey: ["/api/schedule"],
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: { startTime: string; endTime: string; interval: number }) => {
      const response = await apiRequest("POST", "/api/schedule", data);
      const result = await response.json();
      if (!response.ok) {
        // Try to parse the error message if it's JSON
        try {
          const parsed = JSON.parse(result.message);
          const errors = parsed.map((err: any) => err.message).join(", ");
          throw new Error(errors);
        } catch (e) {
          throw new Error(result.message);
        }
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Schedule updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingPosts = posts?.filter(p => !p.posted) || [];
  const postedPosts = posts?.filter(p => p.posted) || [];

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

  const skipMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/posts/${id}/skip`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post skipped successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (jsonData: any) => {
      const response = await apiRequest("POST", "/api/posts/upload", jsonData);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }
      return result as FileUploadResponse;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New posts uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const jsonData = JSON.parse(content);
      await uploadMutation.mutateAsync(jsonData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Invalid JSON file: " + error.message,
        variant: "destructive",
      });
    }
  };

  if (postsLoading) {
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
          <CardTitle className="text-2xl">Schedule Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              scheduleMutation.mutate({
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                interval: parseInt(interval),
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interval">Posting Interval</Label>
                <Select
                  value={interval}
                  onValueChange={setInterval}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="45">Every 45 minutes</SelectItem>
                    <SelectItem value="60">Every 60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={scheduleMutation.isPending}
            >
              {scheduleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Update Schedule
            </Button>
          </form>

          {scheduleConfig && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Current Schedule:</p>
              <p className="text-sm">
                Start: {format(new Date(scheduleConfig.startTime), "PPp")}
              </p>
              <p className="text-sm">
                End: {format(new Date(scheduleConfig.endTime), "PPp")}
              </p>
              <p className="text-sm">
                Interval: Every {scheduleConfig.interval} minutes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Upload New Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={uploadMutation.isPending}
            />
            {uploadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pending Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Posts ({pendingPosts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {pendingPosts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{post.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Scheduled: {post.scheduledTime ? format(new Date(post.scheduledTime), "PPp") : "Not scheduled"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => skipMutation.mutate(post.id)}
                            disabled={skipMutation.isPending}
                          >
                            <SkipForward className="h-4 w-4 mr-1" />
                            Skip
                          </Button>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <p className="whitespace-pre-wrap">{post.promoText}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Posted Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Posted Posts ({postedPosts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {postedPosts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{post.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Posted: {post.postedAt ? format(new Date(post.postedAt), "PPp") : "Unknown"}
                          </p>
                        </div>
                        <Badge className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Posted
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        <p className="whitespace-pre-wrap">{post.promoText}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
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