class ApiError extends Error{
  constructor(
    statusCoude,
    message= "Something went wrong",
    errors = [],
  ){
    super(message)
    this.statusCoude = statusCoude
    this.data = null
    this.message = message
    this.success = false
    this.errors = errors
  }
}

export {ApiError}