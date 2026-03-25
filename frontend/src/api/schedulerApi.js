const BASE = '/api'

async function req(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }

  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`)
  }

  return data
}

export const getSchedule = () => req('/schedule')
export const saveSchedule = (filename) => req('/schedule/save', 'POST', { filename })
export const loadSchedule = (filename) => req('/schedule/load', 'POST', { filename })
export const clearSchedule = () => req('/schedule/clear', 'POST')

export const addMovie = (movie) => req('/movies', 'POST', movie)
export const addShowtime = (showtime) => req('/showtime', 'POST', showtime)

export const generateTimeOptions = (params) =>
  req('/generate-time-options', 'POST', params)

export const enforceRoom = (day, auditorium, movieTitle) =>
  req('/enforce-room', 'POST', { day, auditorium, movie_title: movieTitle })

export const sellTicket = (idx, qty = 1) =>
  req(`/showtimes/${idx}/sell-ticket`, 'POST', { qty })