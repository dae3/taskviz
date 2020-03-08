async function attach () {
  const from = document.getElementById('fromDate')
  const to = document.getElementById('toDate')

  // const now = new Date()
  // to.valueAsDate = now
  // from.valueAsDate = new Date(now.getFullYear(), now.getMonth(), 1)
  from.valueAsDate = new Date(2018, 11, 31, 23)
  to.valueAsDate = new Date(2019, 11, 31)

  from.addEventListener('input', dateChange)
  to.addEventListener('input', dateChange)
}

function dateChange (event) {
  const from = document.getElementById('fromDate')
  const to = document.getElementById('toDate')

  if (from.validity.valid && to.validity.valid) {
    updateTreemap(from.valueAsDate, to.valueAsDate)
  }
}

window.addEventListener('load', attach)
window.addEventListener('load', dateChange)
