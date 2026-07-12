import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Reveal } from "../../components/animation";
import Navbar from "../../containers/Navbar";
import Footer from "../../components/Footer";
import "./index.scss";

const Landing = () => {
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    document.body.classList.add("landing-theme");
    return () => {
      document.body.classList.remove("landing-theme");
    };
  }, []);

  return (
    <div className="Landing">
      <Navbar />
      <Reveal className="landing-hero">
        <div className="landing-hero__background" aria-hidden="true">
          <span className="hero-word">assetflow</span>
        </div>

        <div className="landing-hero__content">
          <div className="eyebrow">ASSETFLOW</div>
          <h1 className="title">Manage every asset with clarity.</h1>
          <p className="subtitle">
            Track devices, equipment, bookings, and maintenance from one calm,
            modern workspace.
          </p>
        </div>
      </Reveal>
      <Footer />
    </div>
  );
};

export default Landing;
