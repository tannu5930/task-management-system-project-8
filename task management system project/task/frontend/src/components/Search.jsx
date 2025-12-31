import React from 'react'
import { CiSearch } from "react-icons/ci";
import { IoIosAdd } from "react-icons/io";

const Search = ({isOpen, onOpen, onClose, setSearch}) => {
  return (
    <>
    <div className='max-w-[300px] min-h-auto flex flex-row m-auto border border-gray-200 bg-base-100 p-3 mb-3 rounded-2xl gap-3.5 shadow-sm'>
        
        <div className='flex flex-row text-center m-auto ml-1.5'>
        <input type="text" placeholder='search task' className='max-w-[160px] p-0.5 bg-base-200 bg-opacity-50 rounded px-2 focus:outline-none focus:bg-base-200 focus:ring-1 focus:ring-green-300 transition-all'
        onChange={(e)=> setSearch(e.target.value)}
        />
        </div>
        <div className='text-2xl cursor-pointer text-green-600 hover:text-green-700 transition-colors'>
            <CiSearch/>
        </div>
        <div className='text-2xl cursor-pointer text-blue-600 hover:text-blue-700 transition-colors'>
            <IoIosAdd onClick={onOpen}/>
        </div>
    </div>
    </>
  )
}

export default Search