import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">MyCamu Portal</CardTitle>
          <CardDescription>
            Student & Teacher Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Access your educational portal to view posts, track attendance, and stay connected with your class.
          </p>
          <Button className="w-full" asChild>
            <a href="/auth">Get Started</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
