import React from "react";

const SmoothScroll = ({ children }) => (
  <div id="smooth-wrapper">
    <div id="smooth-content">
      {children}
    </div>
  </div>
);

export default SmoothScroll;
