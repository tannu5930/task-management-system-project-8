import Navbar from "../components/Navbar.jsx";
import { Outlet } from "react-router-dom";

export const ProtectedLayout = () => {
  return (
    <>

    <Navbar/>
    <Outlet/> {}
    
    </>
  )
}

