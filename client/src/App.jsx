import React, { useEffect, Suspense } from "react";
import "./app/styles/index.scss";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signout, updateUser } from "./app/state/authSlice";
import { authApi } from "./features/auth/api";

import PrivateRoute from "./app/containers/PrivateRoute";
import RoleRoute from "./app/containers/RoleRoute";
import Loading from "./app/components/Loading";
import { SmoothScroll } from "./app/components/animation";

const Login = React.lazy(() => import("./app/routes/Login"));
const Signup = React.lazy(() => import("./app/routes/Signup"));
const ForgotPassword = React.lazy(() => import("./app/routes/ForgotPassword"));
const Landing = React.lazy(() => import("./app/routes/Landing"));
const Dashboard = React.lazy(() => import("./app/routes/Dashboard"));
const OrganizationSetup = React.lazy(() => import("./app/routes/OrganizationSetup"));
const Assets = React.lazy(() => import("./app/routes/Assets"));
const AssetDetail = React.lazy(() => import("./app/routes/Assets/Detail"));
const Allocations = React.lazy(() => import("./app/routes/Allocations"));
const Bookings = React.lazy(() => import("./app/routes/Bookings"));
const Maintenance = React.lazy(() => import("./app/routes/Maintenance"));
const Audits = React.lazy(() => import("./app/routes/Audits"));
const Private = React.lazy(() => import("./app/routes/Private"));

const App = (props) => {
  //Check and update authentication status
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const expired = new Date(Date.now()) >= new Date(auth.expires);

  useEffect(() => {
    if (expired) {
      dispatch(signout());
    }
  }, [dispatch, expired]);

  useEffect(() => {
    // Re-hydrate role/department from the server on load, since a Redux-
    // persisted session can be stale after an admin promotes/demotes the
    // user in Organization Setup.
    if (!auth.isAuthenticated || expired) return;

    authApi
      .me()
      .then((data) => dispatch(updateUser(data.payload)))
      .catch(() => dispatch(signout()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated]);

  return (
    <React.Fragment>
      <Router>
        <SmoothScroll>
          <Suspense fallback={<Loading />}>
            <Switch>
              <Route exact path="/" {...props} component={Landing} />
              <Route exact path="/login" {...props} component={Login} />
              <Route exact path="/signup" {...props} component={Signup} />
              <Route exact path="/forgot-password" {...props} component={ForgotPassword} />
              <Redirect exact from="/signin" to="/login" />
              <PrivateRoute
                exact
                path="/dashboard"
                {...props}
                component={Dashboard}
              />
              <RoleRoute
                exact
                path="/organization"
                roles={["ADMIN"]}
                {...props}
                component={OrganizationSetup}
              />
              <PrivateRoute exact path="/assets" {...props} component={Assets} />
              <PrivateRoute exact path="/assets/:id" {...props} component={AssetDetail} />
              <PrivateRoute exact path="/allocations" {...props} component={Allocations} />
              <PrivateRoute exact path="/bookings" {...props} component={Bookings} />
              <PrivateRoute exact path="/maintenance" {...props} component={Maintenance} />
              <PrivateRoute exact path="/audits" {...props} component={Audits} />
              <PrivateRoute exact path="/audits/:id" {...props} component={Audits} />
              <PrivateRoute
                exact
                path="/another"
                {...props}
                component={Private}
              />
            </Switch>
          </Suspense>
        </SmoothScroll>
      </Router>
    </React.Fragment>
  );
};

export default App;
