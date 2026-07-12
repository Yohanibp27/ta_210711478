import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// AUTHENTICATION
import Login from "./pages/auth/Login.jsx";
import ForgotPassword from "./pages/auth/Forgot.jsx";
import ResetPassword from "./pages/auth/ResetPassword";
import Layout from "./layouts/Layouts";

// DASHBOARD
import Dashboard from "./pages/Dashboard.jsx";
import DashbordExecutive from "./pages/DashboardExecutive.jsx";

// CRUD
import UserList from "./pages/user/UserList.jsx";
import AttendanceHistory from "./pages/attendances/AttendanceHistory.jsx";
import ShiftList from "./pages/shifts/ShiftList.jsx";
import ShiftSchedule from "./pages/shifts/ShiftSchedule.jsx";
import ShiftExchangeList from "./pages/shifts/ShiftExchangeList.jsx";
import LeaveRequestHistory from "./pages/leaveRequests/LeaveRequestHistory.jsx";

import DepartmentList from "./components/organizations/DepartmentList.jsx";
import DivisionList from "./components/organizations/DivisionList.jsx";
import PositionList from "./components/organizations/PositionList";
import ProfessionList from "./components/organizations/ProfessionList";

import CalendarManagement from "./components/calendars/CalendarManagement.jsx";
import WorkShiftList from "./components/workshift/WorkShiftList";
import LeaveTypeList from "./components/leaveRequest/LeaveTypeList.jsx";
import LeaveSubTypeList from "./components/leaveRequest/LeaveSubTypeList.jsx";

// REPORTS
import ReportGeneratorPage from "./pages/reports/ReportGenerator.jsx";
import MonthlyReport from "./pages/reports/MonthlyReport.jsx";
import EmployeePerformance from "./pages/reports/EmployeePerformance.jsx";
import EmployeePerformanceDetail from "./components/reports/EmployeePerformanceDetail.jsx";
import ShiftReport from "./pages/reports/ShiftReport.jsx";
import OvertimeReport from "./pages/reports/OvertimeReport.jsx";
import LeaveRequestReport from "./pages/reports/LeaveRequestReport.jsx";

import ImportMedicalAction from "./components/medicalAction/ImportMedicalAction.jsx";
import UserReport from "./pages/reports/UserReport.jsx";
import UserReportPreview from "./components/reports/UserReportPreview.jsx";
import AttendanceReport from "./pages/reports/AttendanceReport.jsx";
import AttendanceReportPreview from "./components/reports/AttendanceReportPreview.jsx";

// OTHER PAGES
import AttendanceQrPage from "./pages/attendances/AttendanceQrPage.jsx";
import FullscreenQrPage from "./pages/attendances/FullscreenQrPage.jsx";
import UserProfile from "./pages/user/UserProfile.jsx";

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();

  const noLayoutRoutes = [
    "/",
    "/forgot-password",
    "/reset-password",
    "/qr-fullscreen",
  ];
  const isNoLayout =
    noLayoutRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/reset-password");

  return (
    <>
      {isNoLayout ? (
        <Routes>
          {/* AUTHENTICATION ROUTES */}
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          {/* FULLSCREEN QR CODE ROUTE */}
          <Route
            path="/qr-fullscreen"
            element={<FullscreenQrPage fullScreen={true} />}
          />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            {/* DASHBOARD ROUTES */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/executive-dashboard"
              element={<DashbordExecutive />}
            />
            {/* CRUD ROUTES */}
            <Route path="/users" element={<UserList />} />
            <Route
              path="/attendances/history"
              element={<AttendanceHistory />}
            />
            <Route path="/shifts" element={<ShiftList />} />
            <Route path="/shift-schedule" element={<ShiftSchedule />} />
            <Route path="/shift-exchanges" element={<ShiftExchangeList />} />
            <Route
              path="/leave-request-history"
              element={<LeaveRequestHistory />}
            />
            <Route path="/departments" element={<DepartmentList />} />
            <Route path="/divisions" element={<DivisionList />} />
            <Route path="/positions" element={<PositionList />} />
            <Route path="/professions" element={<ProfessionList />} />
            <Route path="/calendars" element={<CalendarManagement />} />
            <Route path="/workshifts" element={<WorkShiftList />} />
            <Route path="/leaves" element={<LeaveTypeList />} />
            <Route path="/sub-leaves" element={<LeaveSubTypeList />} />
            {/* REPORTS */}
            <Route path="/monthly-report" element={<MonthlyReport />} />
            <Route
              path="/performance-report"
              element={<EmployeePerformance />}
            />
            <Route
              path="/performance-report/:id"
              element={<EmployeePerformanceDetail />}
            />
            <Route path="/shift-report" element={<ShiftReport />} />
            <Route path="/overtime-report" element={<OvertimeReport />} />
            <Route path="/request-report" element={<LeaveRequestReport />} />
            <Route
              path="/import-medical-action"
              element={<ImportMedicalAction />}
            />
            <Route path="/user/report" element={<UserReport />} />
            <Route path="/user/preview" element={<UserReportPreview />} />
            <Route path="/attendance/report" element={<AttendanceReport />} />
            <Route
              path="/attendance/preview"
              element={<AttendanceReportPreview />}
            />
            {/* OTHER PAGES */}
            <Route path="/qr-page" element={<AttendanceQrPage />} />
            <Route path="/report-generator" element={<ReportGeneratorPage />} />
            <Route path="/user/profile" element={<UserProfile />} />
          </Routes>
        </Layout>
      )}
    </>
  );
}

export default App;
