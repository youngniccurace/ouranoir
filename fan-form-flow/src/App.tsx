import ApplicationForm from "./pages/ApplicationForm";

// The app is a single page (served at /apply/), so no router or global providers are
// needed. Form messages are shown inline in accessible live regions.
const App = () => <ApplicationForm />;

export default App;
