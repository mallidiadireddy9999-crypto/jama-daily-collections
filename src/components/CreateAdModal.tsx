import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateAdModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAdModal = ({ onClose, onSuccess }: CreateAdModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [targetAudience, setTargetAudience] = useState({
    type: 'all', // all, specific_villages, specific_users
    villages: '',
    users: ''
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('ads')
      .upload(path, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('ads')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      let videoUrl = '';

      // Upload image if selected
      if (imageFile) {
        const imagePath = `${Date.now()}-${imageFile.name}`;
        imageUrl = await uploadFile(imageFile, imagePath);
      }

      // Upload video if selected
      if (videoFile) {
        const videoPath = `${Date.now()}-${videoFile.name}`;
        videoUrl = await uploadFile(videoFile, videoPath);
      }

      // Create ad
      const { error } = await supabase
        .from('ads')
        .insert([{
          title,
          description,
          image_url: imageUrl,
          video_url: videoUrl,
          target_audience: targetAudience,
          start_date: startDate || new Date().toISOString(),
          end_date: endDate || null,
          is_recurring: isRecurring,
          recurring_type: isRecurring ? recurringType : null,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ad created successfully",
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating ad:', error);
      toast({
        title: "Error",
        description: "Failed to create ad",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Advertisement</DialogTitle>
          <DialogDescription>
            Create a new ad campaign with media, targeting, and scheduling options.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Ad Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter ad title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter ad description"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              <div>
                <Label>Image Upload</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Click to upload image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Video Upload (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  {videoFile ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{videoFile.name}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setVideoFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Click to upload video</p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Audience Type</Label>
                <Select value={targetAudience.type} onValueChange={(value) => 
                  setTargetAudience(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="specific_villages">Specific Villages</SelectItem>
                    <SelectItem value="specific_users">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetAudience.type === 'specific_villages' && (
                <div>
                  <Label>Villages (comma-separated)</Label>
                  <Input
                    value={targetAudience.villages}
                    onChange={(e) => setTargetAudience(prev => ({ ...prev, villages: e.target.value }))}
                    placeholder="Village1, Village2, Village3"
                  />
                </div>
              )}

              {targetAudience.type === 'specific_users' && (
                <div>
                  <Label>User IDs (comma-separated)</Label>
                  <Input
                    value={targetAudience.users}
                    onChange={(e) => setTargetAudience(prev => ({ ...prev, users: e.target.value }))}
                    placeholder="user1@example.com, user2@example.com"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduling & Automation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
                <Label htmlFor="recurring">Enable Recurring</Label>
              </div>

              {isRecurring && (
                <div>
                  <Label>Recurring Type</Label>
                  <Select value={recurringType} onValueChange={setRecurringType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurring type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title}>
              {loading ? 'Creating...' : 'Create Ad'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};