-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('student', 'teacher');

-- Create enum for attendance status
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent');

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  class_id UUID REFERENCES public.classes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  class_id UUID NOT NULL REFERENCES public.classes(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for classes
CREATE POLICY "Users can view their class" ON public.classes
  FOR SELECT USING (
    id IN (SELECT class_id FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies for posts
CREATE POLICY "Students can view posts from their class" ON public.posts
  FOR SELECT USING (
    class_id IN (SELECT class_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Teachers can create posts for their class" ON public.posts
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid() AND
    class_id IN (SELECT class_id FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can update their own posts" ON public.posts
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own posts" ON public.posts
  FOR DELETE USING (teacher_id = auth.uid());

-- RLS Policies for attendance
CREATE POLICY "Students can view their own attendance" ON public.attendance
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view attendance for their class students" ON public.attendance
  FOR SELECT USING (
    student_id IN (
      SELECT p1.id FROM public.profiles p1
      JOIN public.profiles p2 ON p1.class_id = p2.class_id
      WHERE p2.id = auth.uid() AND p2.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can mark attendance for their class students" ON public.attendance
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT p1.id FROM public.profiles p1
      JOIN public.profiles p2 ON p1.class_id = p2.class_id
      WHERE p2.id = auth.uid() AND p2.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update attendance for their class students" ON public.attendance
  FOR UPDATE USING (
    student_id IN (
      SELECT p1.id FROM public.profiles p1
      JOIN public.profiles p2 ON p1.class_id = p2.class_id
      WHERE p2.id = auth.uid() AND p2.role = 'teacher'
    )
  );

-- Insert sample classes
INSERT INTO public.classes (name) VALUES 
  ('Class A'),
  ('Class B'),
  ('Class C');