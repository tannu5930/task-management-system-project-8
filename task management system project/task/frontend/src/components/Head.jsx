import React from 'react'
import NotificationBell from './NotificationBell'

const Head = () => {
  return (
    <>
    <div className='max-w-[300px] min-h-auto flex flex-row m-auto border border-gray-200 bg-base-100 p-3 mb-3 rounded-2xl shadow-sm'>
        <div className='flex flex-row text-center m-auto'>
        <p className='text-blue-900 font-bold text-lg'>Task Manager App</p>
        </div>
        <div className='ml-auto'>
            <NotificationBell />
        </div>
    </div>
    </>
  )
}

export default Head