import axios from 'axios'

const ERROR_OK = 0
const baseURL = '/'

axios.default.baseURL = baseURL

export function get(url, params) {
  return axios.get(url, {
    params
  }).then((res) => {
    const serverData = res.data
    if (serverData.code === ERROR_OK) {
      return serverData.result
    }
  }).catch((e) => {
    console.log(e)
  })
}
