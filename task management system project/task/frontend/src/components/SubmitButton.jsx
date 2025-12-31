import React from 'react'

const SubmitButton = ( {value} ) => {
  return (
    <>
    <button type="submit" className="btn btn-soft btn-primary cursor-pointer text-white text-2xl rounded-2xl p-2"> {value} </button>
    </>
  )
}

export default SubmitButton