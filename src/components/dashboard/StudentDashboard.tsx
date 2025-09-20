import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, Calendar } from 'lucide-react';
import AttendanceChart from '@/components/charts/AttendanceChart';
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
  profiles: {
    name: string;
  };
}

interface Attendance {
  id: string;
  date: string;
  status: 'present' | 'absent';
}

export default function StudentDashboard({ profile }: { profile: Profile }) {
  const { signOut } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
    fetchAttendance();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        profiles:teacher_id (name)
      `)
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

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('id, date, status')
      .eq('student_id', profile.id)
      .order('date', { ascending: false });

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
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile.name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Posts Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Class Posts</h2>
            </div>
            
            {posts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">No posts available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <CardDescription>
                        By {post.profiles?.name} • {new Date(post.created_at).toLocaleDateString()}
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

          {/* Attendance Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Attendance Summary</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Attendance Chart</CardTitle>
                <CardDescription>Your attendance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceChart data={attendance} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-muted-foreground text-center">No attendance records</p>
                ) : (
                  <div className="space-y-2">
                    {attendance.slice(0, 10).map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span className="text-sm">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {record.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}