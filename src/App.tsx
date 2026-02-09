import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Attendant from "./pages/attendant";
import Designer from "./pages/designer";
import Billing from "./pages/billing";
import Printer from "./pages/printer";
import Fixer from "./pages/fixer";
import Delivery from "./pages/delivery";
import Admin from "./pages/admin";
import ProtectedRoute from "./components/ProtectedRoute";
import MeasurementJobs from "./pages/measurementsjobs";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/attendant" element={<ProtectedRoute role="attendant"><Attendant/></ProtectedRoute>} />
        <Route path="/designer" element={<ProtectedRoute role="designer"><Designer/></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute role="billing"><Billing/></ProtectedRoute>} />
        <Route path="/printer" element={<ProtectedRoute role="printer"><Printer/></ProtectedRoute>} />
        <Route path="/fixer" element={<ProtectedRoute role="fixer"><Fixer/></ProtectedRoute>} />
        <Route path="/delivery" element={<ProtectedRoute role="delivery"><Delivery/></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><Admin/></ProtectedRoute>} />
        <Route path="/measurement-jobs" element={<ProtectedRoute role="measurement-jobs"><MeasurementJobs/></ProtectedRoute>} />


      </Routes>
    </BrowserRouter>
  );
}
