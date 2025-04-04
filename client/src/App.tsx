import { useContext } from "react";
import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Schedule from "@/pages/schedule";
import Attendance from "@/pages/attendance";
import Courses from "@/pages/courses";
import Exams from "@/pages/exams";
import Students from "@/pages/students";
import ScanQR from "@/pages/scan-qr";
import Channels from "@/pages/channels";
import NotFound from "@/pages/not-found";
import { useAuth } from "./lib/auth";

// A private route component that redirects to login if not authenticated
const PrivateRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>; path: string }) => {
  const { user, isLoading } = useAuth();
  
  // Show nothing during loading to prevent flickering
  if (isLoading) return null;
  
  // Redirect to login if not authenticated
  if (!user) return <Redirect to="/login" />;
  
  return <Component {...rest} />;
};

// Role-based route - only allows access to users with specific roles
const RoleRoute = ({ 
  component: Component, 
  roles, 
  ...rest 
}: { 
  component: React.ComponentType<any>; 
  path: string; 
  roles: string[] 
}) => {
  const { user, isLoading } = useAuth();
  
  // Show nothing during loading to prevent flickering
  if (isLoading) return null;
  
  // Redirect to login if not authenticated
  if (!user) return <Redirect to="/login" />;
  
  // Redirect to dashboard if user doesn't have the required role
  if (!roles.includes(user.role)) return <Redirect to="/dashboard" />;
  
  return <Component {...rest} />;
};

function App() {
  const { user, isLoading } = useAuth();
  
  // Render routes even during authentication loading
  // The individual route components will handle loading states

  return (
    <>
      <Switch>
        {/* Public Routes */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Redirect from root to dashboard if logged in, otherwise to login */}
        <Route path="/">
          {() => (user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />)}
        </Route>
        
        {/* Private Routes - wrapped in Layout component */}
        <Route path="/dashboard">
          {() => (
            <Layout>
              <PrivateRoute component={Dashboard} path="/dashboard" />
            </Layout>
          )}
        </Route>
        
        <Route path="/schedule">
          {() => (
            <Layout>
              <PrivateRoute component={Schedule} path="/schedule" />
            </Layout>
          )}
        </Route>
        
        <Route path="/attendance">
          {() => (
            <Layout>
              <PrivateRoute component={Attendance} path="/attendance" />
            </Layout>
          )}
        </Route>
        
        <Route path="/courses">
          {() => (
            <Layout>
              <PrivateRoute component={Courses} path="/courses" />
            </Layout>
          )}
        </Route>
        
        <Route path="/exams">
          {() => (
            <Layout>
              <PrivateRoute component={Exams} path="/exams" />
            </Layout>
          )}
        </Route>
        
        <Route path="/scan-qr">
          {() => (
            <Layout>
              <PrivateRoute component={ScanQR} path="/scan-qr" />
            </Layout>
          )}
        </Route>

        <Route path="/channels">
          {() => (
            <Layout>
              <PrivateRoute component={Channels} path="/channels" />
            </Layout>
          )}
        </Route>
        
        {/* Role-restricted Routes */}
        <Route path="/students">
          {() => (
            <Layout>
              <RoleRoute component={Students} path="/students" roles={['admin', 'lecturer']} />
            </Layout>
          )}
        </Route>
        
        {/* Fallback to 404 */}
        <Route>
          {() => (
            <Layout>
              <NotFound />
            </Layout>
          )}
        </Route>
      </Switch>
      
      <Toaster />
    </>
  );
}

export default App;
