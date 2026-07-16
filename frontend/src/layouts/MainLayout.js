import Navbar from "./Navbar";
import AIAssistant from "../components/AIAssistant";

function MainLayout({
 children
}) {

 return (

 <div className="layout">
   <Navbar />

   <div className="main-content">

      <div className="page-content">
         {children}
      </div>

   </div>
   <AIAssistant />
 </div> 

 );

}

export default MainLayout;