const NewUser = () => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        type="button"
        onClick={() => {
          localStorage.clear()
          window.location.reload()
        }}
        className="font-semibold py-1 px-2 md:py-2 md:px-4 rounded-lg transition-colors duration-200 text-xs md:text-sm bg-slate-700 hover:opacity-90 hover:cursor-pointer text-white"
      >
        New User
      </button>
    </div>
  )
}

export default NewUser
