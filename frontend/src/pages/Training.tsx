import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PerformanceCard from "./PerformanceCard";

const TrainingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/BLTraining"); // Redirect if no token is found
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
       
        <div className="grid grid-cols-2 gap-8">
          <ErrorBoundary>
            <PerformanceCard />
          </ErrorBoundary>
         
        </div>
      </div>
    </div>
  );
};

// Error Boundary component to catch errors in child components
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Component crashed:", error);
    return <p className="text-red-500">Component failed to load.</p>;
  }
};

export default TrainingPage;
