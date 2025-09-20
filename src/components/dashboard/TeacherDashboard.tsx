import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Plus, Users, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  class_id: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
}

interface AttendanceRecord {
  student_id: string;
  date: string;
  status: 'present' | 'absent';
}

export default function TeacherDashboard({ profile }: { profile: Profile }) {
  const { signOut } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'attendance'>('posts');

  // Form states
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchPosts();
    fetchStudents();
    fetchAttendance();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, content, created_at')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch posts',
        variant: 'destructive',
      });
    } else {
      setPosts(data || []);
    }
  };

  const fetchStudents = async () => {
    if (!profile.class_id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('class_id', profile.class_id)
      .eq('role', 'student');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
    } else {
      setStudents(data || []);
    }
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('student_id, date, status')
      .eq('date', selectedDate);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance',
        variant: 'destructive',
      });
    } else {
      setAttendance(data || []);
    }
    setLoading(false);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.class_id) {
      toast({
        title: 'Error',
        description: 'You must be assigned to a class to create posts',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert([
        {
          teacher_id: profile.id,
          class_id: profile.class_id,
          title: newPost.title,
          content: newPost.content,
        }
      ]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Post created successfully',
      });
      setNewPost({ title: '', content: '' });
      fetchPosts();
    }
  };

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent') => {
    const { error } = await supabase
      .from('attendance')
      .upsert([
        {
          student_id: studentId,
          date: selectedDate,
          status: status,
        }
      ], {
        onConflict: 'student_id,date'
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Attendance marked successfully',
      });
      fetchAttendance();
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    const record = attendance.find(a => a.student_id === studentId);
    return record?.status || null;
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Success',
      description: 'Signed out successfully',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile.name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === 'posts' ? 'default' : 'outline'}
            onClick={() => setActiveTab('posts')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Posts
          </Button>
          <Button
            variant={activeTab === 'attendance' ? 'default' : 'outline'}
            onClick={() => setActiveTab('attendance')}
          >
            <Users className="w-4 h-4 mr-2" />
            Attendance
          </Button>
        </div>

        {activeTab === 'posts' && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Create Post Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Post
                </CardTitle>
                <CardDescription>Share announcements with your class</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="Enter post title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="Enter post content"
                      rows={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Post
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Posts List */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Your Posts</h2>
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">No posts created yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <CardDescription>
                          {new Date(post.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap">{post.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setTimeout(() => fetchAttendance(), 100);
                }}
                className="w-auto"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
                <CardDescription>
                  Mark attendance for {new Date(selectedDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-muted-foreground text-center">No students in your class</p>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <span className="font-medium">{student.name}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={getAttendanceStatus(student.id) === 'present' ? 'default' : 'outline'}
                            onClick={() => handleMarkAttendance(student.id, 'present')}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={getAttendanceStatus(student.id) === 'absent' ? 'destructive' : 'outline'}
                            onClick={() => handleMarkAttendance(student.id, 'absent')}
                          >
                            Absent
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}