import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import SiteHeader from "@/components/SiteHeader";
import InstallApp from "@/components/InstallApp";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Journey from "@/pages/Journey";
import Cases from "@/pages/Cases";
import Invitations from "@/pages/Invitations";
import Dialogue from "@/pages/Dialogue";
import Assistant from "@/pages/Assistant";
import Trust from "@/pages/Trust";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <Switch>
    <Route path="/" component={Home}/>
    <Route path="/journey/:id" component={Journey}/>
    <Route path="/journey" component={Journey}/>
    <Route path="/cases" component={Cases}/>
    <Route path="/invitations" component={Invitations}/>
    <Route path="/invite/:code" component={Invitations}/>
    <Route path="/dialogue" component={Dialogue}/>
    <Route path="/assistant" component={Assistant}/>
    <Route path="/trust" component={Trust}/>
    <Route path="/404" component={NotFound}/>
    <Route component={NotFound}/>
  </Switch>;
}
export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><SiteHeader/><Router/><InstallApp/><Toaster/></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
