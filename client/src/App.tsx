import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import NotFound from "@/pages/not-found";
import HecateCrossroads from "@/pages/HecateCrossroads";

// Crossroads pages
import Dashboard from "@/pages/crossroads/Dashboard";
import KnowledgeGraph from "@/pages/crossroads/KnowledgeGraph";
import ChakraIntelligence from "@/pages/crossroads/ChakraIntelligence";
import SigilLab from "@/pages/crossroads/SigilLab";
import Altars from "@/pages/crossroads/Altars";
import RitualTracker from "@/pages/crossroads/RitualTracker";
import Divination from "@/pages/crossroads/Divination";
import Journal from "@/pages/crossroads/Journal";
import Forum from "@/pages/crossroads/Forum";
import Covens from "@/pages/crossroads/Covens";
import Marketplace from "@/pages/crossroads/Marketplace";
import AIMentor from "@/pages/crossroads/AIMentor";
import Settings from "@/pages/crossroads/Settings";
import Coven from "@/pages/crossroads/Coven";

function AnimatedRoutes() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch key={location} location={location}>
        <Route path="/" component={HecateCrossroads} />

        {/* Wisdom Path */}
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/knowledge-graph" component={KnowledgeGraph} />
        <Route path="/chakra-intelligence" component={ChakraIntelligence} />
        <Route path="/sigil-lab" component={SigilLab} />

        {/* Practice Path */}
        <Route path="/altars" component={Altars} />
        <Route path="/ritual-tracker" component={RitualTracker} />
        <Route path="/divination" component={Divination} />
        <Route path="/journal" component={Journal} />

        {/* Connection Path */}
        <Route path="/forum" component={Forum} />
        <Route path="/covens" component={Covens} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/ai-mentor" component={AIMentor} />
        <Route path="/settings" component={Settings} />

        {/* Hecate / Coven */}
        <Route path="/coven" component={Coven} />

        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AnimatedRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
