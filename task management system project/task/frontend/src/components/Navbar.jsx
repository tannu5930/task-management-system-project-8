import React from 'react'
import { Link } from 'react-router-dom'
import SubmitButton from "./SubmitButton";

const Navbar = () => {
  return (
    <div className='flex flex-row w-screen text-2xl m-3 justify-around items-center overflow-hidden'>
        <div className='max-w-[300px] m-3'>
        <Link to="/home">
        <SubmitButton value={"Home"}/>
        </Link>
        </div>
        <div className='max-w-[300px] m-3'>
        <Link to="/profile">
        <SubmitButton value={"Profile"}/></Link>
        </div>
    </div>
  )
}

export default Navbar