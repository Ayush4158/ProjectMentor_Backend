class ApiResponse{
  constructor(
    statusCoude,
    data,
    message= "Success",
  ){

    this.statusCoude = statusCoude
    this.data = data
    this.message = message
    this.success = statusCoude < 400
  }
}

export {ApiResponse}