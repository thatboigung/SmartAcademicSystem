import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Import loginSchema from shared schema
import { loginSchema } from '@shared/schema';

// Extend the schema with custom error messages
const loginFormSchema = loginSchema.extend({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const Login = () => {
  const { user, login, isLoading, error } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    console.log('Login attempt with:', data.username);
    setIsSubmitting(true);
    try {
      console.log('Calling login function...');
      const user = await login(data.username, data.password);
      console.log('Login successful, user:', user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: 'Login failed',
        description: error || (err instanceof Error ? err.message : 'Please check your credentials and try again'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading indicator while authentication is being checked
  if (isLoading && false) { // Temporarily disable loading state
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Smart Academic Management System</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>
          
          {error && (
            <div className="mt-4 text-sm text-red-500 text-center">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center text-sm text-neutral-600">
          <p className="mb-2">For demo purposes, you can log in with:</p>
          <p>Username: <strong>admin</strong>, <strong>lecturer</strong>, or <strong>student</strong></p>
          <p>Password: <strong>password</strong></p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
