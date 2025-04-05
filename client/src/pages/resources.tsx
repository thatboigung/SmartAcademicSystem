import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Resource, Course } from "@shared/schema";
import { FileIcon, FolderIcon, BookIcon, FileTextIcon, PresentationIcon, InfoIcon, DownloadIcon } from "lucide-react";

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.number().min(1, "Course is required"),
  type: z.enum(["lecture_note", "slide", "pdf", "assignment", "other"]),
  url: z.string().url("Please enter a valid URL"),
  isPublic: z.boolean().default(false),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

function getResourceIcon(type: string) {
  switch (type) {
    case 'lecture_note':
      return <FileTextIcon className="h-4 w-4 mr-1" />;
    case 'slide':
      return <PresentationIcon className="h-4 w-4 mr-1" />;
    case 'pdf':
      return <FileIcon className="h-4 w-4 mr-1" />;
    case 'assignment':
      return <BookIcon className="h-4 w-4 mr-1" />;
    default:
      return <FileIcon className="h-4 w-4 mr-1" />;
  }
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "lecture_note",
      url: "",
      isPublic: false,
    },
  });
  
  const { data: resources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    queryFn: async () => {
      const response = await fetch("/api/resources");
      if (!response.ok) throw new Error("Failed to fetch resources");
      return response.json();
    },
  });
  
  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const response = await fetch("/api/courses");
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    },
  });
  
  const createResourceMutation = useMutation({
    mutationFn: async (data: ResourceFormValues) => {
      const response = await apiRequest("POST", "/api/resources", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create resource");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Resource Created",
        description: "The resource has been successfully created",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ResourceFormValues) => {
    createResourceMutation.mutate(data);
  };
  
  const filteredResources = resources?.filter((resource) => {
    if (activeTab === "all") return true;
    if (activeTab === "my-uploads" && user) return resource.uploadedById === user.id;
    if (activeTab === "public") return resource.isPublic;
    return resource.type === activeTab;
  });

  if (resourcesLoading || coursesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Resource Center</h1>
          {user && (user.role === "admin" || user.role === "lecturer") && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Upload Resource</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>Upload New Resource</DialogTitle>
                      <DialogDescription>
                        Share educational materials with students and other lecturers.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="courseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course</FormLabel>
                            <Select 
                              onValueChange={val => field.onChange(parseInt(val))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a course" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {courses?.map((course) => (
                                  <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resource Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="lecture_note">Lecture Note</SelectItem>
                                <SelectItem value="slide">Slide</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="assignment">Assignment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resource URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://" />
                            </FormControl>
                            <FormDescription>
                              Link to the resource file (e.g., Google Drive, Dropbox)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isPublic"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Make Public</FormLabel>
                              <FormDescription>
                                Allow all users to access this resource
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createResourceMutation.isPending}>
                        {createResourceMutation.isPending ? "Uploading..." : "Upload Resource"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex flex-wrap gap-2">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            {user && <TabsTrigger value="my-uploads">My Uploads</TabsTrigger>}
            <TabsTrigger value="public">Public Resources</TabsTrigger>
            <Separator orientation="vertical" className="mx-2" />
            <TabsTrigger value="lecture_note">Lecture Notes</TabsTrigger>
            <TabsTrigger value="slide">Slides</TabsTrigger>
            <TabsTrigger value="pdf">PDFs</TabsTrigger>
            <TabsTrigger value="assignment">Assignments</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {filteredResources?.length === 0 ? (
              <div className="text-center py-12">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">No resources found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === "my-uploads" 
                    ? "You haven't uploaded any resources yet." 
                    : "There are no resources in this category."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResources?.map((resource) => {
                  const course = courses?.find((c) => c.id === resource.courseId);
                  return (
                    <Card key={resource.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            {getResourceIcon(resource.type || "other")}
                            <span className="text-xs uppercase text-muted-foreground">
                              {resource.type?.replace('_', ' ')}
                            </span>
                          </div>
                          {resource.isPublic && (
                            <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                              Public
                            </div>
                          )}
                        </div>
                        <CardTitle className="mt-2 break-words">{resource.title}</CardTitle>
                        <CardDescription>
                          {course?.name || "Unknown Course"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {resource.description || "No description provided"}
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Uploaded: {new Date(resource.uploadedAt || "").toLocaleDateString()}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/30 flex justify-between">
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary flex items-center"
                        >
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Download
                        </a>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="p-0"
                          onClick={() => window.open(resource.url, '_blank')}
                        >
                          <InfoIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}