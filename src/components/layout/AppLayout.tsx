import { Outlet } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";

export default function AppLayout() {
  return (
    <ToastProvider>
      <Outlet />
    </ToastProvider>
  );
}
