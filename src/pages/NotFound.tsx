import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    console.log('Current User:', user);
  }, [location.pathname, user]);

  const handleReturnHome = () => {
    if (user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'quality_control':
          navigate('/quality-control');
          break;
        case 'purchasing':
          navigate('/dashboard/purchasing');
          break;
        default:
          navigate('/auth');
      }
    } else {
      navigate('/auth');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-destructive">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
        <p className="text-sm text-muted-foreground mb-6">
          The page {location.pathname} could not be found.
        </p>
        <Button onClick={handleReturnHome} variant="default">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
