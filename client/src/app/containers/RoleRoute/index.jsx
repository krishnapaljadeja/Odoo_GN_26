import React, { useEffect } from "react";
import { Route, Redirect } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const Forbidden = () => {
  useEffect(() => {
    toast.error("You don't have permission to view that page.");
  }, []);

  return <Redirect to={{ pathname: "/dashboard" }} />;
};

// Like PrivateRoute, but also gates on role. Source of truth is still the
// backend (every protected API route re-checks role) - this only avoids
// flashing a screen the user can't act on and gives a clear toast instead.
const RoleRoute = ({ component: Component, roles, ...rest }) => {
  const auth = useSelector((state) => state.auth);

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!auth.isAuthenticated) {
          return <Redirect to={{ pathname: "/login", state: { from: props.location } }} />;
        }

        if (roles && roles.length > 0 && !roles.includes(auth.user.role)) {
          return <Forbidden />;
        }

        return <Component {...props} />;
      }}
    />
  );
};

export default RoleRoute;
