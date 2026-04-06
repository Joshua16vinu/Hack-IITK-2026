import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import NistPolicies from "./pages/NistPolicies";
import RevisedPolicy from "./pages/RevisedPolicy";
import Roadmap from "./pages/Roadmap";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/nist-policies" element={<NistPolicies />} />
        <Route path="/revised-policy" element={<RevisedPolicy />} />
        <Route path="/roadmap" element={<Roadmap />} />
      </Route>
    </Routes>
  );
}
