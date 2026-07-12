import Navbars from "./Navbars.jsx";
import Sidebars from "./Sidebars.jsx";
import { useState } from "react";

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout-wrapper">
      <Sidebars
        isCollapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="right-section">
        <Navbars />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
