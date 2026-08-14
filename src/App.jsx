import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ModularJourney from "./pages/ModularJourney";
import Projects from "./pages/Projects";
import Categories from "./pages/Categories";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";

// The admin is a separate concern from the marketing site — lazy-loading it
// keeps Firebase and the CRUD screens out of the public bundle entirely.
const AdminApp = lazy(() => import("./admin/AdminApp"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <AdminApp />
            </Suspense>
          }
        />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services/*" element={<Navigate to="/our-work" replace />} />

          <Route path="modular-journey" element={<ModularJourney />} />
          <Route path="our-work" element={<Categories />} />
          <Route path="projects" element={<Projects />} />
          <Route path="testimonials" element={<Testimonials />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
